import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// ============================================================
// TTS Provider Configuration
// ============================================================
//
// Fallback chain (highest quality → lowest):
//   1. ElevenLabs  (eleven_turbo_v2_5, ~10K chars/month free)
//   2. Google Cloud TTS  (de-DE-Standard-A, 4M chars/month free)
//   3. Google Translate TTS  (no key, unlimited but lower quality)
//
// Each provider has a module-level "disabled" flag that triggers on
// auth/quota errors so we don't burn latency retrying a dead provider
// for every TTS call.

// Dev-only default keys — used when no key is provided in the request body.
// Falls back to environment variables, then to hardcoded defaults.
const DEV_ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 'sk_6c2fb452b6685fff6d61d0d5270467c1c0164475ea43fc99';
const ELEVENLABS_DEFAULT_VOICE_ID = 'Xb7hH8MSUJpSbSDYk0k2'; // "Alice"

// Google Cloud TTS — 4M chars/month free on Standard tier
const DEV_GOOGLE_TTS_API_KEY = process.env.GOOGLE_TTS_API_KEY || 'AIzaSyDIy8sm5zg_qSzKliOBZU1WjjmOqz3fgdA';
const GOOGLE_TTS_DEFAULT_VOICE = 'de-DE-Standard-A';

// ============================================================
// Session-level provider health flags
// ============================================================
// When a provider fails with auth/quota error, we disable it for the
// rest of the Node process lifetime. The fallback chain then skips
// that provider entirely. Restarting the dev server resets the flags.
let elevenLabsDisabled = false;
let googleTtsDisabled = false;

// ============================================================
// In-memory LRU cache with TTL
// ============================================================
// 24h TTL, ~200 entries max. Keyed by `provider:voice:text` hash.
const audioCache = new Map<string, { buffer: Buffer; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24h
const CACHE_MAX_ENTRIES = 200;

function hashKey(provider: string, voice: string, text: string): string {
  return crypto.createHash('md5').update(`${provider}:${voice}:${text}`).digest('hex');
}

function getCached(key: string): Buffer | null {
  const entry = audioCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    audioCache.delete(key);
    return null;
  }
  // Move to end (most recently used) — Map preserves insertion order
  audioCache.delete(key);
  audioCache.set(key, entry);
  return entry.buffer;
}

function setCached(key: string, buffer: Buffer): void {
  // Evict oldest entries if we hit the cap
  while (audioCache.size >= CACHE_MAX_ENTRIES) {
    const oldestKey = audioCache.keys().next().value;
    if (oldestKey === undefined) break;
    audioCache.delete(oldestKey);
  }
  audioCache.set(key, { buffer, timestamp: Date.now() });
}

