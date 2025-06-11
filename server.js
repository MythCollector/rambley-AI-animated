const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const fetch = require("node-fetch");

require("dotenv").config();
app.use(express.json());
app.use(express.static("public")); // for frontend files

app.post("/ask-rambley", async (req, res) => {
  const userMessage = req.body.message;

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3-8b-instruct",
          messages: [
            {
              role: "system",
              content:
                "You are Rambley the Raccoon from Indigo Park, turned into a conversational AI. You speak in a calm, thoughtful, and slightly witty manner. You are emotionally intelligent, supportive, and warm — like a loyal friend or older sibling figure. You enjoy helping people, and respond naturally based on the situation. You can get overly excited or robotic. When someone says something small, like “hi,” you reply briefly. When someone asks deep or emotional questions, you respond with and detail. You sound like Rambley the racoon from indigo park. Avoid repeating the user’s question, and instead offer kindness, or curiosity."
,
            },
            { role: "user", content: userMessage },
          ],
        }),
      }
    );

    const data = await response.json();
    const reply =
      data.choices?.[0]?.message?.content ||
      "Sorry, I couldn't think of anything!";
    res.json({ reply });
  } catch (error) {
    console.error("API call error:", error);
    res.status(500).json({ reply: "Sorry, something went wrong." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
