const axios = require("axios");

const VISION_API_URL = "https://vision.googleapis.com/v1/images:annotate";

/**
 * Extracts text from an image buffer using Google Cloud Vision OCR.
 * @param {Buffer} imageBuffer - Raw image file buffer (from multer memory storage)
 * @param {string} mimeType    - MIME type e.g. "image/jpeg", "image/png"
 * @returns {Promise<string>}  - Extracted text string
 */
const extractTextFromImage = async (imageBuffer, mimeType) => {
  // Encode buffer to base64
  const base64Image = imageBuffer.toString("base64");

  const requestBody = {
    requests: [
      {
        image: {
          content: base64Image,
        },
        features: [
          {
            type: "TEXT_DETECTION",
            maxResults: 1,
          },
        ],
        imageContext: {
          languageHints: ["en"], // prioritize English OCR
        },
      },
    ],
  };

  const response = await axios.post(
    `${VISION_API_URL}?key=${process.env.GOOGLE_VISION_API_KEY}`,
    requestBody,
    {
      headers: { "Content-Type": "application/json" },
      timeout: 15000,
    }
  );

  const annotations = response.data?.responses?.[0];

  // Check for Vision API-level errors
  if (annotations?.error) {
    throw new Error(`Vision API error: ${annotations.error.message}`);
  }

  const extractedText = annotations?.fullTextAnnotation?.text || "";

  if (!extractedText.trim()) {
    throw new Error("No text could be extracted from the provided image.");
  }

  return extractedText.trim();
};

module.exports = {
  extractTextFromImage,
};
