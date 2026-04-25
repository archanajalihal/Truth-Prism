const express = require("express");
const router = express.Router();
const multer = require("multer");
const { analyzeImage } = require("../controllers/imageController");

// Store uploaded file in memory (as Buffer) — no disk writes needed
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max image size
  },
});

// POST /api/analyze/image
router.post("/image", upload.single("image"), analyzeImage);

module.exports = router;
