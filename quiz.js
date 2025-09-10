// ================================
// quiz.js - EduKids Africa (full, updated)
// ================================

/* Sounds */
const correctSound = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");
const wrongSound = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");
const levelUpSound = new Audio("https://actions.google.com/sounds/v1/cartoon/congratulations.ogg");
const gameOverSound = new Audio("https://actions.google.com/sounds/v1/cartoon/boing.ogg");

/* DOM elements */
const questionText = document.getElementById("questionText");
const optionsContainer = document.getElementById("optionsContainer");
const scoreDisplay = document.getElementById("scoreDisplay");
const levelDisplay = document.getElementById("levelDisplay");
const progressBar = document.getElementById("progressBar");
const clockElement = document.getElementById("clock");
const endModal = document.getElementById("endModal");
const endTitle = document.getElementById("endTitle");
const endMessage = document.getElementById("endMessage");
const retryBtn = document.getElementById("retryBtn");
const nextBtn = document.getElementById("nextBtn");

/* State */
let subject = decodeURIComponent(new URLSearchParams(window.location.search).get("subject") || "Mathematics");
let category = decodeURIComponent(new URLSearchParams(window.location.search).get("category") || "");
let subjectData = {};              
let availableLevels = [];          
let currentLevelIndex = 0;         
let questions = [];                
let currentQuestionIndex = 0;
let score = 0;
const PASS_PERCENT = 75;
const progressKey = `EduKidsProgress_${subject}`; 

/* Timer for each question */
let timerInterval;
let timeLeft = 15;
const circle = document.getElementById("timerCircle");
const timerText = document.getElementById("timerText");
const circleLength = 220; 

function startTimer() {
  clearInterval(timerInterval);
  timeLeft = 15;
  timerText.textContent = timeLeft;
  if(circle) circle.style.strokeDasharray = circleLength;
  if(circle) circle.style.strokeDashoffset = 0;

  timerInterval = setInterval(() => {
    timeLeft--;
    if(timerText) timerText.textContent = timeLeft;
    if(circle) {
      const progress = (timeLeft / 15) * circleLength;
      circle.style.strokeDashoffset = circleLength - progress;
    }
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      handleTimeout();
    }
  }, 1000);
}

function handleTimeout() {
  currentQuestionIndex++;
  renderQuestion();
}

/* Clock */
function startClock() {
  setInterval(() => {
    const now = new Date();
    if (clockElement) clockElement.textContent = now.toLocaleTimeString();
  }, 1000);
}

/* Fisher-Yates shuffle */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/* Load subject data from folder-based path or fallback */
async function loadSubjectData() {
  try {
    let path = "";
    if(category) {
      path = `questions/${category}/${subject}.json`;
    } else {
      path = `questions/${subject}.json`;
    }

    let res = await fetch(path);
    if(!res.ok) {
      console.warn(`Could not load ${path}, falling back to questions.json`);
      res = await fetch("questions.json");
    }

    const data = await res.json();

    if(category && data[category] && data[category][subject]) {
      subjectData = data[category][subject];
    } else if(data[subject]) {
      subjectData = data[subject];
    } else {
      let found = null;
      for(const k of Object.keys(data)) {
        if(typeof data[k] === "object" && data[k][subject]) {
          found = data[k][subject];
          break;
        }
      }
      if(found) subjectData = found;
    }

    if(!subjectData || Object.keys(subjectData).length === 0) {
      console.error("No question data found for subject:", subject);
      alert(`No playable level for ${subject}.`);
      return false;
    }

    availableLevels = Object.keys(subjectData)
      .filter(k => /^Level\s*\d+/i.test(k))
      .sort((a,b) => {
        const na = parseInt(a.match(/\d+/)[0],10);
        const nb = parseInt(b.match(/\d+/)[0],10);
        return na - nb;
      });

    const progress = JSON.parse(localStorage.getItem(progressKey) || "{}");
    let firstNotPassed = availableLevels.findIndex(l => !progress[l]);
    currentLevelIndex = firstNotPassed === -1 ? availableLevels.length : firstNotPassed;

    return true;
  } catch(err) {
    console.error("Failed to load questions", err);
    return false;
  }
}

/* Prepare questions for level */
function prepareLevelQuestions() {
  if(currentLevelIndex < 0 || currentLevelIndex >= availableLevels.length) {
    questions = [];
    return;
  }
  const levelKey = availableLevels[currentLevelIndex];
  const raw = subjectData[levelKey] || [];
  questions = raw.map(q => ({
    question: q.question,
    options: Array.isArray(q.options) ? [...q.options] : [],
    answer: q.answer || q.correct || q.correctAnswer || ""
  }));

  questions = shuffle(questions).map(q => {
    if(!q.options.includes(q.answer)) q.options.push(q.answer);
    q.options = shuffle([...q.options]);
    return q;
  });
}

