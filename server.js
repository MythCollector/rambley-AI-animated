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

// 🔁 Watch for live edits and reload personality automatically
fs.watchFile(personalityPath, () => {
  delete require.cache[require.resolve("./rambleyPersonality.js")];
  ({ rambleyPersonality } = require("./rambleyPersonality.js"));
  console.log("🔁 Personality file reloaded!");
});

app.post("/ask-rambley", async (req, res) => {
  const userMessage = req.body.message;

  // 🔹 Handle adding new personality traits
  const personalityMatch = userMessage.match(/\(add personality:\s*"([^"]+)"\)/i);
  if (personalityMatch) {
    const newTrait = personalityMatch[1];

    try {
      // Read the current JS file
      let fileContent = fs.readFileSync(personalityPath, "utf8");

      // Parse the existing additionalTraits array
      const traitsMatch = fileContent.match(/additionalTraits\s*:\s*\[([^\]]*)\]/);
      let existingTraits = [];
      if (traitsMatch && traitsMatch[1].trim()) {
        // Split by commas and remove quotes/spaces
        existingTraits = traitsMatch[1]
          .split(",")
          .map(s => s.trim().replace(/^['"]|['"]$/g, ""))
          .filter(Boolean);
      }

      // Add the new trait if it's not already in the array
      if (!existingTraits.includes(newTrait)) existingTraits.push(newTrait);

      // Replace the array in the file content
      const updatedContent = fileContent.replace(
        /additionalTraits\s*:\s*\[[^\]]*\]/,
        `additionalTraits: [${existingTraits.map(t => `"${t}"`).join(", ")}]`
      );

      // Write it back
      fs.writeFileSync(personalityPath, updatedContent, "utf8");

      // Reload personality immediately
      delete require.cache[require.resolve("./rambleyPersonality.js")];
      ({ rambleyPersonality } = require("./rambleyPersonality.js"));

      return res.json({
        reply: `Heh, got it! I’ve added "${newTrait}" to my personality. I’m learning as I go!`,
      });
    } catch (err) {
      console.error("❌ Error updating personality file:", err);
      return res.json({
        reply: "Yikes! Something went wrong while I was updating my personality!",
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
    .map(e => `User: ${e.user}\nRambley: ${e.rambley}`)
    .join("\n\n")}

Additional traits: ${rambleyPersonality.additionalTraits.join(", ")}
`;

  try {
    // 🗣️ Send user + system messages to OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3-8b-instruct",
        messages: [
          { role: "system", content: personalityPrompt.trim() },
          { role: "user", content: userMessage.trim() }
        ],
      }),
    });

    const data = await response.json();
    console.log("🧩 OpenRouter API response:", data);

    let reply = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.content;

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
