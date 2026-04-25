const axios = require("axios");

// Updated to a stable, highly-used fake news detection model
const HF_MODEL = "textattack/roberta-base-Fake-News";
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

/**
 * Sends text to HuggingFace model and returns a structured analysis result.
 * @param {string} text - The news text to classify
 * @returns {Promise<{score: number, status: string, explanation: string}>}
 */
const classifyText = async (text) => {
  try {
    const response = await axios.post(
      HF_API_URL,
      { inputs: text },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 second timeout
      }
    );

    // HuggingFace returns: [[{ label, score }, { label, score }]]
    const predictions = response.data[0];

    if (!predictions || predictions.length === 0) {
      throw new Error("No predictions returned");
    }

    // Determine dominant prediction (textattack model uses LABEL_0 for Real, LABEL_1 for Fake)
    const label0Entry = predictions.find((p) => p.label === "LABEL_0");
    const label1Entry = predictions.find((p) => p.label === "LABEL_1");

    const realScore = label0Entry ? label0Entry.score : 0;
    const fakeScore = label1Entry ? label1Entry.score : 0;

    const isFake = fakeScore > realScore;
    const confidence = Math.round((isFake ? fakeScore : realScore) * 100);
    const status = isFake ? "Fake" : "Real";

    return {
      score: confidence,
      status,
      explanation: `HuggingFace preliminary analysis leaned towards ${status.toUpperCase()} with ${confidence}% confidence.`,
      raw: predictions,
    };
  } catch (error) {
    console.warn("[huggingfaceService] HF Model failed or timed out. Failing gracefully.", error.message);
    // If the HF API is down, returns 404, or times out, we return a neutral baseline
    // so the LLM pipeline can still proceed using just the News APIs!
    return {
      score: 50,
      status: "Uncertain",
      explanation: "Preliminary AI analysis unavailable. Relying entirely on News API evidence.",
      raw: [],
    };
  }
};

module.exports = {
  classifyText,
};