/* Render question */
function renderQuestion() {
  if(!questions.length || currentQuestionIndex >= questions.length) {
    endLevel();
    return;
  }

  const q = questions[currentQuestionIndex];
  if(questionText) questionText.textContent = q.question;
  if(optionsContainer) {
    optionsContainer.innerHTML = "";
    q.options.forEach(opt => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "w-full text-left px-4 py-3 rounded-lg bg-purple-100 hover:bg-purple-200 transition";
      btn.textContent = opt;
      btn.onclick = () => onSelectOption(opt, btn);
      optionsContainer.appendChild(btn);
    });
  }
  updateScoreBoard();
  startTimer();
}

/* Option selection */
function onSelectOption(selectedText, btnEl) {
  const q = questions[currentQuestionIndex];
  const correct = q.answer;

  if(selectedText === correct) {
    score++;
    if(btnEl) btnEl.classList.add("bg-green-500","text-white");
    correctSound.play();
  } else {
    if(btnEl) btnEl.classList.add("bg-red-500","text-white");
    wrongSound.play();
    const children = [...optionsContainer.children];
    const correctBtn = children.find(c => c.textContent === correct);
    if(correctBtn) correctBtn.classList.add("bg-green-500","text-white");
  }

  [...optionsContainer.children].forEach(c => c.disabled = true);

  setTimeout(() => {
    currentQuestionIndex++;
    if(currentQuestionIndex < questions.length) {
      renderQuestion();
    } else {
      endLevel();
    }
  }, 900);
}

/* Update UI */
function updateScoreBoard() {
  if(!questions || questions.length === 0) {
    if(scoreDisplay) scoreDisplay.textContent = `Score: 0/0`;
    if(progressBar) progressBar.style.width = `0%`;
    return;
  }
  if(scoreDisplay) scoreDisplay.textContent = `Score: ${score}/${questions.length}`;
  const pct = Math.round(((currentQuestionIndex)/questions.length)*100);
  if(progressBar) progressBar.style.width = `${pct}%`;
}

/* End level */
function endLevel() {
  const totalQuestions = questions.length || 1;
  const percent = (score / totalQuestions) * 100;
  const passed = percent >= PASS_PERCENT;
  const levelKey = availableLevels[currentLevelIndex] || "Level 1";

  if(passed) saveLevelPassed(levelKey);

  if(endModal && endTitle && endMessage) {
    if(passed) {
      levelUpSound.play();
      endTitle.textContent = `🎉 Level Passed!`;
      endMessage.textContent = `You scored ${score}/${totalQuestions} (${Math.round(percent)}%). Well done!`;
      retryBtn?.classList.add("hidden");
      nextBtn?.classList.remove("hidden");
    } else {
      gameOverSound.play();
      endTitle.textContent = `❌ Level Failed`;
      endMessage.textContent = `You scored ${score}/${totalQuestions} (${Math.round(percent)}%). You need ${PASS_PERCENT}% to pass.`;
      retryBtn?.classList.remove("hidden");
      nextBtn?.classList.add("hidden");
    }
    endModal.classList.remove("hidden");
    endModal.classList.add("flex");
  }

  clearInterval(timerInterval);
}

/* Hide modal */
function hideEndModal() {
  if(endModal) {
    endModal.classList.add("hidden");
    endModal.classList.remove("flex");
  }
}

/* Save progress */
function saveLevelPassed(levelKey) {
  const obj = JSON.parse(localStorage.getItem(progressKey) || "{}");
  obj[levelKey] = true;
  localStorage.setItem(progressKey, JSON.stringify(obj));
}

/* Start level */
function startLevel() {
  if(currentLevelIndex >= availableLevels.length) {
    alert(`🎓 Congratulations! You played all levels of ${subject}.`);
    return;
  }
  const levelKey = availableLevels[currentLevelIndex];
  if(levelDisplay) levelDisplay.textContent = levelKey;
  prepareLevelQuestions();
  currentQuestionIndex = 0;
  score = 0;
  renderQuestion();
}

/* Button handlers */
retryBtn?.addEventListener("click", () => {
  hideEndModal();
  prepareLevelQuestions();
  currentQuestionIndex = 0;
  score = 0;
  renderQuestion();
});

nextBtn?.addEventListener("click", () => {
  hideEndModal();
  currentLevelIndex++;
  startLevel();
});

/* Initializer */
document.addEventListener("DOMContentLoaded", async () => {
  startClock();
  const ok = await loadSubjectData();
  if(!ok) {
    if(questionText) questionText.textContent = `No quiz data found for "${subject}".`;
    return;
  }
  startLevel();
});

/* Replay / Reset / Refresh buttons (optional, make sure HTML exists) */
window.onload = () => {
  const replayBtns = document.querySelectorAll("[data-replay]");
  replayBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const level = btn.getAttribute("data-replay");
      if(availableLevels.includes(level)) {
        currentLevelIndex = availableLevels.indexOf(level);
        startLevel();
      } else {
        alert(`Level ${level} is not available for ${subject}.`);
      }
    });
  });

  const resetBtn = document.getElementById("resetProgress");
  if(resetBtn) resetBtn.addEventListener("click", () => {
    if(confirm("Are you sure you want to reset your progress?")) {
      localStorage.removeItem(progressKey);
      location.reload();
    }
  });

  const refreshBtn = document.getElementById("refreshQuiz");
  if(refreshBtn) refreshBtn.addEventListener("click", () => location.reload());
};
