require("dotenv").config({ path: "./.env" });
const axios = require("axios");

(async () => {
  // Test 1: Check server health
  console.log("--- Health check ---");
  try {
    const r = await axios.get("http://localhost:5000/api/test", { timeout: 5000 });
    console.log("[health] OK:", r.data);
  } catch (e) {
    console.error("[health] FAILED:", e.response?.data || e.message);
  }

  // Test 2: POST to v2 with text
  console.log("\n--- POST /api/analyze-v2 ---");
  try {
    const r = await axios.post(
      "http://localhost:5000/api/analyze-v2",
      { text: "Narendra Modi is Prime Minister of India" },
      { timeout: 60000 }
    );
    console.log("[v2] score:", r.data.score, "| status:", r.data.status);
    console.log("[v2] sources:", r.data.sources?.length ?? 0, "articles");
    console.log("[v2] explanation:", r.data.explanation);
  } catch (e) {
    if (e.response) {
      console.error("[v2] HTTP", e.response.status, JSON.stringify(e.response.data));
    } else {
      console.error("[v2] ERROR:", e.message);
    }
  }
})();
