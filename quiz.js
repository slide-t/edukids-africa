// ================================
// QUIZ.JS - EduKids Africa Quiz
// ================================

// Sounds
const correctSound = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");
const wrongSound = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");
const levelUpSound = new Audio("https://actions.google.com/sounds/v1/cartoon/congratulations.ogg");
const gameOverSound = new Audio("https://actions.google.com/sounds/v1/cartoon/boing.ogg");

// Levels
const levels = [
  { level: 1, total: 50, pass: 45 },
  { level: 2, total: 60, pass: 55 },
  { level: 3, total: 80, pass: 75 }
];

let currentLevelIndex = 0;
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;

// DOM Elements
const questionText = document.getElementById("questionText");
const optionsContainer = document.getElementById("optionsContainer");
const scoreDisplay = document.getElementById("scoreDisplay");
const levelDisplay = document.getElementById("levelDisplay");
const progressBar = document.getElementById("progressBar");
const clockElement = document.getElementById("clock");
const modal = document.getElementById("instructionModal");
const startBtn = document.getElementById("startQuizBtn");

// Clock ⏰
function startClock() {
  setInterval(() => {
    const now = new Date();
    clockElement.textContent = now.toLocaleTimeString();
  }, 1000);
}
startClock();

// Utility: shuffle array
function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

// Load questions.json for current subject/level
async function loadQuestions(levelObj) {
  try {
    const res = await fetch("questions.json");
    const data = await res.json();
    // For now, subject hardcoded = Mathematics
    let subject = "Mathematics";
    let questions = data[subject][`level${levelObj.level}`];

    // shuffle questions and trim to required total
    questions = shuffle(questions).slice(0, levelObj.total);

    // shuffle options for each question
    questions.forEach(q => {
      q.options = shuffle(q.options);
    });

    return questions;
  } catch (err) {
    console.error("Error loading questions:", err);
    return [];
  }
}

// Render a question
function renderQuestion() {
  const q = currentQuestions[currentQuestionIndex];
  questionText.textContent = q.question;
  optionsContainer.innerHTML = "";

  q.options.forEach((option, index) => {
    const btn = document.createElement("button");
    btn.textContent = option;
    btn.className =
      "w-full text-left px-4 py-3 rounded-lg bg-purple-100 hover:bg-purple-200 transform transition duration-200 hover:scale-105";
    btn.onclick = () => checkAnswer(option, btn);
    optionsContainer.appendChild(btn);
  });

  updateScoreBoard();
}

// Check answer
function checkAnswer(selectedOption, btn) {
  const q = currentQuestions[currentQuestionIndex];

  if (selectedOption === q.correct) {
    score++;
    btn.classList.add("bg-green-500", "text-white");
    correctSound.play();
    showIcon(btn, "✅");
  } else {
    btn.classList.add("bg-red-500", "text-white");
    wrongSound.play();
    showIcon(btn, "❌");

    // highlight correct answer
    const correctBtnIndex = q.options.indexOf(q.correct);
    if (correctBtnIndex >= 0) {
      const correctBtn = optionsContainer.children[correctBtnIndex];
      correctBtn.classList.add("bg-green-500", "text-white");
      showIcon(correctBtn, "✅");
    }
  }

  // disable buttons
  [...optionsContainer.children].forEach(b => (b.disabled = true));

  // Next after 1s
  setTimeout(() => {
    currentQuestionIndex++;
    if (currentQuestionIndex < currentQuestions.length) {
      renderQuestion();
    } else {
      endLevel();
    }
  }, 1000);
}

// Small ✅ or ❌ popup effect
function showIcon(btn, symbol) {
  const span = document.createElement("span");
  span.textContent = symbol;
  span.className = "ml-2 font-bold";
  btn.appendChild(span);
}

// End level
function endLevel() {
  const levelObj = levels[currentLevelIndex];
  if (score >= levelObj.pass) {
    levelUpSound.play();
    alert(`🎉 Congrats! You passed Level ${levelObj.level} with ${score}/${levelObj.total}.`);
    currentLevelIndex++;
    if (currentLevelIndex < levels.length) {
      startLevel();
    } else {
      alert("👑 You completed all levels and earned the crown!");
      resetGame();
    }
  } else {
    gameOverSound.play();
    alert(`❌ You scored ${score}/${levelObj.total}. You need ${levelObj.pass} to pass. Try again.`);
    // retry same level
    startLevel();
  }
}

// Start a level
async function startLevel() {
  const levelObj = levels[currentLevelIndex];
  currentQuestions = await loadQuestions(levelObj);
  currentQuestionIndex = 0;
  score = 0;
  levelDisplay.textContent = `Level ${levelObj.level}`;
  renderQuestion();
}

// Update score/progress
function updateScoreBoard() {
  const levelObj = levels[currentLevelIndex];
  scoreDisplay.textContent = `Score: ${score}/${levelObj.total}`;
  const progressPercent = ((currentQuestionIndex + 1) / levelObj.total) * 100;
  progressBar.style.width = `${progressPercent}%`;
}

// Reset game
function resetGame() {
  currentLevelIndex = 0;
  score = 0;
  startLevel();
}

// Modal start
startBtn.addEventListener("click", () => {
  modal.style.display = "none";
  startLevel();
});
