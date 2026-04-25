import { useLocation, useNavigate } from "react-router-dom";
import { AnalysisResult } from "../App";
import ScoreCircle from "../components/ScoreCircle";

// Derive risk label from score (since V2 uses status, not risk)
const getRisk = (result: AnalysisResult): "High" | "Medium" | "Low" => {
  if (result.risk) return result.risk;
  if (result.score <= 20) return "High";
  if (result.score <= 50) return "Medium";
  return "Low";
};

const RISK_LABELS = {
  High: "🚩 High Risk",
  Medium: "⚠️ Medium Risk",
  Low: "✅ Low Risk",
};

const RISK_DESCRIPTIONS = {
  High: "This content contains multiple red flags and suspicious patterns. Verify with authoritative sources before sharing.",
  Medium: "This content has some concerning elements. Cross-check facts with reliable sources.",
  Low: "This content appears credible, but always verify important claims independently.",
};

const STATUS_COLORS: Record<string, string> = {
  "Likely False": "#DC2626",
  "Uncertain": "#D97706",
  "Likely True": "#16A34A",
};

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { result: AnalysisResult; inputText: string } | undefined;

  if (!state || !state.result) {
    return (
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#9CA3AF", marginBottom: 16 }}>No analysis result found</p>
          <button
            className="btn-primary"
            onClick={() => navigate("/")}
            style={{ padding: "12px 24px" }}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  const { result, inputText } = state;
  const risk = getRisk(result);
  const statusColor = STATUS_COLORS[result.status] || "#6B7280";

  // Unify sources: V2 uses result.sources; V1 used datasetMatches titles
  const sources = result.sources && result.sources.length > 0
    ? result.sources
    : (result.datasetMatches || []).map((t) => ({ title: t, source: "", url: "#" }));

  const flags = result.flags || [];

  return (
    <div className="page anim-fade-in">
      {/* ── Header ────────────────────────────────────── */}
      <div style={{ padding: "32px 24px 0", borderBottom: "1px solid #E5E7EB" }}>
        <button
          onClick={() => navigate("/")}
          className="btn-secondary"
          style={{ marginBottom: 24, padding: "8px 16px", fontSize: "0.875rem", gap: 6 }}
        >
          <span>←</span> Back
        </button>
        <h1 className="section-title" style={{ marginBottom: 6 }}>Analysis Results</h1>
        <p className="section-subtitle">Review the credibility assessment below</p>
      </div>

      {/* ── Main Content ──────────────────────────────── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>

        {/* ── Score + Status Section ───────────────────── */}
        <section style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          marginBottom: 56, padding: "40px 32px",
          background: "#F9FAFB", borderRadius: "16px", border: "1px solid #E5E7EB",
        }}>
          <div className="anim-scale-in" style={{ marginBottom: 24 }}>
            <ScoreCircle score={result.score} risk={risk} />
          </div>

          {/* Status badge */}
          <div style={{
            display: "inline-block", padding: "6px 18px", borderRadius: 999,
            background: `${statusColor}18`, border: `1px solid ${statusColor}40`,
            color: statusColor, fontWeight: 700, fontSize: "1rem", marginBottom: 12,
          }}>
            {result.status}
          </div>

          <p style={{
            fontSize: "1.15rem", fontWeight: 700,
            color: risk === "High" ? "#DC2626" : risk === "Medium" ? "#D97706" : "#16A34A",
            marginBottom: 8, textAlign: "center",
          }}>
            {RISK_LABELS[risk]}
          </p>
          <p style={{ fontSize: "0.95rem", color: "#6B7280", maxWidth: 500, textAlign: "center", lineHeight: 1.6 }}>
            {RISK_DESCRIPTIONS[risk]}
          </p>
        </section>

        {/* ── Extracted Claim ────────────────────────── */}
        {result.claim && (
          <section className="anim-fade-up" style={{ marginBottom: 32 }}>
            <p style={{
              fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "#9CA3AF", marginBottom: 10,
            }}>
              Extracted Claim
            </p>
            <div style={{
              background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "12px",
              padding: "16px 20px", fontSize: "0.95rem", color: "#991B1B",
              lineHeight: 1.7, fontStyle: "italic",
            }}>
              "{result.claim}"
            </div>
          </section>
        )}

        {/* ── Analyzed Text ─────────────────────────── */}
        <section className="anim-fade-up" style={{ marginBottom: 40 }}>
          <p style={{
            fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "#9CA3AF", marginBottom: 12,
          }}>
            Your Input
          </p>
          <div style={{
            background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "12px",
            padding: "20px", fontSize: "0.95rem", color: "#374151",
            lineHeight: 1.7, maxHeight: 140, overflowY: "auto", fontStyle: "italic",
          }}>
            "{inputText}"
          </div>
        </section>

        {/* ── Explanation Card ──────────────────────── */}
        <section className="card anim-fade-up" style={{ padding: "28px", marginBottom: 40, animationDelay: "0.1s" }}>
          <h3 style={{
            fontSize: "0.95rem", fontWeight: 700, color: "#111",
            marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
          }}>
            <span>💡</span> Explanation
          </h3>
          <p style={{ fontSize: "0.95rem", color: "#6B7280", lineHeight: 1.8 }}>
            {result.explanation}
          </p>
        </section>

        {/* ── Cards Grid ────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, marginBottom: 40 }}>

          {/* News Sources Card */}
          <div className="card anim-fade-up" style={{ padding: "24px", animationDelay: "0.15s" }}>
            <h4 style={{
              fontSize: "0.95rem", fontWeight: 700, color: "#111",
              marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
            }}>
              <span>📰</span> News Sources Checked
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sources.length > 0 ? (
                sources.slice(0, 5).map((s, i) => (
                  <div key={i} style={{
                    fontSize: "0.85rem", padding: "8px 12px",
                    background: "#F3F4F6", borderRadius: "8px",
                    color: "#374151", borderLeft: "2px solid #DC2626",
                  }}>
                    <div style={{ fontWeight: 600, color: "#111", marginBottom: 2 }}>
                      {s.source && <span style={{ color: "#DC2626", marginRight: 6 }}>[{s.source}]</span>}
                      {s.url !== "#" ? (
                        <a href={s.url} target="_blank" rel="noopener noreferrer"
                          style={{ color: "#374151", textDecoration: "none" }}>
                          {s.title}
                        </a>
                      ) : s.title}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: "0.875rem", color: "#9CA3AF" }}>No matching sources found</p>
              )}
            </div>
          </div>

          {/* Red Flags Card */}
          <div className="card anim-fade-up" style={{ padding: "24px", animationDelay: "0.2s" }}>
            <h4 style={{
              fontSize: "0.95rem", fontWeight: 700, color: "#111",
              marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
            }}>
              <span>🚩</span> Red Flags
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {flags.length > 0 ? (
                flags.map((flag, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    fontSize: "0.875rem", color: "#6B7280",
                  }}>
                    <span style={{ fontSize: "1.1rem", flexShrink: 0, marginTop: 1 }}>🔍</span>
                    <span style={{ lineHeight: 1.5 }}>{flag}</span>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: "0.875rem", color: "#9CA3AF" }}>No significant flags detected</p>
              )}
            </div>
          </div>

          {/* Score Breakdown Card */}
          <div className="card anim-fade-up" style={{ padding: "24px", animationDelay: "0.25s" }}>
            <h4 style={{
              fontSize: "0.95rem", fontWeight: 700, color: "#111",
              marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
            }}>
              <span>📊</span> Score Breakdown
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, borderBottom: "1px solid #E5E7EB" }}>
                <span style={{ fontSize: "0.85rem", color: "#6B7280" }}>Input length</span>
                <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "#111" }}>{inputText.length} chars</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, borderBottom: "1px solid #E5E7EB" }}>
                <span style={{ fontSize: "0.85rem", color: "#6B7280" }}>Credibility bar</span>
                <div style={{ height: 6, width: 60, background: "#E5E7EB", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${result.score}%`,
                    background: result.score > 50 ? "#16A34A" : result.score > 20 ? "#D97706" : "#DC2626",
                    borderRadius: 3,
                  }} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.85rem", color: "#6B7280" }}>Overall Score</span>
                <span style={{
                  fontSize: "1.05rem", fontWeight: 700,
                  color: result.score > 50 ? "#16A34A" : result.score > 20 ? "#D97706" : "#DC2626",
                }}>
                  {result.score}/100
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── CTA Section ───────────────────────────── */}
        <div className="anim-fade-up" style={{
          display: "flex", gap: 12, justifyContent: "center",
          marginTop: 56, paddingTop: 28, borderTop: "1px solid #E5E7EB",
        }}>
          <button className="btn-primary" onClick={() => navigate("/")} style={{ padding: "13px 32px" }}>
            Analyze Another
          </button>
          <button className="btn-secondary" onClick={() => navigate("/dashboard")} style={{ padding: "13px 32px" }}>
            View Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
