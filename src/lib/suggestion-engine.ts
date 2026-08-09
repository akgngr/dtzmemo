// ============================================================
// Vector-based Suggestion Engine
// Uses Zhipu embedding API + cosine similarity to match
// the AI's latest message against pre-defined conversation scenarios.
// ============================================================

export interface Scenario {
  /** What the AI might say (used as embedding anchor) */
  trigger: string;
  /** 3 short German phrases the user could say next */
  suggestions: string[];
}

export interface TopicScenarioSet {
  topicId: string;
  scenarios: Scenario[];
}

// Zhipu embedding endpoints
const EMBED_URLS = [
  'https://open.z.ai/api/paas/v4/embeddings',
  'https://open.bigmodel.cn/api/paas/v4/embeddings',
];

const EMBED_MODEL = 'embedding-3';

// In-memory caches
const scenarioEmbeddings = new Map<string, { scenarios: Scenario[]; vectors: number[][] }>();
const queryCache = new Map<string, number[]>();
let initPromises = new Map<string, Promise<void>>();

// ---- Cosine similarity ----
function cosineSim(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-10);
}

// ---- Embedding API call ----
async function embedBatch(texts: string[], apiKey: string): Promise<number[][]> {
  if (texts.length === 0) return [];

  for (const url of EMBED_URLS) {
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: EMBED_MODEL, input: texts }),
      });
      if (r.ok) {
        const d = await r.json();
        if (Array.isArray(d.data)) {
          return d.data
            .sort((a: any, b: any) => a.index - b.index)
            .map((item: any) => item.embedding as number[]);
        }
      }
      console.warn(`[SuggestionEngine] Embed endpoint ${url} failed: ${r.status}`);
    } catch (e) {
      console.warn(`[SuggestionEngine] Embed error:`, (e as Error).message);
    }
  }
  throw new Error('All embedding endpoints failed');
}

// ---- Initialize scenarios for a topic ----
async function initTopic(topicId: string, scenarios: Scenario[], apiKey: string): Promise<void> {
  if (scenarioEmbeddings.has(topicId)) return;

  console.log(`[SuggestionEngine] Initializing ${scenarios.length} scenarios for: ${topicId}`);
  const triggers = scenarios.map(s => s.trigger);
  const vectors = await embedBatch(triggers, apiKey);
  scenarioEmbeddings.set(topicId, { scenarios, vectors });
  console.log(`[SuggestionEngine] Ready for: ${topicId}`);
}

// ---- Public API ----

/**
 * Initialize scenarios for a topic. Safe to call multiple times.
 * Returns immediately if already initialized.
 */
export async function ensureInitialized(
  topicId: string,
  scenarios: Scenario[],
  apiKey: string,
): Promise<void> {
  if (scenarioEmbeddings.has(topicId)) return;

  // Deduplicate concurrent calls
  if (!initPromises.has(topicId)) {
    initPromises.set(topicId, initTopic(topicId, scenarios, apiKey).then(() => {
      initPromises.delete(topicId);
    }));
  }
  await initPromises.get(topicId);
}

/**
 * Find the best matching suggestions for the AI's latest message.
 * Returns null if no good match found (similarity < threshold).
 */
export async function findSuggestions(
  topicId: string,
  aiMessage: string,
  apiKey: string,
  threshold: number = 0.35,
): Promise<string[] | null> {
  const cached = scenarioEmbeddings.get(topicId);
  if (!cached) {
    console.warn(`[SuggestionEngine] Topic ${topicId} not initialized`);
    return null;
  }

  // Embed the query (cache by first 200 chars)
  const cacheKey = aiMessage.slice(0, 200);
  let queryVec = queryCache.get(cacheKey);
  if (!queryVec) {
    const vecs = await embedBatch([aiMessage], apiKey);
    queryVec = vecs[0];
    queryCache.set(cacheKey, queryVec);
  }

  // Find best match
  let bestIdx = -1;
  let bestSim = -1;
  const sims: { idx: number; sim: number; trigger: string }[] = [];

  for (let i = 0; i < cached.vectors.length; i++) {
    const sim = cosineSim(queryVec, cached.vectors[i]);
    sims.push({ idx: i, sim, trigger: cached.scenarios[i].trigger.slice(0, 60) });
    if (sim > bestSim) {
      bestSim = sim;
      bestIdx = i;
    }
  }

  // Debug: log top 3
  const top3 = sims.sort((a, b) => b.sim - a.sim).slice(0, 3);
  console.log(`[SuggestionEngine] Query: "${aiMessage.slice(0, 60)}"`);
  console.log(`[SuggestionEngine] Top matches:`, top3.map(s => `  ${s.sim.toFixed(3)}: "${s.trigger}"`));

  if (bestIdx >= 0 && bestSim >= threshold) {
    return cached.scenarios[bestIdx].suggestions;
  }

  console.log(`[SuggestionEngine] No match above threshold ${threshold} (best: ${bestSim.toFixed(3)})`);
  return null;
}

/** Clear all caches (useful for testing) */
export function clearCache(): void {
  scenarioEmbeddings.clear();
  queryCache.clear();
  initPromises.clear();
}
