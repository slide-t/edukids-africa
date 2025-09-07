// ===============================
// EduKids Africa - quiz.js
// ===============================

// ====== GLOBAL STATE ======
let currentLevelIndex = 0;
let currentQuestionIndex = 0;
let score = 0;
let questions = {};
let levelQuestions = [];
let resultsLog = []; // <-- stores attempts for Help Modal

const availableLevels = ["level1", "level2", "level3"];
const progressKey = "edukids_progress";

// ====== DOM ELEMENTS ======
const questionText = document.getElementById("questionText");
const optionsContainer = document.getElementById("optionsContainer");
const progressBar = document.getElementById("progressBar");
const scoreDisplay = document.getElementById("scoreDisplay");
const levelDisplay = document.getElementById("levelDisplay");

// Instruction modal
const instructionModal = document.getElementById("instructionModal");
const startQuizBtn = document.getElementById("startQuizBtn");

// Summary modal
const summaryModal = document.getElementById("summaryModal");
const summaryTitle = document.getElementById("summaryTitle");
const summaryMessage = document.getElementById("summaryMessage");
const retryBtn = document.getElementById("retryBtn");
const nextLevelBtn = document.getElementById("nextLevelBtn");

// End modal
const endModal = document.getElementById("endModal");
const endTitle = document.getElementById("endTitle");
const endMessage = document.getElementById("endMessage");
const endRetryBtn = document.querySelector("#endModal #retryBtn");
const endNextBtn = document.querySelector("#endModal #nextBtn");

// Help Modal & Results
const helpBtn = document.getElementById("eduHelpBtn");
const helpModal = document.getElementById("eduHelpModal");
const closeHelpBtn = document.getElementById("eduCloseHelpBtn");
const replayBtns = document.querySelectorAll("#eduReplayLevelOptions .eduHelpBtnOption");
const resetLevelBtn = document.getElementById("eduResetLevelBtn");
const backSubjectsBtn = document.getElementById("eduBackSubjectsBtn");

// Create container inside Help Modal for results summary
let eduResultsList = document.createElement("div");
eduResultsList.id = "eduResultsList";
eduResultsList.className = "text-left text-sm mt-4 max-h-48 overflow-y-auto";
helpModal.querySelector(".bg-white").appendChild(eduResultsList);

// ====== SAMPLE QUESTIONS ======
questions = {
  level1: [
    { question: "What is 2 + 2?", options: ["3", "4", "5"], correctAnswer: "4" },
    { question: "What is 5 - 3?", options: ["2", "1", "3"], correctAnswer: "2" }
  ],
  level2: [
    { question: "Which planet is known as the Red Planet?", options: ["Earth", "Mars", "Venus"], correctAnswer: "Mars" },
    { question: "How many continents are there?", options: ["5", "6", "7"], correctAnswer: "7" }
  ],
  level3: [
    { question: "Who wrote Hamlet?", options: ["Shakespeare", "Chinua Achebe", "Homer"], correctAnswer: "Shakespeare" },
    { question: "The currency of Nigeria is?", options: ["Dollar", "Naira", "Cedi"], correctAnswer: "Naira" }
  ]
};

