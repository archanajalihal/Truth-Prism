const express = require("express");
const router = express.Router();
const multer = require("multer");
const { analyzeUnified } = require("../controllers/unifiedController");

// Memory storage — works for text (no file), image, and video
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB — covers both images and video files
  },
});

/**
 * POST /api/analyze
 *
 * Single unified endpoint for all media types.
 * Field name for files must be "file".
 *
 * Examples:
 *   text:  { type: "text",  text: "your news text here" }
 *   image: multipart — type=image, file=<image>
 *   video: multipart — type=video, file=<video/audio>
 */
router.post("/", upload.single("file"), analyzeUnified);

module.exports = router;
