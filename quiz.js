// ================================================
// quiz.js - EduKids Africa (All Qs + Summary + Help)
// ================================================

/* Sounds */
const correctSound = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");
const wrongSound = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");
const levelUpSound = new Audio("https://actions.google.com/sounds/v1/cartoon/congratulations.ogg");
const gameOverSound = new Audio("https://actions.google.com/sounds/v1/cartoon/boing.ogg");

/* Core DOM */
const questionText = document.getElementById("questionText");
const optionsContainer = document.getElementById("optionsContainer");
const scoreDisplay = document.getElementById("scoreDisplay");
const levelDisplay = document.getElementById("levelDisplay");
const progressBar = document.getElementById("progressBar");
const clockElement = document.getElementById("clock");

/* Instruction modal */
const instructionModal = document.getElementById("instructionModal");
const startBtn = document.getElementById("startQuizBtn");

/* Summary modal (end-of-level) */
const summaryModal = document.getElementById("summaryModal");
const summaryTitle = document.getElementById("summaryTitle");
const summaryMessage = document.getElementById("summaryMessage");
// IMPORTANT: there are two elements with id="retryBtn" in your HTML.
// Scope them per modal to avoid conflicts:
const summaryRetryBtn = summaryModal ? summaryModal.querySelector("#retryBtn") : null;
const nextLevelBtn = document.getElementById("nextLevelBtn");

/* End modal exists in your HTML but we WON'T use it to avoid double modals.
   If you ever want it, you can wire it similarly with scoped selectors:
   const endModal = document.getElementById("endModal");
   const endRetryBtn = endModal ? endModal.querySelector("#retryBtn") : null;
   const nextBtn = document.getElementById("nextBtn");
*/

/* Floating help modal (already wired in HTML) */
const helpModal = document.getElementById("eduHelpModal");

/* State */
let subject = decodeURIComponent(new URLSearchParams(window.location.search).get("subject") || "Mathematics");
let subjectData = {};
let availableLevels = [];               // e.g., ["Level 1","Level 2","Level 3"]
let currentLevelIndex = 0;              // index into availableLevels
let questions = [];                     // questions for current level
let currentQuestionIndex = 0;
let score = 0;
let attemptsLog = [];                   // [{question, selected, correct, isCorrect}]
const PASS_PERCENT = 75;
const progressKey = `EduKidsProgress_${subject}`;

/* Clock */
function startClock() {
  setInterval(() => {
    const now = new Date();
    if (clockElement) clockElement.textContent = now.toLocaleTimeString();
  }, 1000);
}

/* Utils */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/* Load questions.json + levels */
async function loadSubjectData() {
  try {
    const res = await fetch("questions.json");
    const data = await res.json();

    const category = new URLSearchParams(window.location.search).get("category");
    if (category && data[category] && data[category][subject]) {
      subjectData = data[category][subject];
    } else if (data[subject]) {
      subjectData = data[subject];
    } else {
      // fallback: scan nested categories
      for (const k of Object.keys(data)) {
        if (typeof data[k] === "object" && data[k][subject]) {
          subjectData = data[k][subject];
          break;
        }
      }
    }

    if (!subjectData || Object.keys(subjectData).length === 0) {
      console.error("No question data found for subject:", subject);
      return false;
    }

    availableLevels = Object.keys(subjectData)
      .filter(k => /^Level\s*\d+/i.test(k))
      .sort((a, b) => {
        const na = parseInt(a.match(/\d+/)[0], 10);
        const nb = parseInt(b.match(/\d+/)[0], 10);
        return na - nb;
      });

    const progress = JSON.parse(localStorage.getItem(progressKey) || "{}");
    const firstNotPassed = availableLevels.findIndex(l => !progress[l]);
    currentLevelIndex = (firstNotPassed === -1) ? availableLevels.length : firstNotPassed;

    return true;
  } catch (err) {
    console.error("Failed to load questions.json", err);
    return false;
  }
}

