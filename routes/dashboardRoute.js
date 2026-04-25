/**
 * routes/dashboardRoute.js
 * GET /api/dashboard
 */

const express = require("express");
const router = express.Router();
const { getDashboard } = require("../controllers/dashboardController");

router.get("/", getDashboard);

module.exports = router;
