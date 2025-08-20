import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());

// ✅ Enable CORS (allow frontend URL or fallback to *)
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));

const PORT = process.env.PORT || 5000;
const STABILITY_API_KEY = process.env.STABILITY_API_KEY;

if (!STABILITY_API_KEY) {
  console.error("❌ Missing STABILITY_API_KEY in .env");
  process.exit(1);
}
console.log("✅ Stability API Key loaded");

// ✅ Health check route
app.get("/", (req, res) => {
  res.send("✅ Backend running with Stability AI. Use POST /api/generate-image");
});

// ✅ Generate multiple images
app.post("/api/generate-image", async (req, res) => {
  try {
    const { prompt, count } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Default to 3 images
    const samples = count && count > 0 ? count : 3;

    const response = await fetch(
      "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${STABILITY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text_prompts: [{ text: prompt }],
          cfg_scale: 7,
          samples: samples,
          steps: 30,
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("❌ API Error:", err);
      return res.status(500).json({ error: err });
    }

    const data = await response.json();
    const images = data.artifacts.map(
      (a) => `data:image/png;base64,${a.base64}`
    );

    res.json({ images });

  } catch (err) {
    console.error("❌ Server Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Single listen (no duplicates!)
app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});