// ====== UTILITIES ======
function shuffleArray(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function updateClock() {
  const now = new Date();
  document.getElementById("clock").textContent = now.toLocaleTimeString();
}
setInterval(updateClock, 1000);

// ====== QUIZ FLOW ======
function startLevel(levelIndex) {
  currentLevelIndex = levelIndex;
  currentQuestionIndex = 0;
  score = 0;
  resultsLog = []; // reset results per level
  prepareLevelQuestions();
  renderQuestion();
  updateScoreDisplay();
  updateResultsSummary();
}

function prepareLevelQuestions() {
  const levelKey = availableLevels[currentLevelIndex];
  levelQuestions = shuffleArray([...questions[levelKey]]);
}

function renderQuestion() {
  if (currentQuestionIndex >= levelQuestions.length) {
    endLevel();
    return;
  }

  const currentQ = levelQuestions[currentQuestionIndex];
  questionText.textContent = currentQ.question;
  optionsContainer.innerHTML = "";

  currentQ.options.forEach(option => {
    const btn = document.createElement("button");
    btn.textContent = option;
    btn.className =
      "w-full bg-gray-200 hover:bg-purple-200 px-4 py-2 rounded-lg transition";
    btn.addEventListener("click", () => handleAnswer(option));
    optionsContainer.appendChild(btn);
  });

  updateProgress();
}

function handleAnswer(selected) {
  const currentQ = levelQuestions[currentQuestionIndex];
  const isCorrect = selected === currentQ.correctAnswer;
  if (isCorrect) score++;

  // log result
  resultsLog.push({
    question: currentQ.question,
    selected,
    correct: currentQ.correctAnswer,
    isCorrect
  });
  updateResultsSummary();

  currentQuestionIndex++;
  renderQuestion();
  updateScoreDisplay();
}

function updateProgress() {
  const percent = ((currentQuestionIndex) / levelQuestions.length) * 100;
  progressBar.style.width = `${percent}%`;
}

function updateScoreDisplay() {
  scoreDisplay.textContent = `Score: ${score}/${levelQuestions.length}`;
  levelDisplay.textContent = `Level ${currentLevelIndex + 1}`;
}

// ====== LEVEL END ======
function endLevel() {
  const passMark = Math.ceil(levelQuestions.length * 0.5);
  const passed = score >= passMark;

  summaryTitle.textContent = `Level ${currentLevelIndex + 1} Complete!`;
  summaryMessage.textContent = passed
    ? `Great job! You scored ${score}/${levelQuestions.length}.`
    : `You scored ${score}/${levelQuestions.length}. Try again to improve.`;

  retryBtn.classList.toggle("hidden", passed);
  nextLevelBtn.classList.toggle("hidden", !passed);

  summaryModal.classList.remove("hidden");
  summaryModal.classList.add("flex");
}

// ====== SUMMARY ACTIONS ======
retryBtn.addEventListener("click", () => {
  summaryModal.classList.add("hidden");
  startLevel(currentLevelIndex);
});

nextLevelBtn.addEventListener("click", () => {
  summaryModal.classList.add("hidden");
  if (currentLevelIndex + 1 < availableLevels.length) {
    startLevel(currentLevelIndex + 1);
  } else {
    showEndScreen();
  }
});

function showEndScreen() {
  endTitle.textContent = "🎉 Congratulations!";
  endMessage.textContent = "You have completed all levels!";
  endRetryBtn.classList.remove("hidden");
  endNextBtn.classList.add("hidden");

  endModal.classList.remove("hidden");
  endModal.classList.add("flex");
}

// ====== HELP MODAL BEHAVIOR ======
helpBtn.addEventListener("click", () => {
  helpModal.classList.remove("hidden");
  helpModal.classList.add("flex");
});

closeHelpBtn.addEventListener("click", () => {
  helpModal.classList.add("hidden");
  helpModal.classList.remove("flex");
});

// Replay specific level
replayBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const level = parseInt(btn.dataset.level);
    helpModal.classList.add("hidden");
    startLevel(level - 1);
  });
});

// Reset current level
resetLevelBtn.addEventListener("click", () => {
  helpModal.classList.add("hidden");
  startLevel(currentLevelIndex);
});

// Back to subjects
backSubjectsBtn.addEventListener("click", () => {
  window.location.href = "subjects.html";
});

// ====== RESULTS SUMMARY (inside Help Modal) ======
function updateResultsSummary() {
  eduResultsList.innerHTML = "";

  if (resultsLog.length === 0) {
    eduResultsList.innerHTML = `<p class="text-gray-500">No questions answered yet...</p>`;
    return;
  }

  resultsLog.forEach((res, i) => {
    const p = document.createElement("p");
    p.className = "mb-2";
    if (res.isCorrect) {
      p.innerHTML = `✅ <strong>Q${i + 1}:</strong> ${res.question}`;
    } else {
      p.innerHTML = `❌ <strong>Q${i + 1}:</strong> ${res.question} <br>
        <span class="text-red-600">Your Answer:</span> ${res.selected} |
        <span class="text-green-600">Correct:</span> ${res.correct}`;
    }
    eduResultsList.appendChild(p);
  });
}

// ====== START ======
startQuizBtn.addEventListener("click", () => {
  instructionModal.classList.add("hidden");
  startLevel(0);
});

// Footer year auto-update
document.getElementById("year").textContent = new Date().getFullYear();
