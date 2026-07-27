import { NextRequest, NextResponse } from 'next/server';

// ============================================================
// Chat API — Provider chain: Zhipu (docs.z.ai) → Google Gemini
// ============================================================

// Dev default keys (client can override via request body)
const DEV_ZHIPU_API_KEY = '51d6b2bb24364d4c9f44912ebd64cd86.z122Ar2NXutBAB4L';
const DEV_GOOGLE_AI_KEY = '';

// Zhipu API endpoints — try new (docs.z.ai) first, fall back to classic
const ZHIPU_ENDPOINTS = [
  'https://open.z.ai/api/paas/v4/chat/completions',
  'https://open.bigmodel.cn/api/paas/v4/chat/completions',
];

// Google Gemini endpoint
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const CHAT_MODEL = 'glm-4-flash';
const GEMINI_MODEL = 'gemini-2.0-flash';

interface IncomingMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequestBody {
  messages: IncomingMessage[];
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
  zhipuKey?: string;
  googleAiKey?: string;
}

function extractJson(content: string): { reply: string; tip: string; isEnding: boolean } | null {
  if (!content) return null;
  let cleaned = content.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  }
  try {
    const parsed = JSON.parse(cleaned);
    if (typeof parsed === 'object' && parsed !== null && typeof parsed.reply === 'string') {
      return {
        reply: parsed.reply,
        tip: typeof parsed.tip === 'string' ? parsed.tip : '',
        isEnding: Boolean(parsed.isEnding),
      };
    }
  } catch {
    // fall through
  }
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (typeof parsed.reply === 'string') {
        return {
          reply: parsed.reply,
          tip: typeof parsed.tip === 'string' ? parsed.tip : '',
          isEnding: Boolean(parsed.isEnding),
        };
      }
    } catch {
      // fall through
    }
  }
  return null;
}

// ============================================================
// Provider 1: Zhipu (docs.z.ai / open.bigmodel.cn)
// ============================================================
async function callZhipu(
  messages: IncomingMessage[],
  systemPrompt: string,
  apiKey: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  const fullMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...messages,
  ];

  const payload = {
    model: CHAT_MODEL,
    messages: fullMessages,
    temperature,
    max_tokens: maxTokens,
  };

  let lastError: Error | null = null;

  // Try each Zhipu endpoint
  for (const url of ZHIPU_ENDPOINTS) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const content: string = data.choices?.[0]?.message?.content || '';
        if (content) return content;
        throw new Error('Empty response from Zhipu');
      }

      // Auth error — don't try next endpoint
      if (response.status === 401 || response.status === 403) {
        const errText = await response.text().catch(() => '');
        throw new Error(`Zhipu auth error (${response.status}): ${errText.slice(0, 200)}`);
      }

      // Other error — try next endpoint
      const errText = await response.text().catch(() => '');
      lastError = new Error(`Zhipu ${response.status}: ${errText.slice(0, 200)}`);
      console.warn(`[Chat] Zhipu endpoint ${url} failed: ${response.status}`);
    } catch (err) {
      if ((err as Error).message.includes('auth error')) throw err;
      lastError = err as Error;
      console.warn(`[Chat] Zhipu endpoint ${url} error:`, (err as Error).message);
    }
  }

  throw lastError || new Error('All Zhipu endpoints failed');
}

// ============================================================
// Provider 2: Google Gemini
// ============================================================
async function callGemini(
  messages: IncomingMessage[],
  systemPrompt: string,
  apiKey: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  // Convert messages to Gemini format
  const geminiContents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  // System instruction is separate in Gemini
  const payload = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: geminiContents,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  };

  const url = `${GEMINI_URL}?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Gemini API error (${response.status}): ${errText.slice(0, 300)}`);
  }

  const data = await response.json();
  const content: string = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!content) {
    // Check for safety block
    if (data.candidates?.[0]?.finishReason === 'SAFETY') {
      throw new Error('Gemini güvenlik filtresi yanıtı engelledi.');
    }
    throw new Error('Empty response from Gemini');
  }
  return content;
}

// ============================================================
// Main handler
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequestBody;

    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json({ error: 'Messages array required' }, { status: 400 });
    }
    if (!body.systemPrompt || typeof body.systemPrompt !== 'string') {
      return NextResponse.json({ error: 'systemPrompt required' }, { status: 400 });
    }

    const temperature = body.temperature ?? 0.7;
    const maxTokens = body.maxTokens ?? 500;

    // Resolve API keys: client > env > dev default
    const zhipuKey = body.zhipuKey || process.env.ZHIPU_API_KEY || DEV_ZHIPU_API_KEY;
    const googleAiKey = body.googleAiKey || process.env.GOOGLE_AI_KEY || DEV_GOOGLE_AI_KEY;

    let rawContent = '';
    let usedProvider = '';

    // Try Zhipu first (if key available)
    if (zhipuKey) {
      try {
        rawContent = await callZhipu(body.messages, body.systemPrompt, zhipuKey, temperature, maxTokens);
        usedProvider = 'zhipu';
      } catch (err) {
        console.warn('[Chat] Zhipu failed, trying Gemini:', (err as Error).message);
      }
    }

    // Fallback to Google Gemini
    if (!rawContent && googleAiKey) {
      try {
        rawContent = await callGemini(body.messages, body.systemPrompt, googleAiKey, temperature, maxTokens);
        usedProvider = 'google-gemini';
      } catch (err) {
        console.warn('[Chat] Gemini also failed:', (err as Error).message);
      }
    }

    if (!rawContent) {
      const noKeysMsg = !zhipuKey && !googleAiKey
        ? 'API anahtarı gerekli. Lütfen Ayarlar sayfasından Zhipu veya Google AI API anahtarınızı girin.'
        : 'Tüm AI sağlayıcıları başarısız oldu. Lütfen API anahtarlarınızı kontrol edin.';
      return NextResponse.json({ error: noKeysMsg }, { status: 502 });
    }

    // Try structured JSON extraction
    const parsed = extractJson(rawContent);
    if (parsed) {
      return NextResponse.json({ ...parsed, provider: usedProvider });
    }

    return NextResponse.json({
      reply: rawContent.trim(),
      tip: '',
      isEnding: false,
      provider: usedProvider,
    });
  } catch (err) {
    console.error('[Chat] Server error:', err);
    return NextResponse.json(
      { error: 'Internal server error', detail: String(err).slice(0, 200) },
      { status: 500 },
    );
  }
}
