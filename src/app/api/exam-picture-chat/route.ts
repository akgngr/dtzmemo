import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const DEV_ZHIPU_API_KEY = '51d6b2bb24364d4c9f44912ebd64cd86.z122Ar2NXutBAB4L';
const ZHIPU_ENDPOINTS = [
  'https://open.bigmodel.cn/api/paas/v4/chat/completions',
];
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const ZHIPU_MODEL = 'glm-4-flash';
const OPENAI_MODEL = 'gpt-4o-mini';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

/* ══════════ Image Analysis Cache ══════════ */
const imageCache = new Map<string, { description: string; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function getCachedDescription(imageUrl: string): string | null {
  const entry = imageCache.get(imageUrl);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    console.log('[exam-vision] Cache HIT for', imageUrl.slice(-40));
    return entry.description;
  }
  if (entry) imageCache.delete(imageUrl);
  return null;
}

function setCachedDescription(imageUrl: string, description: string) {
  imageCache.set(imageUrl, { description, timestamp: Date.now() });
  console.log('[exam-vision] Cached description for', imageUrl.slice(-40));
}

interface Message { role: 'user' | 'assistant'; content: string; }

interface RequestBody {
  imageUrl: string;
  messages: Message[];
  level: 'beginner' | 'intermediate' | 'pro';
  imageDescription?: string;
  fallbackDescription?: string;
  isFirstMessage: boolean;
  zhipuKey?: string;
  openaiKey?: string;
  claudeKey?: string;
  googleAiKey?: string;
  cachedDescription?: string;
  returnSample?: boolean;
}

/* ══════════ Helper: Fetch image as base64 ══════════ */
async function fetchImageAsBase64(imageUrl: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const res = await fetch(imageUrl, { headers: { 'User-Agent': 'DeutschMemo/1.0' } });
    if (!res.ok) { console.warn('[fetchImage] HTTP', res.status); return null; }
    const ct = res.headers.get('content-type') || 'image/jpeg';
    const mime = ct.split(';')[0].trim();
    const buf = Buffer.from(await res.arrayBuffer());
    return { data: buf.toString('base64'), mimeType: mime };
  } catch (e) {
    console.warn('[fetchImage] Failed:', (e as Error).message);
    return null;
  }
}

