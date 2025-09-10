// ================================
// quiz.js - EduKids Africa (full)
// ================================

/* Sounds */
const correctSound = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");
const wrongSound = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");
const levelUpSound = new Audio("https://actions.google.com/sounds/v1/cartoon/congratulations.ogg");
const gameOverSound = new Audio("https://actions.google.com/sounds/v1/cartoon/boing.ogg");

/* DOM elements */
const questionText = document.getElementById("questionText");
const optionsContainer = document.getElementById("optionsContainer");
const scoreDisplay = document.getElementById("scoreDisplay");
const levelDisplay = document.getElementById("levelDisplay");
const progressBar = document.getElementById("progressBar");
const clockElement = document.getElementById("clock");
const modal = document.getElementById("instructionModal");

/* End modal elements (must exist in HTML) */
const endModal = document.getElementById("endModal");
const endTitle = document.getElementById("endTitle");
const endMessage = document.getElementById("endMessage");
const retryBtn = document.getElementById("retryBtn");
const nextBtn = document.getElementById("nextBtn");

/* State */
let subject = decodeURIComponent(new URLSearchParams(window.location.search).get("subject") || "Mathematics");
let subjectData = {};              // loaded subject object from questions.json
let availableLevels = [];          // e.g. ["Level 1","Level 2","Level 3"]
let currentLevelIndex = 0;         // index into availableLevels
let questions = [];                // questions for current level
let currentQuestionIndex = 0;
let score = 0;
const PASS_PERCENT = 75;
const progressKey = `EduKidsProgress_${subject}`; // localStorage key

/* timer for each question */
let timerInterval;
let timeLeft = 15;
const circle = document.getElementById("timerCircle");
const timerText = document.getElementById("timerText");
const circleLength = 220; // circumference

function startTimer() {
  clearInterval(timerInterval);
  timeLeft = 15;
  timerText.textContent = timeLeft;
  circle.style.strokeDasharray = circleLength;
  circle.style.strokeDashoffset = 0;

  timerInterval = setInterval(() => {
    timeLeft--;
    timerText.textContent = timeLeft;

    const progress = (timeLeft / 15) * circleLength;
    circle.style.strokeDashoffset = circleLength - progress;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      handleTimeout();
    }
  }, 1000);
}

function handleTimeout() {
  currentQuestionIndex++;
  renderQuestion();
}

/* Utility: start clock */
function startClock() {
  setInterval(() => {
    const now = new Date();
    if (clockElement) clockElement.textContent = now.toLocaleTimeString();
  }, 1000);
}

/* Utility: Fisher-Yates shuffle */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/* Load questions data dynamically */
async function loadSubjectData() {
  try {
    subject = decodeURIComponent(new URLSearchParams(window.location.search).get("subject") || "Mathematics");
    const category = decodeURIComponent(new URLSearchParams(window.location.search).get("category") || "");

    // 1. Try category-specific file first: questions/<category>/<subject>.json
    if (category) {
      const path = `questions/${category}/${subject}.json`;
      try {
        const res = await fetch(path);
        if (res.ok) {
          subjectData = await res.json();
          console.log(`✅ Loaded ${subject} from ${path}`);
          setupLevels();
          return true;
        }
      } catch (err) {
        console.warn(`⚠️ Could not load ${path}, falling back...`, err);
      }
    }

    // 2. Fallback to global questions.json
    const res = await fetch("questions.json");
    if (!res.ok) throw new Error("questions.json not found");
    const data = await res.json();

    if (category && data[category] && data[category][subject]) {
      subjectData = data[category][subject];
    } else if (data[subject]) {
      subjectData = data[subject];
    } else {
      for (const k of Object.keys(data)) {
        if (typeof data[k] === "object" && data[k][subject]) {
          subjectData = data[k][subject];
          break;
        }
      }
    }

    if (!subjectData || Object.keys(subjectData).length === 0) {
      alert(`❌ No question data found for ${subject}.`);
      return false;
    }

    console.log(`✅ Loaded ${subject} from fallback questions.json`);
    setupLevels();
    return true;
  } catch (err) {
    console.error("❌ Failed to load questions data:", err);
    alert("Sorry, we could not load your questions. Please try again later.");
    return false;
  }
}

