import { NextRequest, NextResponse } from 'next/server';

// Zhipu BigModel — GLM-4-Voice (end-to-end voice model)
const ZHIPU_API_KEY = '51d6b2bb24364d4c9f44912ebd64cd86.z122Ar2NXutBAB4L';
const ZHIPU_CHAT_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

const VOICE_MODEL = 'glm-4-voice';

interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

interface VoiceRequestBody {
  // Base64-encoded WAV audio from the browser microphone
  audioBase64: string;
  // Format hint: 'wav' | 'mp3' (browser typically records webm → we convert on client)
  audioFormat?: 'wav' | 'mp3';
  // Previous turns — system prompt is added by this route, not by client
  history: ConversationTurn[];
  // Topic + role description for the system prompt
  scenarioLabel: string;
  scenarioDescription: string;
  userRoleLabel: string;
  aiRoleLabel: string;
  // Optional: turn number, so we can ask the model to wrap up after N turns
  turnIndex?: number;
  maxTurns?: number;
}

// GLM-4-Voice requires user message content to be an array of typed parts.
// System + assistant messages keep string content.
function buildMessages(req: VoiceRequestBody) {
  const { history, scenarioLabel, scenarioDescription, userRoleLabel, aiRoleLabel, turnIndex = 0, maxTurns = 10 } = req;

  const shouldEnd = turnIndex >= maxTurns - 1;

  const systemPrompt = `Sen ${aiRoleLabel} olarak Almanca pratik yaptırıyorsun. Senin rolün: ${aiRoleLabel}.
Kullanıcının rolü: ${userRoleLabel}.
Senaryo: ${scenarioLabel} — ${scenarioDescription}

Kurallar:
- HER ZAMAN Almanca cevap ver. Türkçe veya İngilizce kullanma.
- Kısa ve doğal konuş (1-2 cümle).
- Kullanıcının söylediğini anla ve mantıklı bir şekilde yanıt ver.
${shouldEnd ? '- Bu konuşmanın son turu. Konuşmayı doğal bir şekilde bitir (veda et).' : ''}
- Asla "als AI", "als Sprachmodell" gibi meta-açıklamalar yapma. Rolünde kal.`;

  const messages: Array<{ role: string; content: unknown }> = [
    { role: 'system', content: systemPrompt },
  ];

  for (const turn of history) {
    if (turn.role === 'user') {
      // User turns must use array content for GLM-4-Voice.
      // For past turns (already transcribed), we send text-only.
      messages.push({
        role: 'user',
        content: [{ type: 'text', text: turn.content }],
      });
    } else {
      messages.push({ role: 'assistant', content: turn.content });
    }
  }

  // Latest user turn = audio input
  messages.push({
    role: 'user',
    content: [
      {
        type: 'input_audio',
        input_audio: {
          data: req.audioBase64,
          format: req.audioFormat || 'wav',
        },
      },
    ],
  });

  return messages;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as VoiceRequestBody;

    if (!body.audioBase64) {
      return NextResponse.json({ error: 'audioBase64 is required' }, { status: 400 });
    }
    if (!body.scenarioLabel) {
      return NextResponse.json({ error: 'scenarioLabel is required' }, { status: 400 });
    }

    const messages = buildMessages(body);

    const response = await fetch(ZHIPU_CHAT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ZHIPU_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: VOICE_MODEL,
        messages,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Voice] Zhipu GLM-4-Voice error:', response.status, errText);

      let userMessage = 'Sesli yanıt alınamadı';
      if (response.status === 401) {
        userMessage = 'Zhipu API anahtarı geçersiz (401).';
      } else if (response.status === 403) {
        userMessage = 'Zhipu API erişimi reddedildi (403).';
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
    const choice = data.choices?.[0];
    const message = choice?.message || {};

    const replyText: string = (message.content || '').trim();
    const audioData: string | undefined = message.audio?.data;
    const audioId: string | undefined = message.audio?.id;

    if (!replyText && !audioData) {
      return NextResponse.json(
        { error: 'GLM-4-Voice boş yanıt döndürdü', raw: JSON.stringify(data).slice(0, 500) },
        { status: 502 }
      );
    }

    return NextResponse.json({
      reply: replyText,
      audioBase64: audioData || '',
      audioFormat: 'wav',
      audioId,
      isEnding: choice?.finish_reason === 'stop' && (body.turnIndex || 0) >= (body.maxTurns || 10) - 1,
      usage: data.usage,
    });
  } catch (err) {
    console.error('[Voice] Server error:', err);
    return NextResponse.json(
      { error: 'Internal server error', detail: String(err).slice(0, 200) },
      { status: 500 }
    );
  }
}
