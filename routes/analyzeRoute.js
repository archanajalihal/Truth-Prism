const express = require("express");
const router = express.Router();
const { analyzeText } = require("../controllers/analyzeController");

// POST /api/analyze/text
router.post("/text", analyzeText);

module.exports = router;