/* Prepare ALL questions for current level (no reduction) */
function prepareLevelQuestions() {
  if (currentLevelIndex < 0 || currentLevelIndex >= availableLevels.length) {
    questions = [];
    return;
  }
  const levelKey = availableLevels[currentLevelIndex];
  let raw = subjectData[levelKey] || [];

  // filter malformed
  raw = raw.filter(q => q && q.question && (q.answer || q.correct || q.correctAnswer));

  // normalize
  questions = raw.map(q => ({
    question: q.question,
    options: Array.isArray(q.options) ? [...q.options] : [],
    answer: q.answer || q.correct || q.correctAnswer || ""
  }));

  // ensure answer present & shuffle options
  questions.forEach(q => {
    if (!q.options.includes(q.answer)) q.options.push(q.answer);
    q.options = shuffle(q.options);
  });

  // shuffle questions
  questions = shuffle(questions);

  // reset attempts log for the level
  attemptsLog = [];
}

/* Render current question */
function renderQuestion() {
  if (!questions.length || currentQuestionIndex >= questions.length) {
    endLevel();
    return;
  }

  const q = questions[currentQuestionIndex];
  if (questionText) questionText.textContent = q.question;

  if (optionsContainer) {
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
}

/* Selection handler */
function onSelectOption(selectedText, btnEl) {
  const q = questions[currentQuestionIndex];
  const correct = q.answer;
  const isCorrect = selectedText === correct;

  // Record attempt
  attemptsLog.push({
    question: q.question,
    selected: selectedText,
    correct,
    isCorrect
  });

  if (isCorrect) {
    score++;
    if (btnEl) btnEl.classList.add("bg-green-500", "text-white");
    correctSound.play();
  } else {
    if (btnEl) btnEl.classList.add("bg-red-500", "text-white");
    wrongSound.play();
    const correctBtn = [...optionsContainer.children].find(c => c.textContent === correct);
    if (correctBtn) correctBtn.classList.add("bg-green-500", "text-white");
  }

  // Disable all options
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

/* Scoreboard / progress */
function updateScoreBoard() {
  if (!questions || questions.length === 0) {
    if (scoreDisplay) scoreDisplay.textContent = `Score: 0/0`;
    if (progressBar) progressBar.style.width = `0%`;
    return;
  }
  if (scoreDisplay) scoreDisplay.textContent = `Score: ${score}/${questions.length}`;
  const pct = Math.round((currentQuestionIndex / questions.length) * 100);
  if (progressBar) progressBar.style.width = `${pct}%`;
}

/* Level progression */
function saveLevelPassed(levelKey) {
  const obj = JSON.parse(localStorage.getItem(progressKey) || "{}");
  obj[levelKey] = true;
  localStorage.setItem(progressKey, JSON.stringify(obj));
}

/* Build / inject Results Summary into the floating help modal */
function populateHelpResults() {
  if (!helpModal) return;

  // Root content element inside help modal (its inner white card)
  const card = helpModal.querySelector("div.bg-white");
  if (!card) return;

  // Remove previous results section if it exists
  let existing = card.querySelector("#eduResultsContainer");
  if (existing) existing.remove();

  // Create container
  const container = document.createElement("div");
  container.id = "eduResultsContainer";
  container.className = "mt-4 text-left max-h-80 overflow-y-auto border-t pt-3";

  const levelKey = availableLevels[currentLevelIndex] || "";
  const header = document.createElement("div");
  header.className = "mb-3";
  header.innerHTML = `<h3 class="font-bold text-base">Results Summary ${levelKey ? `- ${levelKey}` : ""}</h3>
                      <p class="text-sm text-gray-600">Review each question you answered this level.</p>`;
  container.appendChild(header);

  if (!attemptsLog.length) {
    const empty = document.createElement("p");
    empty.className = "text-sm text-gray-500";
    empty.textContent = "No results yet. Finish the level to see your summary here.";
    container.appendChild(empty);
  } else {
    attemptsLog.forEach((item, i) => {
      const row = document.createElement("div");
      row.className = "mb-3 p-3 rounded-lg border";
      const correctnessClass = item.isCorrect ? "text-green-700 border-green-200 bg-green-50" : "text-red-700 border-red-200 bg-red-50";
      row.className += ` ${correctnessClass}`;
      row.innerHTML = `
        <div class="text-xs opacity-70 mb-1">Q${i + 1}</div>
        <div class="font-semibold mb-2">${item.question}</div>
        <div class="text-sm"><span class="font-semibold">Your answer:</span> ${item.selected}</div>
        ${item.isCorrect ? "" : `<div class="text-sm"><span class="font-semibold">Correct answer:</span> ${item.correct}</div>`}
      `;
      container.appendChild(row);
    });
  }

  card.appendChild(container);
}

/* End level -> show Summary modal & populate help modal results */
function endLevel() {
  const totalQuestions = questions.length || 1;
  const percent = Math.round((score / totalQuestions) * 100);
  const passed = percent >= PASS_PERCENT;

  // Summary modal content
  if (summaryTitle) summaryTitle.textContent = "Level Summary";
  if (summaryMessage) {
    summaryMessage.textContent =
      `You scored ${score}/${totalQuestions} (${percent}%). ${passed ? "Well done — Next level unlocked." : `You need ${PASS_PERCENT}% to pass.`}`;
  }

  // Buttons visibility
  if (summaryRetryBtn) summaryRetryBtn.classList.toggle("hidden", passed);      // show Retry only if failed
  if (nextLevelBtn) nextLevelBtn.classList.toggle("hidden", !passed);           // show Next only if passed

  // Show summary modal
  if (summaryModal) {
    summaryModal.classList.remove("hidden");
    summaryModal.classList.add("flex");
  }

  // Save progress if passed
  if (passed) {
    const levelKey = availableLevels[currentLevelIndex];
    saveLevelPassed(levelKey);
  }

  // Prepare results inside floating help modal
  populateHelpResults();
}

/* Hide summary modal */
function hideSummaryModal() {
  if (!summaryModal) return;
  summaryModal.classList.add("hidden");
  summaryModal.classList.remove("flex");
}

/* Start a level */
function startLevel() {
  // If all levels completed
  if (currentLevelIndex >= availableLevels.length) {
    // Reuse summary modal to show a completion message
    if (summaryTitle) summaryTitle.textContent = "👑 Course Completed!";
    if (summaryMessage) summaryMessage.textContent = `You have completed all available levels for ${subject}. Great job!`;
    if (summaryRetryBtn) summaryRetryBtn.classList.add("hidden");
    if (nextLevelBtn) nextLevelBtn.classList.add("hidden");
    if (summaryModal) {
      summaryModal.classList.remove("hidden");
      summaryModal.classList.add("flex");
    }
    return;
  }

  const levelKey = availableLevels[currentLevelIndex];
  if (levelDisplay) levelDisplay.textContent = levelKey;

  prepareLevelQuestions();
  currentQuestionIndex = 0;
  score = 0;
  renderQuestion();
}

/* Retry (from summary modal) */
if (summaryRetryBtn) {
  summaryRetryBtn.addEventListener("click", () => {
    hideSummaryModal();
    prepareLevelQuestions();
    currentQuestionIndex = 0;
    score = 0;
    renderQuestion();
  });
}

/* Next Level (from summary modal) */
if (nextLevelBtn) {
  nextLevelBtn.addEventListener("click", () => {
    hideSummaryModal();
    currentLevelIndex++;
    startLevel();
  });
}

/* Instruction modal start */
if (startBtn) {
  startBtn.addEventListener("click", () => {
    if (instructionModal) instructionModal.style.display = "none";
    startLevel();
  });
}

/* Init */
document.addEventListener("DOMContentLoaded", async () => {
  startClock();

  const ok = await loadSubjectData();
  if (!ok) {
    if (questionText) questionText.textContent = `No quiz data found for "${subject}".`;
    return;
  }

  // Keep instruction modal visible until "I'm Ready"
  if (!instructionModal) startLevel();
});

/* Expose globals used by your inline Help script (already in quiz.html) */
window.availableLevels = availableLevels;
window.progressKey = progressKey;
window.currentLevelIndex = currentLevelIndex;
window.score = score;
window.currentQuestionIndex = currentQuestionIndex;
window.startLevel = startLevel;
window.prepareLevelQuestions = prepareLevelQuestions;
window.renderQuestion = renderQuestion;
