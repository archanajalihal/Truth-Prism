/**
 * controllers/dashboardController.js
 * Handles GET /api/dashboard
 */

const { getDashboardData } = require("../utils/analysisStore");

const getDashboard = (req, res) => {
  try {
    const data = getDashboardData();
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    console.error("[dashboardController] Error:", err.message);
    return res.status(500).json({ success: false, error: "Failed to load dashboard data." });
  }
};

module.exports = { getDashboard };
