require("dotenv").config();
const express = require("express");
const path = require("path");
const db = require("./db/client");
const crawlService = require("./services/crawlService");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static("public")); // Serve static HTML

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

app.post("/api/simple-crawl", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    const data = await fetch(url);
    const html = await data.text();

    res.json({
      success: true,
      message: "Crawl completed",
      data: html,
    });
  } catch (error) {
    console.error("Crawl error:", error);
    res.status(500).json({
      error: "Failed to crawl URL",
      message: error.message,
    });
  }
});

// Crawl a single URL
app.post("/api/crawl", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    console.log(`Starting crawl for: ${url}`);
    const result = await crawlService.crawlUrl(url);

    res.json({
      success: true,
      message: "Crawl completed",
      data: result,
    });
  } catch (error) {
    console.error("Crawl error:", error);
    res.status(500).json({
      error: "Failed to crawl URL",
      message: error.message,
    });
  }
});

// Get all crawled pages
app.get("/api/pages", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, url, load_time_ms, status_code, crawled_at FROM crawled_pages ORDER BY crawled_at DESC LIMIT 50"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Failed to fetch pages" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
