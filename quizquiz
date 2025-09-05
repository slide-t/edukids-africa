// ================================
// QUIZ.JS - Kids Quiz Game
// ================================

// Sounds
const correctSound = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");
const wrongSound = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");
const levelUpSound = new Audio("https://actions.google.com/sounds/v1/cartoon/congratulations.ogg");
const gameOverSound = new Audio("https://actions.google.com/sounds/v1/cartoon/boing.ogg");

// Levels setup
const levels = [
  { level: 1, total: 50, pass: 45 },
  { level: 2, total: 60, pass: 55 },
  { level: 3, total: 80, pass: 75 }
];

let currentLevelIndex = 0;
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;

// DOM elements
const questionText = document.getElementById("questionText");
const optionsContainer = document.getElementById("optionsContainer");
const scoreDisplay = document.getElementById("scoreDisplay");
const levelDisplay = document.getElementById("levelDisplay");

// Load questions from questions.json
async function loadQuestions(level) {
  try {
    const res = await fetch("questions.json");
    const data = await res.json();

    // Choose subject (default: Mathematics for now)
    const subject = "Mathematics";

    const levelKey = `level${level.level}`;
    const questions = data[subject][levelKey];

    if (!questions || questions.length === 0) {
      throw new Error(`No questions found for ${subject} - ${levelKey}`);
    }

    // Map JSON to your expected format (convert correct to index)
    return questions.map(q => ({
      question: q.question,
      options: q.options,
      correct: q.options.indexOf(q.correct)
    }));
  } catch (err) {
    console.error("Error loading questions:", err);
    return [];
  }
}

/*// Load questions (replace with Lagos state curriculum JSON later)
function loadQuestions(level) {
  // Temporary demo questions (replace with full set)
  return Array.from({ length: level.total }, (_, i) => ({
    question: `Level ${level.level} - Question ${i + 1}`,
    options: ["Option A", "Option B", "Option C", "Option D"],
    correct: Math.floor(Math.random() * 4)
  }));
}*/

// Render current question
function renderQuestion() {
  const q = currentQuestions[currentQuestionIndex];
  questionText.textContent = q.question;
  optionsContainer.innerHTML = "";

  q.options.forEach((option, index) => {
    const btn = document.createElement("button");
    btn.textContent = option;
    btn.className =
      "w-full text-left px-4 py-3 mb-2 rounded-lg bg-purple-100 hover:bg-purple-200 transition";
    btn.onclick = () => checkAnswer(index, btn);
    optionsContainer.appendChild(btn);
  });

  updateScoreBoard();
}

// Check answer
function checkAnswer(selectedIndex, btn) {
  const q = currentQuestions[currentQuestionIndex];

  if (selectedIndex === q.correct) {
    score++;
    btn.classList.add("bg-green-400", "text-white");
    correctSound.play();
  } else {
    btn.classList.add("bg-red-400", "text-white");
    wrongSound.play();

    // highlight correct option
    [...optionsContainer.children][q.correct].classList.add(
      "bg-green-400",
      "text-white"
    );
  }

  // disable all buttons
  [...optionsContainer.children].forEach((b) => (b.disabled = true));

  // Next question after 1s
  setTimeout(() => {
    currentQuestionIndex++;
    if (currentQuestionIndex < currentQuestions.length) {
      renderQuestion();
    } else {
      endLevel();
    }
  }, 1000);
}

// End level and check pass
function endLevel() {
  const level = levels[currentLevelIndex];
  if (score >= level.pass) {
    levelUpSound.play();
    alert(`🎉 Congratulations! You passed Level ${level.level}.`);
    currentLevelIndex++;
    if (currentLevelIndex < levels.length) {
      startLevel();
    } else {
      alert("👑 You completed all levels and earned the crown!");
    }
  } else {
    gameOverSound.play();
    alert(
      `❌ Game Over! You scored ${score} out of ${level.total}. Required: ${level.pass}.`
    );
    resetGame();
  }
}

// Start level
function startLevel() {
  const level = levels[currentLevelIndex];
  currentQuestions = loadQuestions(level);
  currentQuestionIndex = 0;
  score = 0;
  updateScoreBoard();
  renderQuestion();
  levelDisplay.textContent = `Level ${level.level}`;
}

// Update scoreboard
function updateScoreBoard() {
  const level = levels[currentLevelIndex];
  scoreDisplay.textContent = `Score: ${score}/${level.total}`;
}

// Reset game
function resetGame() {
  currentLevelIndex = 0;
  score = 0;
  startLevel();
}

// Start the first level
startLevel();
