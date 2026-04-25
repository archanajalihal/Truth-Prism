const express = require("express");
const router = express.Router();
const multer = require("multer");
const { analyzeVideo } = require("../controllers/videoController");

// Store in memory — no temp files on disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB max for video files
  },
});

// POST /api/analyze/video
router.post("/video", upload.single("video"), analyzeVideo);

module.exports = router;
