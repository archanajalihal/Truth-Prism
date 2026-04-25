export default function Header() {
  return (
    <header className="text-center mb-12 animate-fade-up">
      {/* Logo mark */}
    <div className="flex justify-center mb-6">
        <div
          className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #DC2626, #7F1D1D)",
            boxShadow: "0 4px 20px rgba(220,38,38,0.25)",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <ellipse cx="14" cy="14" rx="11" ry="7" stroke="white" strokeWidth="2" />
            <circle cx="14" cy="14" r="3.5" fill="white" />
            <circle cx="15.2" cy="12.8" r="1.2" fill="#DC2626" />
          </svg>
        </div>
      </div>
      {/* Title */}
      <h1
        className="font-black tracking-tight mb-2"
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "clamp(2rem, 5vw, 3rem)",
          color: "#111111",
          letterSpacing: "-0.03em",
        }}
      >
        Truth<span style={{ color: "#DC2626" }}>Prism</span>
      </h1>

      {/* Tagline */}
      <p
        className="text-sm font-medium tracking-widest uppercase mb-4"
        style={{ color: "#6B7280", letterSpacing: "0.22em" }}
      >
        Analyze · Verify · Trust
      </p>

      {/* Description */}
      <p
        className="mx-auto max-w-md text-base leading-relaxed"
        style={{ color: "#6B7280" }}
      >
        Paste any headline, article extract, or message. Get an instant
        credibility score powered by pattern analysis.
      </p>
    </header>
  );
}
