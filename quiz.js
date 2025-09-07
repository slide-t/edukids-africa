// ========================
// Quiz Script - EduKids Africa
// ========================

// Parse subject from URL
const urlParams = new URLSearchParams(window.location.search);
const selectedSubject = urlParams.get("subject");

// Global State
let questions = [];
let availableLevels = [];
let currentLevelIndex = 0;
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let progressKey = ""; // localStorage key per subject

// DOM Elements
const modal = document.getElementById("instructionModal");
const startBtn = document.getElementById("startQuizBtn");
const quizBoard = document.getElementById("quizBoard");
const questionText = document.getElementById("questionText");
const optionsContainer = document.getElementById("optionsContainer");
const nextBtn = document.getElementById("nextBtn");
const progressText = document.getElementById("progressText");
const scoreBoard = document.getElementById("scoreBoard");
const helpSummary = document.getElementById("helpSummary"); // inside help modal

// ========================
// Load Questions
// ========================
async function loadQuestions() {
  if (!selectedSubject) {
    alert("No subject selected. Please go back to Subjects.");
    window.location.href = "subjects.html";
    return;
  }

  try {
    const response = await fetch("questions.json");
    const data = await response.json();

    // Filter only this subject
    questions = data.filter(q => q.subject === selectedSubject);

    if (!questions.length) {
      alert(`No questions found for ${selectedSubject}`);
      window.location.href = "subjects.html";
      return;
    }

    progressKey = `quizProgress_${selectedSubject}`;
    setupLevels();
  } catch (err) {
    console.error("Error loading questions:", err);
    alert("Could not load questions.");
  }
}

// ========================
// Setup Levels
// ========================
function setupLevels() {
  // Divide into 3 levels: 50, 60, 80
  availableLevels = [
    questions.slice(0, 50),
    questions.slice(50, 110),
    questions.slice(110, 190)
  ];

  // Restore progress if exists
  const saved = JSON.parse(localStorage.getItem(progressKey) || "{}");
  if (saved.levelIndex !== undefined) {
    currentLevelIndex = saved.levelIndex;
    score = saved.score;
    currentQuestionIndex = saved.currentIndex;
  }

  prepareLevelQuestions();
}

// ========================
// Prepare Current Level
// ========================
function prepareLevelQuestions() {
  currentQuestions = availableLevels[currentLevelIndex] || [];
  if (!currentQuestions.length) {
    alert("No questions for this level.");
    return;
  }
  saveProgress();
  renderQuestion();
}

// ========================
// Render Question
// ========================
function renderQuestion() {
  if (currentQuestionIndex >= currentQuestions.length) {
    finishLevel();
    return;
  }

  const q = currentQuestions[currentQuestionIndex];
  questionText.textContent = q.question;
  optionsContainer.innerHTML = "";

  q.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = opt;
    btn.addEventListener("click", () => checkAnswer(opt, q.answer, btn));
    optionsContainer.appendChild(btn);
  });

  progressText.textContent = `Question ${currentQuestionIndex + 1} of ${currentQuestions.length}`;
}

// ========================
// Check Answer
// ========================
function checkAnswer(selected, correct, btn) {
  const optionButtons = optionsContainer.querySelectorAll("button");
  optionButtons.forEach(b => b.disabled = true);

  if (selected === correct) {
    score++;
    btn.classList.add("correct");
  } else {
    btn.classList.add("wrong");
  }

  saveProgress();
  nextBtn.style.display = "block";
}

// ========================
// Next Question
// ========================
nextBtn.addEventListener("click", () => {
  currentQuestionIndex++;
  nextBtn.style.display = "none";
  renderQuestion();
});

// ========================
// Finish Level
// ========================
function finishLevel() {
  updateScoreBoard();

  // If there is another level, move on
  if (currentLevelIndex < availableLevels.length - 1) {
    currentLevelIndex++;
    currentQuestionIndex = 0;
    score = 0;
    prepareLevelQuestions();
  } else {
    questionText.textContent = "🎉 You’ve completed all levels!";
    optionsContainer.innerHTML = "";
    progressText.textContent = "";
  }

  saveProgress();
  updateHelpSummary();
}

// ========================
// Scoreboard Update
// ========================
function updateScoreBoard() {
  scoreBoard.textContent = `Subject: ${selectedSubject} | Level ${currentLevelIndex + 1} Score: ${score}/${currentQuestions.length}`;
}

// ========================
// Save Progress
// ========================
function saveProgress() {
  const state = {
    subject: selectedSubject,
    levelIndex: currentLevelIndex,
    currentIndex: currentQuestionIndex,
    score: score
  };
  localStorage.setItem(progressKey, JSON.stringify(state));
}

// ========================
// Help Modal Summary
// ========================
function updateHelpSummary() {
  helpSummary.innerHTML = `
    <h3>${selectedSubject} Progress</h3>
    <p>Level ${currentLevelIndex + 1}: ${score}/${currentQuestions.length} questions answered</p>
    <p>Total Levels: ${availableLevels.length}</p>
  `;
}

// ========================
// Start Quiz
// ========================
startBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
  quizBoard.classList.remove("hidden");
  renderQuestion();
});

// ========================
// Init
// ========================
window.addEventListener("DOMContentLoaded", loadQuestions);
