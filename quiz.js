// === EduKids Quiz ===

// time per question (seconds)
const QUESTION_TIME = 15;

// pass mark settings
const PASS_MARKS = {
  1: { total: 50, pass: 45 },
  2: { total: 60, pass: 55 },
  3: { total: 80, pass: 75 },
};

// state
let questionsByLevel = {};
let currentLevel = 1;
let currentIndex = 0;
let score = 0;
let timerInterval = null;

const urlParams = new URLSearchParams(window.location.search);
const subjectParam = urlParams.get("subject");

// DOM
const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const progressText = document.getElementById("progress-text");
const progressFill = document.getElementById("progress-fill");
const timerEl = document.getElementById("timer");
const levelStatus = document.getElementById("level-status");
const quizBoard = document.getElementById("quiz-board");

// sounds
const correctSound = new Audio("sounds/correct.mp3");
const wrongSound = new Audio("sounds/wrong.mp3");

// load JSON
fetch("questions.json")
  .then(res => res.json())
  .then(data => {
    const subjectData = data[subjectParam];
    if (!subjectData) {
      questionEl.textContent = `No questions for ${subjectParam}`;
      return;
    }
    questionsByLevel = subjectData;
    console.log("Loaded questions for", subjectParam, questionsByLevel);
    startLevel(1);
  })
  .catch(err => {
    console.error("Could not load questions.json", err);
    questionEl.textContent = "Error loading questions.";
  });

function startLevel(level) {
  currentLevel = level;
  currentIndex = 0;
  score = 0;
  loadQuestion();
}

function loadQuestion() {
  clearInterval(timerInterval);

  const levelKey = `level${currentLevel}`;
  const questions = questionsByLevel[levelKey];

  // if no questions or finished
  if (!Array.isArray(questions) || currentIndex >= questions.length) {
    // check pass mark
    const pass = PASS_MARKS[currentLevel].pass;
    if (score >= pass && currentLevel < 3) {
      currentLevel++;
      currentIndex = 0;
      score = 0;
      loadQuestion();
    } else {
      endQuiz();
    }
    return;
  }

  const q = questions[currentIndex];
  questionEl.textContent = q.question;
  levelStatus.textContent = `Level ${currentLevel}`;
  progressText.textContent = `Question ${currentIndex + 1} of ${questions.length}`;
  progressFill.style.width = ((currentIndex + 1) / questions.length) * 100 + "%";

  optionsEl.innerHTML = "";
  q.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = opt;
    btn.onclick = () => checkAnswer(opt, q.correct);
    optionsEl.appendChild(btn);
  });

  startTimer();
}

function startTimer() {
  let timeLeft = QUESTION_TIME;
  timerEl.textContent = timeLeft;
  timerInterval = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      nextQuestion();
    }
  }, 1000);
}

function checkAnswer(selected, correct) {
  clearInterval(timerInterval);

  const buttons = optionsEl.querySelectorAll("button");
  buttons.forEach(btn => {
    btn.disabled = true;
    if (btn.textContent === correct) {
      btn.classList.add("correct");
    }
    if (btn.textContent === selected && selected !== correct) {
      btn.classList.add("wrong");
    }
  });

  if (selected === correct) {
    score++;
    correctSound.play();
    showEmoji("🎉");
  } else {
    wrongSound.play();
    showEmoji("😢");
  }

  setTimeout(nextQuestion, 1500);
}

function nextQuestion() {
  currentIndex++;
  loadQuestion();
}

function showEmoji(emoji) {
  const e = document.createElement("div");
  e.textContent = emoji;
  e.className = "bounce-emoji";
  e.style.position = "absolute";
  e.style.top = "50%";
  e.style.left = "50%";
  e.style.fontSize = "3rem";
  e.style.transform = "translate(-50%, -50%)";
  e.style.animation = "bounce 1s ease forwards";
  document.body.appendChild(e);
  setTimeout(() => e.remove(), 1000);
}
function endQuiz() {
  const pass = PASS_MARKS[currentLevel].pass;
  const total = PASS_MARKS[currentLevel].total;

  // Build message
  let html = `<h2>Level ${currentLevel} Completed!</h2>
  <p>You scored <strong>${score}</strong> out of <strong>${total}</strong> in ${subjectParam}</p>`;

  // Buttons
  if (score >= pass && currentLevel < 3) {
    // passed and can go to next level
    html += `<button id="next-level-btn" class="option-btn" style="background:#4caf50;color:#fff;">Proceed to Level ${currentLevel + 1}</button>`;
  } else if (score < pass) {
    // failed – retry
    html += `<button id="retry-btn" class="option-btn" style="background:#f44336;color:#fff;">Retry Level ${currentLevel}</button>`;
  } else if (score >= pass && currentLevel === 3) {
    // finished last level
    html += `<p>🎉 Congratulations! You have completed all levels of ${subjectParam}.</p>`;
  }

  // always show back to subjects
  html += `<a href="subjects.html" class="option-btn" style="display:block;margin-top:10px;background:#673ab7;color:#fff;text-align:center;">Back to Subjects</a>`;

  quizBoard.innerHTML = html;

  // attach events
  const nextBtn = document.getElementById("next-level-btn");
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      currentLevel++;
      currentIndex = 0;
      score = 0;
      loadQuestion();
    });
  }

  const retryBtn = document.getElementById("retry-btn");
  if (retryBtn) {
    retryBtn.addEventListener("click", () => {
      currentIndex = 0;
      score = 0;
      loadQuestion();
    });
  }

  progressFill.style.width = "100%";
  progressText.textContent = "Completed!";
  levelStatus.textContent = `Level ${currentLevel}`;
}

/*
function endQuiz() {
  quizBoard.innerHTML = `
    <h2>Quiz Completed!</h2>
    <p>You scored <strong>${score}</strong> in Level ${currentLevel} of ${subjectParam}</p>
    <a href="subjects.html" class="btn">Back to Subjects</a>
  `;
}*/

// bounce animation
const style = document.createElement("style");
style.textContent = `
.option-btn {
  display:block;
  width:100%;
  margin:6px 0;
  padding:10px;
  border-radius:6px;
  border:1px solid #ccc;
  cursor:pointer;
  background:#f9f9f9;
}
.option-btn.correct { background:#c8f7c5; border-color:#2ecc71; }
.option-btn.wrong { background:#f7c5c5; border-color:#e74c3c; }
.bounce-emoji { pointer-events:none; }
@keyframes bounce {
  0% { transform:translate(-50%,-50%) scale(0.5); opacity:0; }
  50% { transform:translate(-50%,-60%) scale(1.2); opacity:1; }
  100% { transform:translate(-50%,-50%) scale(1); opacity:0; }
}
`;
document.head.appendChild(style);
