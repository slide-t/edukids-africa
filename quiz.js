

// quiz.js — EduKids Quiz with level-size & pass-mark rules
// time per question (seconds)
const QUESTION_TIME = 15;

// expected sizes and pass marks (user-specified)
const EXPECTED = {
  level1: { size: 50, pass: 45 },
  level2: { size: 60, pass: 55 },
  level3: { size: 80, pass: 75 }
};

// state
let questionsByLevel = {};   // object for the chosen subject (level1/level2/level3 arrays)
let currentLevel = 1;        // 1,2,3
let currentIndex = 0;
let levelScore = 0;          // score for current level
let perLevelScores = { 1: 0, 2: 0, 3: 0 }; // store scores per level
let timerInterval = null;

// get subject from URL (default to Mathematics)
const urlParams = new URLSearchParams(window.location.search);
const subjectParam = urlParams.get("subject") || "Mathematics";

// DOM elements (these IDs must exist in your quiz.html)
const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const progressText = document.getElementById("progress-text");
const progressFill = document.getElementById("progress-fill");
const timerEl = document.getElementById("timer");
const levelStatus = document.getElementById("level-status");
const quizBoard = document.getElementById("quiz-board");

// sounds (adjust paths if needed)
const correctSound = new Audio("sounds/correct.mp3");
const wrongSound = new Audio("sounds/wrong.mp3");

// create emoji feedback element above question (if not already present)
let emojiDiv = document.getElementById("emoji-feedback");
if (!emojiDiv) {
  emojiDiv = document.createElement("div");
  emojiDiv.id = "emoji-feedback";
  emojiDiv.style.fontSize = "3rem";
  emojiDiv.style.textAlign = "center";
  emojiDiv.style.height = "3.5rem";
  emojiDiv.style.marginBottom = "6px";
  // insert before question
  if (questionEl && questionEl.parentNode) questionEl.parentNode.insertBefore(emojiDiv, questionEl);
}

// inject small CSS needed for feedback and modals if absent
(function injectStyles() {
  const css = `
  .option-btn.correct { background-color: #4CAF50 !important; color: #fff; }
  .option-btn.wrong { background-color: #f44336 !important; color: #fff; }
  .bounce-emoji { pointer-events:none; animation: bounce 900ms ease forwards; font-size: 3rem; }
  @keyframes bounce {
    0% { transform: translateY(10px) scale(0.6); opacity: 0; }
    40% { transform: translateY(-18px) scale(1.15); opacity: 1; }
    100% { transform: translateY(0) scale(1); opacity: 0; }
  }
  /* level summary modal *
  .level-modal-overlay {
    position: fixed; inset: 0; display:flex; align-items:center; justify-content:center;
    background: rgba(44,26,71,0.7); z-index: 9999;
  }
  .level-modal {
    max-width: 520px; width: 92%; background: #4a2f8f; color: #fff; padding: 22px; border-radius: 12px; text-align:center;
    box-shadow: 0 12px 30px rgba(0,0,0,0.4);
  }
  .level-modal h3 { margin: 0 0 8px; font-size: 1.4rem; }
  .level-modal p { margin: 8px 0; color: #efeefe; }
  .level-modal .btn { display:block; width:100%; padding:12px; margin-top:12px; border-radius:8px; border:0; cursor:pointer; font-weight:700; }
  .btn-primary { background: #ffcc00; color:#222; }
  .btn-secondary { background: transparent; color: #fff; border: 2px solid rgba(255,255,255,0.18); }
  .close-x { position:absolute; top:12px; right:16px; background:transparent; border:none; color:#fff; font-size:1.2rem; cursor:pointer; }
  `;
  const s = document.createElement("style");
  s.appendChild(document.createTextNode(css));
  document.head.appendChild(s);
})();

// load questions.json (expects nested structure: data[subject].level1/...)
// on fetch error show friendly message
fetch("questions.json")
  .then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  })
  .then(data => {
    if (!data[subjectParam]) {
      questionEl.textContent = `No questions found for "${subjectParam}".`;
      return;
    }
    questionsByLevel = data[subjectParam];
    // start at level 1; show welcome modal (if you included one externally it can also be used)
    // start quiz after a short delay so modal can be shown first if present
    setTimeout(() => startLevel(1), 200);
  })
  .catch(err => {
    console.error("Could not load questions.json", err);
    questionEl.textContent = "Error loading questions.";
  });

// start a specified level (1,2,3)
function startLevel(levelNum) {
  currentLevel = levelNum;
  currentIndex = 0;
  levelScore = 0;
  levelStatus.textContent = `Level ${currentLevel}`;
  // show first question or show immediate level summary when no questions
  const levelKey = `level${currentLevel}`;
  const arr = questionsByLevel[levelKey];
  if (!arr || arr.length === 0) {
    // nothing to do — skip to next or end
    if (currentLevel < 3) startLevel(currentLevel + 1);
    else showFinalSummary();
    return;
  }
  loadQuestion();
}

