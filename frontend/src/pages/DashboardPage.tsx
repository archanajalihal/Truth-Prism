import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RecentEntry {
  id: string;
  text: string;
  score: number;
  status: string;
  risk: "High" | "Medium" | "Low";
  timestamp: string;
}

interface DashboardData {
  totalAnalyses: number;
  highRisk: number;
  credible: number;
  lastAnalyzed: string | null;
  recent: RecentEntry[];
}

interface NewsCard {
  id: string;
  title: string;
  source?: string;
  category: string;
  categoryColor: { bg: string; text: string; border: string };
  preview: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const RISK_COLORS = {
  High:   { bg: "#FEE2E2", text: "#DC2626" },
  Medium: { bg: "#FFF7ED", text: "#D97706" },
  Low:    { bg: "#F0FDF4", text: "#16A34A" },
};

const EXAMPLE_NEWS: NewsCard[] = [
  {
    id: "news-1",
    title: "Tech Giant Announces Revolutionary AI Breakthrough",
    source: "Technology Review",
    category: "Technology",
    categoryColor: { bg: "#EEF2FF", text: "#3730A3", border: "#C7D2FE" },
    preview: "Leading technology company reveals new AI capabilities that could transform industry practices and accelerate automation across multiple sectors.",
  },
  {
    id: "news-2",
    title: "Climate Study Shows Alarming Trends (Must Read!)",
    source: "Environmental Monitor",
    category: "Climate",
    categoryColor: { bg: "#F0FDF4", text: "#166534", border: "#BBF7D0" },
    preview: "New research indicates environmental changes at an unprecedented rate globally, with scientists calling for immediate action.",
  },
  {
    id: "news-3",
    title: "Shocking Celebrity Secret Exposed by Anonymous Source",
    source: "Unknown Blog",
    category: "Celebrity",
    categoryColor: { bg: "#FEF7EE", text: "#92400E", border: "#FDE68A" },
    preview: "An unverified source claims to have information about a well-known public figure with no corroboration from credible outlets.",
  },
  {
    id: "news-4",
    title: "Healthcare Report: Public Health Initiative Expands Access",
    source: "Health Ministry",
    category: "Health",
    categoryColor: { bg: "#FEF2F2", text: "#7F1D1D", border: "#FECACA" },
    preview: "Government announces expansion of public health programs across multiple states, targeting underserved communities.",
  },
  {
    id: "news-5",
    title: "Sports Team Wins Championship in Historic Match",
    source: "Sports Central",
    category: "Sports",
    categoryColor: { bg: "#FDF2F8", text: "#831843", border: "#FBCFE8" },
    preview: "In a dramatic final, the team secures victory after an intense competition watched by millions worldwide.",
  },
  {
    id: "news-6",
    title: "Economic Forecast: Mixed Signals for Coming Quarter",
    source: "Financial Times",
    category: "Economics",
    categoryColor: { bg: "#F5F3FF", text: "#6D28D9", border: "#DDD6FE" },
    preview: "Analysts present conflicting views on economic outlook based on recent inflation, employment, and GDP data.",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatTime = (isoString: string | null): string => {
  if (!isoString) return "—";
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data on mount and refresh every 30s
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("Failed to fetch dashboard");
        const json = await res.json();
        setData(json);
        setError(null);
      } catch (err) {
        setError("Could not load dashboard data. Run an analysis first.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30_000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: "Total Analyses", value: data?.totalAnalyses ?? 0, icon: "📊" },
    { label: "High Risk Found", value: data?.highRisk ?? 0, icon: "🚩" },
    { label: "Credible Content", value: data?.credible ?? 0, icon: "✅" },
    { label: "Last Analyzed", value: formatTime(data?.lastAnalyzed ?? null), icon: "⏱️" },
  ];

  const handleAnalyzeNews = (news: NewsCard) => {
    // Build rich context string: title + description + source
    const parts: string[] = [`Title: ${news.title}`];
    if (news.preview?.trim()) parts.push(`Description: ${news.preview.trim()}`);
    if (news.source?.trim())  parts.push(`Source: ${news.source.trim()}`);
    const combinedText = parts.join("\n");
    navigate("/", { state: { prefillText: combinedText } });
  };

  return (
    <div
      className="page"
      style={{
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(-45deg, #ffffff, #f9fafb, #fef2f2, #ffffff)",
        backgroundSize: "400% 400%",
        animation: "gradient 15s ease infinite",
      }}
    >
      {/* ── Header ────────────────────────────────────── */}
      <div style={{ padding: "40px 24px 0", borderBottom: "1px solid #E5E7EB" }}>
        <h1 className="section-title" style={{ marginBottom: 8 }}>Dashboard</h1>
        <p className="section-subtitle">Track your recent analyses and try fact-checking news</p>
      </div>

      {/* ── Main Content ──────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>

        {/* ── Stats Row ───────────────────────────────── */}
        <div
          className="anim-fade-up"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 48,
          }}
        >
          {stats.map((stat, i) => (
            <div
              key={i}
              className="card"
              style={{
                padding: "24px",
                textAlign: "center",
                animation: `fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both`,
                animationDelay: `${0.05 + i * 0.08}s`,
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: 12 }}>{stat.icon}</div>
              <p style={{ fontSize: "0.8rem", color: "#9CA3AF", marginBottom: 6 }}>{stat.label}</p>
              <p style={{ fontSize: "1.75rem", fontWeight: 800, color: "#111" }}>
                {loading ? "—" : String(stat.value)}
              </p>
            </div>
          ))}
        </div>

        {/* ── Recent Analyses Section ───────────────────── */}
        <section className="anim-fade-up" style={{ marginBottom: 56 }}>
          <div style={{ marginBottom: 28 }}>
            <h2 className="section-title">Recent Analyses</h2>
            <p className="section-subtitle">Your latest credibility checks</p>
          </div>

          {/* Loading state */}
          {loading && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#9CA3AF" }}>
              <div style={{ fontSize: "2rem", marginBottom: 12 }}>⏳</div>
              <p>Loading analyses...</p>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div style={{
              textAlign: "center", padding: "40px 0", background: "#FEF2F2",
              borderRadius: 12, border: "1px solid #FECACA",
            }}>
              <div style={{ fontSize: "2rem", marginBottom: 12 }}>📭</div>
              <p style={{ color: "#DC2626", fontWeight: 600, marginBottom: 8 }}>No analyses yet</p>
              <p style={{ color: "#6B7280", fontSize: "0.875rem" }}>
                Analyze a claim on the home page to see it appear here.
              </p>
              <button
                className="btn-primary"
                onClick={() => navigate("/")}
                style={{ marginTop: 16, padding: "10px 24px" }}
              >
                Start Analyzing
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && data?.recent.length === 0 && (
            <div style={{
              textAlign: "center", padding: "40px 0", background: "#F9FAFB",
              borderRadius: 12, border: "1px solid #E5E7EB",
            }}>
              <div style={{ fontSize: "2rem", marginBottom: 12 }}>📭</div>
              <p style={{ color: "#374151", fontWeight: 600, marginBottom: 8 }}>No analyses yet</p>
              <p style={{ color: "#9CA3AF", fontSize: "0.875rem" }}>
                Run your first analysis to see results here.
              </p>
            </div>
          )}

          {/* Real data */}
          {!loading && !error && data && data.recent.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {data.recent.map((entry, idx) => {
                const risk = entry.risk ?? (entry.score <= 20 ? "High" : entry.score <= 50 ? "Medium" : "Low");
                const colors = RISK_COLORS[risk];
                return (
                  <div
                    key={entry.id}
                    className="card"
                    style={{
                      padding: "20px",
                      cursor: "default",
                      animation: `fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both`,
                      animationDelay: `${0.1 + idx * 0.06}s`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
                      {/* Left side */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: "0.95rem", color: "#374151", marginBottom: 6,
                          lineHeight: 1.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>
                          {entry.text}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{
                            fontSize: "0.72rem", fontWeight: 600, padding: "2px 8px",
                            borderRadius: 999, background: colors.bg, color: colors.text,
                          }}>
                            {entry.status}
                          </span>
                          <span style={{ fontSize: "0.78rem", color: "#9CA3AF" }}>
                            {formatTime(entry.timestamp)}
                          </span>
                        </div>
                      </div>

                      {/* Right side — score badge */}
                      <div style={{
                        textAlign: "center", padding: "10px 16px",
                        background: colors.bg, borderRadius: "8px", flexShrink: 0,
                      }}>
                        <p style={{ fontSize: "1.1rem", fontWeight: 800, color: colors.text, lineHeight: 1 }}>
                          {entry.score}
                        </p>
                        <p style={{
                          fontSize: "0.65rem", fontWeight: 700, color: colors.text,
                          textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2,
                        }}>
                          {risk}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Trending News Section ─────────────────────── */}
        <section className="anim-fade-up" style={{ marginBottom: 28 }}>
          <div style={{ marginBottom: 28 }}>
            <h2 className="section-title">Trending News</h2>
            <p className="section-subtitle">Fact-check these headlines and articles</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
            {EXAMPLE_NEWS.map((news, idx) => (
              <div
                key={news.id}
                className="card"
                style={{
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  animation: `fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both`,
                  animationDelay: `${0.1 + idx * 0.06}s`,
                }}
              >
                <div style={{ marginBottom: 14 }}>
                  <span style={{
                    display: "inline-block", fontSize: "0.7rem", fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.06em",
                    padding: "4px 10px", borderRadius: "6px",
                    background: news.categoryColor.bg,
                    color: news.categoryColor.text,
                    border: `1px solid ${news.categoryColor.border}`,
                  }}>
                    {news.category}
                  </span>
                </div>

                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#111", marginBottom: 12, lineHeight: 1.5, flex: 1 }}>
                  {news.title}
                </h3>

                <p style={{ fontSize: "0.875rem", color: "#6B7280", lineHeight: 1.6, marginBottom: 20, flex: 1 }}>
                  {news.preview}
                </p>

                <button
                  className="btn-primary"
                  onClick={() => handleAnalyzeNews(news)}
                  style={{ width: "100%", padding: "11px 16px", fontSize: "0.9rem", fontWeight: 600, marginTop: "auto" }}
                >
                  Analyze
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA Section ────────────────────────────── */}
        <div
          className="anim-fade-up"
          style={{
            background: "#F9FAFB", border: "1.5px solid #E5E7EB",
            borderRadius: "16px", padding: "40px 32px",
            textAlign: "center", marginTop: 48,
          }}
        >
          <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#111", marginBottom: 12 }}>
            Analyze Your Own Content
          </h3>
          <p style={{
            fontSize: "0.95rem", color: "#6B7280", marginBottom: 24,
            maxWidth: 480, margin: "0 auto 24px", lineHeight: 1.6,
          }}>
            Paste any headline, article, or message to check its credibility instantly
          </p>
          <button
            className="btn-primary"
            onClick={() => navigate("/")}
            style={{ padding: "14px 32px", fontSize: "1rem" }}
          >
            Start Analyzing
          </button>
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "28px 24px", textAlign: "center", marginTop: 40 }}>
        <p style={{ fontSize: "0.8rem", color: "#9CA3AF" }}>
          TruthPrism v2.0 &nbsp;·&nbsp; Evidence-driven fact checking &nbsp;·&nbsp; Always verify with authoritative sources
        </p>
      </footer>
    </div>
  );
}
