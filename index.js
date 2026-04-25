require("dotenv").config();

const { validateEnv } = require("./config");
const { config }      = require("./config");
const logger          = require("./utils/logger");

// ── Validate all required environment variables before anything else ─────────
try {
  validateEnv();
  logger.success("Environment variables validated.");
} catch (err) {
  logger.error(err.message);
  process.exit(1);
}

const express = require("express");
const cors    = require("cors");

const { notFoundHandler, globalErrorHandler } = require("./utils/errorHandler");

// ── Routes ───────────────────────────────────────────────────────────────────
const testRoute      = require("./routes/testRoute");
const unifiedRoute   = require("./routes/unifiedRoute");   // POST /api/analyze
const analyzeRoute   = require("./routes/analyzeRoute");   // POST /api/analyze/text
const imageRoute     = require("./routes/imageRoute");     // POST /api/analyze/image
const analyzeRouteV2 = require("./routes/analyzeRouteV2"); // POST /api/analyze-v2
const dashboardRoute = require("./routes/dashboardRoute"); // GET  /api/dashboard

const app = express();

// ── Core Middleware ──────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// ── HTTP Request Logger ──────────────────────────────────────────────────────
app.use((req, _res, next) => {
  logger.http(`${req.method} ${req.originalUrl}`);
  next();
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/test",       testRoute);
app.use("/api/analyze",    unifiedRoute);  // Unified: POST /api/analyze (text + image)
app.use("/api/analyze",    analyzeRoute);  // Dedicated: POST /api/analyze/text
app.use("/api/analyze",    imageRoute);    // Dedicated: POST /api/analyze/image
app.use("/api/analyze-v2", analyzeRouteV2); // V2: POST /api/analyze-v2
app.use("/api/dashboard",  dashboardRoute); // GET  /api/dashboard

// ── 404 & Global Error Handlers (must be last) ───────────────────────────────
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ── Start Server ─────────────────────────────────────────────────────────────
app.listen(config.port, () => {
  logger.success(`SatyaLens server running on port ${config.port} [${config.nodeEnv}]`);
  logger.info("Available endpoints:");
  logger.info("  GET  /api/test");
  logger.info("  POST /api/analyze          (unified — text + image)");
  logger.info("  POST /api/analyze/text");
  logger.info("  POST /api/analyze/image");
  logger.info("  POST /api/analyze-v2       (V2 — BBC / TOI / GNews evidence)");
  logger.info("  GET  /api/dashboard        (real-time stats)");
});