// ============================================================
// Provider 1: ElevenLabs
// ============================================================
async function synthesizeWithElevenLabs(text: string, voiceId: string, apiKey: string): Promise<Buffer> {
  if (elevenLabsDisabled) {
    throw new Error('ElevenLabs disabled for this session');
  }

  const apiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    // Permanently disable on auth/quota errors
    if (response.status === 401 || response.status === 403 || response.status === 429) {
      elevenLabsDisabled = true;
      console.warn(
        `[TTS] ElevenLabs disabled for this session (HTTP ${response.status}). ` +
          `Falling back to Google Cloud TTS.`
      );
    }
    const errText = await response.text().catch(() => '');
    throw new Error(`ElevenLabs API error: ${response.status} ${errText.slice(0, 200)}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ============================================================
// Provider 2: Google Cloud Text-to-Speech
// ============================================================
// Uses Standard voice (de-DE-Standard-A) — 4M chars/month free tier.
// This is the workhorse provider: high quality + generous quota.
async function synthesizeWithGoogleCloud(text: string, voiceName: string, apiKey: string): Promise<Buffer> {
  if (googleTtsDisabled) {
    throw new Error('Google Cloud TTS disabled for this session');
  }

  const languageCode = voiceName.split('-').slice(0, 2).join('-'); // "de-DE-Standard-A" → "de-DE"

  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode, name: voiceName },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 0.95, // slightly slower for language learners
          pitch: 0,
          volumeGainDb: 0,
        },
      }),
    }
  );

  if (!response.ok) {
    if (response.status === 401 || response.status === 403 || response.status === 429) {
      googleTtsDisabled = true;
      console.warn(
        `[TTS] Google Cloud TTS disabled for this session (HTTP ${response.status}). ` +
          `Falling back to Google Translate TTS.`
      );
    }
    const errText = await response.text().catch(() => '');
    throw new Error(`Google Cloud TTS error: ${response.status} ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  if (!data.audioContent) {
    throw new Error('Google Cloud TTS returned no audioContent');
  }
  return Buffer.from(data.audioContent, 'base64');
}

// ============================================================
// Provider 3: Google Translate TTS (no key required)
// ============================================================
// Free, unlimited, but:
//   - Limited to ~190 chars per request
//   - Lower audio quality
//   - May break if Google changes the unofficial endpoint
// We chunk long text on sentence boundaries and concatenate MP3 streams.
const GTTS_MAX_CHUNK = 190;

function splitIntoChunks(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  // Try sentence-based split first (better prosody continuity)
  const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];
  const chunks: string[] = [];
  let current = '';
  for (const s of sentences) {
    const candidate = (current + ' ' + s).trim();
    if (candidate.length <= maxLen) {
      current = candidate;
    } else {
      if (current) chunks.push(current);
      // Hard-split if a single sentence exceeds maxLen
      if (s.length > maxLen) {
        for (let i = 0; i < s.length; i += maxLen) {
          chunks.push(s.slice(i, i + maxLen));
        }
        current = '';
      } else {
        current = s.trim();
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

async function synthesizeChunkWithGoogleTranslate(chunk: string): Promise<Buffer> {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
    chunk
  )}&tl=de&client=tw-ob`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      'Referer': 'https://translate.google.com/',
    },
  });
  if (!response.ok) {
    throw new Error(`Google Translate TTS error: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function synthesizeWithGoogleTranslate(text: string): Promise<Buffer> {
  const chunks = splitIntoChunks(text, GTTS_MAX_CHUNK);
  // Sequential fetch — parallel fetches to google.com sometimes get throttled
  const buffers: Buffer[] = [];
  for (const chunk of chunks) {
    buffers.push(await synthesizeChunkWithGoogleTranslate(chunk));
  }
  return Buffer.concat(buffers);
}

// ============================================================
// Main POST handler — fallback chain
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      text,
      voiceId,
      // Google Cloud TTS voice name override (default: de-DE-Standard-A)
      googleVoice,
      // Client-provided API keys (dev fallback if not provided)
      elevenLabsKey,
      googleTtsKey,
    } = body as {
      text?: string;
      voiceId?: string;
      googleVoice?: string;
      elevenLabsKey?: string;
      googleTtsKey?: string;
    };

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Truncate very long text to avoid quota issues. 500 chars is roughly
    // the sweet spot — most flashcards / chat messages are well under this.
    const truncated = text.slice(0, 500);
    // Resolve API keys: client-provided > dev default
    const elevenLabsApiKey = elevenLabsKey || DEV_ELEVENLABS_API_KEY;
    const googleTtsApiKey = googleTtsKey || DEV_GOOGLE_TTS_API_KEY;

    const useElevenVoice = voiceId || ELEVENLABS_DEFAULT_VOICE_ID;
    const useGoogleVoice = googleVoice || GOOGLE_TTS_DEFAULT_VOICE;

    // Try providers in order: ElevenLabs → Google Cloud → Google Translate
    const providers: Array<{
      name: string;
      voice: string;
      fn: () => Promise<Buffer>;
    }> = [];

    if (!elevenLabsDisabled && elevenLabsApiKey) {
      providers.push({
        name: 'elevenlabs',
        voice: useElevenVoice,
        fn: () => synthesizeWithElevenLabs(truncated, useElevenVoice, elevenLabsApiKey),
      });
    }
    if (!googleTtsDisabled && googleTtsApiKey) {
      providers.push({
        name: 'google-cloud',
        voice: useGoogleVoice,
        fn: () => synthesizeWithGoogleCloud(truncated, useGoogleVoice, googleTtsApiKey),
      });
    }
    // Google Translate is always available (no key)
    providers.push({
      name: 'google-translate',
      voice: 'gtts-de',
      fn: () => synthesizeWithGoogleTranslate(truncated),
    });

    let lastError: Error | null = null;
    for (const provider of providers) {
      const cacheKey = hashKey(provider.name, provider.voice, truncated);
      const cached = getCached(cacheKey);
      if (cached) {
        return new NextResponse(new Uint8Array(cached), {
          status: 200,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'public, max-age=86400',
            'X-Cache': 'HIT',
            'X-TTS-Source': provider.name,
          },
        });
      }

      try {
        const buffer = await provider.fn();
        setCached(cacheKey, buffer);
        return new NextResponse(new Uint8Array(buffer), {
          status: 200,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'public, max-age=86400',
            'X-Cache': 'MISS',
            'X-TTS-Source': provider.name,
          },
        });
      } catch (err) {
        console.warn(`[TTS] Provider "${provider.name}" failed:`, (err as Error).message);
        lastError = err as Error;
        // Continue to next provider
      }
    }

    // All providers failed
    return NextResponse.json(
      {
        error: 'All TTS providers failed',
        detail: lastError?.message?.slice(0, 200) ?? 'unknown',
      },
      { status: 502 }
    );
  } catch (err) {
    console.error('[TTS] Server error:', err);
    return NextResponse.json(
      { error: 'Internal server error', detail: String(err).slice(0, 200) },
      { status: 500 }
    );
  }
}

