/**
 * routes/analyzeRouteV2.js
 * Registers POST /api/analyze-v2
 * Does NOT modify any existing routes.
 */

const express = require("express");
const router = express.Router();
const { upload, analyzeV2 } = require("../controllers/analyzeControllerV2");

// POST /api/analyze-v2
// Accepts: JSON { text } OR multipart/form-data with field name "file"
router.post("/", upload.single("file"), analyzeV2);

module.exports = router;
