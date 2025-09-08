// ================================
// quiz.js - EduKids Africa
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

/* State */
let questions = [];
let currentQuestionIndex = 0;
let score = 0;

/* Get URL params */
const urlParams = new URLSearchParams(window.location.search);
const level = urlParams.get("level");
const subject = urlParams.get("subject");

/* Validate */
if (!level || !subject) {
  alert("Missing subject or level in URL.");
  throw new Error("Missing subject or level in URL");
}

/* File path */
const questionsPath = `questions/${level}/${subject}.json`;

/* Load questions */
async function loadQuestions() {
  try {
    const response = await fetch(questionsPath);
    if (!response.ok) {
      throw new Error(`Failed to load ${questionsPath}`);
    }
    questions = await response.json();
    quizTitle.textContent = `${subject.replace("-", " ")} Quiz (${level})`;
  } catch (error) {
    console.error("Error loading questions:", error);
    quizTitle.textContent = "Error loading quiz.";
    startQuizBtn.disabled = true;
  }
}

/* Start quiz */
function startQuiz() {
  startQuizBtn.classList.add("hidden");
  questionContainer.classList.remove("hidden");
  showQuestion();
}

/* Show question */
function showQuestion() {
  resetState();

  const currentQuestion = questions[currentQuestionIndex];
  questionText.textContent = currentQuestion.question;

  currentQuestion.options.forEach(option => {
    const button = document.createElement("button");
    button.textContent = option;
    button.className =
      "w-full px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition";
    button.addEventListener("click", () => selectAnswer(button, currentQuestion.answer));
    optionsContainer.appendChild(button);
  });
}

/* Reset */
function resetState() {
  nextBtn.classList.add("hidden");
  optionsContainer.innerHTML = "";
}

/* Select answer */
function selectAnswer(button, correctAnswer) {
  const selectedAnswer = button.textContent;

  if (selectedAnswer === correctAnswer) {
    button.classList.add("bg-green-400");
    score++;
    correctSound.play();
  } else {
    button.classList.add("bg-red-400");
    wrongSound.play();
  }

  Array.from(optionsContainer.children).forEach(btn => (btn.disabled = true));
  nextBtn.classList.remove("hidden");
}

/* Next */
function nextQuestion() {
  currentQuestionIndex++;
  if (currentQuestionIndex < questions.length) {
    showQuestion();
  } else {
    showResult();
  }
}

/* Show result */
function showResult() {
  questionContainer.classList.add("hidden");
  resultContainer.classList.remove("hidden");
  scoreText.textContent = `${score} out of ${questions.length}`;
  levelUpSound.play();
}

/* Event listeners */
startQuizBtn.addEventListener("click", startQuiz);
nextBtn.addEventListener("click", nextQuestion);

/* Init */
loadQuestions();