/* Extract available levels */
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

  if (availableLevels.length === 1) {
    alert(`You only have ${availableLevels[0]} to play for ${subject}.`);
  } else {
    const nums = availableLevels.map(l => parseInt(l.match(/\d+/)[0], 10));
    const missing = [];
    for (let i = nums[0]; i <= nums[nums.length - 1]; i++) {
      if (!nums.includes(i)) missing.push(i);
    }
    if (missing.length > 0) {
      alert(
        `Note: Level${missing.length > 1 ? "s" : ""} ${missing.join(", ")} ${
          missing.length > 1 ? "are" : "is"
        } missing. You can only play ${availableLevels.join(", ")} for ${subject}.`
      );
    }
  }

  const progress = JSON.parse(localStorage.getItem(progressKey) || "{}");
  let firstNotPassed = availableLevels.findIndex(l => !progress[l]);
  currentLevelIndex = (firstNotPassed === -1) ? availableLevels.length : firstNotPassed;
}

/* Load and prepare the questions for the current level */
function prepareLevelQuestions() {
  if (currentLevelIndex < 0 || currentLevelIndex >= availableLevels.length) {
    questions = [];
    return;
  }
  const levelKey = availableLevels[currentLevelIndex];
  const raw = subjectData[levelKey] || [];
  questions = raw.map(q => ({
    question: q.question,
    options: Array.isArray(q.options) ? [...q.options] : [],
    answer: q.answer || q.correct || q.correctAnswer || ""
  }));

  questions = shuffle(questions).map(q => {
    if (!q.options.includes(q.answer)) q.options.push(q.answer);
    q.options = shuffle([...q.options]);
    return q;
  });
}

/* Render a question & its shuffled options */
function renderQuestion() {
  if (!questions.length || currentQuestionIndex >= questions.length) {
    endLevel();
    return;
  }

  const q = questions[currentQuestionIndex];
  if (questionText) questionText.textContent = q.question;
  if (optionsContainer) {
    optionsContainer.innerHTML = "";
    q.options.forEach(opt => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "w-full text-left px-4 py-3 rounded-lg bg-purple-100 hover:bg-purple-200 transition";
      btn.textContent = opt;
      btn.onclick = () => onSelectOption(opt, btn);
      optionsContainer.appendChild(btn);
    });
  }
  updateScoreBoard();
  startTimer();
}

/* When user selects an option */
function onSelectOption(selectedText, btnEl) {
  const q = questions[currentQuestionIndex];
  const correct = q.answer;

  if (selectedText === correct) {
    score++;
    if (btnEl) btnEl.classList.add("bg-green-500", "text-white");
    correctSound.play();
  } else {
    if (btnEl) btnEl.classList.add("bg-red-500", "text-white");
    wrongSound.play();
    const correctBtn = [...optionsContainer.children].find(child => child.textContent === correct);
    if (correctBtn) correctBtn.classList.add("bg-green-500", "text-white");
  }

  [...optionsContainer.children].forEach(c => c.disabled = true);

  setTimeout(() => {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
      renderQuestion();
    } else {
      endLevel();
    }
  }, 900);
}

/* Update score / progress UI */
function updateScoreBoard() {
  if (!questions || questions.length === 0) {
    if (scoreDisplay) scoreDisplay.textContent = `Score: 0/0`;
    if (progressBar) progressBar.style.width = `0%`;
    return;
  }
  if (scoreDisplay) scoreDisplay.textContent = `Score: ${score}/${questions.length}`;
  const pct = Math.round(((currentQuestionIndex) / questions.length) * 100);
  if (progressBar) progressBar.style.width = `${pct}%`;
}

/* Show end modal (pass/fail) */
function showEndModal(passed, totalCorrect, totalQuestions) {
  if (!endModal) return;
  if (passed) {
    levelUpSound.play();
    endTitle.textContent = `🎉 Level Passed!`;
    const percent = Math.round((totalCorrect / totalQuestions) * 100);
    endMessage.textContent = `You scored ${totalCorrect}/${totalQuestions} (${percent}%). Well done — next level unlocked.`;
    retryBtn.classList.add("hidden");
    nextBtn.classList.remove("hidden");
  } else {
    gameOverSound.play();
    const percent = Math.round((totalCorrect / totalQuestions) * 100);
    endTitle.textContent = `❌ Level Failed`;
    endMessage.textContent = `You scored ${totalCorrect}/${totalQuestions} (${percent}%). You need ${PASS_PERCENT}% to pass. Try again.`;
    retryBtn.classList.remove("hidden");
    nextBtn.classList.add("hidden");
  }
  endModal.classList.remove("hidden");
  endModal.classList.add("flex");
}

