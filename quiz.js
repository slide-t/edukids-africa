// ================================
// quiz.js - EduKids Africa (updated full)
// ================================

/* Sounds */
const correctSound = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");
const wrongSound = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");
const levelUpSound = new Audio("https://actions.google.com/sounds/v1/cartoon/congratulations.ogg");

/* ================================
   User Plan Handling
   ================================ */
let userPlan = localStorage.getItem("userPlan") || "free"; 
// plans: free, premium, gold

// Subjects disabled per plan
const disabledSubjects = {
  free: [], // none, but only 15 questions in questions.json
  premium: ["Spellings", "Grammar"], // disabled in premium
  gold: [] // all enabled
};

// Folder or file mapping based on plan
function getQuestionFile(subject) {
  if (userPlan === "free") {
    return "questions/questions.json"; 
  } else if (userPlan === "premium") {
    return `premiumquestions/${subject.toLowerCase()}.json`;
  } else if (userPlan === "gold") {
    return `goldquestions/${subject.toLowerCase()}.json`;
  }
  return "questions/questions.json"; 
}

/* ================================
   Get Query Params
   ================================ */
const urlParams = new URLSearchParams(window.location.search);
const subject = urlParams.get("subject") || "General";
const category = urlParams.get("category") || "General";

/* ================================
   Restriction Handling
   ================================ */
if (disabledSubjects[userPlan].includes(subject)) {
  alert(`❌ Sorry, ${subject} is not available on your current plan (${userPlan.toUpperCase()}).`);
  window.location.href = "subjects.html"; 
}

/* ================================
   DOM Elements
   ================================ */
const questionContainer = document.getElementById("question-container");
const nextBtn = document.getElementById("next-btn");
const progressBar = document.getElementById("progress-bar");
const scoreText = document.getElementById("score");
const levelText = document.getElementById("level");

let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let level = 1;

/* ================================
   Load Questions
   ================================ */
async function loadQuestions() {
  try {
    const file = getQuestionFile(subject);
    const res = await fetch(file);
    const data = await res.json();
    questions = data.questions || [];
    startGame();
  } catch (err) {
    console.error("❌ Failed to load questions", err);
    questionContainer.innerHTML = `<p class="text-red-600">Failed to load questions for ${subject}.</p>`;
  }
}

/* ================================
   Start Game
   ================================ */
function startGame() {
  currentQuestionIndex = 0;
  score = 0;
  level = 1;
  scoreText.textContent = score;
  levelText.textContent = level;
  showQuestion();
}

/* ================================
   Show Question
   ================================ */
function showQuestion() {
  resetState();
  const q = questions[currentQuestionIndex];
  if (!q) {
    return endGame();
  }

  const questionElement = document.createElement("div");
  questionElement.className = "mb-6";
  questionElement.innerHTML = `
    <h2 class="text-xl font-semibold mb-4">${q.question}</h2>
    ${q.options.map((opt, i) => `
      <button class="option-btn block w-full text-left px-4 py-2 mb-2 bg-white rounded border hover:bg-indigo-100 transition" data-correct="${opt === q.answer}">
        ${opt}
      </button>
    `).join("")}
  `;
  questionContainer.appendChild(questionElement);

  // Attach event listeners
  document.querySelectorAll(".option-btn").forEach(btn => {
    btn.addEventListener("click", selectAnswer);
  });

  updateProgress();
}

/* ================================
   Reset State
   ================================ */
function resetState() {
  nextBtn.classList.add("hidden");
  questionContainer.innerHTML = "";
}

/* ================================
   Select Answer
   ================================ */
function selectAnswer(e) {
  const selectedBtn = e.target;
  const correct = selectedBtn.dataset.correct === "true";

  if (correct) {
    selectedBtn.classList.add("bg-green-300");
    score++;
    scoreText.textContent = score;
    correctSound.play();
  } else {
    selectedBtn.classList.add("bg-red-300");
    wrongSound.play();
  }

  // Disable all buttons
  document.querySelectorAll(".option-btn").forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.correct === "true") {
      btn.classList.add("bg-green-200");
    }
  });

  nextBtn.classList.remove("hidden");
}

/* ================================
   Next Question
   ================================ */
nextBtn.addEventListener("click", () => {
  currentQuestionIndex++;
  if (currentQuestionIndex < questions.length) {
    showQuestion();
  } else {
    endGame();
  }
});

/* ================================
   Progress Update
   ================================ */
function updateProgress() {
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  progressBar.style.width = progress + "%";

  if ((currentQuestionIndex + 1) % 10 === 0) {
    level++;
    levelText.textContent = level;
    levelUpSound.play();
  }
}

/* ================================
   End Game
   ================================ */
function endGame() {
  questionContainer.innerHTML = `
    <div class="text-center">
      <h2 class="text-2xl font-bold mb-4">🎉 Well done!</h2>
      <p class="mb-4">Your final score is <strong>${score}</strong> out of ${questions.length}.</p>
      <button onclick="startGame()" class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">Play Again</button>
    </div>
  `;
  progressBar.style.width = "100%";
}

// Load questions on page ready
loadQuestions();
