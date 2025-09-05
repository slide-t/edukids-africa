let questions = {};
let currentSubject = "Mathematics"; // can be set dynamically
let currentLevel = "level1";
let currentIndex = 0;
let score = 0;
let timer;
let timePerQuestion = 15; // seconds

// Load sound effects
const clickSound = new Audio("sounds/click.mp3");
const flipSound = new Audio("sounds/flip.mp3");

// Load questions.json
fetch("questions.json")
  .then(res => res.json())
  .then(data => {
    questions = data;
    startQuiz();
  })
  .catch(err => {
    console.error("Failed to load questions.json:", err);
    document.getElementById("question").innerText = "Error loading questions!";
  });

function startQuiz() {
  currentIndex = 0;
  score = 0;
  loadQuestion();
}

function loadQuestion() {
  const levelQuestions = questions[currentSubject][currentLevel];
  if (currentIndex >= levelQuestions.length) {
    endLevel();
    return;
  }

  const q = levelQuestions[currentIndex];
  document.getElementById("question").innerText = q.question;

  // Shuffle options
  const optionsContainer = document.getElementById("options");
  optionsContainer.innerHTML = "";
  shuffleArray(q.options).forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.innerText = opt;

    btn.onclick = () => {
      clickSound.currentTime = 0;
      clickSound.play();
      checkAnswer(opt, q.correct);
    };

    optionsContainer.appendChild(btn);
  });

  // Progress
  document.getElementById("progress-text").innerText =
    `Question ${currentIndex + 1} of ${levelQuestions.length}`;
  document.getElementById("progress-fill").style.width =
    `${((currentIndex + 1) / levelQuestions.length) * 100}%`;

  // Timer
  resetTimer();
}

function checkAnswer(selected, correct) {
  if (selected === correct) {
    score++;
  }
  currentIndex++;

  // play flip sound before loading next
  setTimeout(() => {
    flipSound.currentTime = 0;
    flipSound.play();
    loadQuestion();
  }, 600);
}

function endLevel() {
  alert(`Level complete! Score: ${score}`);
  if (currentLevel === "level1" && score >= 45) {
    if (confirm("🎉 Congratulations! Proceed to Level 2?")) {
      currentLevel = "level2";
      startQuiz();
    }
  } else if (currentLevel === "level2" && score >= 55) {
    if (confirm("👏 Great job! Proceed to Level 3?")) {
      currentLevel = "level3";
      startQuiz();
    }
  } else if (currentLevel === "level3" && score >= 75) {
    alert("🏆 You earned the crown! Well done!");
  } else {
    alert("Try again!");
    startQuiz();
  }
}

// Timer functions
function resetTimer() {
  clearInterval(timer);
  let timeLeft = timePerQuestion;
  document.getElementById("timer").innerText = formatTime(timeLeft);

  timer = setInterval(() => {
    timeLeft--;
    document.getElementById("timer").innerText = formatTime(timeLeft);

    if (timeLeft <= 0) {
      clearInterval(timer);
      currentIndex++;
      loadQuestion();
    }
  }, 1000);
}

function formatTime(seconds) {
  return seconds < 10 ? `00:0${seconds}` : `00:${seconds}`;
}

// Utility: shuffle array
function shuffleArray(array) {
  return [...array].sort(() => Math.random() - 0.5);
}
