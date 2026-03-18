// join our discord discord.gg/uoaio or dm me Uo#1428 if you need any type of help
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot is alive!");
});

const server = app.listen(5000, "0.0.0.0", () => {
  console.log("Web server running on port 5000");
  require("./src/index");
});
 

