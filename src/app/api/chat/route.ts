import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { ensureInitialized, findSuggestions, clearCache } from '@/lib/suggestion-engine';
import { allTopicScenarios } from '@/lib/suggestion-scenarios';

// ============================================================
// Chat API — VECTOR ENGINE + LLM FALLBACK
// Call 1: Conversational reply  → { reply, tip, isEnding }
// Call 2 (vector first, LLM fallback): Suggestions
// ============================================================

const DEV_ZHIPU_API_KEY = '51d6b2bb24364d4c9f44912ebd64cd86.z122Ar2NXutBAB4L';

const ZHIPU_ENDPOINTS = [
  'https://open.z.ai/api/paas/v4/chat/completions',
  'https://open.bigmodel.cn/api/paas/v4/chat/completions',
];
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const ZHIPU_MODEL = 'glm-4-flash';
const OPENAI_MODEL = 'gpt-4o-mini';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
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
  openaiKey?: string;
  claudeKey?: string;
  googleAiKey?: string;
  topicId?: string; // NEW: for vector suggestion engine
}

// ============================================================
// Shared provider call
// ============================================================
async function callProvider(
  provider: string,
  messages: { role: string; content: string }[],
  systemPrompt: string,
  keys: { zhipu: string; openai: string; claude: string; google: string },
  temperature: number,
  maxTokens: number,
  jsonMode: boolean,
): Promise<{ content: string; provider: string }> {
  // --- Zhipu ---
  if (provider === 'zhipu' && keys.zhipu) {
    const payload: any = {
      model: ZHIPU_MODEL,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature,
      max_tokens: maxTokens,
    };
    if (jsonMode) payload.response_format = { type: 'json_object' };
    for (const url of ZHIPU_ENDPOINTS) {
      try {
        const r = await fetch(url, {
          method: 'POST',
          headers: { Authorization: `Bearer ${keys.zhipu}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (r.ok) {
          const d = await r.json();
          const c = d.choices?.[0]?.message?.content || '';
          if (c) return { content: c, provider: 'zhipu' };
        }
        if (r.status === 401 || r.status === 403) {
          const t = await r.text().catch(() => '');
          throw new Error(`Zhipu auth ${r.status}: ${t.slice(0, 100)}`);
        }
      } catch (e) {
        if ((e as Error).message.includes('auth')) throw e;
      }
    }
    throw new Error('Zhipu failed');
  }

  // --- OpenAI ---
  if (provider === 'openai' && keys.openai) {
    const client = new OpenAI({ apiKey: keys.openai });
    const r = await client.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: 'system', content: systemPrompt }, ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))],
      temperature,
      max_tokens: maxTokens,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    });
    const c = r.choices?.[0]?.message?.content || '';
    if (!c) throw new Error('Empty OpenAI response');
    return { content: c, provider: 'openai' };
  }

  // --- Claude ---
  if (provider === 'claude' && keys.claude) {
    const client = new Anthropic({ apiKey: keys.claude });
    const r = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' as const : 'user' as const, content: m.content })),
    });
    const c = r.content.find(b => b.type === 'text')?.text || '';
    if (!c) throw new Error('Empty Claude response');
    return { content: c, provider: 'claude' };
  }

  // --- Gemini ---
  if (provider === 'gemini' && keys.google) {
    const payload: any = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
      generationConfig: { temperature, maxOutputTokens: maxTokens },
    };
    if (jsonMode) payload.generationConfig.responseMimeType = 'application/json';
    const r = await fetch(`${GEMINI_URL}?key=${keys.google}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const t = await r.text().catch(() => '');
      throw new Error(`Gemini ${r.status}: ${t.slice(0, 200)}`);
    }
    const d = await r.json();
    const c = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!c) throw new Error('Empty Gemini response');
    return { content: c, provider: 'gemini' };
  }

  throw new Error(`Provider ${provider} not available`);
}

// ============================================================
// Call 1: Conversational reply  { reply, tip, isEnding }
// ============================================================
async function getConversationReply(
  messages: IncomingMessage[],
  systemPrompt: string,
  keys: { zhipu: string; openai: string; claude: string; google: string },
  temperature: number,
  maxTokens: number,
): Promise<{ reply: string; tip: string; isEnding: boolean; provider: string }> {
  const providerOrder = ['zhipu', 'openai', 'claude', 'gemini'];

  for (const prov of providerOrder) {
    const hasKey = (prov === 'zhipu' && keys.zhipu) ||
      (prov === 'openai' && keys.openai) ||
      (prov === 'claude' && keys.claude) ||
      (prov === 'gemini' && keys.google);
    if (!hasKey) continue;

    try {
      const result = await callProvider(prov, messages, systemPrompt, keys, temperature, maxTokens, true);
      const parsed = parseReplyJson(result.content);
      if (parsed) {
        console.log(`[Chat] Call1 (${result.provider}) OK. reply length: ${parsed.reply.length}`);
        return { ...parsed, provider: result.provider };
      }
      console.warn(`[Chat] Call1 (${result.provider}): JSON parse failed`);
    } catch (e) {
      console.warn(`[Chat] Call1 ${prov} failed:`, (e as Error).message);
    }
  }
  throw new Error('All providers failed for conversation reply');
}

function parseReplyJson(content: string): { reply: string; tip: string; isEnding: boolean } | null {
  if (!content) return null;
  let c = content.trim();
  if (c.startsWith('```')) c = c.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  // Direct parse
  try {
    const obj = JSON.parse(c);
    if (typeof obj?.reply === 'string') return { reply: obj.reply, tip: typeof obj.tip === 'string' ? obj.tip : '', isEnding: Boolean(obj.isEnding) };
  } catch {}

  // Extract JSON object
  const m = c.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
  if (m) {
    for (let i = m.length - 1; i >= 0; i--) {
      try {
        const obj = JSON.parse(m[i]);
        if (typeof obj?.reply === 'string') return { reply: obj.reply, tip: typeof obj.tip === 'string' ? obj.tip : '', isEnding: Boolean(obj.isEnding) };
      } catch {}
    }
  }

  // Repair
  const f = c.indexOf('{'), l = c.lastIndexOf('}');
  if (f >= 0 && l > f) {
    try {
      let r = c.slice(f, l + 1).replace(/,\s*([}\]])/g, '$1').replace(/(?<![\\\"])'(?![\\\"])/g, '"');
      const obj = JSON.parse(r);
      if (typeof obj?.reply === 'string') return { reply: obj.reply, tip: typeof obj.tip === 'string' ? obj.tip : '', isEnding: Boolean(obj.isEnding) };
    } catch {}
  }

  // Last resort: raw text as reply
  if (c.length > 5 && c.length < 2000) return { reply: c, tip: '', isEnding: false };
  return null;
}

// ============================================================
// Call 2 (LLM fallback): Get context-aware suggestions
// ============================================================
function buildSuggestionPrompt(conversationMessages: IncomingMessage[], aiReply: string): string {
  const recent = conversationMessages.slice(-8);
  const transcript = recent.map(m => {
    const label = m.role === 'assistant' ? 'Pruefer' : 'Lernender';
    return `${label}: ${m.content}`;
  }).join('\n');

  // Detect what the AI's last message is asking about
  const lowerReply = aiReply.toLowerCase();
  const topicHint = lowerReply.includes('farbe') ? 'FRAGE ueber FARBE'
    : lowerReply.includes('groesse') || lowerReply.includes('größe') ? 'FRAGE ueber GROESSE'
    : lowerReply.includes('preis') || lowerReply.includes('kosten') || lowerReply.includes('teuer') ? 'FRAGE ueber PREIS'
    : lowerReply.includes('marke') ? 'FRAGE ueber MARKE'
    : lowerReply.includes('wohn') ? 'FRAGE ueber WOHNEN'
    : lowerReply.includes('beruf') || lowerReply.includes('arbeit') ? 'FRAGE ueber BERUF'
    : lowerReply.includes('hobby') || lowerReply.includes('freizeit') ? 'FRAGE ueber HOBBY/FREIZEIT'
    : lowerReply.includes('sprache') || lowerReply.includes('deutsch') ? 'FRAGE ueber SPRACHE/LERNEN'
    : lowerReply.includes('weather') || lowerReply.includes('wetter') ? 'FRAGE ueber WETTER'
    : lowerReply.includes('essen') || lowerReply.includes('speise') || lowerReply.includes('speisen') ? 'FRAGE ueber ESSEN'
    : lowerReply.includes('reservier') || lowerReply.includes('tisch') ? 'FRAGE ueber RESERVIERUNG'
    : 'ALLGEMEINE FRAGE';

  return `Du bist ein Deutschlehrer. Ein B1-Lernender fuehrt eine Konversation.

BISHERIGE KONVERSATION:
${transcript}

DER PRUEFER HAT GERADE GEANTWORTET:
"${aiReply.replace(/"/g, '\\"').slice(0, 400)}"

KONTEXTHINWEIS: ${topicHint}

AUFGABE: Gib GENAU 3 voelligenstaendige, UNABHAENGIGE deutsche Saetze, die der Lernende als ANTWORT auf die letzte Frage sagen koennte.

STRENGE REGELN:
- Jeder Satz muss FUER SICH ALLEINE eine vollstaendige, sinnvolle Antwort sein
- Jeder Satz muss 4-10 Woerter lang sein
- Die 3 Saetze muessen UNTERSCHIEDLICHE Antworten sein (nicht dieselbe Idee neu formuliert)
- Die Saetze muessen zur KONVERSATION passen (B1 Niveau)
- KEIN Satz darf ein Teil eines anderen Satzes sein

BEISPIEL FUER "Welche Farbe bevorzugst du?":
{"suggestions": ["Ich moechte gerne ein blaues Hemd.", "Eigentlich habe ich keine Lieblingsfarbe.", "Haben Sie etwas in Schwarz?"]}

BEISPIEL FUER "Was machen Sie in Ihrer Freizeit?":
{"suggestions": ["Ich spiele gerne Fussball mit Freunden.", "Am Wochenende lese ich oft Buecher.", "Ich koche gerne deutsche Gerichte."]}

Antworte NUR mit JSON: {"suggestions": ["Satz 1", "Satz 2", "Satz 3"]}`;
}

async function getLlmSuggestions(
  conversationMessages: IncomingMessage[],
  aiReply: string,
  keys: { zhipu: string; openai: string; claude: string; google: string },
): Promise<string[]> {
  const prompt = buildSuggestionPrompt(conversationMessages, aiReply);
  const msg: IncomingMessage = { role: 'user', content: prompt };

  const providerOrder = ['zhipu', 'openai', 'claude', 'gemini'];
  for (const prov of providerOrder) {
    const hasKey = (prov === 'zhipu' && keys.zhipu) ||
      (prov === 'openai' && keys.openai) ||
      (prov === 'claude' && keys.claude) ||
      (prov === 'gemini' && keys.google);
    if (!hasKey) continue;

    try {
      const result = await callProvider(prov, [msg], '', keys, 0.5, 250, true);
      const arr = parseSuggestionArray(result.content);
      if (arr.length >= 2) {
        console.log(`[Chat] LLM suggestions (${result.provider}):`, JSON.stringify(arr));
        return arr.slice(0, 3);
      }
    } catch (e) {
      console.warn(`[Chat] LLM suggestions ${prov} failed:`, (e as Error).message);
    }
  }
  return [];
}

function parseSuggestionArray(content: string): string[] {
  if (!content) return [];
  let c = content.trim();
  if (c.startsWith('```')) c = c.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  try {
    const obj = JSON.parse(c);
    const field = obj.suggestions || obj.vorschlaege || obj.answers || obj.array;
    if (Array.isArray(field)) return field.filter((s: unknown) => typeof s === 'string' && s.length > 2 && s.length < 80);
    if (Array.isArray(obj)) return obj.filter((s: unknown) => typeof s === 'string' && s.length > 2 && s.length < 80);
  } catch {}

  const arrMatch = c.match(/\[[^\]]+\]/);
  if (arrMatch) {
    try {
      const arr = JSON.parse(arrMatch[0]);
      if (Array.isArray(arr)) return arr.filter((s: unknown) => typeof s === 'string' && s.length > 2 && s.length < 80);
    } catch {}
  }

  const objMatch = c.match(/\{[^{}]*\}/);
  if (objMatch) {
    try {
      const obj = JSON.parse(objMatch[0]);
      const field = obj.suggestions || obj.vorschlaege || obj.answers;
      if (Array.isArray(field)) return field.filter((s: unknown) => typeof s === 'string' && s.length > 2 && s.length < 80);
    } catch {}
  }

  return [];
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

    const keys = {
      zhipu: body.zhipuKey || process.env.ZHIPU_API_KEY || DEV_ZHIPU_API_KEY,
      openai: body.openaiKey || process.env.OPENAI_API_KEY || '',
      claude: body.claudeKey || process.env.ANTHROPIC_API_KEY || '',
      google: body.googleAiKey || process.env.GOOGLE_AI_KEY || '',
    };

    // ============ CALL 1: Conversational reply ============
    console.log(`[Chat] Call1 starting... (${body.messages.length} messages, topic: ${body.topicId || 'none'})`);
    const convResult = await getConversationReply(body.messages, body.systemPrompt, keys, temperature, maxTokens);

    // ============ CALL 2: Suggestions (VECTOR FIRST, LLM FALLBACK) ============
    let suggestions: string[] = [];
    const topicId = body.topicId || '';

    // Skip vector engine for b1-vorstellung (dynamic content, no pre-defined scenarios)
    if (topicId && topicId !== 'b1-vorstellung') {
      const topicScenarios = allTopicScenarios.find(t => t.topicId === topicId);
      if (topicScenarios && topicScenarios.scenarios.length > 0) {
        try {
          console.log(`[Chat] Vector engine: initializing for ${topicId}...`);
          await ensureInitialized(topicId, topicScenarios.scenarios, keys.zhipu);
          console.log(`[Chat] Vector engine: searching for suggestions...`);
          const vectorResult = await findSuggestions(topicId, convResult.reply, keys.zhipu, 0.35);
          if (vectorResult) {
            suggestions = vectorResult;
            console.log(`[Chat] Vector engine: MATCH FOUND! suggestions:`, JSON.stringify(suggestions));
          } else {
            console.log(`[Chat] Vector engine: no match, falling back to LLM`);
          }
        } catch (e) {
          console.warn(`[Chat] Vector engine error, falling back to LLM:`, (e as Error).message);
        }
      }
    }

    // LLM fallback if vector engine didn't find a match
    if (suggestions.length === 0) {
      const fullConversation = [...body.messages, { role: 'assistant' as const, content: convResult.reply }];
      console.log(`[Chat] LLM fallback starting...`);
      suggestions = await getLlmSuggestions(fullConversation, convResult.reply, keys);
    }

    console.log(`[Chat] Done. Provider: ${convResult.provider}, suggestions: ${suggestions.length}`);

    return NextResponse.json({
      reply: convResult.reply,
      tip: convResult.tip,
      isEnding: convResult.isEnding,
      suggestions,
      provider: convResult.provider,
    });
  } catch (err) {
    console.error('[Chat] Server error:', err);
    return NextResponse.json(
      { error: 'Internal server error', detail: String(err).slice(0, 200) },
      { status: 500 },
    );
  }
}
