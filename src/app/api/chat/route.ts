import { NextRequest, NextResponse } from 'next/server';

// Dev-only default key — used when no key is provided in the request body.
// In production, the client must send the user's own key.
const DEV_ZHIPU_API_KEY = '51d6b2bb24364d4c9f44912ebd64cd86.z122Ar2NXutBAB4L';
const ZHIPU_CHAT_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

const CHAT_MODEL = 'glm-4.5-air';

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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequestBody;

    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json({ error: 'Messages array required' }, { status: 400 });
    }
    if (!body.systemPrompt || typeof body.systemPrompt !== 'string') {
      return NextResponse.json({ error: 'systemPrompt required' }, { status: 400 });
    }

    // Resolve API key: client-provided > dev default > error
    const apiKey = body.zhipuKey || (process.env.NODE_ENV !== 'production' ? DEV_ZHIPU_API_KEY : '');
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Zhipu API anahtarı gerekli. Lütfen Ayarlar sayfasından API anahtarınızı girin.' },
        { status: 400 }
      );
    }

    const fullMessages = [
      { role: 'system', content: body.systemPrompt },
      ...body.messages,
    ];

    const payload: Record<string, unknown> = {
      model: CHAT_MODEL,
      messages: fullMessages,
      temperature: body.temperature ?? 0.7,
      max_tokens: body.maxTokens ?? 500,
      thinking: { type: 'disabled' },
    };

    const response = await fetch(ZHIPU_CHAT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Chat] Zhipu API error:', response.status, errText);

      let userMessage = 'Yanıt alınamadı';
      if (response.status === 401) {
        userMessage = 'Zhipu API anahtarı geçersiz (401). Lütfen anahtarınızı kontrol edin.';
      } else if (response.status === 403) {
        userMessage =
          'Zhipu API erişimi reddedildi (403). API anahtarınızı veya IP kısıtlamalarını kontrol edin.';
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
    const rawContent: string = data.choices?.[0]?.message?.content || '';

    const parsed = extractJson(rawContent);
    if (parsed) {
      return NextResponse.json(parsed);
    }

    return NextResponse.json({
      reply: rawContent.trim(),
      tip: '',
      isEnding: false,
    });
  } catch (err) {
    console.error('[Chat] Server error:', err);
    return NextResponse.json(
      { error: 'Internal server error', detail: String(err).slice(0, 200) },
      { status: 500 }
    );
  }
}