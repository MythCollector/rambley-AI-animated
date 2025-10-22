const express = require("express");
const fetch = require("node-fetch");
const app = express();
const PORT = 3000;
require("dotenv").config();

// Import Rambley's personality from a JS module
const { rambleyPersonality } = require("./rambleyPersonality.js");

app.use(express.json());
app.use(express.static("public")); // for your frontend files

app.post("/ask-rambley", async (req, res) => {
  const userMessage = req.body.message;

  try {
    // Build a formatted personality string
    const personalityPrompt = `
You are ${rambleyPersonality.name} from Indigo Park.
${rambleyPersonality.description}

Follow this style guide strictly:
${JSON.stringify(rambleyPersonality.styleGuide, null, 2)}

Here are examples of how you talk:
${rambleyPersonality.examples
  .map(e => `User: ${e.user}\nRambley: ${e.rambley}`)
  .join("\n\n")}
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3-8b-instruct",
        messages: [
          { role: "system", content: personalityPrompt },
          { role: "user", content: userMessage }
        ]
      })
    });

    const data = await response.json();
    console.log("OpenRouter API response:", data);

    // Safely grab the AI's reply
    const reply =
      data.choices?.[0]?.message?.content ||
      data.choices?.[0]?.content ||
      "Hmm… I’m not sure what to say!";

    res.json({ reply });
  } catch (err) {
    console.error("Error calling OpenRouter API:", err);
    res.json({ reply: "Oops! Something went wrong while thinking..." });
  }
});

app.listen(PORT, () => {
  console.log(`Rambley AI server running on http://localhost:${PORT}`);
});
