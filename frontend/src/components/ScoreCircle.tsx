import { useEffect, useRef } from "react";

interface Props {
  score: number;
  risk: "High" | "Medium" | "Low";
}

const COLOR_MAP = {
  High:   { stroke: "#DC2626", bg: "#FEE2E2", text: "#DC2626" },
  Medium: { stroke: "#D97706", bg: "#FFF7ED", text: "#D97706" },
  Low:    { stroke: "#16A34A", bg: "#F0FDF4", text: "#16A34A" },
};

const R = 80;
const C = 2 * Math.PI * R; // ≈ 502

export default function ScoreCircle({ score, risk }: Props) {
  const { stroke, bg, text } = COLOR_MAP[risk];
  const offset = C - (score / 100) * C;
  const circleRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const el = circleRef.current;
    if (!el) return;
    el.style.strokeDashoffset = String(C);
    el.getBoundingClientRect(); // force reflow
    el.style.transition = "stroke-dashoffset 1.15s cubic-bezier(0.34,1.4,0.64,1)";
    el.style.strokeDashoffset = String(offset);
  }, [score, offset]);

  return (
    <div
      className="relative inline-flex items-center justify-center rounded-full"
      style={{ width: 160, height: 160, background: bg }}
    >
      <svg width="160" height="160" viewBox="0 0 200 200" style={{ position: "absolute", inset: 0 }}>
        {/* track */}
        <circle cx="100" cy="100" r={R} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="10" />
        {/* arc */}
        <circle
          ref={circleRef}
          cx="100" cy="100" r={R}
          fill="none"
          stroke={stroke}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C}
          transform="rotate(-90 100 100)"
        />
      </svg>

      {/* Center text */}
      <div className="relative flex flex-col items-center">
        <span
          className="font-black leading-none"
          style={{ fontSize: "2.5rem", color: text, fontFamily: "'Inter', sans-serif", letterSpacing: "-0.04em" }}
        >
          {score}
        </span>
        <span className="text-xs font-medium" style={{ color: "#9CA3AF" }}>/ 100</span>
      </div>
    </div>
  );
}
