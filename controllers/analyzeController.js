const { analyzeContent } = require("../services/pipelineService");

const analyzeText = async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== "string" || text.trim() === "") {
    return res.status(400).json({
      success: false,
      error: "Invalid input. 'text' field is required and must be a non-empty string.",
    });
  }

  try {
    const result = await analyzeContent("text", { text });
    return res.status(200).json(result);
  } catch (error) {
    console.error("[analyzeText] Error:", error.message);
    if (error.response?.status === 503) {
      return res.status(503).json({
        success: false,
        error: "The AI model is currently loading. Please retry in 20-30 seconds.",
      });
    }
    return res.status(500).json({ success: false, error: "Failed to analyze text." });
  }
};

module.exports = { analyzeText };
