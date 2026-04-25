import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";



const FEATURES = [
  {
    icon: "🔍",
    title: "Keyword Detection",
    desc: "Spots emotionally triggering and sensationalist language patterns instantly.",
  },
  {
    icon: "🗄️",
    title: "Database Matching",
    desc: "Cross-references 23,000+ known misinformation headlines for pattern similarity.",
  },
  {
    icon: "📊",
    title: "Credibility Score",
    desc: "Returns a 0–100 score with risk level and detailed explanation.",
  },
];

export default function HomePage() {
  const [text, setText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Auto-fill textarea when navigated from Dashboard with prefillText
  useEffect(() => {
    const state = location.state as { prefillText?: string } | null;
    const prefill = state?.prefillText?.trim();
    if (prefill && !text) {
      setText(prefill.slice(0, 5000)); // cap at 5000 chars
      // Scroll to and focus the input box
      setTimeout(() => {
        inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        inputRef.current?.focus();
      }, 100);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/webm",
    "application/pdf",
    "text/plain",
  ];

  // Cursor tracking with smooth animation
  useEffect(() => {
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        targetX = e.touches[0].clientX;
        targetY = e.touches[0].clientY;
      }
    };

    const animate = () => {
      // Smooth easing
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      
      setCursorPos({ x: currentX, y: currentY });
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleFileSelect = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      setError("File is too large. Maximum size is 50MB.");
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("File type not supported. Upload images, videos, PDFs, or text files.");
      return;
    }

    setError(null);
    setUploadedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleAnalyze = async () => {
    if ((text.trim().length < 10 && !uploadedFile) || loading) return;
    setLoading(true);
    setError(null);
    try {
      let res: Response;

      if (uploadedFile) {
        // Image input — send as multipart/form-data
        const formData = new FormData();
        formData.append("file", uploadedFile);
        res = await fetch("http://localhost:5000/api/analyze-v2", {
          method: "POST",
          body: formData,
        });
      } else {
        // Text input — send as JSON
        res = await fetch("http://localhost:5000/api/analyze-v2", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.trim() }),
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        // Special case: Vision API billing not enabled
        if (errData.suggestion === "Use text input") {
          throw new Error("📋 Image OCR is unavailable. Please copy the text from your image and paste it in the text box above.");
        }
        throw new Error(errData.error || "Server error");
      }
      const data = await res.json();
      navigate("/result", { state: { result: data, inputText: text.trim() || uploadedFile?.name } });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      setError(
        msg === "Failed to fetch"
          ? "Cannot connect to backend. Make sure the server is running."
          : msg || "Something went wrong. Please try again."
      );
      setLoading(false);
    }
  };

  return (
    <div
      ref={pageRef}
      className="page"
      style={{
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(-45deg, #ffffff, #f9fafb, #fef2f2, #ffffff)",
        backgroundSize: "400% 400%",
        animation: "gradient 15s ease infinite",
      }}
    >
      {loading && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backdropFilter: "blur(4px)"
        }}>
          <div className="spinner" style={{ width: 60, height: 60, borderTopColor: "#DC2626", borderRightColor: "#DC2626", borderBottomColor: "#DC2626" }} />
          <h2 style={{ marginTop: 20, color: "#DC2626", fontWeight: "bold" }}>Analyzing Credibility...</h2>
          <p style={{ color: "#666" }}>Cross-referencing global sources & running AI verification</p>
        </div>
      )}
      {/* ── Cursor-Reactive Radial Glow ──────── */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
          zIndex: 0,
          background: `radial-gradient(circle at ${cursorPos.x}px ${cursorPos.y}px, rgba(220, 38, 38, 0.22) 0px, rgba(220, 38, 38, 0.12) 80px, rgba(220, 38, 38, 0.01) 250px, transparent 400px)`,
          willChange: "background",
        }}
      />

      {/* ── Content Wrapper (above background) ── */}
      <div style={{ position: "relative", zIndex: 1 }}>
      {/* ── Hero ────────────────────────────────── */}
      <section className="hero anim-fade-up">

        <h1 className="hero-title">
          Truth<span className="accent">Prism</span>
        </h1>
        <p className="hero-tagline">Analyze · Verify · Trust</p>
        <p className="hero-desc">
          Paste any news headline or article. Get an instant credibility score,
          risk level, and clear explanation — in seconds.
        </p>
      </section>

      {/* ── Spline 3D embed ─────────────────────── */}
      {/* Disabled - replace with your Spline URL if you have one */}
      {/* To use Spline: 
          1. Go to spline.design 
          2. Create/design your 3D scene
          3. Get the embed URL
          4. Replace the src below
      */}

      {/* ── Input card ──────────────────────────── */}
      <div className="input-section anim-fade-up" style={{ animationDelay: "0.15s" }}>
        <div className="input-card">

          {/* Label row */}
          <div className="input-label">
            <span>Paste your content</span>
          </div>

          {/* Textarea */}
          <textarea
            ref={inputRef}
            className="textarea"
            placeholder="Enter a headline, article excerpt, or any message you'd like to fact-check…"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 5000))}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleAnalyze();
            }}
            disabled={loading}
          />

          <div className="mt-3 mb-6">
            <input
              type="file"
              accept="image/*,video/*"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />
            {uploadedFile && (
              <p style={{ fontSize: "0.85rem", color: "#111", marginTop: 8 }}>
                Selected file: {uploadedFile.name}
              </p>
            )}
          </div>

          {/* CTA Button */}
          <button
            className="btn-primary"
            style={{ width: "100%", fontSize: "1.05rem", padding: "17px 32px" }}
            onClick={handleAnalyze}
            disabled={loading || (text.trim().length < 10 && !uploadedFile)}
          >
            {loading ? (
              <>
                <div className="spinner" />
                Analyzing…
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                Analyze Credibility
              </>
            )}
          </button>

          {error && (
            <div style={{
              marginTop: 14, padding: "12px 16px", borderRadius: 10,
              background: "#FEF2F2", border: "1px solid #FECACA",
              fontSize: "0.875rem", color: "#991B1B", display: "flex", gap: 8
            }}>
              <span>⚠️</span> {error}
            </div>
          )}


        </div>
      </div>

      {/* ── Features row ────────────────────────── */}
      <section style={{ padding: "0 24px 100px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 20 }}>
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="card anim-fade-up"
              style={{ padding: "24px", animationDelay: `${0.1 + i * 0.1}s` }}
            >
              <div style={{ fontSize: "1.8rem", marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontSize: "0.975rem", fontWeight: 700, marginBottom: 8, color: "#111" }}>{f.title}</h3>
              <p style={{ fontSize: "0.875rem", color: "#6B7280", lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ──────────────────────────────── */}
      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "32px 24px", textAlign: "center" }}>
        <p style={{ fontSize: "0.8rem", color: "#9CA3AF" }}>
          TruthPrism v1.0 &nbsp;·&nbsp; Pattern-matching analysis &nbsp;·&nbsp;
          Always verify with authoritative sources
        </p>
      </footer>
      </div>
      {/* ── Close Content Wrapper ───────────────– */}
    </div>
  );
}
