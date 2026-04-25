const { analyzeContent } = require("../services/pipelineService");

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"];

const analyzeImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: "No image file provided. Send a file with field name 'image'.",
    });
  }

  if (!ALLOWED_IMAGE_TYPES.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      error: `Unsupported file type: ${req.file.mimetype}. Allowed: JPEG, PNG, WEBP, GIF, BMP.`,
    });
  }

  try {
    const result = await analyzeContent("image", {
      buffer: req.file.buffer,
      mimetype: req.file.mimetype,
      originalname: req.file.originalname,
    });
    return res.status(200).json(result);
  } catch (error) {
    console.error("[analyzeImage] Error:", error.message);
    if (error.message.includes("No text could be extracted")) {
      return res.status(422).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Failed to analyze image." });
  }
};

module.exports = { analyzeImage };
