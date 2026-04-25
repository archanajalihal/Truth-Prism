import { useState, useRef } from "react";

interface Props {
  onAnalyze: (text: string) => void;
  loading: boolean;
}



export default function AnalysisInput({ onAnalyze, loading }: Props) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (text.trim().length < 10 || loading) return;
    onAnalyze(text.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleSubmit();
  };

  return (
    <div
      className="card-elevated p-6 md:p-8 animate-fade-up"
      style={{ animationDelay: "0.12s" }}
    >
      {/* ── Textarea ── */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="news-input"
            className="label"
          >
            Your Content
          </label>
        </div>

        <textarea
          id="news-input"
          ref={textareaRef}
          className="textarea-primary p-4"
          style={{ minHeight: 150 }}
          placeholder="Paste a news headline, article, or message to verify its credibility…"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 5000))}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />

        <div className="mt-3">
          <input
            type="file"
            accept="image/*,video/*"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
          />
        </div>
      </div>

      {/* ── Analyze button ── */}
      <button
        id="analyze-btn"
        className="btn-primary w-full py-3.5 relative overflow-hidden"
        onClick={handleSubmit}
        disabled={loading || text.trim().length < 10}
      >
        {loading ? (
          <>
            <div className="dot-loader flex gap-1.5">
              <span /><span /><span />
            </div>
            <span>Analyzing…</span>
            <div className="scanning-bar" />
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Analyze Credibility
          </>
        )}
      </button>

      {/* Removed example cards */}
    </div>
  );
}
