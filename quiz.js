let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let timer;
let timeLeft = 15;

let level = 1;
let levelConfigs = {
  1: { total: 50, pass: 45 },
  2: { total: 60, pass: 55 },
  3: { total: 80, pass: 75 }
};

// DOM Elements
const questionText = document.getElementById("question-text");
const optionsContainer = document.getElementById("options-container");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");
const feedback = document.getElementById("feedback");
const timerDisplay = document.getElementById("timer");

const flipSound = document.getElementById("flip-sound");
const correctSound = document.getElementById("correct-sound");
const wrongSound = document.getElementById("wrong-sound");

// Fetch questions.json
async function loadQuestions() {
  const res = await fetch("questions.json");
  const data = await res.json();
  questions = shuffleArray(data[`level${level}`]);
  startQuiz();
}

// Start quiz
function startQuiz() {
  currentQuestionIndex = 0;
  score = 0;
  feedback.innerHTML = "";
  showQuestion();
}

// Show a question
function showQuestion() {
  if (currentQuestionIndex >= levelConfigs[level].total) {
    return endQuiz();
  }

  const q = questions[currentQuestionIndex];
  questionText.textContent = q.question;
  optionsContainer.innerHTML = "";

  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.className = "option-btn";
    btn.onclick = () => selectAnswer(opt, q.answer);
    optionsContainer.appendChild(btn);
  });

  updateProgress();
  startTimer();
  playSound(flipSound);
}

// Handle answer
function selectAnswer(selected, correct) {
  clearInterval(timer);

  if (selected === correct) {
    score++;
    feedback.textContent = "✅ Correct!";
    playSound(correctSound);
  } else {
    feedback.textContent = "❌ Wrong!";
    playSound(wrongSound);
  }

  setTimeout(() => {
    feedback.textContent = "";
    currentQuestionIndex++;
    showQuestion();
  }, 1000);
}

// End quiz
function endQuiz() {
  clearInterval(timer);

  const config = levelConfigs[level];
  let message = `You scored ${score} out of ${config.total}.`;

  if (score >= config.pass) {
    if (level < 3) {
      message += ` 🎉 Congratulations! You passed Level ${level}. Proceed to Level ${level + 1}?`;
      if (confirm(message)) {
        level++;
        loadQuestions();
        return;
      }
    } else {
      message += " 👑 You won the Crown! Excellent job!";
    }
  } else {
    message += " ❌ You did not pass. Try again.";
  }

  feedback.innerHTML = message;
}

// Timer per question
function startTimer() {
  clearInterval(timer);
  timeLeft = 15;
  timerDisplay.textContent = `${timeLeft}s`;

  timer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = `${timeLeft}s`;

    if (timeLeft <= 0) {
      clearInterval(timer);
      feedback.textContent = "⏰ Time's up!";
      playSound(wrongSound);
      setTimeout(() => {
        feedback.textContent = "";
        currentQuestionIndex++;
        showQuestion();
      }, 1000);
    }
  }, 1000);
}

// Progress update
function updateProgress() {
  const total = levelConfigs[level].total;
  progressText.textContent = `Question ${currentQuestionIndex + 1} of ${total}`;
  progressBar.style.width = `${((currentQuestionIndex + 1) / total) * 100}%`;
}

// Helpers
function shuffleArray(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function playSound(sound) {
  sound.currentTime = 0;
  sound.play();
}

// Start
loadQuestions();
