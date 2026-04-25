/**
 * services/imageServiceV2.js
 *
 * Uses a completely free, local OCR library (Tesseract.js).
 * Does NOT require any Google API keys or billing.
 */

const Tesseract = require("tesseract.js");

/**
 * Extracts text from an image using Tesseract.js locally.
 * @param {Buffer} imageBuffer
 * @returns {Promise<string>}
 */
const tryTesseractOCR = async (imageBuffer) => {
  try {
    const { data: { text } } = await Tesseract.recognize(
      imageBuffer,
      'eng', // English language
      { logger: m => {} } // Suppress logs
    );
    
    if (!text || !text.trim()) {
      throw new Error("No text extracted from image.");
    }
    
    return text.trim();
  } catch (error) {
    throw new Error(`Tesseract OCR failed: ${error.message}`);
  }
};

/**
 * Main image analysis function.
 * @param {Buffer} imageBuffer
 * @param {string} [mimeType]
 * @param {string} [originalname]
 * @returns {Promise<{ extractedText: string, method: string, visionAvailable: boolean }>}
 */
const analyzeImageV2 = async (imageBuffer, mimeType = "image/jpeg", originalname = "image") => {
  // Attempt Local Tesseract OCR
  try {
    console.log("[imageServiceV2] Attempting Local Tesseract OCR...");
    const text = await tryTesseractOCR(imageBuffer);
    console.log("[imageServiceV2] OCR success:", text.slice(0, 150));
    return { extractedText: text, method: "tesseract-ocr", visionAvailable: true };
  } catch (err) {
    console.warn(`[imageServiceV2] Tesseract OCR failed:`, err.message);
  }

  // Vision not available — guide user to paste text instead
  return {
    extractedText: `IMAGE_ANALYSIS_UNAVAILABLE:${originalname}`,
    method: "unavailable",
    visionAvailable: false,
  };
};

module.exports = { analyzeImageV2 };