/* ══════════ Vision: Analyze Image ══════════ */
async function analyzeImage(
  imageUrl: string,
  keys: { zhipu: string; openai: string; claude: string; google: string },
): Promise<string> {
  const prompt = `Du bist ein Deutschlehrer. Analysiere dieses Bild fuer eine B1-Pruefung "Bildbeschreibung".
Gib eine detaillierte Beschreibung auf Deutsch. Beruecksichtige:
1. Vordergrund (Was ist im Vordergrund zu sehen?)
2. Hintergrund (Was ist im Hintergrund?)
3. Personen (Welche Personen sind zu sehen und was tun sie?)
4. Atmosphaere/Stimmung
5. Besonderheiten

Antworte mit JSON:
{"description": "Deutsche Gesamtbeschreibung (4-6 Saetze)", "foreground": "...", "background": "...", "people": "...", "atmosphere": "...", "details": "...", "suggestedVocab": [{"word": "Wort", "article": "der/die/das", "meaning": "Anlam", "example": "Beispielsatz"}, ...], "examTips": ["Tipp1", ...]}`;

  const needsBase64 = keys.google || keys.claude;
  let imgBase64: { data: string; mimeType: string } | null = null;
  if (needsBase64) {
    console.log('[exam-vision] Fetching image for base64 conversion...');
    imgBase64 = await fetchImageAsBase64(imageUrl);
  }

  // 1) OpenAI Vision
  if (keys.openai) {
    try {
      console.log('[exam-vision] Trying OpenAI vision...');
      const client = new OpenAI({ apiKey: keys.openai });
      const r = await client.chat.completions.create({
        model: 'gpt-4o-mini', max_tokens: 1000,
        messages: [{ role: 'user', content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageUrl } },
        ]}],
        response_format: { type: 'json_object' },
      });
      const c = r.choices?.[0]?.message?.content || '';
      if (c) { console.log('[exam-vision] OpenAI vision succeeded'); return c; }
    } catch (e) { console.warn('[exam-vision] OpenAI vision failed:', (e as Error).message); }
  }

  // 2) Gemini Vision
  if (keys.google && imgBase64) {
    try {
      const r = await fetch(`${GEMINI_URL}?key=${keys.google}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: 'Antworte NUR mit JSON, kein Markdown.' }] },
          contents: [{ role: 'user', parts: [
            { text: prompt },
            { inlineData: { mimeType: imgBase64.mimeType, data: imgBase64.data } },
          ]}],
          generationConfig: { maxOutputTokens: 1000, responseMimeType: 'application/json' },
        }),
      });
      if (r.ok) {
        const d = await r.json();
        const c = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (c) { console.log('[exam-vision] Gemini vision succeeded'); return c; }
      }
    } catch (e) { console.warn('[exam-vision] Gemini vision failed:', (e as Error).message); }
  }

  // 3) Claude Vision
  if (keys.claude && imgBase64) {
    try {
      const client = new Anthropic({ apiKey: keys.claude });
      const r = await client.messages.create({
        model: CLAUDE_MODEL, max_tokens: 1000, system: 'Antworte NUR mit JSON, kein Markdown.',
        messages: [{ role: 'user', content: [
          { type: 'text', text: prompt },
          { type: 'image', source: { type: 'base64', media_type: imgBase64.mimeType as 'image/jpeg', data: imgBase64.data } },
        ]}],
      });
      const c = r.content.find(b => b.type === 'text')?.text || '';
      if (c) { console.log('[exam-vision] Claude vision succeeded'); return c; }
    } catch (e) { console.warn('[exam-vision] Claude vision failed:', (e as Error).message); }
  }

  throw new Error('Resim analizi icin kullanilabilir bir vision API anahtari bulunamadi.');
}

/* ══════════ Conversation LLM Call ══════════ */
interface LLMResult {
  reply: string;
  tip: string;
  isEnding: boolean;
  suggestions: string[];
  grammarCorrections?: { original: string; corrected: string; explanation: string }[];
  sampleAnswer?: string;
  sessionFeedback?: { strengths: string[]; improvements: string[]; score: string };
}

async function chatReply(
  messages: Message[],
  systemPrompt: string,
  keys: { zhipu: string; openai: string; claude: string; google: string },
): Promise<LLMResult> {
  const providers: { name: string; hasKey: boolean }[] = [
    { name: 'zhipu', hasKey: !!keys.zhipu },
    { name: 'openai', hasKey: !!keys.openai },
    { name: 'claude', hasKey: !!keys.claude },
    { name: 'gemini', hasKey: !!keys.google },
  ];

  for (const { name, hasKey } of providers) {
    if (!hasKey) continue;
    try {
      let content = '';
      if (name === 'zhipu') {
        const zhipuMsgs = messages.length > 0
          ? [{ role: 'system' as const, content: systemPrompt }, ...messages]
          : [{ role: 'user' as const, content: 'Bitte beginnen Sie die Bildbeschreibung.' }];
        const zhipuPayload = messages.length > 0
          ? { model: ZHIPU_MODEL, messages: zhipuMsgs, temperature: 0.7, max_tokens: 800, response_format: { type: 'json_object' } as const }
          : { model: ZHIPU_MODEL, messages: [{ role: 'system' as const, content: systemPrompt }, ...zhipuMsgs], temperature: 0.7, max_tokens: 800, response_format: { type: 'json_object' } as const };
        for (const url of ZHIPU_ENDPOINTS) {
          try {
            const r = await fetch(url, {
              method: 'POST',
              headers: { Authorization: `Bearer ${keys.zhipu}`, 'Content-Type': 'application/json' },
              body: JSON.stringify(zhipuPayload),
            });
            if (r.ok) { const data = await r.json(); content = data.choices?.[0]?.message?.content || ''; if (content) break; }
          } catch (e) { console.warn(`[exam-picture-chat] zhipu fetch error:`, (e as Error).message); }
        }
      } else if (name === 'openai') {
        const client = new OpenAI({ apiKey: keys.openai });
        const r = await client.chat.completions.create({
          model: OPENAI_MODEL,
          messages: messages.length > 0
            ? [{ role: 'system' as const, content: systemPrompt }, ...messages.map(m => ({ role: m.role, content: m.content }))]
            : [{ role: 'system' as const, content: systemPrompt }, { role: 'user' as const, content: 'Bitte beginnen Sie die Bildbeschreibung.' }],
          temperature: 0.7, max_tokens: 800, response_format: { type: 'json_object' },
        });
        content = r.choices?.[0]?.message?.content || '';
      } else if (name === 'claude') {
        const claudeMsgs = messages.length > 0
          ? messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' as const : 'user' as const, content: m.content }))
          : [{ role: 'user' as const, content: 'Bitte beginnen Sie die Bildbeschreibung.' }];
        const client = new Anthropic({ apiKey: keys.claude });
        const r = await client.messages.create({
          model: CLAUDE_MODEL, max_tokens: 800, system: systemPrompt, messages: claudeMsgs,
        });
        content = r.content.find(b => b.type === 'text')?.text || '';
      } else if (name === 'gemini') {
        const geminiMsgs = messages.length > 0
          ? messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))
          : [{ role: 'user', parts: [{ text: 'Bitte beginnen Sie die Bildbeschreibung.' }] }];
        const r = await fetch(`${GEMINI_URL}?key=${keys.google}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: geminiMsgs,
            generationConfig: { temperature: 0.7, maxOutputTokens: 800, responseMimeType: 'application/json' },
          }),
        });
        if (r.ok) content = (await r.json()).candidates?.[0]?.content?.parts?.[0]?.text || '';
      }
      if (!content) continue;
      console.log(`[exam-picture-chat] ${name} succeeded`);
      return parseJsonReply(content);
    } catch (e) {
      console.warn(`[exam-picture-chat] ${name} failed:`, (e as Error).message);
    }
  }
  throw new Error('Tum saglayicilar basarisiz oldu. Lutfen Ayarlar\'dan bir API anahtari ekleyin.');
}

