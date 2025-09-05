// === EduKids Quiz ===
const QUESTION_TIME = 15;

const LEVEL_RULES = {
  1: {questions:50, pass:45},
  2: {questions:60, pass:55},
  3: {questions:80, pass:75}
};

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

// modal
const modal = document.getElementById("welcomeModal");
const readyBtn = document.getElementById("readyBtn");
const closeBtn = document.querySelector(".close-btn");

readyBtn.onclick = () => modal.style.display = "none";
closeBtn.onclick = () => modal.style.display = "none";

// load JSON
fetch("questions.json")
  .then(res => res.json())
  .then(data => {
    // match subject exactly
    const subjectData = data[subjectParam];
    if (!subjectData) {
      questionEl.textContent = `No questions found for ${subjectParam}`;
      return;
    }
    questionsByLevel = subjectData;
    startLevel(1); // always start from level 1
  })
  .catch(err => {
    console.error(err);
    questionEl.textContent = "Error loading questions.";
  });

/*fetch("questions.json")
  .then(res => res.json())
  .then(data => {
    if (!data[subjectParam]) {
      questionEl.textContent = `No questions for ${subjectParam}`;
      return;
    }
    questionsByLevel = data[subjectParam];
    // wait for ready button click then start level 1
    readyBtn.addEventListener("click", ()=> startLevel(1));
  })
  .catch(err => {
    console.error("Could not load questions.json", err);
    questionEl.textContent = "Error loading questions.";
  });*/

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
  // check pass mark
    handleLevelCompletion();
    return;
  }
 /* if (!questions || currentIndex >= questions.length) {
    // check pass mark
    handleLevelCompletion();
    return;
  }*/

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

function handleLevelCompletion() {
  const needed = LEVEL_RULES[currentLevel].pass;
  const total = questionsByLevel[`level${currentLevel}`].length;
  if (score >= needed && currentLevel < 3) {
    quizBoard.innerHTML = `<h2>Great job!</h2>
    <p>You scored ${score}/${total}. You passed Level ${currentLevel}!</p>
    <button onclick="startLevel(${currentLevel+1})">Start Level ${currentLevel+1}</button>`;
  } else if (currentLevel < 3) {
    quizBoard.innerHTML = `<h2>Level ${currentLevel} Completed</h2>
    <p>You scored ${score}/${total}. You needed ${needed} to pass.</p>
    <a href="subjects.html" class="btn">Back to Subjects</a>`;
  } else {
    endQuiz();
  }
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
  quizBoard.innerHTML = `
    <h2>Quiz Completed!</h2>
    <p>You scored <strong>${score}</strong> in Level ${currentLevel} of ${subjectParam}</p>
    <a href="subjects.html" class="btn">Back to Subjects</a>
  `;
}

// bounce animation style
const style = document.createElement("style");
style.textContent = `
.option-btn {
  display:block;width:100%;margin:6px 0;padding:10px;
  border-radius:6px;border:1px solid #ccc;
  cursor:pointer;background:#f9f9f9;
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
