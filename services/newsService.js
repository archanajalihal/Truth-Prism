const axios = require("axios");
const { config } = require("../config");

/**
 * Extracts meaningful keywords from input text for use in news search.
 * Strips common stop words and returns up to 5 keywords.
 * @param {string} text
 * @returns {string} - space-separated keywords
 */
const extractKeywords = (text) => {
  const stopWords = new Set([
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "need", "dare", "ought",
    "to", "of", "in", "for", "on", "with", "at", "by", "from", "as",
    "into", "through", "during", "before", "after", "above", "below",
    "and", "but", "or", "nor", "so", "yet", "both", "either", "neither",
    "not", "this", "that", "these", "those", "it", "its", "we", "they",
    "he", "she", "you", "i", "my", "your", "our", "their", "his", "her",
    "said", "says", "say", "also", "just", "more", "than", "then",
    "about", "up", "out", "no", "new", "first", "last", "long", "great",
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")   // remove punctuation
    .split(/\s+/)                 // split into words
    .filter((w) => w.length > 3 && !stopWords.has(w)); // filter short & stop words

  // Deduplicate and take top 5
  const unique = [...new Set(words)].slice(0, 5);
  return unique.join(" ");
};

const fetchNewsAPI = async (query) => {
  try {
    const response = await axios.get("https://newsapi.org/v2/everything", {
      params: { q: query, language: "en", sortBy: "relevancy", pageSize: 3, apiKey: config.newsApiKey },
      timeout: 5000,
    });
    return (response.data.articles || []).map((a) => ({
      title: a.title || "No title",
      source: a.source?.name || "Unknown source",
      url: a.url || "#",
      publishedAt: a.publishedAt || null,
      description: a.description || "No description available.",
    }));
  } catch (err) {
    console.error("NewsAPI error:", err.message);
    return [];
  }
};

const fetchGNews = async (query) => {
  try {
    const response = await axios.get("https://gnews.io/api/v4/search", {
      params: { q: query, lang: "en", max: 3, apikey: config.gnewsApiKey },
      timeout: 5000,
    });
    return (response.data.articles || []).map((a) => ({
      title: a.title || "No title",
      source: a.source?.name || "Unknown source",
      url: a.url || "#",
      publishedAt: a.publishedAt || null,
      description: a.description || "No description available.",
    }));
  } catch (err) {
    console.error("GNews API error:", err.message);
    return [];
  }
};

const fetchCurrents = async (query) => {
  try {
    const response = await axios.get("https://api.currentsapi.services/v1/search", {
      params: { keywords: query, language: "en", page_size: 3, apiKey: config.currentsApiKey },
      timeout: 5000,
    });
    return (response.data.news || []).map((a) => ({
      title: a.title || "No title",
      source: a.author || "Currents",
      url: a.url || "#",
      publishedAt: a.published || null,
      description: a.description || "No description available.",
    }));
  } catch (err) {
    console.error("Currents API error:", err.message);
    return [];
  }
};

const fetchNewsData = async (query) => {
  try {
    const response = await axios.get("https://newsdata.io/api/1/news", {
      params: { q: query, language: "en", apikey: config.newsdataApiKey },
      timeout: 5000,
    });
    return (response.data.results || []).slice(0, 3).map((a) => ({
      title: a.title || "No title",
      source: a.source_id || "Unknown source",
      url: a.link || "#",
      publishedAt: a.pubDate || null,
      description: a.description || "No description available.",
    }));
  } catch (err) {
    console.error("NewsData API error:", err.message);
    return [];
  }
};

/**
 * Fetches top news articles related to the input text across multiple sources.
 * @param {string} text - Original input text
 * @returns {Promise<Array>} - Array of article objects
 */
const fetchRelatedArticles = async (text) => {
  const query = extractKeywords(text);

  if (!query) {
    return [];
  }

  const results = await Promise.allSettled([
    fetchNewsAPI(query),
    fetchGNews(query),
    fetchCurrents(query),
    fetchNewsData(query),
  ]);

  const allArticles = results
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value);

  // Deduplicate based on URL
  const uniqueUrls = new Set();
  const dedupedArticles = [];
  for (const article of allArticles) {
    if (!uniqueUrls.has(article.url) && article.url !== "#") {
      uniqueUrls.add(article.url);
      dedupedArticles.push(article);
    }
  }

  return dedupedArticles.slice(0, 6); // Return top 6 deduplicated articles
};

module.exports = {
  fetchRelatedArticles,
  extractKeywords,
};
