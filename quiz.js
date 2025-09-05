// ================================
// QUIZ.JS - EduKids Africa
// ================================

// --- Sounds ---
const correctSound = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");
const wrongSound = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");
const levelUpSound = new Audio("https://actions.google.com/sounds/v1/cartoon/congratulations.ogg");
const gameOverSound = new Audio("https://actions.google.com/sounds/v1/cartoon/boing.ogg");

// --- Levels setup ---
const levels = [
  { level: 1, total: 50, pass: 45 },
  { level: 2, total: 60, pass: 55 },
  { level: 3, total: 80, pass: 75 }
];

let currentLevelIndex = 0;
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;

// --- DOM elements ---
const questionText = document.getElementById("questionText");
const optionsContainer = document.getElementById("optionsContainer");
const scoreDisplay = document.getElementById("scoreDisplay");
const levelDisplay = document.getElementById("levelDisplay");

// --- Get subject from URL ---
const urlParams = new URLSearchParams(window.location.search);
const subject = urlParams.get("subject") || "Mathematics";

// --- Load questions from JSON ---
async function loadQuestions(level) {
  try {
    const response = await fetch("questions.json");
    if (!response.ok) throw new Error("Failed to load questions.json");

    const data = await response.json();
    const subjectData = data[subject];

    if (!subjectData || !subjectData[`level${level.level}`]) {
      throw new Error(`No questions found for ${subject}, Level ${level.level}`);
    }

    return subjectData[`level${level.level}`];
  } catch (err) {
    console.error(err);
    alert("❌ Could not load questions. Check console for details.");
    return [];
  }
}

// --- Render current question ---
function renderQuestion() {
  const q = currentQuestions[currentQuestionIndex];
  if (!q) return;

  questionText.textContent = q.question;
  optionsContainer.innerHTML = "";

  q.options.forEach((option, index) => {
    const btn = document.createElement("button");
    btn.textContent = option;
    btn.className =
      "w-full text-left px-4 py-3 mb-2 rounded-lg bg-white border border-purple-300 hover:bg-purple-100 transition";
    btn.onclick = () => checkAnswer(index, btn);
    optionsContainer.appendChild(btn);
  });

  updateScoreBoard();
}

// --- Check answer ---
function checkAnswer(selectedIndex, btn) {
  const q = currentQuestions[currentQuestionIndex];

  if (selectedIndex === q.correct) {
    score++;
    btn.classList.add("bg-green-500", "text-white");
    correctSound.play();
  } else {
    btn.classList.add("bg-red-500", "text-white");
    wrongSound.play();

    // highlight correct option
    [...optionsContainer.children][q.correct].classList.add(
      "bg-green-500",
      "text-white"
    );
  }

  // disable all buttons
  [...optionsContainer.children].forEach((b) => (b.disabled = true));

  // Next question after short delay
  setTimeout(() => {
    currentQuestionIndex++;
    if (currentQuestionIndex < currentQuestions.length) {
      renderQuestion();
    } else {
      endLevel();
    }
  }, 1000);
}

// --- End level ---
function endLevel() {
  const level = levels[currentLevelIndex];
  if (score >= level.pass) {
    levelUpSound.play();
    alert(`🎉 Congratulations! You passed Level ${level.level} in ${subject}.`);
    currentLevelIndex++;
    if (currentLevelIndex < levels.length) {
      startLevel();
    } else {
      alert(`👑 You completed all levels in ${subject} and earned the crown!`);
    }
  } else {
    gameOverSound.play();
    alert(
      `❌ Game Over! You scored ${score} out of ${level.total}. Required: ${level.pass}.`
    );
    resetGame();
  }
}

// --- Start level ---
async function startLevel() {
  const level = levels[currentLevelIndex];
  currentQuestions = await loadQuestions(level);

  if (currentQuestions.length === 0) {
    alert("⚠ No questions available. Please check questions.json.");
    return;
  }

  currentQuestionIndex = 0;
  score = 0;
  updateScoreBoard();
  renderQuestion();
  levelDisplay.textContent = `Level ${level.level}`;
}

// --- Update scoreboard ---
function updateScoreBoard() {
  const level = levels[currentLevelIndex];
  scoreDisplay.textContent = `Score: ${score}/${level.total}`;
}

// --- Reset game ---
function resetGame() {
  currentLevelIndex = 0;
  score = 0;
  startLevel();
}

// --- Start game ---
startLevel();