// load current question in currentQuestions
function loadQuestion() {
  clearInterval(timerInterval);
  emojiDiv.textContent = ""; // clear emoji
  const levelKey = `level${currentLevel}`;
  const arr = questionsByLevel[levelKey] || [];
  if (currentIndex >= arr.length) {
    // complete level
    completeLevel();
    return;
  }
  const q = arr[currentIndex];

  // render
  questionEl.textContent = q.question;
  optionsEl.innerHTML = "";
  // shuffle options for variety
  const opts = shuffleArray(q.options || []);
  opts.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = opt;
    btn.style.fontSize = "1.1rem";
    btn.addEventListener("click", () => checkAnswer(btn, opt, q.correct));
    optionsEl.appendChild(btn);
  });

  // progress & timer
  progressText.textContent = `Question ${currentIndex + 1} of ${arr.length}`;
  progressFill.style.width = `${((currentIndex) / arr.length) * 100}%`;

  startTimer(QUESTION_TIME);
}

// timer
function startTimer(sec) {
  let remaining = sec;
  timerEl.textContent = formatTime(remaining);
  timerInterval = setInterval(() => {
    remaining--;
    timerEl.textContent = formatTime(remaining);
    if (remaining <= 0) {
      clearInterval(timerInterval);
      // mark unanswered (no score), move on
      // disable buttons
      const allBtns = optionsEl.querySelectorAll(".option-btn");
      allBtns.forEach(b => b.disabled = true);
      // briefly show correct answer then advance
      const levelKey = `level${currentLevel}`;
      const arr = questionsByLevel[levelKey] || [];
      const correct = arr[currentIndex] ? arr[currentIndex].correct : null;
      if (correct) {
        allBtns.forEach(b => { if (b.textContent === correct) b.classList.add("correct"); });
        showEmoji("⏳");
      }
      setTimeout(() => { currentIndex++; loadQuestion(); }, 1200);
    }
  }, 1000);
}

function formatTime(s) {
  return s < 10 ? `00:0${s}` : `00:${s}`;
}

// answer handling
function checkAnswer(button, selected, correct) {
  clearInterval(timerInterval);
  // disable all
  const allBtns = optionsEl.querySelectorAll(".option-btn");
  allBtns.forEach(b => b.disabled = true);

  if (selected === correct) {
    levelScore++;
    perLevelScores[currentLevel] = levelScore;
    playSound("correct");
    button.classList.add("correct");
    showEmoji("✅");
  } else {
    playSound("wrong");
    button.classList.add("wrong");
    // highlight the correct one
    allBtns.forEach(b => { if (b.textContent === correct) b.classList.add("correct"); });
    showEmoji("❌");
  }

  // small delay to let kids see feedback
  setTimeout(() => {
    currentIndex++;
    loadQuestion();
  }, 1000);
}

// complete level -> evaluate pass mark and show level summary modal
function completeLevel() {
  clearInterval(timerInterval);
  const levelKey = `level${currentLevel}`;
  const arr = questionsByLevel[levelKey] || [];
  const actualCount = arr.length;
  const expected = EXPECTED[levelKey] ? EXPECTED[levelKey].size : actualCount;
  const pass = EXPECTED[levelKey] ? EXPECTED[levelKey].pass : Math.ceil(actualCount * 0.7);

  // if actualCount < expected, scale pass threshold proportionally
  const required = actualCount < expected
    ? Math.max(1, Math.ceil(pass * (actualCount / expected)))
    : pass;

  // levelScore already tracked
  perLevelScores[currentLevel] = levelScore;

  const passed = levelScore >= required;

  // show modal summary for the level
  showLevelSummaryModal({
    level: currentLevel,
    got: levelScore,
    total: actualCount,
    required,
    passed
  });
}

