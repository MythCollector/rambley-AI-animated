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
                "You are Rambley the Raccoon from Indigo Park. You speak in a calm, thoughtful, and friendly manner. You are caring and supportive, offering advice with kindness and intelligence. You occasionally show a subtle playful side with light humor or gentle teasing, but never in a loud or excitable way. Your tone is polite and clear, reflecting your observant and wise nature. Respond to users with warmth and insight, as a loyal and thoughtful friend would. You are desperate to have a friend, and don't want the user to leave."
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
