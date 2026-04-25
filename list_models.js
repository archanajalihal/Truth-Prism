require("dotenv").config({ path: "./.env" });
const axios = require("axios");

(async () => {
  try {
    const res = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    console.log("Models:");
    res.data.models.forEach(m => {
      console.log(`- ${m.name}`);
    });
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
})();