function showLevelSummaryModal({ level, got, total, required, passed }) {
  // remove existing modal if any
  const existing = document.getElementById("level-summary-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "level-summary-overlay";
  overlay.className = "level-modal-overlay";

  const modal = document.createElement("div");
  modal.className = "level-modal";
  modal.style.position = "relative";

  const closeBtn = document.createElement("button");
  closeBtn.className = "close-x";
  closeBtn.innerHTML = "×";
  closeBtn.onclick = () => overlay.remove();

  const title = document.createElement("h3");
  title.textContent = passed ? `Level ${level} Passed! 🎉` : `Level ${level} Completed`;

  const p1 = document.createElement("p");
  p1.innerHTML = `You scored <strong>${got}</strong> out of <strong>${total}</strong>.`;

  const p2 = document.createElement("p");
  p2.innerHTML = `Pass mark required: <strong>${required}</strong>.`;

  const actionContainer = document.createElement("div");
  // primary button: proceed or retry
  const primary = document.createElement("button");
  primary.className = "btn btn-primary";
  if (passed) {
    if (level < 3) primary.textContent = `Proceed to Level ${level + 1}`;
    else primary.textContent = `Finish & View Summary`;
  } else {
    primary.textContent = `Retry Level ${level}`;
  }
  primary.onclick = () => {
    overlay.remove();
    if (passed) {
      if (level < 3) {
        // start next level
        startLevel(level + 1);
      } else {
        // final summary
        showFinalSummary();
      }
    } else {
      // retry same level: reset the level score and restart
      levelScore = 0;
      perLevelScores[level] = 0;
      startLevel(level);
    }
  };

  // secondary: go back to subjects/home
  const secondary = document.createElement("button");
  secondary.className = "btn btn-secondary";
  secondary.textContent = "Back to Subjects";
  secondary.onclick = () => {
    overlay.remove();
    window.location.href = "subjects.html";
  };

  modal.appendChild(closeBtn);
  modal.appendChild(title);
  modal.appendChild(p1);
  modal.appendChild(p2);
  modal.appendChild(primary);
  modal.appendChild(secondary);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

// final summary at end of level3 (or if no more levels)
function showFinalSummary() {
  // remove existing overlay if any
  const existing = document.getElementById("level-summary-overlay");
  if (existing) existing.remove();

  // compute totals (sum of available questions across levels)
  const levelKeys = ["level1", "level2", "level3"];
  let totalQuestions = 0;
  let totalCorrect = 0;
  levelKeys.forEach((lk, idx) => {
    const arr = questionsByLevel[lk] || [];
    totalQuestions += arr.length;
    const sc = perLevelScores[idx + 1] || 0;
    totalCorrect += sc;
  });

  // build final summary
  const overlay = document.createElement("div");
  overlay.id = "level-summary-overlay";
  overlay.className = "level-modal-overlay";

  const modal = document.createElement("div");
  modal.className = "level-modal";

  const title = document.createElement("h3");
  title.textContent = `Quiz Complete — ${subjectParam}`;

  const p1 = document.createElement("p");
  p1.innerHTML = `Total correct: <strong>${totalCorrect}</strong> of <strong>${totalQuestions}</strong> questions.`;

  const p2 = document.createElement("p");
  const percent = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  p2.innerHTML = `Overall score: <strong>${percent}%</strong>.`;

  const details = document.createElement("div");
  details.style.marginTop = "10px";
  details.style.textAlign = "left";
  details.style.background = "rgba(255,255,255,0.05)";
  details.style.padding = "10px";
  details.style.borderRadius = "8px";
  details.innerHTML = `
    <strong>Per-level</strong>
    <ul style="padding-left:18px; margin:8px 0 0 0;">
      <li>Level 1: ${perLevelScores[1]||0} / ${ (questionsByLevel.level1||[]).length }</li>
      <li>Level 2: ${perLevelScores[2]||0} / ${ (questionsByLevel.level2||[]).length }</li>
      <li>Level 3: ${perLevelScores[3]||0} / ${ (questionsByLevel.level3||[]).length }</li>
    </ul>
  `;

  const restartBtn = document.createElement("button");
  restartBtn.className = "btn btn-primary";
  restartBtn.textContent = "Restart from Level 1";
  restartBtn.onclick = () => {
    overlay.remove();
    perLevelScores = {1:0,2:0,3:0};
    startLevel(1);
  };

  const subjectsBtn = document.createElement("button");
  subjectsBtn.className = "btn btn-secondary";
  subjectsBtn.textContent = "Back to Subjects";
  subjectsBtn.onclick = () => { window.location.href = "subjects.html"; };

  modal.appendChild(title);
  modal.appendChild(p1);
  modal.appendChild(p2);
  modal.appendChild(details);
  modal.appendChild(restartBtn);
  modal.appendChild(subjectsBtn);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

// helper: show small emoji animation near top of quiz
function showEmoji(emoji) {
  emojiDiv.textContent = emoji;
  // add bounce class temporarily
  emojiDiv.classList.add("bounce-emoji");
  setTimeout(() => {
    emojiDiv.classList.remove("bounce-emoji");
    emojiDiv.textContent = "";
  }, 900);
}

// helper: play sounds
function playSound(type) {
  try {
    if (type === "correct") correctSound.play();
    else wrongSound.play();
  } catch (e) {
    // ignore autoplay issues
  }
}

// helper: shuffle
function shuffleArray(arr) {
  return arr.slice().sort(() => Math.random() - 0.5);
}








/*
// === EduKids Quiz ===

// time per question (seconds)
const QUESTION_TIME = 15;

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
    if (!data[subjectParam]) {
      questionEl.textContent = `No questions for ${subjectParam}`;
      return;
    }
    questionsByLevel = data[subjectParam];
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
  if (!questions || currentIndex >= questions.length) {
    // move to next level or end quiz
    if (currentLevel < 3) {
      currentLevel++;
      currentIndex = 0;
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
  quizBoard.innerHTML = `
    <h2>Quiz Completed!</h2>
    <p>You scored <strong>${score}</strong> in Level ${currentLevel} of ${subjectParam}</p>
    <a href="subjects.html" class="btn">Back to Subjects</a>
  `;
}

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