// ============================================================
// GET endpoint — list available German voices
// ============================================================
// Used by settings UI later to let the user pick a voice.
export async function GET() {
  // Try fetching Google Cloud voices (works only if API is enabled)
  try {
    if (!googleTtsDisabled) {
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/voices?languageCode=de-DE&key=${DEV_GOOGLE_TTS_API_KEY}`
      );
      if (response.ok) {
        const data = await response.json();
        const voices = (data.voices || [])
          .filter((v: any) => v.name.includes('Standard') || v.name.includes('Neural2'))
          .map((v: any) => ({
            id: v.name,
            name: v.name,
            gender: v.ssmlGender || 'NEUTRAL',
            type: v.name.includes('Neural2') ? 'Neural2' : 'Standard',
          }));
        return NextResponse.json({ voices, provider: 'google-cloud' });
      }
    }
  } catch (err) {
    console.warn('[TTS] Could not fetch Google Cloud voices:', (err as Error).message);
  }

  // Fallback — return the preset voice list
  return NextResponse.json({
    voices: [
      { id: 'de-DE-Standard-A', name: 'de-DE-Standard-A', gender: 'FEMALE', type: 'Standard' },
      { id: 'de-DE-Standard-B', name: 'de-DE-Standard-B', gender: 'MALE', type: 'Standard' },
      { id: 'de-DE-Standard-C', name: 'de-DE-Standard-C', gender: 'FEMALE', type: 'Standard' },
      { id: 'de-DE-Standard-D', name: 'de-DE-Standard-D', gender: 'MALE', type: 'Standard' },
      { id: 'de-DE-Neural2-A', name: 'de-DE-Neural2-A', gender: 'FEMALE', type: 'Neural2' },
      { id: 'de-DE-Neural2-B', name: 'de-DE-Neural2-B', gender: 'MALE', type: 'Neural2' },
    ],
    provider: 'preset',
  });
}
