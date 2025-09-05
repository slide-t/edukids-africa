// === EduKids Quiz ===

// how long per question (seconds)
const QUESTION_TIME = 15;

let allQuestions = [];        // loaded from JSON
let currentLevel = 1;
let currentIndex = 0;
let score = 0;
let timerInterval = null;

// get subject from URL
const urlParams = new URLSearchParams(window.location.search);
const subjectParam = urlParams.get("subject");

// DOM elements
const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const progressText = document.getElementById("progress-text");
const progressFill = document.getElementById("progress-fill");
const timerEl = document.getElementById("timer");
const levelStatus = document.getElementById("level-status");
const quizBoard = document.getElementById("quiz-board");

// 1. Load JSON
fetch("questions.json")
  .then(res => res.json())
  .then(data => {
    // filter by subject
    allQuestions = data.filter(q => q.subject === subjectParam);
    startLevel(1);
  })
  .catch(err => {
    console.error("Could not load questions.json", err);
    questionEl.textContent = "Error loading questions.";
  });

// … keep the rest of your quiz.js (startLevel, loadQuestion, startTimer, checkAnswer, endQuiz) unchanged …

// how long per question (seconds)
/*const QUESTION_TIME = 15;

let allQuestions = [];        // loaded from JSON (flattened)
let currentLevel = 1;
let currentIndex = 0;
let score = 0;
let timerInterval = null;

// DOM elements
const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const progressText = document.getElementById("progress-text");
const progressFill = document.getElementById("progress-fill");
const timerEl = document.getElementById("timer");
const levelStatus = document.getElementById("level-status");
const quizBoard = document.getElementById("quiz-board");

// a div for emoji animation
const emojiDiv = document.createElement("div");
emojiDiv.id = "emoji-feedback";
emojiDiv.style.fontSize = "3rem";
emojiDiv.style.textAlign = "center";
emojiDiv.style.height = "3.5rem";
quizBoard.insertBefore(emojiDiv, questionEl);

// === 1. Load JSON and flatten it ===
fetch("questions.json")
  .then(res => res.json())
  .then(data => {
    const math = data.Mathematics;
    allQuestions = [
      ...math.level1.map(q => ({
        level: 1,
        question: q.question,
        options: q.options,
        answer: q.correct
      })),
      ...math.level2.map(q => ({
        level: 2,
        question: q.question,
        options: q.options,
        answer: q.correct
      })),
      ...math.level3.map(q => ({
        level: 3,
        question: q.question,
        options: q.options,
        answer: q.correct
      }))
    ];
    startLevel(1);
  })
  .catch(err => {
    console.error("Could not load questions.json", err);
    questionEl.textContent = "Error loading questions.";
  });*/

// === 2. Start a level ===
function startLevel(level) {
  currentLevel = level;
  currentIndex = 0;
  score = score; // keep running score
  levelStatus.textContent = `Level ${level}`;
  questionsThisLevel = allQuestions.filter(q => q.level === level);
  if (questionsThisLevel.length === 0) {
    endQuiz();
    return;
  }
  currentQuestions = questionsThisLevel;
  loadQuestion();
}

// === 3. Load a question ===
function loadQuestion() {
  clearInterval(timerInterval);

  // clear emoji
  emojiDiv.textContent = "";

  if (currentIndex >= currentQuestions.length) {
    // finished this level
    if (currentLevel < 3) {
      startLevel(currentLevel + 1);
    } else {
      endQuiz();
    }
    return;
  }

  const q = currentQuestions[currentIndex];

  questionEl.textContent = q.question;

  // options
  optionsEl.innerHTML = "";
  q.options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = opt;
    btn.addEventListener("click", () => checkAnswer(btn, opt, q.answer));
    optionsEl.appendChild(btn);
  });

  // progress bar + text
  progressText.textContent = `Question ${currentIndex + 1} of ${currentQuestions.length}`;
  progressFill.style.width = `${((currentIndex) / currentQuestions.length) * 100}%`;

  // timer
  startTimer(QUESTION_TIME);
}

// === 4. Timer countdown ===
function startTimer(time) {
  let remaining = time;
  timerEl.textContent = formatTime(remaining);
  timerInterval = setInterval(() => {
    remaining--;
    timerEl.textContent = formatTime(remaining);
    if (remaining <= 0) {
      clearInterval(timerInterval);
      currentIndex++;
      loadQuestion();
    }
  }, 1000);
}

function formatTime(s) {
  return s < 10 ? `00:0${s}` : `00:${s}`;
}

// === 5. Check answer (with sounds + flash + emoji) ===
function checkAnswer(button, selected, correct) {
  clearInterval(timerInterval);

  // disable all buttons
  const allBtns = document.querySelectorAll(".option-btn");
  allBtns.forEach(b => b.disabled = true);

  if (selected === correct) {
    score++;
    playSound("correct");
    button.classList.add("correct"); // flash green
    emojiDiv.textContent = "✅"; // happy emoji
  } else {
    playSound("wrong");
    button.classList.add("wrong"); // flash red only the one they clicked
    emojiDiv.textContent = "❌"; // sad emoji
    // also show the correct one in green to guide them
    allBtns.forEach(b => {
      if (b.textContent === correct) b.classList.add("correct");
    });
  }

  currentIndex++;
  progressFill.style.width = `${((currentIndex) / currentQuestions.length) * 100}%`;

  setTimeout(loadQuestion, 1200);
}

// === 6. End quiz summary ===
function endQuiz() {
  clearInterval(timerInterval);
  emojiDiv.textContent = "";
  const totalQuestions = allQuestions.length;
  quizBoard.innerHTML = `
    <h2>🎉 Quiz Completed!</h2>
    <p>You answered <strong>${score}</strong> out of <strong>${totalQuestions}</strong> correctly.</p>
    <button id="restart-btn" class="option-btn" style="margin-top:20px;">Restart Quiz</button>
  `;
  document.getElementById("restart-btn").addEventListener("click", () => {
    score = 0;
    startLevel(1);
  });
  progressFill.style.width = "100%";
  progressText.textContent = "Completed!";
  levelStatus.textContent = "Well done!";
}

// === 7. Play sounds ===
function playSound(type) {
  let src = "";
  if (type === "correct") {
    src = "sounds/correct.mp3"; // put your own file path
  } else {
    src = "sounds/wrong.mp3"; // put your own file path
  }
  const audio = new Audio(src);
  audio.play();
}
