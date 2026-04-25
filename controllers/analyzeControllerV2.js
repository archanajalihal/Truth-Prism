/**
 * controllers/analyzeControllerV2.js
 * Controller for POST /api/analyze-v2
 * Handles text or image input independently from the original pipeline.
 */

const multer = require("multer");
const { extractClaimV2, classifyClaimV2, analyzeGeneralFactV2, analyzeWithLLMV2 } = require("../services/llmServiceV2");
const { fetchRelatedArticlesV2 } = require("../services/newsServiceV2");
const { analyzeImageV2 } = require("../services/imageServiceV2");
const { saveAnalysis } = require("../utils/analysisStore");

// Memory storage for uploaded files
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

/**
 * POST /api/analyze-v2
 *
 * Accepts:
 *   - JSON body: { "text": "..." }            → text analysis
 *   - multipart/form-data: file (image)       → image AI detection + OCR + fact-check
 */
const analyzeV2 = async (req, res) => {
  console.log("[analyzeV2] Incoming request. Content-Type:", req.headers["content-type"]);

  try {
    let claim = null;
    let inputType = "text";

    // ── STEP 1: Determine input type and extract text/claim ─────────────────
    if (req.file) {
      // Image input
      inputType = "image";
      console.log("[analyzeV2] Image received:", req.file.originalname, "|", req.file.mimetype);

      const { extractedText, method, visionAvailable } = await analyzeImageV2(req.file.buffer, req.file.mimetype, req.file.originalname);
      console.log(`[analyzeV2] Image analyzed via: ${method}`);

      // If Vision API is not available (billing not enabled), guide user
      if (!visionAvailable || extractedText.startsWith("IMAGE_ANALYSIS_UNAVAILABLE:")) {
        return res.status(400).json({
          error: "Image text extraction failed.",
          details: "We could not read any clear text from this image. Please copy the text from your image and paste it into the text input field instead.",
          suggestion: "Use text input",
        });
      }

      claim = await extractClaimV2(extractedText);

    } else if (req.body?.text && req.body.text.trim().length > 0) {
      // Text input
      console.log("[analyzeV2] Text input received:", req.body.text.slice(0, 100));
      claim = await extractClaimV2(req.body.text.trim());

    } else {
      return res.status(400).json({ error: "Text input or image file is required." });
    }

    console.log("[analyzeV2] Extracted claim:", claim);

    // ── STEP 1.5: Classify claim type ────────────────────────────────────────
    const claimType = await classifyClaimV2(claim);
    console.log("[analyzeV2] Claim classified as:", claimType);

    let llmResult;
    let articles = [];

    if (claimType === "future") {
      // ── Future Prediction ──────────────────────────────────────────────────
      llmResult = {
        score: 30,
        status: "Uncertain",
        explanation: "This claim is a prediction about the future. Fact-checking systems can only verify events that have already occurred or established facts. Future events cannot be definitively verified."
      };
    } else if (claimType === "general") {
      // ── General Fact ───────────────────────────────────────────────────────
      llmResult = await analyzeGeneralFactV2(claim);
      console.log("[analyzeV2] General fact LLM result:", llmResult);
    } else {
      // ── Breaking News (default) ────────────────────────────────────────────
      articles = await fetchRelatedArticlesV2(claim);
      console.log(`[analyzeV2] Articles fetched: ${articles.length}`);
      llmResult = await analyzeWithLLMV2(claim, articles);
      console.log("[analyzeV2] News LLM result:", llmResult);
    }

    // ── STEP 4: Save to dashboard store & build response ────────────────────
    const risk = llmResult.score <= 20 ? "High" : llmResult.score <= 50 ? "Medium" : "Low";
    saveAnalysis({
      text: req.body?.text || req.file?.originalname || claim,
      score: llmResult.score,
      status: llmResult.status,
      risk,
    });

    return res.status(200).json({
      success: true,
      inputType,
      claim,
      type: claimType,
      score: llmResult.score,
      status: llmResult.status,
      explanation: llmResult.explanation,
      sources: articles.map((a) => ({
        title: a.title,
        source: a.source,
        url: a.url,
      })),
    });

  } catch (error) {
    console.error("[analyzeV2] Error:", error.message);
    return res.status(500).json({
      error: "V2 analysis failed.",
      details: error.message,
    });
  }
};

module.exports = { upload, analyzeV2 };
