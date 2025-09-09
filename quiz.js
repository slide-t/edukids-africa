
// ================================
// quiz.js - EduKids Africa (updated)
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
const startBtn = document.getElementById("startQuizBtn");

/* End modal elements */
const endModal = document.getElementById("endModal");
const endTitle = document.getElementById("endTitle");
const endMessage = document.getElementById("endMessage");
const retryBtn = document.getElementById("retryBtn");
const nextBtn = document.getElementById("nextBtn");

/* Summary/help modal */
const retrySummaryBtn = document.getElementById("retryBtn");
const nextLevelSummaryBtn = document.getElementById("nextLevelBtn");

/* State */
let subject = decodeURIComponent(new URLSearchParams(window.location.search).get("subject") || "Mathematics");
let category = decodeURIComponent(new URLSearchParams(window.location.search).get("category") || "Primary");
let subjectData = {};
let availableLevels = [];
let currentLevelIndex = 0;
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
const PASS_PERCENT = 75;
const progressKey = `EduKidsProgress_${subject}`;

/* Timer */
let timerInterval;
let timeLeft = 15;
const circle = document.getElementById("timerCircle");
const timerText = document.getElementById("timerText");
const circleLength = 220;

/* ---------------------- Utility Functions ---------------------- */
function startClock() {
  setInterval(() => {
    if (clockElement) clockElement.textContent = new Date().toLocaleTimeString();
  }, 1000);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/* ---------------------- Timer ---------------------- */
function startTimer() {
  clearInterval(timerInterval);
  timeLeft = 15;
  if (timerText) timerText.textContent = timeLeft;
  if (circle) circle.style.strokeDasharray = circleLength;

  timerInterval = setInterval(() => {
    timeLeft--;
    if (timerText) timerText.textContent = timeLeft;
    if (circle) {
      circle.style.strokeDashoffset = circleLength - (timeLeft / 15) * circleLength;
    }
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

/* ---------------------- Load Questions ---------------------- */
async function loadSubjectData() {
  try {
    // Primary source: questions folder
    const folderUrl = `questions/${category}/${subject}.json`;
    let res = await fetch(folderUrl);
    if (!res.ok) throw new Error("Folder file not found, fallback to questions.json");
    subjectData = await res.json();
  } catch (err) {
    console.warn(err.message);
    try {
      // Fallback: questions.json
      const res = await fetch("questions.json");
      const data = await res.json();
      if (data[category] && data[category][subject]) {
        subjectData = data[category][subject];
      } else {
        subjectData = data[subject] || {};
      }
    } catch (err2) {
      console.error("No question data found for subject:", subject);
      return false;
    }
  }

  // Levels
  availableLevels = Object.keys(subjectData)
    .filter(k => /^level\s*\d+/i.test(k))
    .sort((a,b) => parseInt(a.match(/\d+/)[0],10) - parseInt(b.match(/\d+/)[0],10));

  // Load progress
  const progress = JSON.parse(localStorage.getItem(progressKey) || "{}");
  let firstNotPassed = availableLevels.findIndex(l => !progress[l]);
  currentLevelIndex = firstNotPassed === -1 ? availableLevels.length : firstNotPassed;

  return true;
}

/* ---------------------- Prepare Questions ---------------------- */
function prepareLevelQuestions() {
  if (currentLevelIndex >= availableLevels.length) {
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
    q.options = shuffle(q.options);
    return q;
  });
}

/* ---------------------- Render Question ---------------------- */
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

/* ---------------------- Select Option ---------------------- */
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
    // highlight correct
    const children = [...optionsContainer.children];
    const correctBtn = children.find(c => c.textContent === correct);
    if (correctBtn) correctBtn.classList.add("bg-green-500", "text-white");
  }

  [...optionsContainer.children].forEach(c => c.disabled = true);

  setTimeout(() => {
    currentQuestionIndex++;
    renderQuestion();
  }, 900);
}

/* ---------------------- Score & Progress ---------------------- */
function updateScoreBoard() {
  if (!questions.length) {
    if (scoreDisplay) scoreDisplay.textContent = `Score: 0/0`;
    if (progressBar) progressBar.style.width = `0%`;
    return;
  }
  if (scoreDisplay) scoreDisplay.textContent = `Score: ${score}/${questions.length}`;
  const pct = Math.round((currentQuestionIndex / questions.length) * 100);
  if (progressBar) progressBar.style.width = `${pct}%`;
}

/* ---------------------- End Level ---------------------- */
function saveLevelPassed(levelKey) {
  const obj = JSON.parse(localStorage.getItem(progressKey) || "{}");
  obj[levelKey] = true;
  localStorage.setItem(progressKey, JSON.stringify(obj));
}

function endLevel() {
  const totalQuestions = questions.length || 1;
  const percent = (score / totalQuestions) * 100;
  const passed = percent >= PASS_PERCENT;
  const levelKey = availableLevels[currentLevelIndex];

  if (passed) saveLevelPassed(levelKey);

  // Show end modal
  if (endModal && endTitle && endMessage) {
    endModal.classList.remove("hidden");
    endModal.classList.add("flex");
    endTitle.textContent = passed ? `🎉 Level Passed!` : `❌ Level Failed`;
    endMessage.textContent = `You scored ${score}/${totalQuestions} (${Math.round(percent)}%).`;
  }

  clearInterval(timerInterval);
}

/* ---------------------- Start Level ---------------------- */
function startLevel() {
  if (currentLevelIndex >= availableLevels.length) {
    if (endModal && endTitle && endMessage) {
      endTitle.textContent = `👑 Course Completed!`;
      endMessage.textContent = `You have completed all available levels for ${subject}.`;
      endModal.classList.remove("hidden");
      endModal.classList.add("flex");
    }
    return;
  }

  if (levelDisplay) levelDisplay.textContent = availableLevels[currentLevelIndex];
  prepareLevelQuestions();
  currentQuestionIndex = 0;
  score = 0;
  renderQuestion();
}

/* ---------------------- Event Listeners ---------------------- */
if (retryBtn) retryBtn.addEventListener("click", () => {
  if (endModal) endModal.classList.add("hidden");
  prepareLevelQuestions();
  currentQuestionIndex = 0;
  score = 0;
  renderQuestion();
});

if (nextBtn) nextBtn.addEventListener("click", () => {
  if (endModal) endModal.classList.add("hidden");
  currentLevelIndex++;
  startLevel();
});

/* ---------------------- Initializer ---------------------- */
document.addEventListener("DOMContentLoaded", async () => {
  startClock();
  const ok = await loadSubjectData();
  if (!ok) {
    if (questionText) questionText.textContent = `No quiz data found for "${subject}".`;
    return;
  }

  // Start quiz
  if (startBtn && modal) {
    startBtn.addEventListener("click", () => {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
      startLevel();
    });
  } else {
    startLevel();
  }
});






//My old quiz.js

/*
// ================================
// quiz.js - EduKids Africa (full)
// ================================

/* Sounds *
const correctSound = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");
const wrongSound = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");
const levelUpSound = new Audio("https://actions.google.com/sounds/v1/cartoon/congratulations.ogg");
const gameOverSound = new Audio("https://actions.google.com/sounds/v1/cartoon/boing.ogg");

/* DOM elements *
const questionText = document.getElementById("questionText");
const optionsContainer = document.getElementById("optionsContainer");
const scoreDisplay = document.getElementById("scoreDisplay");
const levelDisplay = document.getElementById("levelDisplay");
const progressBar = document.getElementById("progressBar");
const clockElement = document.getElementById("clock");
const modal = document.getElementById("instructionModal");
const startBtn = document.getElementById("startQuizBtn");

/* End modal elements (must exist in HTML) *
const endModal = document.getElementById("endModal");
const endTitle = document.getElementById("endTitle");
const endMessage = document.getElementById("endMessage");
const retryBtn = document.getElementById("retryBtn");
const nextBtn = document.getElementById("nextBtn");

/* State *
let subject = decodeURIComponent(new URLSearchParams(window.location.search).get("subject") || "Mathematics");
let subjectData = {};              // loaded subject object from questions.json
let availableLevels = [];          // e.g. ["Level 1","Level 2","Level 3"]
let currentLevelIndex = 0;         // index into availableLevels
let questions = [];                // questions for current level
let currentQuestionIndex = 0;
let score = 0;
const PASS_PERCENT = 75;
const progressKey = `EduKidsProgress_${subject}`; // localStorage key

/* timer for each question *

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
      // auto move to next question or mark wrong
      handleTimeout();
    }
  }, 1000);
}

function handleTimeout() {
  // treat as incorrect and move on
  currentQuestionIndex++;
  renderQuestion();
}


/* Utility: start clock *
function startClock() {
  setInterval(() => {
    const now = new Date();
    if (clockElement) clockElement.textContent = now.toLocaleTimeString();
  }, 1000);
}

/* Utility: Fisher-Yates shuffle *
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/* Load questions.json and prepare available levels *
async function loadSubjectData() {
  try {
    const res = await fetch("questions.json");
    const data = await res.json();
    // Support nested structure: e.g. data["Primary School"]["Mathematics"] or top-level data["Mathematics"]
    // Try either (category param may exist)
    const category = new URLSearchParams(window.location.search).get("category");
    if (category && data[category] && data[category][subject]) {
      subjectData = data[category][subject];
    } else if (data[subject]) {
      subjectData = data[subject];
    } else {
      // maybe the JSON uses top-level categories (like "Primary School") - find subject anywhere
      let found = null;
      for (const k of Object.keys(data)) {
        if (typeof data[k] === "object" && data[k][subject]) {
          found = data[k][subject];
          break;
        }
      }
      if (found) subjectData = found;
    }

    if (!subjectData || Object.keys(subjectData).length === 0) {
      console.error("No question data found for subject:", subject);
      return false;
    }

    // Collect Level keys & sort (Level 1, Level 2, ...)
    availableLevels = Object.keys(subjectData)
      .filter(k => /^Level\s*\d+/i.test(k))
      .sort((a,b) => {
        const na = parseInt(a.match(/\d+/)[0],10);
        const nb = parseInt(b.match(/\d+/)[0],10);
        return na - nb;
      });

    // load progress from localStorage to set starting level
    const progress = JSON.parse(localStorage.getItem(progressKey) || "{}");
    // find first level not passed
    let firstNotPassed = availableLevels.findIndex(l => !progress[l]);
    if (firstNotPassed === -1) {
      // all passed -> either show completion screen or start at last level completed + 1 (but none)
      // We'll default to the last level index + 1 (which means all completed)
      currentLevelIndex = availableLevels.length; // special marker -> completed
    } else {
      currentLevelIndex = firstNotPassed;
    }

    return true;
  } catch (err) {
    console.error("Failed to load questions.json", err);
    return false;
  }
}

/* Load and prepare the questions for the current level *
function prepareLevelQuestions() {
  if (currentLevelIndex < 0 || currentLevelIndex >= availableLevels.length) {
    questions = [];
    return;
  }
  const levelKey = availableLevels[currentLevelIndex]; // e.g. "Level 1"
  const raw = subjectData[levelKey] || [];
  // deep clone to avoid mutating original data
  questions = raw.map(q => {
    // allow either "answer" or "correct" keys in JSON (backwards compatibility)
    return {
      question: q.question,
      options: Array.isArray(q.options) ? [...q.options] : [],
      answer: q.answer || q.correct || q.correctAnswer || ""
    };
  });

  // Shuffle questions and options
  questions = shuffle(questions);
  questions = questions.map(q => {
    // ensure answer is present in options (if not, add it)
    if (!q.options.includes(q.answer)) q.options.push(q.answer);
    q.options = shuffle([...q.options]);
    return q;
  });
}

/* Render a question & its shuffled options *
function renderQuestion() {
  if (!questions.length || currentQuestionIndex >= questions.length) {
    endLevel();
    return;
  }

  const q = questions[currentQuestionIndex];
  if (questionText) questionText.textContent = q.question;
  if (optionsContainer) {
    optionsContainer.innerHTML = "";
    q.options.forEach((opt, idx) => {
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


/* When user selects an option *
function onSelectOption(selectedText, btnEl) {
  const q = questions[currentQuestionIndex];
  const correct = q.answer;

  // mark chosen / correct
  if (selectedText === correct) {
    score++;
    if (btnEl) btnEl.classList.add("bg-green-500", "text-white");
    correctSound.play();
  } else {
    if (btnEl) btnEl.classList.add("bg-red-500", "text-white");
    wrongSound.play();
    // highlight correct
    const children = [...optionsContainer.children];
    const correctBtn = children.find(child => child.textContent === correct);
    if (correctBtn) correctBtn.classList.add("bg-green-500", "text-white");
  }

  // disable all options
  [...optionsContainer.children].forEach(c => c.disabled = true);

  // move next
  setTimeout(() => {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
      renderQuestion();
    } else {
      endLevel();
    }
  }, 900);
}

/* Update score / progress UI *
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

/* Show end modal (pass/fail) *
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
  // show modal (Tailwind classes)
  endModal.classList.remove("hidden");
  endModal.classList.add("flex");
}

/* Hide end modal *
function hideEndModal() {
  if (!endModal) return;
  endModal.classList.add("hidden");
  endModal.classList.remove("flex");
}

/* Save level passed to localStorage *
function saveLevelPassed(levelKey) {
  const obj = JSON.parse(localStorage.getItem(progressKey) || "{}");
  obj[levelKey] = true;
  localStorage.setItem(progressKey, JSON.stringify(obj));
}

/* Determine and start the current level *
function startLevel() {
  // if all levels already passed
  if (currentLevelIndex >= availableLevels.length) {
    // show final completion message
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

  const levelKey = availableLevels[currentLevelIndex]; // e.g. "Level 1"
  if (levelDisplay) levelDisplay.textContent = levelKey;
  // prepare questions for current level
  prepareLevelQuestions();
  // reset counters
  currentQuestionIndex = 0;
  score = 0;
  // render first question
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

  // ✅ Show summary inside Help Modal
  if (helpModal) {
    helpModal.classList.remove("hidden");
    helpModal.classList.add("flex");
  }

  // stop timer
  clearInterval(timerInterval);
}

/* Button handlers for end modal *
if (retryBtn) {
  retryBtn.addEventListener("click", () => {
    hideEndModal();
    // restart the same level with fresh shuffle
    prepareLevelQuestions();
    currentQuestionIndex = 0;
    score = 0;
    renderQuestion();
  });
}

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    hideEndModal();
    // move to next level
    currentLevelIndex++;
    startLevel();
  });
}

/* Instruction modal start button *
document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startQuizBtn");
  const modal = document.getElementById("instructionModal");
  
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
      }
      startLevel();
    });
  }
});



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


/* Initialiser *
document.addEventListener("DOMContentLoaded", async () => {
  startClock();

  const ok = await loadSubjectData();
  if (!ok) {
    // show friendly error on page
    if (questionText) questionText.textContent = `No quiz data found for "${subject}".`;
    return;
  }

  // If user already completed none -> show instruction modal if present, else start immediately.
  if (modal) {
    // leave modal visible until user clicks Start (existing behavior)
  } else {
    // no instruction modal found - start automatically
    startLevel();
  }
});
