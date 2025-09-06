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

// Start clock ⏰
function startClock() {
  setInterval(() => {
    const now = new Date();
    clockElement.textContent = now.toLocaleTimeString();
  }, 1000);
}
startClock();

// Load questions.json for current level
async function loadQuestions(levelObj) {
  try {
    const res = await fetch("questions.json");
    const data = await res.json();
    // Currently hard-coded subject = "Mathematics"
    let subject = "Mathematics";
    return data[subject][`level${levelObj.level}`];
  } catch (err) {
    console.error("Error loading questions:", err);
    return [];
  }
}

// Render current question
function renderQuestion() {
  const q = currentQuestions[currentQuestionIndex];
  questionText.textContent = q.question;
  optionsContainer.innerHTML = "";

  q.options.forEach((option, index) => {
    const btn = document.createElement("button");
    btn.textContent = option;
    btn.className =
      "w-full text-left px-4 py-3 rounded-lg bg-purple-100 hover:bg-purple-200 transition";
    btn.onclick = () => checkAnswer(index, btn);
    optionsContainer.appendChild(btn);
  });

  updateScoreBoard();
}

// Check answer
function checkAnswer(selectedIndex, btn) {
  const q = currentQuestions[currentQuestionIndex];

  if (q.options[selectedIndex] === q.correct) {
    score++;
    btn.classList.add("bg-green-500", "text-white");
    correctSound.play();
  } else {
    btn.classList.add("bg-red-500", "text-white");
    wrongSound.play();
    // highlight correct
    const correctBtnIndex = q.options.indexOf(q.correct);
    if (correctBtnIndex >= 0) {
      optionsContainer.children[correctBtnIndex].classList.add("bg-green-500", "text-white");
    }
  }

  // disable buttons
  [...optionsContainer.children].forEach(b => b.disabled = true);

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

// End Level
function endLevel() {
  const levelObj = levels[currentLevelIndex];
  if (score >= levelObj.pass) {
    levelUpSound.play();
    alert(`🎉 Congrats! You passed Level ${levelObj.level}.`);
    currentLevelIndex++;
    if (currentLevelIndex < levels.length) {
      startLevel();
    } else {
      alert("👑 You completed all levels and earned the crown!");
    }
  } else {
    gameOverSound.play();
    alert(`❌ Game Over! You scored ${score}/${levelObj.total}. Required: ${levelObj.pass}.`);
    resetGame();
  }
}

// Start Level
async function startLevel() {
  const levelObj = levels[currentLevelIndex];
  currentQuestions = await loadQuestions(levelObj);
  currentQuestionIndex = 0;
  score = 0;
  levelDisplay.textContent = `Level ${levelObj.level}`;
  renderQuestion();
}

// Update scoreboard
function updateScoreBoard() {
  const levelObj = levels[currentLevelIndex];
  scoreDisplay.textContent = `Score: ${score}/${levelObj.total}`;
  const progressPercent = ((currentQuestionIndex + 1) / levelObj.total) * 100;
  progressBar.style.width = `${progressPercent}%`;
}

// Reset Game
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
