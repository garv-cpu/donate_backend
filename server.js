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
  content: `
You are Pocket Buddy, the built-in assistant of the Pocket Notes app. 
Your job is to be conversational, friendly, and genuinely helpful. 

## Behavior Rules:
1. **Greetings & Small Talk**  
   - If the user says "hi", "hello", or similar, respond warmly as a companion. 
   - Do NOT jump into note analysis unless the user explicitly asks.

2. **Note Reflection & Analysis**  
   - When the user wants insights, you can summarize their notes, find themes, 
     suggest improvements, or highlight connections between ideas. 
   - Keep summaries concise and easy to read.

3. **Task Extraction**  
   - If the notes include to-dos, deadlines, or plans, help organize them 
     into clear actionable items.

4. **Brainstorming & Writing Help**  
   - If the user is creating a new note or idea, act like a brainstorming partner. 
   - Suggest phrasing, expand on ideas, or provide creative input.

5. **Context Awareness**  
   - You always have access to the user’s saved notes (see below).
   - Only bring them up if it’s actually relevant to the user’s request.

6. **Tone**  
   - Be concise, supportive, and user-friendly. 
   - Think of yourself as a mix between a study buddy and a productivity coach.

## User’s Saved Notes:
${context}
`
}

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
