const axios = require("axios");
const db = require("../db/client");

const FIRECRAWL_API_URL =
  process.env.FIRECRAWL_API_URL || "https://api.firecrawl.dev/v1/scrape";

async function crawlUrl(url) {
  const startTime = Date.now();

  try {
    const response = await axios.post(
      FIRECRAWL_API_URL,
      {
        url: url,
        formats: ["html", "markdown"],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const loadTime = Date.now() - startTime;
    const data = response.data;

    console.log("ok all our scraped data: ", data);

    const result = await db.query(
      `INSERT INTO crawled_pages_simple (url, status_code, content, headers, load_time_ms, crawled_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [
        url,
        data.statusCode || 200,
        data.data?.markdown || data.data?.html || "",
        JSON.stringify(data.metadata || {}),
        loadTime,
      ]
    );

    console.log(`✅ Crawled and saved: ${url}`);
    // Trigger Postgres notification
    await db.query("SELECT pg_notify('page_crawled', $1)", [
      JSON.stringify({ url, branding_profile_id, status_code, crawled_at }),
    ]);

    return result.rows[0];
  } catch (error) {
    console.error(`❌ Failed to crawl ${url}:`, error.message);

    // Still save the failed attempt
    const loadTime = Date.now() - startTime;
    await db.query(
      `INSERT INTO crawled_pages_simple (url, status_code, content, headers, load_time_ms, crawled_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        url,
        error.response?.status || 500,
        error.message,
        JSON.stringify({ error: true }),
        loadTime,
      ]
    );

    throw error;
  }
}

module.exports = {
  crawlUrl,
};
