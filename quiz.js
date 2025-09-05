<script>
const QUESTION_TIME = 15;
const PASS_MARKS = {
  1: { total: 50, pass: 45 },
  2: { total: 60, pass: 55 },
  3: { total: 80, pass: 75 },
};

let questionsByLevel = {};
let currentLevel = 1;
let currentIndex = 0;
let score = 0;
let timerInterval = null;

const subjectParam = new URLSearchParams(window.location.search).get("subject");

const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const progressText = document.getElementById("progress-text");
const progressFill = document.getElementById("progress-fill");
const timerEl = document.getElementById("timer");
const levelStatus = document.getElementById("level-status");
const quizBoard = document.getElementById("quiz-board");

// modal DOM
const welcomeModal = document.getElementById("welcomeModal");
const closeWelcomeBtn = document.getElementById("closeWelcomeBtn");
const startQuizBtn = document.getElementById("startQuizBtn");
const levelModal = document.getElementById("levelModal");
const levelModalTitle = document.getElementById("levelModalTitle");
const levelModalText = document.getElementById("levelModalText");
const nextLevelBtn = document.getElementById("nextLevelBtn");

// show welcome modal on load
window.addEventListener("load", () => {
  welcomeModal.style.display = "flex";
});

// close and start
closeWelcomeBtn.addEventListener("click", () => {
  welcomeModal.style.display = "none";
});
startQuizBtn.addEventListener("click", () => {
  welcomeModal.style.display = "none";
  startLevel(1);
});

nextLevelBtn.addEventListener("click", () => {
  levelModal.style.display = "none";
  loadQuestion();
});

// sounds
const correctSound = new Audio("sounds/correct.mp3");
const wrongSound = new Audio("sounds/wrong.mp3");

// load questions
fetch("questions.json")
  .then(r => r.json())
  .then(data => {
    questionsByLevel = data[subjectParam];
    if (!questionsByLevel) {
      questionEl.textContent = `No questions for ${subjectParam}`;
    }
  })
  .catch(err => {
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

  if (!Array.isArray(questions) || currentIndex >= questions.length) {
    const pass = PASS_MARKS[currentLevel].pass;
    if (score >= pass && currentLevel < 3) {
      // passed
      levelModalTitle.textContent = `🎉 You passed Level ${currentLevel}`;
      levelModalText.textContent = `Score: ${score}. Proceeding to Level ${currentLevel + 1}`;
      currentLevel++;
      currentIndex = 0;
      score = 0;
      levelModal.style.display = "flex";
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
    if (btn.textContent === correct) btn.classList.add("correct");
    if (btn.textContent === selected && selected !== correct) btn.classList.add("wrong");
  });

  if (selected === correct) {
    score++;
    correctSound.play();
  } else {
    wrongSound.play();
  }

  setTimeout(nextQuestion, 1000);
}

function nextQuestion() {
  currentIndex++;
  loadQuestion();
}

function endQuiz() {
  let html = `<h2>Level ${currentLevel} Completed!</h2>
  <p>You scored <strong>${score}</strong> out of <strong>${PASS_MARKS[currentLevel].total}</strong> in ${subjectParam}</p>`;

  if (score < PASS_MARKS[currentLevel].pass) {
    html += `<button id="retry-btn" class="option-btn" style="background:#f44336;color:#fff;">Retry Level ${currentLevel}</button>`;
  } else if (score >= PASS_MARKS[currentLevel].pass && currentLevel === 3) {
    html += `<p>🎉 Congratulations! You have completed all levels of ${subjectParam}.</p>`;
  }

  html += `<a href="subjects.html" class="option-btn" style="display:block;margin-top:10px;background:#673ab7;color:#fff;text-align:center;">Back to Subjects</a>`;
  quizBoard.innerHTML = html;

  const retryBtn = document.getElementById("retry-btn");
  if (retryBtn) {
    retryBtn.addEventListener("click", () => {
      currentIndex = 0;
      score = 0;
      loadQuestion();
    });
  }
}
</script>
