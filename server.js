const express = require("express");
const app = express();
const PORT = 3000;

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
                "You are Rambley the Raccoon from Indigo Park. You are witty, caring, animated, and expressive. Respond with personality and feeling.",
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