function parseJsonReply(raw: string): LLMResult {
  let c = raw.trim();
  if (c.startsWith('```')) c = c.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  try {
    const o = JSON.parse(c);
    return {
      reply: String(o.reply || o.antwort || ''),
      tip: String(o.tip || o.tipp || ''),
      isEnding: Boolean(o.isEnding),
      suggestions: Array.isArray(o.suggestions || o.vorschlaege) ? (o.suggestions || o.vorschlaege).slice(0, 3) : [],
      grammarCorrections: Array.isArray(o.grammarCorrections) ? o.grammarCorrections.map((gc: any) => ({
        original: String(gc.original || gc.falsch || ''),
        corrected: String(gc.corrected || gc.korrekt || ''),
        explanation: String(gc.explanation || gc.erklaerung || ''),
      })) : undefined,
      sampleAnswer: o.sampleAnswer ? String(o.sampleAnswer || o.beispielAntwort || '') : undefined,
      sessionFeedback: o.sessionFeedback ? {
        strengths: Array.isArray(o.sessionFeedback.strengths || o.sessionFeedback.staerken) ? (o.sessionFeedback.strengths || o.sessionFeedback.staerken) : [],
        improvements: Array.isArray(o.sessionFeedback.improvements || o.sessionFeedback.verbesserungen) ? (o.sessionFeedback.improvements || o.sessionFeedback.verbesserungen) : [],
        score: String(o.sessionFeedback.score || o.sessionFeedback.note || o.sessionFeedback.bewertung || ''),
      } : undefined,
    };
  } catch {}
  if (c.length > 5) return { reply: c, tip: '', isEnding: false, suggestions: [] };
  return { reply: '...', tip: '', isEnding: false, suggestions: [] };
}

/* ══════════ System Prompts ══════════ */
function buildSystemPrompt(level: string, imageDesc: string): string {
  const base = `Du bist ein Deutschlehrer fuer B1-Pruefungsvorbereitung "Bildbeschreibung".

BILD-ANALYSE (von einer KI erstellt):
${imageDesc}

ALLGEMEINE REGELN:
- Antworte IMMER auf Deutsch.
- Verwende B1-Sprache.
- Antwortformat: JSON mit folgenden Feldern:
  - "reply": Deine gesprochene Antwort auf Deutsch
  - "tip": Kurzer Hilfetext auf Tuerkce (Grammatik-Tipp, Ermutigung, Korrektur)
  - "isEnding": true/false — Nach 8+ Nachrichten natuerlich beenden
  - "suggestions": 2-3 Beispiel-Saetze auf Deutsch (nur fuer Anfaenger bei jedem Schritt)
  - "grammarCorrections": Array von Fehlern des Lernenden (falls vorhanden):
    [{"original": "falscher Text", "corrected": "korrekter Text", "explanation": "Kurze Erklaerung auf Tuerkce"}]
  - Wenn isEnding=true, fuege zusaetzlich hinzu:
    - "sampleAnswer": Eine komplette Muster-Bildbeschreibung (6-8 Saetze, B1-Niveau)
    - "sessionFeedback": {"strengths": ["..."], "improvements": ["..."], "score": "z.B. B1-"",}

`;

  if (level === 'beginner') {
    return base + `
ANFAENGER-MODUS (BASLANGIC):
- Fuehre den Lernenden SCHRITT FUER SCHRITT durch die Bildbeschreibung.
- Frage NUR EINE Sache gleichzeitig.
- Gib IMMER 2-3 Beispielsaetze im "suggestions"-Feld.
- Sei sehr ermutigend und geduldig.
- Wenn etwas falsch gesagt wird, korrigiere im "grammarCorrections"-Feld UND gib einen freundlichen Tipp im "tip"-Feld.
- Erklaere BILDBESCHREIBUNG-Konzepte: Vordergrund, Hintergrund, links, rechts, Mitte.

SCHRITTE:
1. Begruesung und Erklaerung der Aufgabe
2. Vordergrund beschreiben
3. Hintergrund beschreiben
4. Personen und Aktivitaeten
5. Stimmung/Atmosphaere
6. Eigene Meinung
7. Abschluss mit sampleAnswer und sessionFeedback`;
  }

  if (level === 'intermediate') {
    return base + `
ORTA-MODUS:
- Lass den Lernenden selbstaendig beschreiben.
- Stelle nur bei Bedarf Rueckfragen oder gib Impulse.
- Korrigiere Grammatik-/Wortschatzfehler IMMER im "grammarCorrections"-Feld.
- Gib 1-2 Anregungen im "suggestions"-Feld, aber NICHT bei jeder Nachricht.
- Sei weniger direktiv als im Anfaenger-Modus.
- Der Lernende soll selbst entscheiden, was er als naechstes beschreibt.
- Gib positives Feedback wenn etwas gut war.
- Bei isEnding=true: sampleAnswer UND sessionFeedback MUSS ausgefuellt sein.`;
  }

  // pro
  return base + `
SINAV-MODUS (PRO):
- Du bist ein PRUEFER im B1-Deutsch-Test.
- Als Eroeffnung sag NUR: "Bitte beschreiben Sie dieses Bild."
- Der Pruefling muss VOLLSTAENDIG selbstaendig beschreiben.
- KEINE Tipps, KEINE Beispielsaetze waehrend der Beschreibung.
- "suggestions" sollte IMMER ein leeres Array sein: [].
- "tip" sollte waehrend der Beschreibung leer sein.
- Korrigiere Fehler NICHT waehrend der Beschreibung.
- Erst NACHDEM der Pruefling fertig ist: kurzes Feedback und Bewertung.
- Bewertungskriterien: Vollstaendigkeit, Grammatik, Wortschatz, Fluss.
- Bei isEnding=true: sampleAnswer (Musterbeschreibung) UND sessionFeedback MUSS ausgefuellt sein.`;
}

