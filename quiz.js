// ================================
// quiz.js - EduKids Africa (full)
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
/*const modal = document.getElementById("instructionModal");*/
const startBtn = document.getElementById("startQuizBtn");

/* End modal elements */
const endModal = document.getElementById("endModal");
const endTitle = document.getElementById("endTitle");
const endMessage = document.getElementById("endMessage");
const retryBtn = document.getElementById("retryBtn");
const nextBtn = document.getElementById("nextBtn");

/* State */
let subject = decodeURIComponent(new URLSearchParams(window.location.search).get("subject") || "Mathematics");
let category = decodeURIComponent(new URLSearchParams(window.location.search).get("category") || "Primary"); 
let subjectData = {};
let availableLevels = [];
let currentLevelIndex = 0;
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
const PASS_PERCENT = 75;
const progressKey = `EduKidsProgress_${subject}_${category}`;

/* timer for each question */
let timerInterval;
let timeLeft = 15;
const circle = document.getElementById("timerCircle");
const timerText = document.getElementById("timerText");
const circleLength = 220;

function startTimer() {
  clearInterval(timerInterval);
  timeLeft = 15;
  timerText.textContent = timeLeft;
  circle.style.strokeDasharray = circleLength;
  circle.style.strokeDashoffset =
