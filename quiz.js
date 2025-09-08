// ================================
// quiz.js - EduKids Africa (updated)
// ================================

/* Sounds */
const correctSound = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");
const wrongSound = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");
const levelUpSound = new Audio("https://actions.google.com/sounds/v1/cartoon/congratulations.ogg");

/* DOM Elements */
const quizTitle = document.getElementById("quizTitle");
const startQuizBtn = document.getElementById("startQuizBtn");
const questionContainer = document.getElementById("questionContainer");
const questionText = document.getElementById("questionText");
const optionsContainer = document.getElementById("optionsContainer");
const nextBtn = document.getElementById("nextBtn");
const resultContainer = document.getElementById("resultContainer");
const scoreText = document.getElementById("scoreText");

let questions = [];
let currentQuestionIndex = 0;
let score = 0;

/* Parse Query Parameters */
function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    level: params.get("level"),
    subject: params.get("subject")
  };
}

async function loadQuestions() {
  const { level, subject } = getQueryParams();

  if (!level || !subject) {
    quizTitle.textContent = "Missing subject or level in URL!";
    startQuizBtn.style.display = "none";
    return;
  }

  quizTitle.textContent = `${subject} - ${level} Quiz`;

  // Build path e.g. questions/Primary/Mathematics.json
  const filePath = `questions/${level}/${subject}.json`;

  try {
    const response = await fetch(filePath);
    if (!response.ok) throw new Error("Questions not found");

    questions = await response.json();
  } catch (error) {
    quizTitle.textContent = `Error loading ${subject} questions.`;
    console.error("Error:", error);
    startQuizBtn.style.display = "none";
  }
}

function startQuiz() {
  startQuizBtn.classList.add("hidden");
  questionContainer.classList.remove("hidden");
  currentQuestionIndex = 0;
  score = 0;
  showQuestion();
}

function showQuestion() {
  resetState();

  const currentQuestion = questions[currentQuestionIndex];
  questionText.textContent = currentQuestion.question;

  currentQuestion.options.forEach(option => {
    const button = document.createElement("button");
    button.textContent = option;
    button.className =
      "w-full bg-purple-100 hover:bg-purple-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition";
    button.addEventListener("click", () => selectAnswer(button, currentQuestion.answer));
    optionsContainer.appendChild(button);
  });
}

function resetState() {
  nextBtn.classList.add("hidden");
  optionsContainer.innerHTML = "";
}

function selectAnswer(button, correctAnswer) {
  const selectedAnswer = button.textContent;

  if (selectedAnswer === correctAnswer) {
    button.classList.add("bg-green-400");
    correctSound.play();
    score++;
  } else {
    button.classList.add("bg-red-400");
    wrongSound.play();
  }

  Array.from(optionsContainer.children).forEach(btn => {
    btn.disabled = true;
    if (btn.textContent === correctAnswer) {
      btn.classList.add("bg-green-400");
    }
  });

  nextBtn.classList.remove("hidden");
}

function showResult() {
  questionContainer.classList.add("hidden");
  resultContainer.classList.remove("hidden");
  scoreText.textContent = `You scored ${score} out of ${questions.length}`;
  if (score === questions.length) {
    levelUpSound.play();
  }
}

function handleNextButton() {
  currentQuestionIndex++;
  if (currentQuestionIndex < questions.length) {
    showQuestion();
  } else {
    showResult();
  }
}

/* Event Listeners */
startQuizBtn.addEventListener("click", startQuiz);
nextBtn.addEventListener("click", handleNextButton);

/* Init */
loadQuestions();
