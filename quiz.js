// ================================
// quiz.js - EduKids Africa (updated)
// ================================

/* Sounds */
const correctSound = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");
const wrongSound = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");
const levelUpSound = new Audio("https://actions.google.com/sounds/v1/cartoon/congratulations.ogg");
const gameOverSound = new Audio("https://actions.google.com/sounds/v1/cartoon/boing.ogg");

/* DOM elements (queried where safe) */
const questionText = document.getElementById("questionText");
const optionsContainer = document.getElementById("optionsContainer");
const scoreDisplay = document.getElementById("scoreDisplay");
const levelDisplay = document.getElementById("levelDisplay");
const progressBar = document.getElementById("progressBar");
const clockElement = document.getElementById("clock");

/* We'll query these in init to avoid timing problems */
let modal = null;       // instructionModal (set in init)
let startBtn = null;    // startQuizBtn (set in init)

/* End modal elements (these must exist in HTML) */
const endModal = document.getElementById("endModal");
const endTitle = document.getElementById("endTitle");
const endMessage = document.getElementById("endMessage");
const retryBtn = document.getElementById("retryBtn");
const nextBtn = document.getElementById("nextBtn");

/* State */
let subject = decodeURIComponent(new URLSearchParams(window.location.search).get("subject") || "Mathematics");
let subjectData = {};              // loaded subject object from questions JSON(s)
let availableLevels = [];          // e.g. ["Level 1","Level 2","Level 3"]
let currentLevelIndex = 0;         // index into availableLevels
let questions = [];                // questions for current level
let currentQuestionIndex = 0;
let score = 0;
const PASS_PERCENT = 75;
const progressKey = `EduKidsProgress_${subject}`; // localStorage key

/* Timer variables (queried in init) */
let timerInterval = null;
let timeLeft = 15;
let circle = null;
let timerText = null;
const circleLength = 220; // circumference fallback

/* ---------- Timer ---------- */
function startTimer() {
  // ensure elements exist
  if (!timerText || !circle) {
    // try to re-query (maybe they were added later)
    timerText = document.getElementById("timerText");
    circle = document.getElementById("timerCircle");
  }

  // If timer UI not present, just skip starting the visual timer
  if (!timerText || !circle) {
    // still set a logical timer so questions progress on timeout
    clearInterval(timerInterval);
    timeLeft = 15;
    timerInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        handleTimeout();
      }
    }, 1000);
    return;
  }

  clearInterval(timerInterval);
  timeLeft = 15;
  timerText.textContent = timeLeft;
  circle.style.strokeDasharray = circleLength;
  circle.style.strokeDashoffset = 0;

  timerInterval = setInterval(() => {
    timeLeft--;
    timerText.textContent = timeLeft;

    const progress = (timeLeft / 15) * circleLength;
    circle.style.strokeDashoffset = circleLength - progress;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      handleTimeout();
    }
  }, 1000);
}

function handleTimeout() {
  // treat as incorrect and advance
  // ensure we stop any running timer
  clearInterval(timerInterval);
  currentQuestionIndex++;
  renderQuestion();
}

