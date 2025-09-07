// ================================
// quiz.js - EduKids Africa (ALL QUESTIONS + MODALS)
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

/* State */
let subject = decodeURIComponent(new URLSearchParams(window.location.search).get("subject") || "Mathematics");
let subjectData = {};
let availableLevels = [];
let currentLevelIndex = 0;
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
const PASS_PERCENT = 75;
const progressKey = `EduKidsProgress_${subject}`;

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

/* Load questions.json */
async function loadSubjectData() {
  try {
    const res = await fetch("questions.json");
    const data = await res.json();
    const category = new URLSearchParams(window.location.search).get("category");

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
      console.error("No question data found for subject:", subject);
      return false;
    }

    availableLevels = Object.keys(subjectData)
      .filter(k => /^Level\s*\d+/i.test(k))
      .sort((a, b) => parseInt(a.match(/\d+/)[0], 10) - parseInt(b.match(/\d+/)[0], 10));

    const progress = JSON.parse(localStorage.getItem(progressKey) || "{}");
    let firstNotPassed = availableLevels.findIndex(l => !progress[l]);
    currentLevelIndex = firstNotPassed === -1 ? availableLevels.length : firstNotPassed;

    return true;
  } catch (err) {
    console.error("Failed to load questions.json", err);
    return false;
  }
}

/* Prepare level questions */
function prepareLevelQuestions() {
  if (currentLevelIndex < 0 || currentLevelIndex >= availableLevels.length) {
    questions = [];
    return;
  }
  const levelKey = availableLevels[currentLevelIndex];
  let raw = subjectData[levelKey] || [];

  raw = raw.filter(q => q && q.question && (q.answer || q.correct || q.correctAnswer));

  questions = raw.map(q => ({
    question: q.question,
    options: Array.isArray(q.options) ? [...q.options] : [],
    answer: q.answer || q.correct || q.correctAnswer || ""
  }));

  questions.forEach(q => {
    if (!q.options.includes(q.answer)) q.options.push(q.answer);
    q.options = shuffle(q.options);
  });

  questions = shuffle(questions); // all questions included
}

/* Render a question */
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
}

/* On answer selection */
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
    const correctBtn = [...optionsContainer.children].find(c => c.textContent === correct);
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

/* Update score/progress */
function updateScoreBoard() {
  if (!questions || questions.length === 0) {
    if (scoreDisplay) scoreDisplay.textContent = `Score: 0/0`;
    if (progressBar) progressBar.style.width = `0%`;
    return;
  }
  if (scoreDisplay) scoreDisplay.textContent = `Score: ${score}/${questions.length}`;
  const pct = Math.round((currentQuestionIndex / questions.length) * 100);
  if (progressBar) progressBar.style.width = `${pct}%`;
}

/* Show end modal */
function showEndModal(passed, totalCorrect, totalQuestions, isCourseComplete = false) {
  if (!endModal) return;

  if (isCourseComplete) {
    endTitle.textContent = `👑 Course Completed!`;
    endMessage.textContent = `You have completed all available levels for ${subject}. Great job!`;
    retryBtn.classList.add("hidden");
    nextBtn.classList.add("hidden");
  } else if (passed) {
    levelUpSound.play();
    const percent = Math.round((totalCorrect / totalQuestions) * 100);
    endTitle.textContent = `🎉 Level Passed!`;
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
  endModal?.classList.add("hidden");
  endModal?.classList.remove("flex");
}

/* Save level progress */
function saveLevelPassed(levelKey) {
  const obj = JSON.parse(localStorage.getItem(progressKey) || "{}");
  obj[levelKey] = true;
  localStorage.setItem(progressKey, JSON.stringify(obj));
}

/* Start level */
function startLevel() {
  if (currentLevelIndex >= availableLevels.length) {
    showEndModal(false, 0, 0, true);
    return;
  }

  const levelKey = availableLevels[currentLevelIndex];
  if (levelDisplay) levelDisplay.textContent = levelKey;

  prepareLevelQuestions();
  currentQuestionIndex = 0;
  score = 0;
  renderQuestion();
}

/* End level */
function endLevel() {
  const totalQuestions = questions.length || 1;
  const percent = (score / totalQuestions) * 100;
  const passed = percent >= PASS_PERCENT;
  const levelKey = availableLevels[currentLevelIndex];

  if (passed) {
    saveLevelPassed(levelKey);
    showEndModal(true, score, totalQuestions);
  } else {
    showEndModal(false, score, totalQuestions);
  }
}

/* Button handlers */
retryBtn?.addEventListener("click", () => {
  hideEndModal();
  prepareLevelQuestions();
  currentQuestionIndex = 0;
  score = 0;
  renderQuestion();
});

nextBtn?.addEventListener("click", () => {
  hideEndModal();
  currentLevelIndex++;
  startLevel();
});

/* Instruction modal start */
startBtn?.addEventListener("click", () => {
  if (modal) modal.style.display = "none";
  startLevel();
});

/* Init */
document.addEventListener("DOMContentLoaded", async () => {
  startClock();
  const ok = await loadSubjectData();
  if (!ok) {
    if (questionText) questionText.textContent = `No quiz data found for "${subject}".`;
    return;
  }
  if (!modal) startLevel();
});
