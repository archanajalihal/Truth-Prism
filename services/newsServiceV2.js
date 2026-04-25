/**
 * services/newsServiceV2.js
 * V2 news fetcher — targets BBC, Times of India via NewsAPI, and GNews.
 * Completely independent from newsService.js.
 */

const axios = require("axios");
const { config } = require("../config");

const extractKeywords = (text) => {
  const stopWords = new Set([
    "a","an","the","is","are","was","were","be","been","being",
    "have","has","had","do","does","did","will","would","could",
    "should","to","of","in","for","on","with","at","by","from",
    "and","but","or","not","this","that","it","we","they","he",
    "she","you","i","my","your","our","said","says","also","about",
  ]);
  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w));
  return [...new Set(words)].slice(0, 5).join(" ");
};

/**
 * Fetch from NewsAPI scoped to BBC News.
 */
const fetchBBC = async (query) => {
  try {
    // Try top-headlines first (no 24h delay on free tier)
    let res = await axios.get("https://newsapi.org/v2/top-headlines", {
      params: { q: query, sources: "bbc-news", language: "en", pageSize: 3, apiKey: config.newsApiKey },
      timeout: 6000,
    });
    
    // If no recent headlines found, fallback to everything
    if (!res.data.articles || res.data.articles.length === 0) {
      res = await axios.get("https://newsapi.org/v2/everything", {
        params: { q: query, sources: "bbc-news", language: "en", sortBy: "publishedAt", pageSize: 3, apiKey: config.newsApiKey },
        timeout: 6000,
      });
    }

    return (res.data.articles || []).map((a) => ({
      title: a.title || "No title",
      source: "BBC News",
      url: a.url || "#",
      publishedAt: a.publishedAt || null,
      description: a.description || "No description.",
    }));
  } catch (err) {
    console.warn("[newsServiceV2] BBC fetch failed:", err.message);
    return [];
  }
};

/**
 * Fetch from NewsAPI scoped to Times of India.
 */
const fetchTOI = async (query) => {
  try {
    let res = await axios.get("https://newsapi.org/v2/top-headlines", {
      params: { q: query, sources: "the-times-of-india", language: "en", pageSize: 3, apiKey: config.newsApiKey },
      timeout: 6000,
    });

    if (!res.data.articles || res.data.articles.length === 0) {
      res = await axios.get("https://newsapi.org/v2/everything", {
        params: { q: query, sources: "the-times-of-india", language: "en", sortBy: "publishedAt", pageSize: 3, apiKey: config.newsApiKey },
        timeout: 6000,
      });
    }

    return (res.data.articles || []).map((a) => ({
      title: a.title || "No title",
      source: "Times of India",
      url: a.url || "#",
      publishedAt: a.publishedAt || null,
      description: a.description || "No description.",
    }));
  } catch (err) {
    console.warn("[newsServiceV2] TOI fetch failed:", err.message);
    return [];
  }
};

/**
 * Fetch from GNews (acts as bias-context source similar to Ground News).
 */
const fetchGNews = async (query) => {
  try {
    const res = await axios.get("https://gnews.io/api/v4/search", {
      params: {
        q: query,
        lang: "en",
        max: 3,
        sortby: "publishedAt",
        token: config.gnewsApiKey,
      },
      timeout: 6000,
    });
    return (res.data.articles || []).map((a) => ({
      title: a.title || "No title",
      source: a.source?.name || "GNews",
      url: a.url || "#",
      publishedAt: a.publishedAt || null,
      description: a.description || "No description.",
    }));
  } catch (err) {
    console.warn("[newsServiceV2] GNews fetch failed:", err.message);
    return [];
  }
};

/**
 * Deduplicates articles by title.
 */
const deduplicate = (articles) => {
  const seen = new Set();
  return articles.filter((a) => {
    const key = a.title.toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/**
 * Main entry point — fetches from BBC, TOI, and GNews concurrently.
 * @param {string} text - User input or extracted claim
 * @returns {Promise<Array>} - Top 5 deduplicated articles
 */
const fetchRelatedArticlesV2 = async (text) => {
  const query = extractKeywords(text);
  console.log("[newsServiceV2] Searching for:", query);

  const [bbc, toi, gnews] = await Promise.allSettled([
    fetchBBC(query),
    fetchTOI(query),
    fetchGNews(query),
  ]);

  const all = [
    ...(bbc.status === "fulfilled" ? bbc.value : []),
    ...(toi.status === "fulfilled" ? toi.value : []),
    ...(gnews.status === "fulfilled" ? gnews.value : []),
  ];

  const results = deduplicate(all).slice(0, 5);
  console.log(`[newsServiceV2] Found ${results.length} articles from BBC/TOI/GNews`);
  return results;
};

module.exports = { fetchRelatedArticlesV2 };
