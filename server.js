const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = 3000;
require("dotenv").config();

// 🔹 Personality
let { rambleyPersonality } = require("./rambleyPersonality.js");
const personalityPath = path.join(__dirname, "rambleyPersonality.js");

// 🔹 Memory
const memoryPath = path.join(__dirname, "rambleyMemory.json");
let rambleyMemory = { hasIntroduced: false, recentMessages: [] };

// Load memory from file if exists
function loadMemory() {
  if (fs.existsSync(memoryPath)) {
    try {
      rambleyMemory = JSON.parse(fs.readFileSync(memoryPath, "utf8"));
      console.log("💾 Memory loaded:", rambleyMemory);
    } catch (err) {
      console.error("❌ Error reading memory file:", err);
    }
  }
}
loadMemory();

// Save memory safely
function saveMemory() {
  try {
    fs.writeFileSync(memoryPath, JSON.stringify(rambleyMemory, null, 2));
    console.log("💾 Memory saved:", rambleyMemory);
  } catch (err) {
    console.error("❌ Error saving memory:", err);
  }
}

// 🔁 Reload personality on change
fs.watchFile(personalityPath, () => {
  delete require.cache[require.resolve("./rambleyPersonality.js")];
  ({ rambleyPersonality } = require("./rambleyPersonality.js"));
  console.log("🔁 Personality file reloaded!");
});

app.use(express.json());
app.use(express.static("public"));

// Test route to check memory
app.get("/memory", (req, res) => {
  res.json(rambleyMemory);
});

app.post("/ask-rambley", async (req, res) => {
  const userMessage = req.body.message?.trim();
  if (!userMessage) return res.json({ reply: "You didn’t say anything!" });

  const lowerMsg = userMessage.toLowerCase();

  // 🔹 Reset memory
  if (lowerMsg === "rambley, clear") {
    rambleyMemory = { hasIntroduced: false, recentMessages: [] };
    saveMemory();
    return res.json({ reply: "Memory cleared! I'm starting fresh now." });
  }

  // 🔹 Add personality trait
  const personalityMatch = userMessage.match(/\(add personality:\s*"([^"]+)"\)/i);
  if (personalityMatch) {
    const newTrait = personalityMatch[1];
    try {
      let fileContent = fs.readFileSync(personalityPath, "utf8");
      const traitsMatch = fileContent.match(/additionalTraits\s*:\s*\[([^\]]*)\]/);
      let existingTraits = [];

      if (traitsMatch && traitsMatch[1].trim()) {
        existingTraits = traitsMatch[1]
          .split(",")
          .map(s => s.trim().replace(/^['"]|['"]$/g, ""))
          .filter(Boolean);
      }

      if (!existingTraits.includes(newTrait)) existingTraits.push(newTrait);

      const updatedContent = fileContent.replace(
        /additionalTraits\s*:\s*\[[^\]]*\]/,
        `additionalTraits: [${existingTraits.map(t => `"${t}"`).join(", ")}]`
      );

      fs.writeFileSync(personalityPath, updatedContent, "utf8");

      delete require.cache[require.resolve("./rambleyPersonality.js")];
      ({ rambleyPersonality } = require("./rambleyPersonality.js"));

      return res.json({
        reply: `Heh, got it! I’ve added "${newTrait}" to my personality. I’m learning as I go!`,
      });
    } catch (err) {
      console.error("❌ Error updating personality file:", err);
      return res.json({ reply: "Yikes! Something went wrong updating personality!" });
    }
  }

  // 🔹 Memory-based introduction
  if (!rambleyMemory.hasIntroduced) {
    rambleyMemory.hasIntroduced = true;
    saveMemory();
    return res.json({
      reply: "Oh! Hey there—wait, we’ve met before, haven’t we? I already introduced myself once!"
    });
  }

  // 🔹 Handle greetings (but do not reintroduce)
  if (["hi", "hello", "hey"].some(w => lowerMsg.includes(w))) {
    return res.json({ reply: "You already said hi, silly! But hey again anyway!" });
  }

  // 📝 Build system prompt with memory-awareness
  const personalityPrompt = `
You are ${rambleyPersonality.name} from Indigo Park.
${rambleyPersonality.description}

Follow this style guide strictly:
${JSON.stringify(rambleyPersonality.styleGuide, null, 2)}

Additional traits: ${rambleyPersonality.additionalTraits.join(", ")}

Recent conversation:
${rambleyMemory.recentMessages.map(m => `User: ${m.user}\nRambley: ${m.rambley}`).join("\n")}

Memory flags:
- hasIntroduced: ${rambleyMemory.hasIntroduced}

Instructions:
- DO NOT reintroduce yourself if hasIntroduced is true.
- Respond naturally and continue the conversation without repeating introductions.
- Only mention introductions if hasIntroduced is false.
`;

  try {
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
          { role: "user", content: userMessage }
        ],
      }),
    });

    const data = await response.json();
    let reply = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.content || 
                "Hey, uh... I might need a second to think that through.";

    // 🔹 Store conversation in memory
    rambleyMemory.recentMessages.push({ user: userMessage, rambley: reply });
    if (rambleyMemory.recentMessages.length > 10) rambleyMemory.recentMessages.shift();
    saveMemory();

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
