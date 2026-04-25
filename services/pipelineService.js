const { classifyText } = require("./huggingfaceService");
const { fetchRelatedArticles } = require("./newsService");
const { analyzeWithLLM, extractClaim } = require("./llmService");
const { extractTextFromImage } = require("./imageService");
const logger = require("../utils/logger");

/**
 * Core shared analysis pipeline.
 * Runs HuggingFace + NewsAPI in parallel, then sends everything to Gemini LLM.
 *
 * @param {string} text - Clean text to analyze
 * @returns {Promise<object>} - { score, status, explanation, reasoning, redFlags, sources, hfData }
 */
const runAnalysisPipeline = async (text) => {
  const claim = await extractClaim(text);

  const [hfResult, articlesResult] = await Promise.allSettled([
    classifyText(text),
    fetchRelatedArticles(claim),
  ]);

  // HuggingFace failure is non-critical — huggingfaceService already returns a neutral fallback
  if (hfResult.status === "rejected") {
    logger.warn(`[pipeline] HuggingFace failed (non-critical): ${hfResult.reason?.message}`);
  }

  const hfData = hfResult.value ?? { score: 50, status: "Uncertain", explanation: "HF unavailable", raw: [] };
  const sources = articlesResult.status === "fulfilled" ? articlesResult.value : [];

  if (articlesResult.status === "rejected") {
    logger.warn(`[pipeline] News fetch failed (non-critical): ${articlesResult.reason?.message}`);
  }

  // LLM final reasoning
  const llmData = await analyzeWithLLM(claim, text, sources);

  // Map status → risk label that ResultPage expects
  let risk = "Medium";
  if (llmData.score <= 20) risk = "High";
  else if (llmData.score <= 50) risk = "Medium";
  else risk = "Low";

  return {
    score: llmData.score,
    status: llmData.status,
    risk,
    explanation: llmData.explanation,
    flags: llmData.redFlags || [],
    reasoning: [],
    redFlags: llmData.redFlags || [],
    datasetMatches: sources.map((s) => s.title).filter(Boolean),
    sources,
    hfData,
  };
};

/**
 * Unified content analyzer — handles text, image, and video.
 *
 * @param {"text"|"image"|"video"} inputType
 * @param {object} payload
 *   - For "text":  { text: string }
 *   - For "image": { buffer: Buffer, mimetype: string, originalname: string }
 *   - For "video": { buffer: Buffer, originalname: string, size: number }
 * @returns {Promise<object>} - Unified analysis result
 */
const analyzeContent = async (inputType, payload) => {
  let extractedText = null;
  let meta = { inputType };

  // ── Step 1: Extract text from input ──────────────────────────────────────
  switch (inputType) {
    case "text": {
      if (!payload.text || typeof payload.text !== "string" || !payload.text.trim()) {
        const err = new Error("'text' field is required and must be a non-empty string.");
        err.isValidationError = true;
        throw err;
      }
      logger.info(`[pipeline] Text input received (${payload.text.length} chars)`);
      extractedText = payload.text.trim();
      meta.inputText = extractedText;
      break;
    }

    case "image": {
      logger.info(`[pipeline] Extracting text from image: ${payload.originalname}`);
      extractedText = await extractTextFromImage(payload.buffer, payload.mimetype);
      meta.fileName = payload.originalname;
      meta.extractedText = extractedText;
      break;
    }

    default: {
      const err = new Error(`Unsupported input type: "${inputType}". Use "text" or "image".`);
      err.isValidationError = true;
      throw err;
    }
  }

  // ── Step 2: Run the shared HF → News → LLM pipeline ─────────────────────
  const result = await runAnalysisPipeline(extractedText);

  // ── Step 3: Build unified response ───────────────────────────────────────
  return {
    success: true,
    inputType,
    // Fields ResultPage.tsx reads directly:
    score: result.score,
    risk: result.risk,
    flags: result.flags,
    explanation: result.explanation,
    datasetMatches: result.datasetMatches,
    // Extra fields for future use:
    status: result.status,
    reasoning: result.reasoning,
    redFlags: result.redFlags,
    sources: result.sources,
    meta: {
      ...meta,
      hfClassification: result.hfData?.status,
      hfConfidence: result.hfData?.score,
    },
  };
};

module.exports = {
  analyzeContent,
  runAnalysisPipeline,
};
