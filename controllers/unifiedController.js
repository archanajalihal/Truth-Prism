const { analyzeContent } = require("../services/pipelineService");

/**
 * POST /api/analyze
 *
 * Unified endpoint for all input types.
 * - type=text  → JSON body:       { type: "text",  text: "..." }
 * - type=image → multipart/form:  { type: "image", file: <image file> }
 * - type=video → multipart/form:  { type: "video", file: <video/audio file> }
 */
const analyzeUnified = async (req, res) => {
  // STEP 1: LOG INCOMING REQUEST
  console.log("Incoming request body:", req.body);

  // STEP 2 & 4: CHECK REQUEST BODY / HANDLE EMPTY INPUT SAFELY
  if (!req.body || !req.body.text) {
    return res.status(400).json({
      error: "Text input is required"
    });
  }

  // STEP 8: Temporarily return debug response (commented out since we fixed the logic)
  // return res.json({ received: req.body.text });

  // STEP 6: ADD TRY-CATCH
  try {
    // STEP 5: LOG BEFORE API CALLS
    console.log("Processing text:", req.body.text);

    // Call existing pipeline
    const result = await analyzeContent("text", { text: req.body.text });
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
};

module.exports = { analyzeUnified };
