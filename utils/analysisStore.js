/**
 * utils/analysisStore.js
 *
 * In-memory store for completed analyses.
 * Holds the last 50 results — no database needed.
 * Singleton: shared across all imports in the same Node.js process.
 */

const MAX_ENTRIES = 50;

/** @type {Array<{id:string, text:string, score:number, status:string, risk:string, timestamp:string}>} */
const store = [];

/**
 * Adds a new analysis result to the store.
 * @param {{ text: string, score: number, status: string, risk: string }} result
 */
const saveAnalysis = ({ text, score, status, risk }) => {
  const entry = {
    id: Date.now().toString(),
    text: (text || "").slice(0, 200),  // cap at 200 chars
    score: Math.round(score ?? 0),
    status: status || "Uncertain",
    risk: risk || (score <= 20 ? "High" : score <= 50 ? "Medium" : "Low"),
    timestamp: new Date().toISOString(),
  };

  store.unshift(entry);  // newest first
  if (store.length > MAX_ENTRIES) store.pop();

  console.log(`[analysisStore] Saved entry. Total stored: ${store.length}`);
  return entry;
};

/**
 * Returns dashboard summary stats + recent entries.
 * @returns {{ totalAnalyses, highRisk, credible, lastAnalyzed, recent }}
 */
const getDashboardData = () => {
  const totalAnalyses = store.length;
  const highRisk      = store.filter((e) => e.score < 30).length;
  const credible      = store.filter((e) => e.score > 70).length;
  const lastAnalyzed  = store[0]?.timestamp || null;
  const recent        = store.slice(0, 5);

  return { totalAnalyses, highRisk, credible, lastAnalyzed, recent };
};

module.exports = { saveAnalysis, getDashboardData };
