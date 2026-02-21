/**
 * Core API Router — Heady Manager
 * Provides foundational API endpoints used by multiple services.
 */
const express = require("express");
const router = express.Router();

// Core health routing — delegates to main health handler
router.get("/core/health", (req, res) => {
    res.json({
        ok: true,
        service: "heady-core-api",
        version: "2.0.0",
        ts: new Date().toISOString(),
    });
});

module.exports = router;
