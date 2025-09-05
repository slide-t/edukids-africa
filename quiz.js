// === EduKids Quiz ===

// how long per question (seconds)
const QUESTION_TIME = 15;

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

// === 1. Load JSON and flatten it ===
fetch("questions.json")
  .then(res => res.json())
  .then(data => {
    // Only Mathematics for now – flatten levels
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
  });

// === 2. Start a level ===
function startLevel(level) {
  currentLevel = level;
  currentIndex = 0;
  levelStatus.textContent = `Level ${level}`;
  // filter questions for this level
  questionsThisLevel = allQuestions.filter(q => q.level === level);
  if (questionsThisLevel.length === 0) {
    // no questions for this level, show summary
    endQuiz();
    return;
  }
  currentQuestions = questionsThisLevel;
  loadQuestion();
}

// === 3. Load a question ===
function loadQuestion() {
  clearInterval(timerInterval);
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
      // auto next question
      currentIndex++;
      loadQuestion();
    }
  }, 1000);
}

function formatTime(s) {
  return s < 10 ? `00:0${s}` : `00:${s}`;
}

// === 5. Check answer (with sounds + flash) ===
function checkAnswer(button, selected, correct) {
  clearInterval(timerInterval);

  // disable all buttons so child cannot click again
  const allBtns = document.querySelectorAll(".option-btn");
  allBtns.forEach(b => b.disabled = true);

  if (selected === correct) {
    score++;
    playSound("correct");
    button.classList.add("correct"); // flash green
  } else {
    playSound("wrong");
    button.classList.add("wrong"); // flash red
    // also highlight the correct one
    allBtns.forEach(b => {
      if (b.textContent === correct) b.classList.add("correct");
    });
  }

  currentIndex++;
  // animate progress
  progressFill.style.width = `${((currentIndex) / currentQuestions.length) * 100}%`;

  setTimeout(loadQuestion, 1000); // wait to show color before next Q
}

// === 6. End quiz summary ===
function endQuiz() {
  clearInterval(timerInterval);
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
