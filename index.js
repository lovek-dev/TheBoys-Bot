// join our discord discord.gg/uoaio or dm me Uo#1428 if you need any type of help
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot is alive!");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const server = app.listen(5000, "0.0.0.0", () => {
  console.log("Web server running on port 5000");
  require("./src/index");
  startKeepAlive();
});

function startKeepAlive() {
  const PING_INTERVAL = 5 * 60 * 1000; // 5 minutes

  // Use Render's public URL env var, or fallback to localhost
  const url = process.env.RENDER_EXTERNAL_URL
    ? `${process.env.RENDER_EXTERNAL_URL}/health`
    : `http://localhost:5000/health`;

  setInterval(async () => {
    try {
      const fetch = (await import("node-fetch")).default;
      const res = await fetch(url);
      const data = await res.json();
      console.log(`[KEEP-ALIVE] Self-ping OK at ${data.timestamp}`);
    } catch (err) {
      console.error(`[KEEP-ALIVE] Self-ping failed: ${err.message}`);
    }
  }, PING_INTERVAL);

  console.log(`[KEEP-ALIVE] Auto-ping started every 5 minutes → ${url}`);
}