// ========================
// Quiz.js - EduKids Africa
// ========================

// Global State
let questionsData = {};
let availableLevels = [];
let currentLevelIndex = 0;
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;

const progressKey = "quizProgress";

// DOM Elements
const questionText = document.getElementById("questionText");
const optionsContainer = document.getElementById("optionsContainer");
const progressBar = document.getElementById("progressBar");
const scoreDisplay = document.getElementById("scoreDisplay");
const levelDisplay = document.getElementById("levelDisplay");

// ========================
// Footer year auto-update
// ========================
document.getElementById("year").textContent = new Date().getFullYear();

// ========================
// Instruction Modal Logic
// ========================
const instructionModal = document.getElementById("instructionModal");
const startQuizBtn = document.getElementById("startQuizBtn");

if (startQuizBtn) {
  startQuizBtn.addEventListener("click", () => {
    instructionModal.classList.add("hidden");
    instructionModal.classList.remove("flex");
    startLevel(currentLevelIndex); // start from level 1
  });
}

// ========================
// Load Questions
// ========================
async function loadQuestions() {
  try {
    const response = await fetch("questions.json");
    questionsData = await response.json();

    availableLevels = Object.keys(questionsData);
    startLevel(0); // always begin at Level 1
  } catch (error) {
    console.error("Error loading questions:", error);
  }
}

// ========================
// Prepare Level Questions
// ========================
function prepareLevelQuestions() {
  const levelKey = availableLevels[currentLevelIndex];
  currentQuestions = [...questionsData[levelKey]];
  currentQuestionIndex = 0;
  score = 0;

  updateScoreDisplay();
  updateLevelDisplay();
}

// ========================
// Render Question
// ========================
function renderQuestion() {
  if (currentQuestionIndex >= currentQuestions.length) {
    return showSummary();
  }

  const currentQ = currentQuestions[currentQuestionIndex];
  questionText.textContent = currentQ.question;

  optionsContainer.innerHTML = "";
  currentQ.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className =
      "w-full text-left bg-gray-100 px-4 py-2 rounded-lg shadow hover:bg-gray-200 transition";
    btn.textContent = opt;
    btn.addEventListener("click", () => handleAnswer(i));
    optionsContainer.appendChild(btn);
  });

  updateProgress();
}

// ========================
// Handle Answer
// ========================
function handleAnswer(selectedIndex) {
  const currentQ = currentQuestions[currentQuestionIndex];

  if (selectedIndex === currentQ.answer) {
    score++;
  }

  currentQuestionIndex++;
  updateScoreDisplay();
  renderQuestion();
}

// ========================
// UI Updates
// ========================
function updateProgress() {
  const percent = (currentQuestionIndex / currentQuestions.length) * 100;
  progressBar.style.width = `${percent}%`;
}

function updateScoreDisplay() {
  scoreDisplay.textContent = `Score: ${score}/${currentQuestions.length}`;
}

function updateLevelDisplay() {
  levelDisplay.textContent = `Level ${currentLevelIndex + 1}`;
}

// ========================
// Show Summary
// ========================
function showSummary() {
  const summaryModal = document.getElementById("summaryModal");
  const summaryTitle = document.getElementById("summaryTitle");
  const summaryMessage = document.getElementById("summaryMessage");
  const retryBtn = document.getElementById("retryBtn");
  const nextLevelBtn = document.getElementById("nextLevelBtn");

  summaryModal.classList.remove("hidden");
  summaryModal.classList.add("flex");

  const passMark = Math.ceil(currentQuestions.length * 0.6); // 60%
  if (score >= passMark) {
    summaryTitle.textContent = "Great Job! 🎉";
    summaryMessage.textContent = `You passed with ${score}/${currentQuestions.length}.`;
    nextLevelBtn.classList.remove("hidden");
    retryBtn.classList.add("hidden");
  } else {
    summaryTitle.textContent = "Try Again 😟";
    summaryMessage.textContent = `You scored ${score}/${currentQuestions.length}. You need ${passMark} to pass.`;
    retryBtn.classList.remove("hidden");
    nextLevelBtn.classList.add("hidden");
  }

  // Retry button
  retryBtn.onclick = () => {
    summaryModal.classList.add("hidden");
    summaryModal.classList.remove("flex");
    prepareLevelQuestions();
    renderQuestion();
  };

  // Next level button
  nextLevelBtn.onclick = () => {
    summaryModal.classList.add("hidden");
    summaryModal.classList.remove("flex");

    if (currentLevelIndex + 1 < availableLevels.length) {
      startLevel(currentLevelIndex + 1);
    } else {
      showEndScreen();
    }
  };
}

// ========================
// End Screen
// ========================
function showEndScreen() {
  const endModal = document.getElementById("endModal");
  const endTitle = document.getElementById("endTitle");
  const endMessage = document.getElementById("endMessage");

  endModal.classList.remove("hidden");
  endModal.classList.add("flex");

  endTitle.textContent = "🎉 Congratulations!";
  endMessage.textContent = "You’ve completed all levels!";
}

// ========================
// Floating Help Modal
// ========================
const helpBtn = document.getElementById("eduHelpBtn");
const helpModal = document.getElementById("eduHelpModal");
const closeHelpBtn = document.getElementById("eduCloseHelpBtn");
const replayBtns = document.querySelectorAll("#eduReplayLevelOptions .eduHelpBtnOption");
const resetLevelBtn = document.getElementById("eduResetLevelBtn");
const backSubjectsBtn = document.getElementById("eduBackSubjectsBtn");

// Show modal
helpBtn.addEventListener("click", () => {
  helpModal.classList.remove("hidden");
  helpModal.classList.add("flex");
});

// Close modal
closeHelpBtn.addEventListener("click", () => {
  helpModal.classList.add("hidden");
  helpModal.classList.remove("flex");
});

// Replay specific level
replayBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const level = parseInt(btn.dataset.level);

    if (availableLevels.length >= level) {
      const progress = JSON.parse(localStorage.getItem(progressKey) || "{}");
      const levelKey = availableLevels[level - 1];
      if (progress[levelKey]) delete progress[levelKey];
      localStorage.setItem(progressKey, JSON.stringify(progress));

      currentLevelIndex = level - 1;
      score = 0;
      currentQuestionIndex = 0;
      prepareLevelQuestions();
      renderQuestion();

      helpModal.classList.add("hidden");
      helpModal.classList.remove("flex");
    }
  });
});

// Reset current level
resetLevelBtn.addEventListener("click", () => {
  score = 0;
  currentQuestionIndex = 0;
  prepareLevelQuestions();
  renderQuestion();

  helpModal.classList.add("hidden");
  helpModal.classList.remove("flex");
});

// Go back to subjects
backSubjectsBtn.addEventListener("click", () => {
  window.location.href = "subjects.html";
});

// ========================
// Start Level
// ========================
function startLevel(levelIndex) {
  currentLevelIndex = levelIndex;
  prepareLevelQuestions();
  renderQuestion();
}

// Start
loadQuestions();
