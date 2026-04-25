const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Load dataset
let data = [];
try {
  data = require("./data/fakeNews.json");
  console.log(`✅ Loaded ${data.length} records from fakeNews.json`);
} catch (err) {
  console.error("❌ Failed to load fakeNews.json:", err.message);
}

// === Analysis Logic ===

const TRIGGER_KEYWORDS = [
  "breaking",
  "shocking",
  "urgent",
  "unbelievable",
  "exclusive",
  "bombshell",
  "exposed",
  "leaked",
  "secret",
  "conspiracy",
  "they don't want you to know",
  "mainstream media won't tell you",
  "share before deleted",
  "wake up",
  "must read",
];

const CREDIBILITY_KEYWORDS = [
  "according to",
  "research shows",
  "study finds",
  "official statement",
  "confirmed by",
  "data shows",
  "experts say",
  "published in",
];

function normalizeText(text) {
  return text.toLowerCase().trim();
}

function checkKeywords(text) {
  const normalized = normalizeText(text);
  const foundFlags = [];

  TRIGGER_KEYWORDS.forEach((kw) => {
    if (normalized.includes(kw.toLowerCase())) {
      foundFlags.push(kw);
    }
  });

  return foundFlags;
}

function checkCredibilityKeywords(text) {
  const normalized = normalizeText(text);
  let boost = 0;
  CREDIBILITY_KEYWORDS.forEach((kw) => {
    if (normalized.includes(kw.toLowerCase())) {
      boost += 5;
    }
  });
  return Math.min(boost, 20); // cap at +20
}

function matchDataset(text) {
  const normalized = normalizeText(text);
  const words = normalized.split(/\s+/).filter((w) => w.length > 4);
  const matches = [];

  for (const item of data) {
    const titleNorm = normalizeText(item.title || "");
    // Check if any significant word from dataset title appears in input
    const titleWords = titleNorm.split(/\s+/).filter((w) => w.length > 4);
    const overlap = titleWords.filter((tw) => words.includes(tw));

    if (overlap.length >= 3) {
      matches.push(item.title);
    }
    if (matches.length >= 3) break; // limit matches
  }

  // Also do a broader substring match for short inputs
  if (matches.length === 0 && text.length > 20) {
    for (const item of data) {
      const titleNorm = normalizeText(item.title || "");
      // Check if 30%+ of input words appear in dataset title
      const inputWords = normalized.split(/\s+/).filter((w) => w.length > 3);
      const overlapCount = inputWords.filter((w) => titleNorm.includes(w)).length;
      if (overlapCount >= 2 && overlapCount / inputWords.length > 0.3) {
        matches.push(item.title);
        if (matches.length >= 3) break;
      }
    }
  }

  return matches;
}

function getRiskLevel(score) {
  if (score <= 40) return "High";
  if (score <= 70) return "Medium";
  return "Low";
}

function generateExplanation(flags, datasetMatches, score) {
  const explanations = [];

  if (flags.length > 0) {
    explanations.push(
      `Contains ${flags.length} emotionally triggering or sensational keyword${flags.length > 1 ? "s" : ""}: "${flags.slice(0, 3).join('", "')}"`
    );
  }

  if (datasetMatches.length > 0) {
    explanations.push(
      `Similar to ${datasetMatches.length} known fake news pattern${datasetMatches.length > 1 ? "s" : ""} in our database`
    );
  }

  if (score <= 40) {
    explanations.push(
      "High probability of misinformation based on content analysis"
    );
  } else if (score <= 70) {
    explanations.push(
      "Moderate credibility concerns detected — verify with trusted sources"
    );
  } else {
    explanations.push(
      "Content appears relatively credible, but always cross-check with official sources"
    );
  }

  if (explanations.length === 0) {
    explanations.push("No specific red flags detected in this content");
  }

  return explanations.join(". ") + ".";
}

// === POST /analyze ===
app.post("/analyze", (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({ error: "Please provide a non-empty text field." });
  }

  const inputText = text.trim();

  // Step 1: Base score
  let score = 80;

  // Step 2: Keyword check — reduce if sensational keywords found
  const flags = checkKeywords(inputText);
  if (flags.length > 0) {
    score -= Math.min(flags.length * 8, 20);
  }

  // Step 3: Dataset matching — reduce if similar to known patterns
  const datasetMatches = matchDataset(inputText);
  if (datasetMatches.length > 0) {
    score -= 30;
  }

  // Step 4: Credibility boost for factual language
  const credBoost = checkCredibilityKeywords(inputText);
  score += credBoost;

  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  // Step 5: Risk level
  const risk = getRiskLevel(score);

  // Step 6: Explanation
  const explanation = generateExplanation(flags, datasetMatches, score);

  return res.json({
    score,
    risk,
    flags,
    explanation,
    datasetMatches: datasetMatches.slice(0, 2), // return max 2 matched titles
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", recordsLoaded: data.length });
});

app.listen(PORT, () => {
  console.log(`🚀 TruthLens server running on http://localhost:${PORT}`);
});
