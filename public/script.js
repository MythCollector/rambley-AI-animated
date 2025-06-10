const chatBox = document.getElementById("chat-box");
const rambleyImg = document.getElementById("rambley-img");
const input = document.getElementById("user-input");

function addMessage(sender, text) {
  const msg = document.createElement("div");
  msg.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  addMessage("You", message);
  input.value = "";

  rambleyImg.src = "thinking.png"; // show thinking animation

  const res = await fetch("/ask-rambley", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  const data = await res.json();
  const reply = data.reply;
  addMessage("Rambley", reply);

  rambleyImg.src = "happy.png"; // show emotional reaction

  // Speak the reply
  const utter = new SpeechSynthesisUtterance(reply);
  utter.voice = speechSynthesis
    .getVoices()
    .find((v) => v.name.includes("Google") || v.lang === "en-US");
  speechSynthesis.speak(utter);

  // Return to idle after speaking
  utter.onend = () => {
    rambleyImg.src = "idle.png";
  };
}
