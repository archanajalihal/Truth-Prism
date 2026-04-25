const axios = require("axios");
const logger = require("../utils/logger");

const ASSEMBLYAI_BASE = "https://api.assemblyai.com/v2";

// Shared headers for all AssemblyAI requests
const aaiHeaders = () => ({
  authorization: process.env.ASSEMBLYAI_API_KEY,
  "Content-Type": "application/json",
});

/**
 * Step 1: Upload the audio/video buffer to AssemblyAI.
 * @param {Buffer} fileBuffer - Raw file buffer from multer
 * @returns {Promise<string>} - upload_url to use in transcription request
 */
const uploadFile = async (fileBuffer) => {
  const response = await axios.post(`${ASSEMBLYAI_BASE}/upload`, fileBuffer, {
    headers: {
      authorization: process.env.ASSEMBLYAI_API_KEY,
      "Content-Type": "application/octet-stream",
      "Transfer-Encoding": "chunked",
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    timeout: 60000, // 60s for large file uploads
  });

  const uploadUrl = response.data?.upload_url;
  if (!uploadUrl) throw new Error("AssemblyAI did not return an upload URL.");

  return uploadUrl;
};

/**
 * Step 2: Submit a transcription job to AssemblyAI.
 * @param {string} uploadUrl - URL returned from uploadFile()
 * @returns {Promise<string>} - transcript_id to poll
 */
const submitTranscription = async (uploadUrl) => {
  const response = await axios.post(
    `${ASSEMBLYAI_BASE}/transcript`,
    {
      audio_url: uploadUrl,
      language_detection: true, // auto-detect language
      punctuate: true,
      format_text: true,
    },
    { headers: aaiHeaders(), timeout: 15000 }
  );

  const transcriptId = response.data?.id;
  if (!transcriptId) throw new Error("AssemblyAI did not return a transcript ID.");

  return transcriptId;
};

/**
 * Step 3: Poll AssemblyAI until transcription is complete.
 * Times out after ~5 minutes (60 polls × 5s interval).
 * @param {string} transcriptId
 * @returns {Promise<string>} - Final transcript text
 */
const pollTranscription = async (transcriptId) => {
  const MAX_POLLS = 60;
  const POLL_INTERVAL_MS = 5000; // 5 seconds

  for (let attempt = 1; attempt <= MAX_POLLS; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

    const response = await axios.get(
      `${ASSEMBLYAI_BASE}/transcript/${transcriptId}`,
      { headers: aaiHeaders(), timeout: 10000 }
    );

    const { status, text, error } = response.data;

    if (status === "completed") {
      if (!text || text.trim() === "") {
        throw new Error("Transcription completed but no speech was detected in the file.");
      }
      return text.trim();
    }

    if (status === "error") {
      throw new Error(`AssemblyAI transcription failed: ${error || "Unknown error"}`);
    }

    // status is "queued" or "processing" — keep polling
    logger.info(`[videoService] Poll ${attempt}/${MAX_POLLS} — status: ${status}`);
  }

  throw new Error("Transcription timed out after 5 minutes. Please try a shorter file.");
};

/**
 * Full transcription pipeline: upload → submit → poll → return text.
 * @param {Buffer} fileBuffer - Raw audio/video buffer from multer
 * @returns {Promise<string>} - Transcribed text
 */
const transcribeMedia = async (fileBuffer) => {
  const uploadUrl = await uploadFile(fileBuffer);
  const transcriptId = await submitTranscription(uploadUrl);
  const transcriptText = await pollTranscription(transcriptId);
  return transcriptText;
};

module.exports = {
  transcribeMedia,
};
