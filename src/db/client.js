const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test connection on startup
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("❌ Database connection failed:", err);
  } else {
    console.log("✅ Database connected at:", res.rows[0].now);
  }
});

// Set up listener
pool.query("LISTEN page_crawled");

pool.on("notification", (msg) => {
  console.log("Page crawled:", msg.payload);
  // Could emit to websocket, update cache, etc.
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
