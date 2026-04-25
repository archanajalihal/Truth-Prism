/**
 * config/index.js
 * Centralized configuration with startup validation.
 * Reads from environment variables and fails fast if critical keys are missing.
 */

const REQUIRED_ENV_VARS = [
  "HUGGINGFACE_API_KEY",
  "NEWS_API_KEY",
  "GEMINI_API_KEY",
  "GOOGLE_VISION_API_KEY",
  "GNEWS_API_KEY",
  "CURRENTS_API_KEY",
  "NEWSDATA_API_KEY",
];

/**
 * Validates that all required environment variables are set.
 * Throws an error on startup if any are missing — prevents silent failures.
 */
const validateEnv = () => {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  ${missing.join("\n  ")}\nCheck your .env file.`
    );
  }
};

const config = {
  port:            process.env.PORT || 5000,
  nodeEnv:         process.env.NODE_ENV || "development",
  huggingFaceKey:  process.env.HUGGINGFACE_API_KEY,
  newsApiKey:      process.env.NEWS_API_KEY,
  geminiKey:       process.env.GEMINI_API_KEY,
  visionKey:       process.env.GOOGLE_VISION_API_KEY,
  assemblyAiKey:   process.env.ASSEMBLYAI_API_KEY,
  gnewsApiKey:     process.env.GNEWS_API_KEY,
  currentsApiKey:  process.env.CURRENTS_API_KEY,
  newsdataApiKey:  process.env.NEWSDATA_API_KEY,
};

module.exports = { config, validateEnv };
