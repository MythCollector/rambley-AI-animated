const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = 3000;
require("dotenv").config();

let { rambleyPersonality } = require("./rambleyPersonality.js");
const personalityPath = path.join(__dirname, "rambleyPersonality.js");

app.use(express.json());
app.use(express.static("public"));

// 🔁 Watch for live file edits and reload Rambley’s personality automatically
fs.watchFile(personalityPath, () => {
  delete require.cache[require.resolve("./rambleyPersonality.js")];
  ({ rambleyPersonality } = require("./rambleyPersonality.js"));
  console.log("🔁 Personality file reloaded automatically!");
});

app.post("/ask-rambley", async (req, res) => {
  const userMessage = req.body.message;

  // 🔹 Handle live personality updates
  const personalityMatch = userMessage.match(/\(add personality:\s*"([^"]+)"\)/i);
  if (personalityMatch) {
    const newTrait = personalityMatch[1];

    try {
      // Read current personality JS file
      const fileContent = fs.readFileSync(personalityPath, "utf8");

      // Evaluate the exported object safely
      const rambleyModule = {};
      eval(fileContent.replace(/export const /, "rambleyModule."));

      // Add new trait to the uses array if not already present
      if (!rambleyModule.rambleyPersonality.styleGuide.uses.includes(newTrait)) {
        rambleyModule.rambleyPersonality.styleGuide.uses.push(newTrait);
      }

      // Convert back to JS string
      const newFileContent = `export const rambleyPersonality = ${JSON.stringify(
        rambleyModule.rambleyPersonality,
        null,
        2
      )};`;

      fs.writeFileSync(personalityPath, newFileContent, "utf8");

      // Reload personality immediately
      delete require.cache[require.resolve("./rambleyPersonality.js")];
      ({ rambleyPersonality } = require("./rambleyPersonality.js"));

      return res.json({
        reply: `Heh, got it! I’ve added "${newTrait}" to my personality — guess I’m learning as I go!`,
      });
    } catch (err) {
      console.error("❌ Error updating personality file:", err);
      return res.json({
        reply: "Yikes! Something went wrong while I was trying to update my personality!",
      });
    }
  }

  // 🧠 Build Rambley's system personality prompt
  const personalityPrompt = `
You are ${rambleyPersonality.name} from Indigo Park.
${rambleyPersonality.description}

Follow this style guide strictly:
${JSON.stringify(rambleyPersonality.styleGuide, null, 2)}

Here are examples of how you talk:
${rambleyPersonality.examples
    .map((e) => `User: ${e.user}\nRambley: ${e.rambley}`)
    .join("\n\n")}
`;

  try {
    // 🗣️ Send user + system messages to OpenRouter
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
            { role: "system", content: personalityPrompt.trim() },
            { role: "user", content: userMessage.trim() },
          ],
        }),
      }
    );

    const data = await response.json();
    console.log("🧩 OpenRouter API response:", data);

    // 🧾 Safely access the reply
    let reply = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.content;

    // Default fallback
    if (!reply || reply.trim() === "") {
      reply = "Hey, uh... I might need a moment to think that one over.";
    }

    res.json({ reply });
  } catch (err) {
    console.error("❌ Error calling OpenRouter API:", err);
    res.json({ reply: "Something went wrong trying to think that through..." });
  }
});

app.listen(PORT, () => {
  console.log("API key loaded?", !!process.env.OPENROUTER_KEY);
  console.log(`🚀 Rambley AI server running on http://localhost:${PORT}`);
});
