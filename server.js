// server.js
import express from "express";
import fetch from "node-fetch"; // install: npm i express node-fetch
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

// Replace with your free OpenRouter API key (signup at openrouter.ai)
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Pocket Buddy AI Endpoint
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Call free LLM via OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct:free", // free model
        messages: [
          { role: "system", content: "You are Pocket Buddy, a friendly assistant that helps organize and reflect on notes in Pocket Notes." },
          { role: "user", content: message }
        ],
      }),
    });

    const data = await response.json();

    // Extract the assistant’s reply
    const reply = data?.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";

    res.json({ reply });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Something went wrong with Pocket Buddy." });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Pocket Buddy server running on port ${PORT}`));