/* ---------- Utilities ---------- */
function startClock() {
  setInterval(() => {
    const now = new Date();
    if (clockElement) clockElement.textContent = now.toLocaleTimeString();
  }, 1000);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/* ---------- Data loading ---------- */
/*
 Strategy:
 1) Try to fetch a per-subject file at /questions/<normalized-subject>.json
 2) If not found, fall back to a single top-level questions.json and look up subject inside it.
 Normalization: lower-case, replace spaces with hyphens, strip unsafe chars.
*/
function normalizeSubjectToFileName(s) {
  return s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
}

async function loadSubjectData() {
  try {
    const fname = normalizeSubjectToFileName(subject);
    // Try folder-based file first
    try {
      const res = await fetch(`questions/${fname}.json`);
      if (res.ok) {
        subjectData = await res.json();
      } else {
        // fallback to top-level file that may contain many subjects
        const res2 = await fetch("questions.json");
        const data = await res2.json();
        // look under different possible structures
        const categoryParam = new URLSearchParams(window.location.search).get("category");
        if (categoryParam && data[categoryParam] && data[categoryParam][subject]) {
          subjectData = data[categoryParam][subject];
        } else if (data[subject]) {
          subjectData = data[subject];
        } else {
          // try to find subject anywhere
          let found = null;
          for (const k of Object.keys(data)) {
            if (typeof data[k] === "object" && data[k][subject]) {
              found = data[k][subject];
              break;
            }
          }
          if (found) subjectData = found;
        }
      }
    } catch (innerErr) {
      // final fallback to top-level file
      const resTop = await fetch("questions.json");
      const data = await resTop.json();
      if (data[subject]) subjectData = data[subject];
      else {
        // try to find subject anywhere
        let found = null;
        for (const k of Object.keys(data)) {
          if (typeof data[k] === "object" && data[k][subject]) {
            found = data[k][subject];
            break;
          }
        }
        if (found) subjectData = found;
      }
    }

    if (!subjectData || Object.keys(subjectData).length === 0) {
      console.error("No question data found for subject:", subject);
      return false;
    }

    // Collect Level keys & sort (Level 1, Level 2, ...)
    availableLevels = Object.keys(subjectData)
      .filter(k => /^Level\s*\d+/i.test(k))
      .sort((a,b) => {
        const na = parseInt(a.match(/\d+/)[0],10);
        const nb = parseInt(b.match(/\d+/)[0],10);
        return na - nb;
      });

    // load progress from localStorage to set starting level
    const progress = JSON.parse(localStorage.getItem(progressKey) || "{}");
    let firstNotPassed = availableLevels.findIndex(l => !progress[l]);
    currentLevelIndex = firstNotPassed === -1 ? availableLevels.length : firstNotPassed;

    return true;
  } catch (err) {
    console.error("Failed to load questions data", err);
    return false;
  }
}

/* ---------- Prepare / Render Questions ---------- */
function prepareLevelQuestions() {
  if (currentLevelIndex < 0 || currentLevelIndex >= availableLevels.length) {
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

  // Ensure answer is included & shuffle options per question, then shuffle questions
  questions.forEach(q => {
    if (q.answer && !q.options.includes(q.answer)) q.options.push(q.answer);
    q.options = shuffle(q.options);
  });
  questions = shuffle(questions);
}

/* ---------- Render & Interaction ---------- */
function renderQuestion() {
  // stop previous timer
  clearInterval(timerInterval);

  if (!questions.length || currentQuestionIndex >= questions.length) {
    endLevel();
    return;
  }

  const q = questions[currentQuestionIndex];
  if (questionText) questionText.textContent = q.question;

  if (optionsContainer) {
    optionsContainer.innerHTML = "";
    q.options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "w-full text-left px-4 py-3 rounded-lg bg-purple-100 hover:bg-purple-200 transition";
      btn.textContent = opt;
      btn.onclick = () => onSelectOption(opt, btn);
      optionsContainer.appendChild(btn);
    });
  }
  updateScoreBoard();
  // start timer for this question (only if timer UI exists it's harmless otherwise)
  startTimer();
}

function onSelectOption(selectedText, btnEl) {
  clearInterval(timerInterval);
  const q = questions[currentQuestionIndex];
  const correct = q.answer;

  if (selectedText === correct) {
    score++;
    if (btnEl) btnEl.classList.add("bg-green-500", "text-white");
    correctSound.play();
  } else {
    if (btnEl) btnEl.classList.add("bg-red-500", "text-white");
    wrongSound.play();
    const children = [...optionsContainer.children];
    const correctBtn = children.find(child => child.textContent === correct);
    if (correctBtn) correctBtn.classList.add("bg-green-500", "text-white");
  }

  [...optionsContainer.children].forEach(c => c.disabled = true);

  setTimeout(() => {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
      renderQuestion();
    } else {
      endLevel();
    }
  }, 900);
}

function updateScoreBoard() {
  if (!questions || questions.length === 0) {
    if (scoreDisplay) scoreDisplay.textContent = `Score: 0/0`;
    if (progressBar) progressBar.style.width = `0%`;
    return;
  }
  if (scoreDisplay) scoreDisplay.textContent = `Score: ${score}/${questions.length}`;
  const pct = Math.round(((currentQuestionIndex) / questions.length) * 100);
  if (progressBar) progressBar.style.width = `${pct}%`;
}

