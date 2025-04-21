import express from "express";
import { createClient } from "redis";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;
const TARGET_URL = "https://wiki-production-3c8b.up.railway.app"; // Your Wiki.js URL

const redisClient = createClient({
  url: process.env.REDIS_URL,
});
await redisClient.connect();

app.get("/home", async (req, res) => {
  try {
    const cached = await redisClient.get("home_page");
    if (cached) {
      console.log("⏪ Served from cache");
      return res.send(cached);
    }

    const response = await fetch(`${TARGET_URL}/home`);
    const data = await response.text();

    await redisClient.set("home_page", data, { EX: 60 }); // Cache for 60 sec
    console.log("🔁 Fetched from origin");

    res.send(data);
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on port ${PORT}`);
});