/* ══════════ Main Handler ══════════ */
export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    console.log('[exam-picture-chat] Request received, isFirst:', body.isFirstMessage, 'level:', body.level);

    if (!body.imageUrl || !body.messages || !body.level) {
      return NextResponse.json({ error: 'imageUrl, messages, level required' }, { status: 400 });
    }

    const keys = {
      zhipu: body.zhipuKey || process.env.ZHIPU_API_KEY || DEV_ZHIPU_API_KEY,
      openai: body.openaiKey || process.env.OPENAI_API_KEY || '',
      claude: body.claudeKey || process.env.ANTHROPIC_API_KEY || '',
      google: body.googleAiKey || process.env.GOOGLE_AI_KEY || '',
    };

    let imageDescription = body.imageDescription || body.cachedDescription || '';

    // Step 1: Analyze image on first message
    let usedFallback = false;
    if (body.isFirstMessage && !imageDescription) {
      const cached = getCachedDescription(body.imageUrl);
      if (cached) {
        imageDescription = cached;
      } else {
        try {
          imageDescription = await analyzeImage(body.imageUrl, keys);
          setCachedDescription(body.imageUrl, imageDescription);
        } catch (e) {
          imageDescription = body.fallbackDescription || 'Dieses Bild zeigt eine Szene mit mehreren Personen.';
          usedFallback = true;
        }
      }
    }

    // Step 2: Build system prompt
    const systemPrompt = buildSystemPrompt(body.level, imageDescription);

    // Step 3: Get conversation reply
    const result = await chatReply(body.messages, systemPrompt, keys);

    // Extract vocabulary from image description on first message
    let vocabulary: { word: string; article: string; meaning: string; example: string }[] | undefined;
    if (body.isFirstMessage && imageDescription) {
      try {
        let desc = imageDescription.trim();
        if (desc.startsWith('```')) desc = desc.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
        const parsed = JSON.parse(desc);
        if (Array.isArray(parsed.suggestedVocab)) {
          vocabulary = parsed.suggestedVocab.map((v: any) => ({
            word: String(v.word || v.wort || ''),
            article: String(v.article || v.artikel || ''),
            meaning: String(v.meaning || v.bedeutung || v.turkish || ''),
            example: String(v.example || v.beispielsatz || ''),
          })).filter((v: any) => v.word);
        }
      } catch {}
    }

    return NextResponse.json({
      ...result,
      imageDescription: body.isFirstMessage ? imageDescription : undefined,
      usedFallback: body.isFirstMessage ? usedFallback : undefined,
      vocabulary: body.isFirstMessage ? vocabulary : undefined,
    });
  } catch (err) {
    console.error('[exam-picture-chat] Error:', err);
    return NextResponse.json({ error: String(err).slice(0, 300) }, { status: 500 });
  }
}
