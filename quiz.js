let questions = {};
let current = 0, score = 0, timer, timeLeft = 15;
let subject = "Mathematics"; // default
let level = "level1";

// Preload sounds
const sounds = {
  flip: new Audio("sounds/flip.mp3"),
  click: new Audio("sounds/click.mp3"),
  correct: new Audio("sounds/correct.mp3"),
  wrong: new Audio("sounds/wrong.mp3")
};

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function getParams() {
  const params = new URLSearchParams(window.location.search);
  subject = params.get("subject") || "Mathematics";
  level = params.get("level") || "level1";
}

// Load questions.json directly from GitHub repo
async function loadQuestions() {
  try {
    const res = await fetch("questions.json");
    const data = await res.json();
    if (data[subject] && data[subject][level]) {
      questions = shuffle([...data[subject][level]]);
      renderQuestion();
    } else {
      document.getElementById("quiz-board").innerHTML =
        `<h2>No questions available for ${subject} - ${level}</h2>`;
    }
  } catch (err) {
    console.error("Error loading questions:", err);
  }
}

function startTimer() {
  clearInterval(timer);
  timeLeft = 15;
  updateTimer();
  timer = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) {
      clearInterval(timer);
      nextQuestion();
    }
  }, 1000);
}

function updateTimer() {
  const timerEl = document.getElementById("timer");
  let mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  let secs = String(timeLeft % 60).padStart(2, "0");
  timerEl.textContent = `${mins}:${secs}`;
}

function renderQuestion() {
  const q = questions[current];
  if (!q) return showResult();

  document.getElementById("question").textContent = q.question;

  const optionsBox = document.getElementById("options");
  optionsBox.innerHTML = "";
  let shuffled = shuffle([...q.options]);

  shuffled.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = opt;
    btn.onclick = () => checkAnswer(btn, q.correct);
    btn.addEventListener("mousedown", () => sounds.click.play());
    optionsBox.appendChild(btn);
  });

  // Progress
  document.getElementById("progress-text").textContent =
    `Question ${current + 1} of ${questions.length}`;
  document.getElementById("progress-fill").style.width =
    `${((current + 1) / questions.length) * 100}%`;

  // Level indicator
  document.getElementById("level-status").textContent = level.toUpperCase();

  sounds.flip.play();
  startTimer();
}

function checkAnswer(btn, correct) {
  clearInterval(timer);
  const allBtns = document.querySelectorAll(".option-btn");

  allBtns.forEach(b => {
    b.disabled = true;
    if (b.textContent === correct) {
      b.style.background = "#4CAF50";
      b.style.color = "#fff";
    }
    if (b === btn && b.textContent !== correct) {
      b.style.background = "#e74c3c";
      b.style.color = "#fff";
    }
  });

  if (btn.textContent === correct) {
    score++;
    sounds.correct.play();
  } else {
    sounds.wrong.play();
  }

  setTimeout(nextQuestion, 1000);
}

function nextQuestion() {
  current++;
  if (current < questions.length) {
    renderQuestion();
  } else {
    showResult();
  }
}

function showResult() {
  const board = document.getElementById("quiz-board");
  board.innerHTML = `
    <h2>🎉 Quiz Finished!</h2>
    <p>Your Score: ${score} / ${questions.length}</p>
    <button onclick="location.reload()">Retry</button>
  `;
}

// Start
getParams();
loadQuestions();











/*
let questions = {};
let currentSubject = "Mathematics"; // later you can pass this dynamically
let currentLevel = "level1";
let currentIndex = 0;
let score = 0;
let timer;
let timePerQuestion = 15; // seconds

// Load questions.json
fetch("questions.json")
  .then(res => res.json())
  .then(data => {
    questions = data;
    startQuiz();
  })
  .catch(err => {
    console.error("Failed to load questions.json:", err);
    document.getElementById("question").innerText = "Error loading questions!";
  });

function startQuiz() {
  currentIndex = 0;
  score = 0;
  loadQuestion();
}

function loadQuestion() {
  const levelQuestions = questions[currentSubject][currentLevel];
  if (currentIndex >= levelQuestions.length) {
    endLevel();
    return;
  }

  const q = levelQuestions[currentIndex];
  document.getElementById("question").innerText = q.question;

  // Shuffle options
  const optionsContainer = document.getElementById("options");
  optionsContainer.innerHTML = "";
  shuffleArray(q.options).forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.innerText = opt;
    btn.onclick = () => checkAnswer(opt, q.correct);
    optionsContainer.appendChild(btn);
  });

  // Progress
  document.getElementById("progress-text").innerText =
    `Question ${currentIndex + 1} of ${levelQuestions.length}`;
  document.getElementById("progress-fill").style.width =
    `${((currentIndex + 1) / levelQuestions.length) * 100}%`;

  // Timer
  resetTimer();
}

function checkAnswer(selected, correct) {
  if (selected === correct) {
    score++;
  }
  currentIndex++;
  setTimeout(loadQuestion, 500); // auto flip to next question
}

function endLevel() {
  alert(`Level complete! Score: ${score}`);
  // Example progression rules
  if (currentLevel === "level1" && score >= 45) {
    if (confirm("Congratulations! Proceed to Level 2?")) {
      currentLevel = "level2";
      startQuiz();
    }
  } else if (currentLevel === "level2" && score >= 55) {
    if (confirm("Great job! Proceed to Level 3?")) {
      currentLevel = "level3";
      startQuiz();
    }
  } else if (currentLevel === "level3" && score >= 75) {
    alert("🏆 You earned the crown! Well done!");
  } else {
    alert("Try again!");
    startQuiz();
  }
}

// Timer functions
function resetTimer() {
  clearInterval(timer);
  let timeLeft = timePerQuestion;
  document.getElementById("timer").innerText = formatTime(timeLeft);

  timer = setInterval(() => {
    timeLeft--;
    document.getElementById("timer").innerText = formatTime(timeLeft);

    if (timeLeft <= 0) {
      clearInterval(timer);
      currentIndex++;
      loadQuestion();
    }
  }, 1000);
}

function formatTime(seconds) {
  return seconds < 10 ? `00:0${seconds}` : `00:${seconds}`;
}

// Utility: shuffle array
function shuffleArray(array) {
  return [...array].sort(() => Math.random() - 0.5);
}
