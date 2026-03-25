// join our discord discord.gg/uoaio or dm me Uo#1428 if you need any type of help
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot is alive!");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Render requires the server to listen on process.env.PORT — hardcoding any port
// causes Render's health checks to fail and the service never comes online.
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Web server running on port ${PORT}`);
  require("./src/index");
  startKeepAlive();
});

function startKeepAlive() {
  const PING_INTERVAL = 5 * 60 * 1000; // 5 minutes

  // Render sets RENDER_EXTERNAL_URL, Replit sets REPLIT_DEV_DOMAIN, else use localhost
  let url;
  if (process.env.RENDER_EXTERNAL_URL) {
    url = `${process.env.RENDER_EXTERNAL_URL}/health`;
  } else if (process.env.REPLIT_DEV_DOMAIN) {
    url = `https://${process.env.REPLIT_DEV_DOMAIN}/health`;
  } else {
    url = `http://localhost:${PORT}/health`;
  }

  setInterval(async () => {
    try {
      const fetch = (await import("node-fetch")).default;
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      const data = await res.json();
      console.log(`[KEEP-ALIVE] Self-ping OK at ${data.timestamp}`);
    } catch (err) {
      console.error(`[KEEP-ALIVE] Self-ping failed: ${err.message}`);
    }
  }, PING_INTERVAL);

  console.log(`[KEEP-ALIVE] Auto-ping started every 5 minutes → ${url}`);
}
