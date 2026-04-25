const { analyzeWithFallback } = require("./fallbackLLMService");
const { generateWithRotation } = require("../utils/geminiKeyRotator");

const extractClaim = async (text) => {
  try {
    const prompt = `Extract a clear factual claim from the following user input. Return ONLY the claim string, nothing else.\n\nInput: "${text}"\nClaim:`;
    const raw = await generateWithRotation("gemini-2.5-flash", prompt);
    return raw.trim();
  } catch (err) {
    // All keys exhausted or non-quota error — use raw input as claim
    console.warn("[llmService] extractClaim failed, using raw text:", err.message);
    return text.trim().slice(0, 200);
  }
};

/**
 * Builds a structured prompt for Gemini combining all context.
 * @param {string} claim - Core factual claim
 * @param {string} text - Original news text
 * @param {Array}  articles - Related news articles from NewsAPI
 * @returns {string} - Final prompt string
 */
const buildPrompt = (claim, text, articles) => {
  const articleSummaries =
    articles.length > 0
      ? articles
          .map(
            (a, i) =>
              `${i + 1}. "${a.title}" — ${a.source} (${
                a.publishedAt ? a.publishedAt.slice(0, 10) : "unknown date"
              })\n   ${a.description}`
          )
          .join("\n\n")
      : "No related articles were found.";

  return `
You are an expert fact-checking AI system.

Your task is to evaluate the credibility of a claim using ONLY the provided evidence.

---

### INPUT:

Claim:
"${claim}"

News Evidence:
${articleSummaries}

---

### STRICT INSTRUCTIONS:

1. DO NOT assume the claim is true.
2. DO NOT rely on general knowledge.
3. ONLY use the provided news evidence.
4. If NO credible sources support the claim → mark it as LOW credibility.
5. If the claim is serious (crime, death, accusations) and lacks evidence → treat it as HIGHLY suspicious.
6. If evidence contradicts the claim → mark it as FALSE.
7. If evidence partially supports → mark as UNCERTAIN.
8. If strong trusted sources confirm → mark as TRUE.

---

### SCORING RULES (STRICT):

- 0–20 → Likely False (no evidence / suspicious)
- 21–50 → Uncertain (weak or mixed evidence)
- 51–100 → Likely True (strong supporting evidence)

---

### OUTPUT FORMAT (MANDATORY JSON):

{
  "score": <number (0-100)>,
  "status": "<Likely False | Uncertain | Likely True>",
  "explanation": "<Clear reasoning based ONLY on evidence>"
}

---

### IMPORTANT:

- If no relevant news evidence is provided:
  → score MUST be below 25

- If claim is sensational (e.g., crime, death) without evidence:
  → score MUST be below 20

- Be strict and conservative in scoring.

---

Now analyze the claim.
`.trim();
};

/**
 * Runs the full LLM analysis using Gemini.
 * @param {string} claim - Core factual claim
 * @param {string} text - Original news text
 * @param {Array}  articles - Related articles from NewsAPI
 * @returns {Promise<object>} - Structured LLM output
 */
const analyzeWithLLM = async (claim, text, articles) => {
  console.log("[llmService] Using Gemini for analysis (key rotation active)...");
  try {
    const prompt = buildPrompt(claim, text, articles);
    const rawText = await generateWithRotation("gemini-2.5-flash", prompt);

    // Parse JSON response from Gemini
    let parsed;
    try {
      const cleaned = rawText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("[llmService] Failed to parse Gemini response:", rawText);
      throw new Error("LLM returned an invalid response format.");
    }

    return {
      score: parsed.score ?? 50,
      status: parsed.status ?? "Uncertain",
      explanation: parsed.explanation ?? "Unable to analyze credibility.",
    };
  } catch (geminiErr) {
    const allExhausted = geminiErr.message === "ALL_KEYS_EXHAUSTED";
    console.warn(
      allExhausted
        ? "[llmService] All Gemini keys exhausted. Using rule-based fallback."
        : `[llmService] Gemini error: ${geminiErr.message}. Using fallback.`
    );
    return analyzeWithFallback(claim, articles);
  }
};

module.exports = {
  extractClaim,
  analyzeWithLLM,
};
