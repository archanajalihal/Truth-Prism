/**
 * utils/geminiKeyRotator.js
 *
 * Manages a pool of Gemini API keys.
 * Automatically rotates to the next key when a 429 quota error is hit.
 * Falls back to rule-based analysis only when ALL keys are exhausted.
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Collect all keys from env at startup — filter out undefined/empty
const ALL_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
].filter(Boolean);

if (ALL_KEYS.length === 0) {
  throw new Error("No Gemini API keys found in environment variables.");
}

console.log(`[geminiKeyRotator] Loaded ${ALL_KEYS.length} Gemini API key(s).`);

// Track which keys have hit quota (reset after 60s to allow re-use)
const exhaustedUntil = new Map(); // key → timestamp when quota resets

/**
 * Returns the next available API key.
 * Skips keys that are currently in quota cooldown.
 * @returns {string|null} - An available API key, or null if all exhausted
 */
const getAvailableKey = () => {
  const now = Date.now();
  for (const key of ALL_KEYS) {
    const cooldownUntil = exhaustedUntil.get(key) || 0;
    if (now >= cooldownUntil) {
      return key;
    }
  }
  return null; // all keys exhausted
};

/**
 * Marks a key as quota-exhausted for 65 seconds.
 * @param {string} key
 */
const markExhausted = (key) => {
  const resetTime = Date.now() + 65_000; // 65s cooldown
  exhaustedUntil.set(key, resetTime);
  const keyPreview = `${key.slice(0, 8)}...`;
  console.warn(`[geminiKeyRotator] Key ${keyPreview} exhausted. Cooling down for 65s.`);
};

/**
 * Runs a Gemini generation with automatic key rotation on 429.
 *
 * @param {string}   modelName  - e.g. "gemini-2.5-flash"
 * @param {string}   prompt     - The prompt to send
 * @returns {Promise<string>}   - Raw response text from Gemini
 * @throws {Error}              - If ALL keys are exhausted
 */
const generateWithRotation = async (modelName, prompt) => {
  let attempts = 0;

  while (attempts < ALL_KEYS.length) {
    const key = getAvailableKey();

    if (!key) {
      throw new Error("ALL_KEYS_EXHAUSTED");
    }

    const keyPreview = `${key.slice(0, 8)}...`;
    console.log(`[geminiKeyRotator] Trying key ${keyPreview} (attempt ${attempts + 1}/${ALL_KEYS.length})`);

    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (err) {
      const isQuota =
        err.message?.includes("quota") ||
        err.message?.includes("429") ||
        err.status === 429;

      if (isQuota) {
        markExhausted(key);
        attempts++;
        // immediately retry with next key
      } else {
        // Non-quota error — don't rotate, just throw
        throw err;
      }
    }
  }

  throw new Error("ALL_KEYS_EXHAUSTED");
};

module.exports = { generateWithRotation, getAvailableKey };
