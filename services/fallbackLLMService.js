/**
 * services/fallbackLLMService.js
 *
 * Fallback analysis when Gemini quota is exceeded or unavailable.
 *
 * Strategy:
 *  1. Rule-based scoring using article count and source quality
 *  2. If that somehow fails → safe static response
 *
 * Returns the SAME format as Gemini:
 *  { score, status, explanation }
 */

// Trusted source names — higher weight in scoring
const TRUSTED_SOURCES = [
  "bbc", "reuters", "ap news", "associated press", "times of india",
  "the hindu", "ndtv", "bloomberg", "guardian", "al jazeera",
  "new york times", "washington post", "france 24",
];

/**
 * Checks if an article comes from a trusted source.
 * @param {string} sourceName
 * @returns {boolean}
 */
const isTrusted = (sourceName = "") =>
  TRUSTED_SOURCES.some((t) => sourceName.toLowerCase().includes(t));

/**
 * Checks if a claim sounds sensational / high-risk (crime, death, accusations).
 * @param {string} claim
 * @returns {boolean}
 */
const isSensational = (claim = "") => {
  const triggers = [
    "killed", "murder", "dead", "arrested", "raped", "fraud",
    "scam", "terrorist", "bomb", "attack", "coup", "overthrow",
    "bribed", "corrupt", "shot", "assassination",
  ];
  const lower = claim.toLowerCase();
  return triggers.some((t) => lower.includes(t));
};

/**
 * Rule-based scoring fallback.
 *
 * @param {string} claim
 * @param {Array}  articles - [{title, source, description}]
 * @returns {{ score: number, status: string, explanation: string }}
 */
const ruleBasedAnalysis = (claim, articles) => {
  console.log("[fallbackLLM] Running rule-based analysis as Gemini fallback...");

  // ── Scoring rules ────────────────────────────────────────────────────────
  if (!articles || articles.length === 0) {
    const score = isSensational(claim) ? 5 : 15;
    return {
      score,
      status: "Likely False",
      explanation: `No news sources were found to support this claim. ${
        isSensational(claim)
          ? "The claim involves serious allegations without any verifiable evidence."
          : "Without corroborating sources, credibility cannot be confirmed."
      } (Scored via rule-based fallback — Gemini unavailable)`,
    };
  }

  const trustedCount = articles.filter((a) => isTrusted(a.source)).length;
  const totalCount   = articles.length;

  let score;
  let status;
  let explanation;

  if (trustedCount >= 2) {
    score       = 70 + Math.min(trustedCount * 5, 20); // 70–90
    status      = "Likely True";
    explanation = `${trustedCount} trusted sources (${articles
      .filter((a) => isTrusted(a.source))
      .map((a) => a.source)
      .join(", ")}) published related articles, supporting credibility.`;
  } else if (trustedCount === 1) {
    score       = 50;
    status      = "Uncertain";
    explanation = `One trusted source was found (${articles.find((a) => isTrusted(a.source))?.source}), but insufficient to fully confirm the claim.`;
  } else if (totalCount >= 3) {
    score       = 35;
    status      = "Uncertain";
    explanation = `${totalCount} articles found but none from highly trusted outlets. Treat with caution.`;
  } else {
    score       = 20;
    status      = "Likely False";
    explanation = `Only ${totalCount} low-credibility source(s) found. Insufficient evidence to validate the claim.`;
  }

  // Sensational claim penalty
  if (isSensational(claim)) {
    score = Math.min(score, 30);
    if (score <= 30) status = score <= 15 ? "Likely False" : "Uncertain";
    explanation += " (Score reduced: claim involves serious allegations requiring stronger evidence.)";
  }

  explanation += " (Scored via rule-based fallback — Gemini quota exceeded)";

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    status,
    explanation,
  };
};

/**
 * Safe static response — last resort if rule-based also throws.
 */
const safeStaticResponse = () => ({
  score: 25,
  status: "Uncertain",
  explanation:
    "Unable to fully verify due to limited API access. Based on available evidence, credibility is uncertain. Please verify with trusted news sources directly.",
});

/**
 * Main fallback entry point.
 * @param {string} claim
 * @param {Array}  articles
 * @returns {{ score: number, status: string, explanation: string }}
 */
const analyzeWithFallback = (claim, articles) => {
  try {
    return ruleBasedAnalysis(claim, articles);
  } catch (err) {
    console.error("[fallbackLLM] Rule-based analysis failed:", err.message);
    return safeStaticResponse();
  }
};

module.exports = { analyzeWithFallback };
