// =========================
// QUIZ ENGINE
// =========================

// Global state
let questionsData = {};
let availableLevels = [];
let currentLevelIndex = 0;
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let subject = null;
const progressKey = "quizProgress";

// DOM references
const questionText = document.getElementById("questionText");
const optionsContainer = document.getElementById("optionsContainer");
const progressBar = document.getElementById("progressBar");
const scoreDisplay = document.getElementById("scoreDisplay");
const levelDisplay = document.getElementById("levelDisplay");

const instructionModal = document.getElementById("instructionModal");
const startQuizBtn = document.getElementById("startQuizBtn");

const summaryModal = document.getElementById("summaryModal");
const summaryTitle = document.getElementById("summaryTitle");
const summaryMessage = document.getElementById("summaryMessage");
const retryBtn = document.getElementById("retryBtn");
const nextLevelBtn = document.getElementById("nextLevelBtn");

const endModal = document.getElementById("endModal");
const endTitle = document.getElementById("endTitle");
const endMessage = document.getElementById("endMessage");
const endRetryBtn = document.getElementById("retryBtn");
const endNextBtn = document.getElementById("nextBtn");

const helpModal = document.getElementById("eduHelpModal");
const replayBtns = document.querySelectorAll("#eduReplayLevelOptions .eduHelpBtnOption");
const resetLevelBtn = document.getElementById("eduResetLevelBtn");
const backSubjectsBtn = document.getElementById("eduBackSubjectsBtn");

// =========================
// INIT
// =========================
window.addEventListener("DOMContentLoaded", () => {
  // Get subject from URL
  const params = new URLSearchParams(window.location.search);
  subject = params.get("subject");

  if (!subject) {
    questionText.textContent = "No subject selected. Please go back to Subjects.";
    return;
  }

  // Load questions.json
  fetch("questions.json")
    .then(res => res.json())
    .then(data => {
      questionsData = data;

      if (!questionsData[subject]) {
        questionText.textContent = `No questions found for ${subject}`;
        return;
      }

      availableLevels = Object.keys(questionsData[subject]);
      levelDisplay.textContent = "Level 1";

      // Show instruction modal first
      instructionModal.classList.remove("hidden");
      instructionModal.classList.add("flex");
    })
    .catch(err => {
      console.error("Error loading questions.json:", err);
      questionText.textContent = "Error loading questions.";
    });
});

// =========================
// QUIZ FLOW
// =========================
function prepareLevelQuestions() {
  const levelKey = availableLevels[currentLevelIndex];
  currentQuestions = [...questionsData[subject][levelKey]];
  currentQuestionIndex = 0;
  score = 0;

  levelDisplay.textContent = `Level ${currentLevelIndex + 1}`;
  renderQuestion();
}

function renderQuestion() {
  if (currentQuestionIndex >= currentQuestions.length) {
    endLevel();
    return;
  }

  const q = currentQuestions[currentQuestionIndex];
  questionText.textContent = q.question;

  optionsContainer.innerHTML = "";
  q.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className =
      "w-full bg-gray-100 border border-gray-300 rounded-lg py-2 hover:bg-purple-100 transition";
    btn.textContent = opt;
    btn.onclick = () => handleAnswer(opt);
    optionsContainer.appendChild(btn);
  });

  updateProgress();
}

function handleAnswer(selected) {
  const q = currentQuestions[currentQuestionIndex];
  if (selected === q.correct) score++;

  currentQuestionIndex++;
  renderQuestion();
}

function updateProgress() {
  scoreDisplay.textContent = `Score: ${score}/${currentQuestions.length}`;
  const progressPercent = (currentQuestionIndex / currentQuestions.length) * 100;
  progressBar.style.width = `${progressPercent}%`;
}

function endLevel() {
  // Save progress
  let progress = JSON.parse(localStorage.getItem(progressKey) || "{}");
  if (!progress[subject]) progress[subject] = {};
  progress[subject][availableLevels[currentLevelIndex]] = {
    score,
    total: currentQuestions.length
  };
  localStorage.setItem(progressKey, JSON.stringify(progress));

  const passMark = Math.ceil(currentQuestions.length * 0.6);
  const passed = score >= passMark;

  summaryTitle.textContent = `Level ${currentLevelIndex + 1} Summary`;
  summaryMessage.textContent = `You scored ${score}/${currentQuestions.length}. ${
    passed ? "Great job! 🎉" : "Try again!"
  }`;

  retryBtn.classList.toggle("hidden", passed);
  nextLevelBtn.classList.toggle("hidden", !passed);

  summaryModal.classList.remove("hidden");
  summaryModal.classList.add("flex");
}
function updateHelpModalButtons() {
  const progress = JSON.parse(localStorage.getItem(progressKey) || "{}");

  replayBtns.forEach(btn => {
    const level = parseInt(btn.dataset.level);
    const levelKey = availableLevels[level - 1];
    
    if (progress[subject] && progress[subject][levelKey]) {
      btn.classList.remove("hidden");
    } else {
      btn.classList.add("hidden");
    }
  });
}



// =========================
// EVENT HANDLERS
// =========================

// Instruction modal → start quiz
startQuizBtn.addEventListener("click", () => {
  instructionModal.classList.add("hidden");
  instructionModal.classList.remove("flex");
  prepareLevelQuestions();
});

// Retry current level
retryBtn.addEventListener("click", () => {
  summaryModal.classList.add("hidden");
  summaryModal.classList.remove("flex");
  prepareLevelQuestions();
});

// Next level
nextLevelBtn.addEventListener("click", () => {
  summaryModal.classList.add("hidden");
  summaryModal.classList.remove("flex");
  currentLevelIndex++;

  if (currentLevelIndex < availableLevels.length) {
    prepareLevelQuestions();
  } else {
    showEndScreen();
  }
});

// End screen after all levels
function showEndScreen() {
  endTitle.textContent = `Congratulations! 🎓`;
  endMessage.textContent = `You have completed all levels of ${subject}.`;

  endModal.classList.remove("hidden");
  endModal.classList.add("flex");
}

// =========================
// HELP MODAL
// =========================
replayBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const level = parseInt(btn.dataset.level);

    if (availableLevels.length >= level) {
      const progress = JSON.parse(localStorage.getItem(progressKey) || "{}");
      const levelKey = availableLevels[level - 1];

      // Only allow replay if attempted
      if (progress[subject] && progress[subject][levelKey]) {
        currentLevelIndex = level - 1;
        score = 0;
        currentQuestionIndex = 0;
        prepareLevelQuestions();

        helpModal.classList.add("hidden");
        helpModal.classList.remove("flex");
      }
    }
  });
});


resetLevelBtn.addEventListener("click", () => {
  score = 0;
  currentQuestionIndex = 0;
  prepareLevelQuestions();

  helpModal.classList.add("hidden");
  helpModal.classList.remove("flex");
});

backSubjectsBtn.addEventListener("click", () => {
  window.location.href = "subjects.html";
});

// =========================
// CLOCK DISPLAY
// =========================
setInterval(() => {
  const now = new Date();
  document.getElementById("clock").textContent = now.toLocaleTimeString();
}, 1000);
