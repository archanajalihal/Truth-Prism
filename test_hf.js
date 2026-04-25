const axios = require("axios");

(async () => {
  try {
    const res = await axios.post("https://api-inference.huggingface.co/models/mrm8488/bert-tiny-finetuned-fake-news-detection", { inputs: "test" });
    console.log("Success:", res.data);
  } catch (err) {
    console.error("HF Error:", err.response ? err.response.status : err.message);
  }
})();
