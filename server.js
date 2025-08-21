// server.js
import express from "express";
import fetch from "node-fetch"; // npm i express node-fetch
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

// Replace with your free OpenRouter API key
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Pocket Buddy Chat
app.post("/chat", async (req, res) => {
  try {
    const { message, notes } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Prepare context from notes (summarize titles + categories + content)
    let context = "";
    if (Array.isArray(notes) && notes.length > 0) {
      context = notes
        .map(
          (n, idx) =>
            `Note ${idx + 1} [${n.category || "General"}]: ${n.title}\n${
              n.content || ""
            }`
        )
        .join("\n\n");
    }

    // Call LLM via OpenRouter
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "mistralai/mistral-7b-instruct:free", // free tier model
          messages: [
            {
              role: "system",
              content:
                "You are Pocket Buddy, a helpful assistant inside the Pocket Notes app. " +
                "You help users reflect on their notes, summarize them, extract tasks, " +
                "and connect related ideas. Always stay concise and user-friendly.",
            },
            {
              role: "system",
              content: `Here are the user’s saved notes:\n${context}`,
            },
            { role: "user", content: message },
          ],
        }),
      }
    );

    const data = await response.json();
    console.log("OpenRouter response:", data); // 👀 log full response

    if (data.error) {
      return res
        .status(500)
        .json({ error: data.error.message || "OpenRouter error" });
    }

    const reply =
      data?.choices?.[0]?.message?.content ||
      "Sorry, I couldn’t generate a response.";

    res.json({ reply });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Something went wrong with Pocket Buddy." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅ Pocket Buddy server running on port ${PORT}`)
);
