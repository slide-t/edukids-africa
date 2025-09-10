/* ================================
   GLOBAL VARIABLES
================================ */
let subject = decodeURIComponent(new URLSearchParams(window.location.search).get("subject") || "Mathematics");
let subjectData = {};
let availableLevels = [];
let currentLevelIndex = 0;
let score = 0;
let currentQuestionIndex = 0;
let timer;
let secondsElapsed = 0;
const progressKey = `${subject}_progress`;

// DOM elements
const modal = document.getElementById("instructionModal");
const questionText = document.getElementById("question-text");
const optionsContainer = document.getElementById("options-container");
const scoreBoard = document.getElementById("score");
const levelIndicator = document.getElementById("level");
const clockDisplay = document.getElementById("clock");
const audioCorrect = document.getElementById("audio-correct");
const audioWrong = document.getElementById("audio-wrong");

/* ================================
   LOAD QUESTIONS
================================ */
async function loadSubjectData() {
  subject = decodeURIComponent(new URLSearchParams(window.location.search).get("subject") || "Mathematics");
  const category = decodeURIComponent(new URLSearchParams(window.location.search).get("category") || "");

  // 1. Try category-specific file first: ./questions/<category>/<subject>.json
  if (category) {
    const path = `./questions/${category}/${subject}.json`;
    try {
      const res = await fetch(path);
      if (res.ok) {
        subjectData = await res.json();
        console.log(`✅ Loaded ${subject} from ${path}`);
        setupLevels();
        return true;
      } else {
        console.warn(`⚠️ Could not load ${path}, status: ${res.status}`);
      }
    } catch (err) {
      console.warn(`⚠️ Error loading ${path}, falling back...`, err);
    }
  }

  // 2. Fallback to global ./questions.json
  try {
    const res = await fetch("./questions.json");
    if (!res.ok) throw new Error("questions.json not found");
    const data = await res.json();

    if (category && data[category] && data[category][subject]) {
      subjectData = data[category][subject];
    } else if (data[subject]) {
      subjectData = data[subject];
    } else {
      // fallback: scan all categories
      for (const k of Object.keys(data)) {
        if (typeof data[k] === "object" && data[k][subject]) {
          subjectData = data[k][subject];
          break;
        }
      }
    }

    if (!subjectData || Object.keys(subjectData).length === 0) {
      console.error("No question data found for subject:", subject);
      return false;
    }

    console.log(`✅ Loaded ${subject} from fallback ./questions.json`);
    setupLevels();
    return true;
  } catch (err) {
    console.error("❌ Failed to load questions.json", err);
    return false;
  }
}

/* ================================
   SETUP LEVELS
================================ */
function setupLevels() {
  availableLevels = Object.keys(subjectData)
    .filter(k => /^Level\s*\d+/i.test(k))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)[0], 10);
      const nb = parseInt(b.match(/\d+/)[0], 10);
      return na - nb;
    });

  if (availableLevels.length === 0) {
    alert(`Sorry, no playable levels found for ${subject}.`);
    return;
  }

  // If only one level exists
  if (availableLevels.length === 1) {
    alert(`You only have ${availableLevels[0]} to play for ${subject}.`);
  } else {
    // Check for missing levels in sequence
    const nums = availableLevels.map(l => parseInt(l.match(/\d+/)[0], 10));
    const missing = [];
    for (let i = nums[0]; i <= nums[nums.length - 1]; i++) {
      if (!nums.includes(i)) {
        missing.push(i);
      }
    }
    if (missing.length > 0) {
      alert(
        `Note: Level${missing.length > 1 ? "s" : ""} ${missing.join(", ")} ${
          missing.length > 1 ? "are" : "is"
        } missing. You can only play ${availableLevels.join(", ")} for ${subject}.`
      );
    }
  }

  // Handle progress
  const progress = JSON.parse(localStorage.getItem(progressKey) || "{}");
  let firstNotPassed = availableLevels.findIndex(l => !progress[l]);
  currentLevelIndex = (firstNotPassed === -1) ? availableLevels.length : firstNotPassed;
}

/* ================================
   QUIZ FLOW
================================ */
function startLevel() {
  if (currentLevelIndex >= availableLevels.length) {
    alert("🎉 You’ve completed all levels!");
    return;
  }

  const currentLevel = availableLevels[currentLevelIndex];
  levelIndicator.textContent = currentLevel;
  score = 0;
  currentQuestionIndex = 0;
  displayQuestion();
}

function displayQuestion() {
  const currentLevel = availableLevels[currentLevelIndex];
  const questions = subjectData[currentLevel];

  if (currentQuestionIndex >= questions.length) {
    finishLevel();
    return;
  }

  const q = questions[currentQuestionIndex];
  questionText.textContent = q.question;
  optionsContainer.innerHTML = "";

  q.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.className = "option-btn";
    btn.onclick = () => checkAnswer(opt, q.answer);
    optionsContainer.appendChild(btn);
  });
}

function checkAnswer(selected, correct) {
  if (selected === correct) {
    score++;
    audioCorrect.play();
  } else {
    audioWrong.play();
  }
  currentQuestionIndex++;
  displayQuestion();
}

function finishLevel() {
  alert(`Level complete! Your score: ${score}`);
  const currentLevel = availableLevels[currentLevelIndex];

  // Save progress
  const progress = JSON.parse(localStorage.getItem(progressKey) || "{}");
  progress[currentLevel] = true;
  localStorage.setItem(progressKey, JSON.stringify(progress));

  // Move to next level
  currentLevelIndex++;
  startLevel();
}

/* ================================
   CLOCK
================================ */
function startClock() {
  setInterval(() => {
    secondsElapsed++;
    const minutes = Math.floor(secondsElapsed / 60);
    const seconds = secondsElapsed % 60;
    if (clockDisplay) {
      clockDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
  }, 1000);
}

/* ================================
   DOM READY
================================ */
document.addEventListener("DOMContentLoaded", async () => {
  startClock();

  const ok = await loadSubjectData();
  if (!ok) {
    if (questionText) questionText.textContent = `No quiz data found for "${subject}".`;
    return;
  }

  if (modal) {
    // Auto-close modal after 3 seconds, then start quiz
    setTimeout(() => {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
      startLevel();
    }, 3000);
  } else {
    // If no modal exists, start quiz immediately
    startLevel();
  }
});
