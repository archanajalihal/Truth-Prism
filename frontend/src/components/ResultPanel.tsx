import ScoreCircle from "./ScoreCircle";
import type { AnalysisResult } from "../App";

interface Props {
  result: AnalysisResult;
}

const RISK_CONFIG = {
  High: {
    chip: "chip-high",
    icon: "⚠️",
    label: "High Risk",
    color: "#DC2626",
    barColor: "linear-gradient(90deg, #DC2626, #7F1D1D)",
    desc: "Strong indicators of misinformation detected.",
  },
  Medium: {
    chip: "chip-medium",
    icon: "◑",
    label: "Medium Risk",
    color: "#D97706",
    barColor: "linear-gradient(90deg, #F59E0B, #D97706)",
    desc: "Some credibility concerns. Cross-check before sharing.",
  },
  Low: {
    chip: "chip-low",
    icon: "✓",
    label: "Low Risk",
    color: "#16A34A",
    barColor: "linear-gradient(90deg, #22C55E, #16A34A)",
    desc: "Content appears relatively credible.",
  },
};

export default function ResultPanel({ result }: Props) {
  const cfg = RISK_CONFIG[result.risk];

  return (
    <div className="mt-6 space-y-4 animate-fade-up">

      {/* ── Main result card ── */}
      <div className="card-elevated p-6 md:p-8">

        {/* Top row: risk chip + status */}
        <div className="flex items-center justify-between mb-6">
          <span className={`chip ${cfg.chip}`}>
            {cfg.icon} {cfg.label}
          </span>
          <span className="text-xs" style={{ color: "#9CA3AF" }}>
            Analysis complete
          </span>
        </div>

        {/* Score + details row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">

          {/* SVG circle */}
          <div className="flex-shrink-0 mx-auto sm:mx-0">
            <ScoreCircle score={result.score} risk={result.risk} />
          </div>

          {/* Right side */}
          <div className="flex-1 w-full">
            <p className="label mb-1">Credibility Score</p>
            <div className="flex items-baseline gap-1.5 mb-4">
              <span
                className="font-black"
                style={{
                  fontSize: "2.8rem",
                  color: cfg.color,
                  fontFamily: "'Inter', sans-serif",
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                }}
              >
                {result.score}
              </span>
              <span className="text-base font-medium" style={{ color: "#9CA3AF" }}>
                out of 100
              </span>
            </div>

            {/* Score bar */}
            <div
              className="w-full rounded-full overflow-hidden mb-5"
              style={{ height: 8, background: "#F3F4F6" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${result.score}%`,
                  background: cfg.barColor,
                  transition: "width 1.1s cubic-bezier(0.34,1.4,0.64,1)",
                }}
              />
            </div>

            {/* Risk description */}
            <p className="text-sm font-medium mb-1" style={{ color: cfg.color }}>
              {cfg.desc}
            </p>
          </div>
        </div>

        {/* Divider */}
        <hr className="divider my-6" />

        {/* Explanation */}
        <div>
          <p className="label mb-2">Analysis</p>
          <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>
            {result.explanation}
          </p>
        </div>
      </div>

      {/* ── Flags ── */}
      {result.flags.length > 0 && (
        <div className="card p-5 animate-fade-up" style={{ animationDelay: "0.08s" }}>
          <p className="label mb-3">
            🚩 Trigger keywords ({result.flags.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {result.flags.map((f, i) => (
              <span key={i} className="flag-badge">{f}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Dataset matches ── */}
      {result.datasetMatches && result.datasetMatches.length > 0 && (
        <div className="card p-5 animate-fade-up" style={{ animationDelay: "0.14s" }}>
          <p className="label mb-3">
            🗄️ Similar patterns in database ({result.datasetMatches.length})
          </p>
          <div className="space-y-2">
            {result.datasetMatches.map((m, i) => (
              <div key={i} className="info-box">
                <p className="text-sm" style={{ color: "#374151" }}>
                  <span className="font-semibold" style={{ color: "#DC2626" }}>↳ </span>
                  {m}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── No flags ── */}
      {result.flags.length === 0 &&
        (!result.datasetMatches || result.datasetMatches.length === 0) && (
          <div className="card p-5 animate-fade-up" style={{ animationDelay: "0.08s" }}>
            <p className="text-sm" style={{ color: "#6B7280" }}>
              ℹ️ No trigger keywords or database matches were found. Score is based on overall language patterns.
            </p>
          </div>
        )}

      {/* ── Disclaimer ── */}
      <p className="text-center text-xs pb-2" style={{ color: "#9CA3AF" }}>
        TruthLens uses pattern analysis — always verify with trusted sources.
      </p>
    </div>
  );
}
