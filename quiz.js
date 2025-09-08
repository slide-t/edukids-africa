// quiz.js

// DOM Elements
const questionText = document.getElementById("questionText");
const optionsContainer = document.getElementById("optionsContainer");
const progressBar = document.getElementById("progressBar");
const levelDisplay = document.getElementById("levelDisplay");
const scoreDisplay = document.getElementById("scoreDisplay");
const timerCircle = document.getElementById("timerCircle");
const timerText = document.getElementById("timerText");

// State
let questions = [];
let shuffledQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let timer;
let timeLeft = 15;

// Sounds
const correctSound = new Audio("assets/correct.mp3");
const wrongSound = new Audio("assets/wrong.mp3");

// Parse subject + level from query string
const params = new URLSearchParams(window.location.search);
const subject = params.get("subject");
const level = params.get("level"); // Primary or Secondary

if (!subject || !level) {
  alert("Missing subject or level in URL");
  throw new Error("Missing subject or level");
}

// Build correct JSON file path
const quizFile = `questions/${level}/${subject}.json`;

// Load quiz data
async function loadQuiz() {
  try {
    const res = await fetch(quizFile);
    if (!res.ok) throw new Error("Quiz file not found");

    const data = await res.json();
    if (!data) throw new Error("Empty quiz file");

    // Detect if file has subject object wrapper
    if (data[subject]) {
      questions = data[subject]["Level1"] || [];
    } else {
      questions = data;
    }

    if (questions.length === 0) throw new Error("No questions found");

    shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
    startLevel();
  } catch (err) {
    console.error("Error loading quiz:", err);
    questionText.textContent = "Quiz not available.";
  }
}

// Start level
function startLevel() {
  score = 0;
  currentQuestionIndex = 0;
  levelDisplay.textContent = `${level} - Level 1`;
  scoreDisplay.textContent = `Score: 0/${shuffledQuestions.length}`;
  renderQuestion();
}

// Render a question
function renderQuestion() {
  resetState();

  if (currentQuestionIndex >= shuffledQuestions.length) {
    return endLevel();
  }

  const q = shuffledQuestions[currentQuestionIndex];
  questionText.textContent = q.question;

  q.options.forEach(option => {
    const btn = document.createElement("button");
    btn.textContent = option;
    btn.className =
      "w-full px-4 py-2 text-left bg-gray-100 rounded-lg hover:bg-yellow-400 transition";
    btn.onclick = () => selectAnswer(btn, q.answer);
    optionsContainer.appendChild(btn);
  });

  updateProgress();
  startTimer();
}

// Handle answer selection
function selectAnswer(button, correctAnswer) {
  clearInterval(timer);

  const selected = button.textContent;

  if (selected === correctAnswer) {
    button.classList.add("bg-green-500", "text-white");
    correctSound.play();
    score++;
  } else {
    button.classList.add("bg-red-500", "text-white");
    wrongSound.play();
  }

  Array.from(optionsContainer.children).forEach(btn => {
    btn.disabled = true;
    if (btn.textContent === correctAnswer) {
      btn.classList.add("bg-green-500", "text-white");
    }
  });

  scoreDisplay.textContent = `Score: ${score}/${shuffledQuestions.length}`;

  setTimeout(() => {
    currentQuestionIndex++;
    renderQuestion();
  }, 1200);
}

// Timer
function startTimer() {
  clearInterval(timer);
  timeLeft = 15;
  updateTimerDisplay();

  timer = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearInterval(timer);
      autoFail();
    }
  }, 1000);
}

function updateTimerDisplay() {
  timerText.textContent = timeLeft;
  const progress = (timeLeft / 15) * 220;
  timerCircle.setAttribute("stroke-dasharray", "220");
  timerCircle.setAttribute("stroke-dashoffset", `${220 - progress}`);
}

function autoFail() {
  wrongSound.play();
  Array.from(optionsContainer.children).forEach(btn => {
    btn.disabled = true;
  });
  setTimeout(() => {
    currentQuestionIndex++;
    renderQuestion();
  }, 1000);
}

// Reset for next question
function resetState() {
  optionsContainer.innerHTML = "";
  clearInterval(timer);
}

// Progress bar
function updateProgress() {
  const percent = ((currentQuestionIndex + 1) / shuffledQuestions.length) * 100;
  progressBar.style.width = `${percent}%`;
}

// End of level
function endLevel() {
  questionText.textContent = `🎉 You finished! Final Score: ${score}/${shuffledQuestions.length}`;
  optionsContainer.innerHTML = "";
  clearInterval(timer);
}

// Init
loadQuiz();
