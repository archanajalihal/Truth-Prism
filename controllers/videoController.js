const { analyzeContent } = require("../services/pipelineService");

const ALLOWED_MEDIA_TYPES = [
  "video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo",
  "video/webm", "video/x-matroska",
  "audio/mpeg", "audio/mp4", "audio/wav", "audio/ogg",
  "audio/webm", "audio/x-m4a",
];

const analyzeVideo = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: "No media file provided. Send a file with field name 'video'.",
    });
  }

  if (!ALLOWED_MEDIA_TYPES.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      error: `Unsupported file type: ${req.file.mimetype}. Allowed: MP4, MOV, AVI, WebM, MP3, WAV, OGG, M4A.`,
    });
  }

  try {
    const result = await analyzeContent("video", {
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      size: req.file.size,
    });
    return res.status(200).json(result);
  } catch (error) {
    console.error("[analyzeVideo] Error:", error.message);
    const userFacingErrors = ["no speech was detected", "timed out", "transcription failed"];
    if (userFacingErrors.some((msg) => error.message.toLowerCase().includes(msg))) {
      return res.status(422).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Failed to analyze video/audio." });
  }
};

module.exports = { analyzeVideo };
