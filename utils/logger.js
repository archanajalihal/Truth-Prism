/**
 * utils/logger.js
 * Lightweight structured logger with timestamps, log levels, and color output.
 * Drop-in replacement for raw console.log calls across the codebase.
 */

const COLORS = {
  reset:   "\x1b[0m",
  dim:     "\x1b[2m",
  green:   "\x1b[32m",
  yellow:  "\x1b[33m",
  red:     "\x1b[31m",
  cyan:    "\x1b[36m",
  magenta: "\x1b[35m",
  white:   "\x1b[37m",
};

const LEVELS = {
  INFO:    { label: "INFO ",   color: COLORS.cyan    },
  SUCCESS: { label: "OK   ",   color: COLORS.green   },
  WARN:    { label: "WARN ",   color: COLORS.yellow  },
  ERROR:   { label: "ERROR",   color: COLORS.red     },
  HTTP:    { label: "HTTP ",   color: COLORS.magenta },
};

const timestamp = () => {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
};

const log = (level, message, meta = null) => {
  const { label, color } = LEVELS[level] || LEVELS.INFO;
  const ts = `${COLORS.dim}[${timestamp()}]${COLORS.reset}`;
  const lv = `${color}[${label}]${COLORS.reset}`;
  const msg = `${COLORS.white}${message}${COLORS.reset}`;

  if (meta) {
    console.log(`${ts} ${lv} ${msg}`, meta);
  } else {
    console.log(`${ts} ${lv} ${msg}`);
  }
};

const logger = {
  info:    (msg, meta) => log("INFO",    msg, meta),
  success: (msg, meta) => log("SUCCESS", msg, meta),
  warn:    (msg, meta) => log("WARN",    msg, meta),
  error:   (msg, meta) => log("ERROR",   msg, meta),
  http:    (msg, meta) => log("HTTP",    msg, meta),
};

module.exports = logger;
