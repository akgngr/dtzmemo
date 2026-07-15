import { NextRequest, NextResponse } from 'next/server';

// Zhipu BigModel API — same key works for GLM-4.5-Air (chat) and GLM-ASR-2512 (transcription)
const ZHIPU_API_KEY = '51d6b2bb24364d4c9f44912ebd64cd86.z122Ar2NXutBAB4L';
const ZHIPU_TRANSCRIPTION_URL =
  'https://open.bigmodel.cn/api/paas/v4/audio/transcriptions';

// GLM-ASR-2512: Zhipu's dedicated speech-to-text model.
// Supports ONLY wav + mp3, up to 25MB / 30s. Multilingual (incl. German + Turkish).
// Browser records webm/opus, which Zhipu rejects with 400 — so we convert on the
// client side to WAV (44100Hz mono 16-bit PCM) and send the base64 string here.
//
// IMPORTANT: Zhipu's `file_base64` parameter must be in a JSON body, NOT in
// multipart/form-data. The multipart path only accepts `file` (binary upload).
const STT_MODEL = 'glm-asr-2512';

interface JsonBody {
  audioBase64?: string;
  audioFormat?: 'wav' | 'mp3';
  language?: string;
  prompt?: string;
  hotwords?: string[];
}

export async function POST(req: NextRequest) {
  try {
    let audioBase64: string | undefined;
    let language = 'de';
    let prompt = '';
    let hotwords: string[] = [];
    let audioFile: File | null = null;

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      // JSON path: client converts to WAV base64 and posts JSON.
      // This is the preferred path because Zhipu's `file_base64` field only works
      // in JSON bodies, not multipart/form-data.
      const body = (await req.json()) as JsonBody;
      audioBase64 = body.audioBase64;
      language = body.language || 'de';
      prompt = body.prompt || '';
      hotwords = Array.isArray(body.hotwords) ? body.hotwords : [];
    } else {
      // Legacy multipart path: client posts raw blob as `file`.
      // Zhipu will REJECT webm/opus — client must convert to WAV first.
      const formData = await req.formData();
      audioFile = formData.get('audio') as File | null;
      language = (formData.get('language') as string) || 'de';
      prompt = (formData.get('prompt') as string) || '';
      const hotwordsRaw = (formData.get('hotwords') as string) || '';
      if (hotwordsRaw) {
        hotwords = hotwordsRaw
          .split(',')
          .map((w) => w.trim())
          .filter(Boolean);
      }
    }

    if (!audioBase64 && !audioFile) {
      return NextResponse.json({ error: 'Audio is required' }, { status: 400 });
    }

    // Build the request to Zhipu. We have two paths:
    //   1. JSON body with file_base64 (preferred — works reliably)
    //   2. Multipart with `file` binary upload (legacy fallback)
    let response: Response;

    if (audioBase64) {
      // JSON path
      const jsonBody: Record<string, unknown> = {
        model: STT_MODEL,
        stream: false,
        file_base64: audioBase64,
      };
      if (prompt) jsonBody.prompt = prompt.slice(0, 8000);
      if (hotwords.length > 0) jsonBody.hotwords = hotwords.slice(0, 100);

      response = await fetch(ZHIPU_TRANSCRIPTION_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ZHIPU_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonBody),
      });
    } else {
      // Multipart path
      const forward = new FormData();
      forward.append('model', STT_MODEL);
      forward.append('stream', 'false');
      if (audioFile) {
        forward.append('file', audioFile, audioFile.name || 'audio.wav');
      }
      if (prompt) forward.append('prompt', prompt.slice(0, 8000));
      if (hotwords.length > 0) {
        forward.append('hotwords', JSON.stringify(hotwords.slice(0, 100)));
      }

      response = await fetch(ZHIPU_TRANSCRIPTION_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ZHIPU_API_KEY}`,
        },
        body: forward,
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error(
        '[Transcribe] Zhipu ASR error:',
        response.status,
        errText.slice(0, 500)
      );

      let userMessage = 'Ses tanıma başarısız';
      if (response.status === 401) {
        userMessage =
          'Zhipu API anahtarı geçersiz (401). Lütfen API anahtarınızı kontrol edin.';
      } else if (response.status === 403) {
        userMessage =
          'Zhipu API erişimi reddedildi (403). IP kısıtlamalarını kontrol edin.';
      } else if (response.status === 413) {
        userMessage =
          'Ses dosyası çok büyük. Maksimum 25MB veya 30 saniye olmalı.';
      } else if (response.status === 415 || response.status === 400) {
        userMessage = 'Ses formatı desteklenmiyor. WAV veya MP3 gerekir.';
      } else if (response.status === 429) {
        userMessage = 'Zhipu API hız sınırına ulaşıldı. Lütfen biraz bekleyin.';
      } else if (response.status >= 500) {
        userMessage = 'Zhipu sunucusu geçici olarak kullanılamıyor.';
      }

      return NextResponse.json(
        {
          error: userMessage,
          detail: errText.slice(0, 500),
          status: response.status,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text: string = (data.text || '').trim();

    return NextResponse.json({
      text,
      language,
      model: STT_MODEL,
      id: data.id,
    });
  } catch (err) {
    console.error('[Transcribe] Server error:', err);
    return NextResponse.json(
      { error: 'Internal server error', detail: String(err).slice(0, 200) },
      { status: 500 }
    );
  }
}
