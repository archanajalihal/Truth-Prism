require("dotenv").config({ path: "./.env" });
const { fetchRelatedArticles } = require("./services/newsService");

(async () => {
  try {
    console.log("Fetching for 'Narendra Modi killed someone'...");
    const articles = await fetchRelatedArticles("Narendra Modi killed someone");
    console.log("Articles found:", articles.length);
    console.log(JSON.stringify(articles, null, 2));
  } catch (err) {
    console.error(err);
  }
})();