/* ---------- End / Summary / Persistence ---------- */
function showEndModal(passed, totalCorrect, totalQuestions) {
  if (!endModal) return;
  if (passed) {
    levelUpSound.play();
    endTitle.textContent = `🎉 Level Passed!`;
    const percent = Math.round((totalCorrect / totalQuestions) * 100);
    endMessage.textContent = `You scored ${totalCorrect}/${totalQuestions} (${percent}%). Well done — next level unlocked.`;
    retryBtn?.classList.add("hidden");
    nextBtn?.classList.remove("hidden");
  } else {
    gameOverSound.play();
    const percent = Math.round((totalCorrect / totalQuestions) * 100);
    endTitle.textContent = `❌ Level Failed`;
    endMessage.textContent = `You scored ${totalCorrect}/${totalQuestions} (${percent}%). You need ${PASS_PERCENT}% to pass. Try again.`;
    retryBtn?.classList.remove("hidden");
    nextBtn?.classList.add("hidden");
  }
  endModal.classList.remove("hidden");
  endModal.classList.add("flex");
}

function hideEndModal() {
  if (!endModal) return;
  endModal.classList.add("hidden");
  endModal.classList.remove("flex");
}

function saveLevelPassed(levelKey) {
  const obj = JSON.parse(localStorage.getItem(progressKey) || "{}");
  obj[levelKey] = true;
  localStorage.setItem(progressKey, JSON.stringify(obj));
}

/* ---------- Level flow ---------- */
function startLevel() {
  if (currentLevelIndex >= availableLevels.length) {
    // all levels completed
    if (!endModal) {
      alert(`🎓 You have completed all levels for ${subject}!`);
      return;
    }
    endTitle.textContent = `👑 Course Completed!`;
    endMessage.textContent = `You have completed all available levels for ${subject}. Great job!`;
    retryBtn?.classList.add("hidden");
    nextBtn?.classList.add("hidden");
    endModal.classList.remove("hidden");
    endModal.classList.add("flex");
    return;
  }

  const levelKey = availableLevels[currentLevelIndex];
  if (levelDisplay) levelDisplay.textContent = levelKey;
  prepareLevelQuestions();
  currentQuestionIndex = 0;
  score = 0;
  renderQuestion();
}

function endLevel() {
  clearInterval(timerInterval);
  const totalQuestions = questions.length || 1;
  const percent = (score / totalQuestions) * 100;
  const passed = percent >= PASS_PERCENT;
  const levelKey = availableLevels[currentLevelIndex];

  if (passed) {
    saveLevelPassed(levelKey);
    // auto-progress to next level (or show end)
    // show modal with results
  } else {
    // show fail summary
  }

  showEndModal(passed, score, totalQuestions);
}

/* ---------- Event bindings (retry/next) ---------- */
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

/* ---------- Single initializer: attach start button and load data ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  // Query elements that might not have existed earlier
  modal = document.getElementById("instructionModal");
  startBtn = document.getElementById("startQuizBtn");
  circle = document.getElementById("timerCircle");
  timerText = document.getElementById("timerText");

  // Start UI clock
  startClock();

  // Load question data (per-subject file preferred)
  const ok = await loadSubjectData();
  if (!ok) {
    if (questionText) questionText.textContent = `No quiz data found for "${subject}".`;
    return;
  }

  // Hook up the "I'm Ready" button safely (single handler)
  if (startBtn) {
    // assign onclick to avoid accidental double-binding
    startBtn.onclick = (e) => {
      e.preventDefault();
      if (modal) {
        // hide instruction modal (Tailwind classes)
        modal.classList.add("hidden");
        modal.classList.remove("flex");
      }
      // Ensure quiz starts only after data loaded
      startLevel();
    };
    // also support keyboard activation (Enter)
    startBtn.addEventListener("keyup", (ev) => {
      if (ev.key === "Enter") startBtn.click();
    });
  } else {
    // No start button in DOM -> auto-start
    startLevel();
  }
});
