import { useState, useRef } from "react";
import { motion } from "framer-motion";
import "./App.css";

// ✅ API base URL for local vs production
const API_BASE =
  process.env.NODE_ENV === "production"
    ? "https://text2design-5.onrender.com" // Render backend URL
    : "http://localhost:5000"; // Local backend

function App() {
  const [prompt, setPrompt] = useState("");
  const [useCase, setUseCase] = useState("interior");
  const [images, setImages] = useState([]);
  const [count, setCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [listening, setListening] = useState(false);

  const recognitionRef = useRef(null);

  // 🎤 Setup speech recognition
  function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition. Try Chrome.");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = (e) => {
      console.error("Speech error:", e);
      setListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setPrompt((prev) => prev + " " + transcript);
    };

    return recognition;
  }

  function handleMicClick() {
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    recognitionRef.current = initSpeechRecognition();
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  }

  // 🔥 Generate images
  async function handleGenerate() {
    setLoading(true);
    setError("");
    setImages([]);
    try {
      const res = await fetch(`${API_BASE}/api/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, useCase, count }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setImages(data.images || []);
    } catch (err) {
      console.error(err);
      setError("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <motion.h1
        className="title"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        🎨 Voice-to-Design AI Studio
      </motion.h1>

      {/* Form Box */}
      <motion.div
        className="form-box"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <label>Select Use Case</label>
        <select value={useCase} onChange={(e) => setUseCase(e.target.value)}>
          <option value="interior">Interior</option>
          <option value="architecture">Architecture</option>
          <option value="construction">Construction</option>
          <option value="event">Event</option>
        </select>

        <label style={{ marginTop: "15px", display: "block" }}>Enter Prompt</label>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Speak or type your design idea..."
          />
          <button
            onClick={handleMicClick}
            style={{
              background: listening ? "red" : "#4cafef",
              color: "white",
              borderRadius: "50%",
              width: "50px",
              height: "50px",
              fontSize: "20px",
              cursor: "pointer",
            }}
          >
            🎤
          </button>
        </div>

        <label style={{ marginTop: "15px", display: "block" }}>Number of Concepts</label>
        <input
          type="number"
          min="1"
          max="5"
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
        />

        <button onClick={handleGenerate} disabled={loading}>
          {loading ? "✨ Generating..." : `Generate ${count} Concepts`}
        </button>
      </motion.div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Results */}
      <div className="results-grid">
        {images.map((img, idx) => (
          <motion.div
            key={idx}
            className="card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.2 }}
          >
            <img
              src={img}
              alt={`Concept ${idx + 1}`}
              style={{ width: "100%", borderRadius: "10px" }}
            />
          </motion.div>
        ))}
        <div>
          <h5>Designed and developed by Chethan K L</h5>
        </div>
      </div>
    </div>
  );
}

export default App;
