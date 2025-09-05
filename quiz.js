// === EduKids Quiz ===

// time per question (seconds)
const QUESTION_TIME = 15;

// questions per level + pass marks
const PASS_MARKS = {
  1: { questions: 50, pass: 45 },
  2: { questions: 60, pass: 55 },
  3: { questions: 80, pass: 75 }
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

// start quiz
function startQuiz() {
  currentLevel = 1;
  currentIndex = 0;
  score = 0;
  loadQuestion();
}

// load question (main engine)
function loadQuestion() {
  clearInterval(timerInterval);

  const levelKey = `level${currentLevel}`;
  const questions = questionsByLevel[levelKey];

  // finished all in this level
  if (!Array.isArray(questions) || currentIndex >= questions.length) {
    const pass = PASS_MARKS[currentLevel].pass;
    if (score >= pass && currentLevel < 3) {
      // passed level
      showLevelModal(currentLevel, score);
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

  // options
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

// timer
function startTimer() {
  let timeLeft = QUESTION_TIME;
  timerEl.textContent = timeLeft;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      nextQuestion();
    }
  }, 1000);
}

// check answer
function checkAnswer(selected, correct) {
  clearInterval(timerInterval);

  const buttons = optionsEl.querySelectorAll("button");
  buttons.forEach(btn => {
    btn.disabled = true;
    if (btn.textContent === correct) btn.classList.add("correct");
    if (btn.textContent === selected && selected !== correct) btn.classList.add("wrong");
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

// next question
function nextQuestion() {
  currentIndex++;
  loadQuestion();
}

// bouncing emoji
function showEmoji(emoji) {
  const e = document.createElement("div");
  e.textContent = emoji;
  e.className = "bounce-emoji";
  e.style.top = "50%";
  e.style.left = "50%";
  e.style.transform = "translate(-50%,-50%)";
  e.style.animation = "bounce 1s ease forwards";
  document.body.appendChild(e);
  setTimeout(() => e.remove(), 1000);
}

// level passed modal
function showLevelModal(level, scoreVal) {
  document.getElementById("levelModalTitle").textContent = `🎉 You passed Level ${level}`;
  document.getElementById("levelModalText").textContent =
    `Your score: ${scoreVal}. Click Continue for Level ${level + 1}.`;
  document.getElementById("levelModal").style.display = "flex";
}

// quiz end
function endQuiz() {
  quizBoard.innerHTML = `
    <h2>Level ${currentLevel} Completed</h2>
    <p>You scored <strong>${score}</strong> out of ${
    questionsByLevel[`level${currentLevel}`].length
  }</p>
    <div class="end-buttons">
      <button class="btn" onclick="retryLevel()">Try Again</button>
      <a href="subjects.html" class="btn">Back to Subjects</a>
    </div>
  `;
}

// retry same level
function retryLevel() {
  currentIndex = 0;
  score = 0;
  loadQuestion();
}

// attach events when DOM ready
window.addEventListener("DOMContentLoaded", () => {
  // load JSON first
  fetch("questions.json")
    .then(res => res.json())
    .then(data => {
      if (!data[subjectParam]) {
        questionEl.textContent = `No questions for ${subjectParam}`;
        return;
      }
      questionsByLevel = data[subjectParam];
    });

  // welcome modal
  document.getElementById("welcomeModal").style.display = "flex";
  document.getElementById("closeWelcome").addEventListener("click", () => {
    document.getElementById("welcomeModal").style.display = "none";
  });
  document.getElementById("startQuizBtn").addEventListener("click", () => {
    document.getElementById("welcomeModal").style.display = "none";
    startQuiz();
  });

  // next level button inside modal
  document.getElementById("nextLevelBtn").addEventListener("click", () => {
    document.getElementById("levelModal").style.display = "none";
    currentLevel++;
    currentIndex = 0;
    score = 0;
    loadQuestion();
  });
});

// style for bounce
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
.bounce-emoji { pointer-events:none; position:absolute; font-size:3rem; }
@keyframes bounce {
  0% { transform:translate(-50%,-50%) scale(0.5); opacity:0; }
  50% { transform:translate(-50%,-60%) scale(1.2); opacity:1; }
  100% { transform:translate(-50%,-50%) scale(1); opacity:0; }
}
`;
document.head.appendChild(style);
