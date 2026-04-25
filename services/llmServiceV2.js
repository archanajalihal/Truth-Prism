/**
 * services/llmServiceV2.js
 * V2 LLM service — strict Gemini analysis using only provided evidence.
 * Completely independent from llmService.js.
 */

const { analyzeWithFallback } = require("./fallbackLLMService");
const { generateWithRotation } = require("../utils/geminiKeyRotator");

/**
 * Extracts a concise, searchable factual claim from raw user input.
 * @param {string} text
 * @returns {Promise<string>}
 */
const extractClaimV2 = async (text) => {
  try {
    const prompt = `Extract a single, clear factual claim from the following user input.
Return ONLY the claim as a plain string with no explanation, quotes, or punctuation.

Input: "${text}"
Claim:`;
    const raw = await generateWithRotation("gemini-2.5-flash", prompt);
    return raw.trim();
  } catch (err) {
    console.warn("[llmServiceV2] extractClaim failed, using raw text:", err.message);
    return text.trim().slice(0, 200);
  }
};

/**
 * Classifies the type of claim to optimize pipeline routing.
 * @param {string} claim 
 * @returns {Promise<"news"|"general"|"future">}
 */
const classifyClaimV2 = async (claim) => {
  try {
    const prompt = `Classify the following statement into one of exactly three categories:
1. "news": A recent or current event, breaking news, or specific incident (e.g., "Donald Trump resigned", "Earthquake in Japan").
2. "general": A timeless fact, historical event, scientific knowledge, or static truth (e.g., "The Earth is round", "Water boils at 100 degrees", "Barack Obama was the 44th president").
3. "future": A prediction, speculation, or event that has not happened yet (e.g., "Aliens will attack in 2030", "Stock market will crash next month").

Return ONLY the single category word ("news", "general", or "future") with no quotes, punctuation, or explanation.

Statement: "${claim}"
Category:`;
    const raw = await generateWithRotation("gemini-2.5-flash", prompt);
    const category = raw.trim().toLowerCase();
    if (["news", "general", "future"].includes(category)) return category;
    return "news"; // default to news if ambiguous
  } catch (err) {
    console.warn("[llmServiceV2] classifyClaimV2 failed, defaulting to news:", err.message);
    return "news";
  }
};

/**
 * Analyzes a general fact using LLM internal knowledge, completely bypassing news APIs.
 * @param {string} claim
 * @returns {Promise<{score: number, status: string, explanation: string}>}
 */
const analyzeGeneralFactV2 = async (claim) => {
  try {
    const prompt = `You are a fact-checking AI. Evaluate the following claim based on established global knowledge, science, or history. Do not assume it is true.

Claim: "${claim}"

SCORING RULES:
- 0-20: Blatantly false, debunked, or pseudoscientific.
- 21-50: Uncertain, highly controversial, or a common misconception.
- 51-100: Established fact, widely accepted truth.

OUTPUT (mandatory JSON, no markdown):
{
  "score": <number 0-100>,
  "status": "<Likely False | Uncertain | Likely True>",
  "explanation": "<concise explanation based on general knowledge>"
}`;
    const rawText = await generateWithRotation("gemini-2.5-flash", prompt);
    let parsed;
    try {
      const cleaned = rawText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { score: 50, status: "Uncertain", explanation: "Parse error." };
    }
    return {
      score: Math.max(0, Math.min(100, Math.round(parsed.score))),
      status: parsed.status || "Uncertain",
      explanation: parsed.explanation || "No explanation provided.",
    };
  } catch (err) {
    console.warn("[llmServiceV2] analyzeGeneralFactV2 failed:", err.message);
    return { score: 50, status: "Uncertain", explanation: "General fact analysis failed." };
  }
};


/**
 * Builds the strict evidence-based fact-checking prompt for V2.
 * @param {string} claim
 * @param {Array} articles - [{title, source, description, publishedAt}]
 * @returns {string}
 */
const buildPromptV2 = (claim, articles) => {
  const evidenceSummary =
    articles.length > 0
      ? articles
          .map(
            (a, i) =>
              `${i + 1}. [${a.source}] "${a.title}"\n   ${a.description || "No description."}`
          )
          .join("\n\n")
      : "No relevant news articles were found for this claim.";

  return `You are an expert fact-checking AI system.

Evaluate the credibility of the claim below using ONLY the provided news evidence.

---

CLAIM:
"${claim}"

NEWS EVIDENCE:
${evidenceSummary}

---

STRICT RULES:
1. DO NOT assume the claim is true.
2. DO NOT use your general knowledge — rely ONLY on the evidence provided.
3. If NO credible sources support the claim → LOW score.
4. If the claim involves crime, death, or serious accusations without evidence → score MUST be under 20.
5. If evidence contradicts the claim → mark as FALSE.
6. If evidence partially supports → mark as UNCERTAIN.
7. If strong trusted sources (BBC, Reuters, AP, TOI) confirm → mark as TRUE.

SCORING TIERS (STRICT):
- 0–20   → Likely False  (no evidence, suspicious claim)
- 21–50  → Uncertain     (mixed or weak evidence)
- 51–100 → Likely True   (strong credible sources support it)

ADDITIONAL HARD RULES:
- If no articles found: score MUST be 10 or below.
- If articles found but none directly support the claim: score MUST be under 30.
- Never give a high score to a sensational claim without direct news confirmation.

OUTPUT (mandatory JSON, no markdown):
{
  "score": <number 0-100>,
  "status": "<Likely False | Uncertain | Likely True>",
  "explanation": "<concise reasoning citing specific evidence or lack thereof>"
}`.trim();
};

/**
 * Runs the V2 Gemini LLM analysis.
 * @param {string} claim
 * @param {Array} articles
 * @returns {Promise<{score: number, status: string, explanation: string}>}
 */
const analyzeWithLLMV2 = async (claim, articles) => {
  console.log("[llmServiceV2] Using Gemini for V2 analysis (key rotation active)...");
  try {
    const prompt = buildPromptV2(claim, articles);
    const rawText = await generateWithRotation("gemini-2.5-flash", prompt);

    let parsed;
    try {
      const cleaned = rawText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("[llmServiceV2] Failed to parse Gemini response:", rawText);
      parsed = {
        score: 15,
        status: "Likely False",
        explanation: "LLM response could not be parsed. Defaulting to low credibility.",
      };
    }

    if (articles.length === 0 && parsed.score > 10) {
      parsed.score = 10;
      parsed.status = "Likely False";
    }

    return {
      score: Math.max(0, Math.min(100, Math.round(parsed.score))),
      status: parsed.status || "Uncertain",
      explanation: parsed.explanation || "No explanation provided.",
    };
  } catch (geminiErr) {
    const allExhausted = geminiErr.message === "ALL_KEYS_EXHAUSTED";
    console.warn(
      allExhausted
        ? "[llmServiceV2] All Gemini keys exhausted. Using rule-based fallback."
        : `[llmServiceV2] Gemini error: ${geminiErr.message}. Using fallback.`
    );
    return analyzeWithFallback(claim, articles);
  }
};

module.exports = { extractClaimV2, classifyClaimV2, analyzeGeneralFactV2, analyzeWithLLMV2 };