/* Hide end modal */
function hideEndModal() {
  if (!endModal) return;
  endModal.classList.add("hidden");
  endModal.classList.remove("flex");
}

/* Save level passed to localStorage */
function saveLevelPassed(levelKey) {
  const obj = JSON.parse(localStorage.getItem(progressKey) || "{}");
  obj[levelKey] = true;
  localStorage.setItem(progressKey, JSON.stringify(obj));
}

/* Determine and start the current level */
function startLevel() {
  if (currentLevelIndex >= availableLevels.length) {
    if (!endModal) {
      alert(`🎓 You have completed all levels for ${subject}!`);
      return;
    }
    endTitle.textContent = `👑 Course Completed!`;
    endMessage.textContent = `You have completed all available levels for ${subject}. Great job!`;
    retryBtn.classList.add("hidden");
    nextBtn.classList.add("hidden");
    endModal.classList.remove("hidden");
    endModal.classList.add("flex");
    return;
  }

  const levelKey = availableLevels[currentLevelIndex];
  if (levelDisplay) levelDisplay.textContent = levelKey;
  prepareLevelQuestions();
  currentQuestionIndex = 0;
  score = 0;
  renderQuestion();
}

function endLevel() {
  const totalQuestions = questions.length || 1;
  const percent = (score / totalQuestions) * 100;
  const passed = percent >= PASS_PERCENT;
  const levelKey = availableLevels[currentLevelIndex];

  const summaryMessage = document.getElementById("summaryMessage");
  const retryBtn = document.getElementById("retryBtn");
  const nextLevelBtn = document.getElementById("nextLevelBtn");
  const helpModal = document.getElementById("eduHelpModal");

  if (summaryMessage) {
    summaryMessage.textContent = `You scored ${score}/${totalQuestions} (${Math.round(percent)}%).`;
  }

  if (passed) {
    saveLevelPassed(levelKey);
    if (retryBtn) retryBtn.classList.add("hidden");
    if (nextLevelBtn) nextLevelBtn.classList.remove("hidden");
  } else {
    if (retryBtn) retryBtn.classList.remove("hidden");
    if (nextLevelBtn) nextLevelBtn.classList.add("hidden");
  }

  if (helpModal) {
    helpModal.classList.remove("hidden");
    helpModal.classList.add("flex");
  }

  clearInterval(timerInterval);
}

/* Button handlers */
if (retryBtn) {
  retryBtn.addEventListener("click", () => {
    hideEndModal();
    prepareLevelQuestions();
    currentQuestionIndex = 0;
    score = 0;
    renderQuestion();
  });
}

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    hideEndModal();
    currentLevelIndex++;
    startLevel();
  });
}

const retrySummaryBtn = document.getElementById("retryBtn");
const nextLevelSummaryBtn = document.getElementById("nextLevelBtn");

if (retrySummaryBtn) {
  retrySummaryBtn.addEventListener("click", () => {
    const helpModal = document.getElementById("eduHelpModal");
    if (helpModal) {
      helpModal.classList.add("hidden");
      helpModal.classList.remove("flex");
    }
    prepareLevelQuestions();
    currentQuestionIndex = 0;
    score = 0;
    renderQuestion();
  });
}

if (nextLevelSummaryBtn) {
  nextLevelSummaryBtn.addEventListener("click", () => {
    const helpModal = document.getElementById("eduHelpModal");
    if (helpModal) {
      helpModal.classList.add("hidden");
      helpModal.classList.remove("flex");
    }
    currentLevelIndex++;
    startLevel();
  });
}

/* Initialiser */
document.addEventListener("DOMContentLoaded", async () => {
  startClock();

  const ok = await loadSubjectData();
  if (!ok) {
    if (questionText) questionText.textContent = `No quiz data found for "${subject}".`;
    return;
  }

  if (modal) {
    setTimeout(() => {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
      startLevel();
    }, 3000); // auto close modal after 3 seconds
  } else {
    startLevel();
  }
});
