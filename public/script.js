const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");

let rambleyMemory = { hasIntroduced: false }; // optionally load from server

// --- CHAT FUNCTIONS ---
function addMessage(sender, text) {
  const msg = document.createElement("div");
  msg.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// --- ANIMATION HELPERS ---
function playAnimation(type, loop = true) {
  const totalFrames = animations[type].length;
  let frameIndex = 0;
  
  // clear previous interval if exists
  if (window.rambleyAnimInterval) clearInterval(window.rambleyAnimInterval);

  window.rambleyAnimInterval = setInterval(() => {
    document.body.style.background = `url('${animations[type][frameIndex]}') center center / cover no-repeat`;
    frameIndex++;
    if (frameIndex >= totalFrames) {
      if (loop) frameIndex = 0;
      else clearInterval(window.rambleyAnimInterval);
    }
  }, 100); // 10 fps, adjust as needed
}

// --- PRELOAD FRAMES ---
// --- ANIMATION SYSTEM ---

  const animations = {
  idle: [
    "/frames/idle/frame_001.png",
    "/frames/idle/frame_002.png",
    "/frames/idle/frame_003.png",
    "/frames/idle/frame_004.png",
    "/frames/idle/frame_005.png",
    "/frames/idle/frame_006.png",
    "/frames/idle/frame_007.png",
    "/frames/idle/frame_008.png",
    "/frames/idle/frame_009.png",
    "/frames/idle/frame_010.png",
    "/frames/idle/frame_011.png",
    "/frames/idle/frame_012.png",
    "/frames/idle/frame_013.png",
    "/frames/idle/frame_014.png",
    "/frames/idle/frame_015.png",
    "/frames/idle/frame_016.png",
    "/frames/idle/frame_017.png",
    "/frames/idle/frame_018.png",
    "/frames/idle/frame_019.png",
    "/frames/idle/frame_020.png",
    "/frames/idle/frame_021.png",
    "/frames/idle/frame_022.png",
    "/frames/idle/frame_023.png",
    "/frames/idle/frame_024.png",
    "/frames/idle/frame_025.png",
    "/frames/idle/frame_026.png",
    "/frames/idle/frame_027.png",
    "/frames/idle/frame_028.png",
    "/frames/idle/frame_029.png",
    "/frames/idle/frame_030.png",
    "/frames/idle/frame_031.png",
    "/frames/idle/frame_032.png",
    "/frames/idle/frame_033.png",
    "/frames/idle/frame_034.png",
    "/frames/idle/frame_035.png",
    "/frames/idle/frame_036.png",
    "/frames/idle/frame_037.png",
    "/frames/idle/frame_038.png",
    "/frames/idle/frame_039.png",
    "/frames/idle/frame_040.png",
    "/frames/idle/frame_041.png",
    "/frames/idle/frame_042.png",
    "/frames/idle/frame_043.png",
    "/frames/idle/frame_044.png",
    "/frames/idle/frame_045.png",
    "/frames/idle/frame_046.png",
    "/frames/idle/frame_047.png",
    "/frames/idle/frame_048.png",
    "/frames/idle/frame_049.png",
    "/frames/idle/frame_050.png",
    "/frames/idle/frame_051.png",
    "/frames/idle/frame_052.png",
    "/frames/idle/frame_053.png",
    "/frames/idle/frame_054.png",
    "/frames/idle/frame_055.png",
    "/frames/idle/frame_056.png",
    "/frames/idle/frame_057.png",
    "/frames/idle/frame_058.png",
    "/frames/idle/frame_059.png",
    "/frames/idle/frame_060.png",
    "/frames/idle/frame_061.png",
    "/frames/idle/frame_062.png",
    "/frames/idle/frame_063.png",
    "/frames/idle/frame_064.png",
    "/frames/idle/frame_065.png",
    "/frames/idle/frame_066.png",
    "/frames/idle/frame_067.png",
    "/frames/idle/frame_068.png",
    "/frames/idle/frame_069.png",
    "/frames/idle/frame_070.png",
    "/frames/idle/frame_071.png"
  ],
  talking: [
    "/frames/talking/frame_001.png",
    "/frames/talking/frame_002.png",
    "/frames/talking/frame_003.png",
    "/frames/talking/frame_004.png",
    "/frames/talking/frame_005.png",
    // … continue with all your talking frames
  ],
  welcome: [
    "/frames/welcome/frame_001.png",
    "/frames/welcome/frame_002.png",
    "/frames/welcome/frame_003.png",
    "/frames/welcome/frame_004.png",
    "/frames/welcome/frame_005.png",
    // … continue with all your welcome frames
  ]
};



function preloadAnimationFrames(name, total, pathPattern) {
  for (let i = 1; i <= total; i++) {
    animations[name].push(pathPattern.replace('%03d', String(i).padStart(3, '0')));
  }
}

// Example preloading
preloadAnimationFrames('idle', 71, 'frames/idle/frame_%03d.png');
preloadAnimationFrames('talking', 40, 'frames/talking/frame_%03d.png');
preloadAnimationFrames('welcome', 60, 'frames/welcome/frame_%03d.png');

// start idle loop
playAnimation('idle');

// --- SEND MESSAGE ---
async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  addMessage("You", message);
  input.value = "";

  if (!rambleyMemory.hasIntroduced) {
    rambleyMemory.hasIntroduced = true;
    playAnimation('welcome', false); // welcome plays once
  } else {
    playAnimation('talking', false); // talking plays once
  }

  // fetch response
  const res = await fetch("/ask-rambley", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  });

  const data = await res.json();
  const reply = data.reply;
  addMessage("Rambley", reply);

  // back to idle
  playAnimation('idle');
}
