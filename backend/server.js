import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

const PORT = 5000;
const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
console.log("Stability API Key:", STABILITY_API_KEY);

// ✅ Root route for testing
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

    // default to 3 images if not specified
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
          steps: 30
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(err);
    }

    const data = await response.json();
    const images = data.artifacts.map(
      (a) => `data:image/png;base64,${a.base64}`
    );

    res.json({ images });

  } catch (err) {
    console.error("❌ Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () =>
  console.log(`🚀 Backend running at http://localhost:${PORT}`)
);
