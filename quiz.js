let questions = {};
let currentSubject = "Mathematics"; // default
let currentLevel = "level1";
let currentIndex = 0;
let score = 0;
let timer;
let timePerQuestion = 15; // seconds

// Load sound effects
const clickSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-cool-interface-click-tone-2568.mp3");
const flipSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-page-turn-single-1103.mp3");

// Load questions.json once
fetch("questions.json")
  .then(res => res.json())
  .then(data => {
    questions = data;
    // don’t start automatically; let user choose subject
  })
  .catch(err => {
    console.error("Failed to load questions.json:", err);
    document.getElementById("question").innerText = "Error loading questions!";
  });

function selectSubject() {
  currentSubject = document.getElementById("subjectSelect").value;
  currentLevel = "level1";  // always start from level1
  startQuiz();
}

function startQuiz() {
  clearInterval(timer); // stop any old timer
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
  // Fade-out then update question text
  const questionEl = document.getElementById("question");
  questionEl.classList.remove("fade");
  void questionEl.offsetWidth; // trigger reflow
  questionEl.classList.add("fade");
  questionEl.innerText = q.question;

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
      handleAnswer(btn, opt, q.correct);
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

function handleAnswer(button, selected, correct) {
  const allButtons = document.querySelectorAll(".option-btn");
  allButtons.forEach(btn => btn.disabled = true);

  if (selected === correct) {
    score++;
    button.style.backgroundColor = "#4CAF50";
  } else {
    button.style.backgroundColor = "#f44336";
    allButtons.forEach(btn => {
      if (btn.innerText === correct) {
        btn.style.backgroundColor = "#4CAF50";
      }
    });
  }

  currentIndex++;
  setTimeout(() => {
    flipSound.currentTime = 0;
    flipSound.play();
    loadQuestion();
  }, 1000);
}

function endLevel() {
  clearInterval(timer);
  alert(`Level complete! Score: ${score}`);

  // Adjust thresholds to your question counts
  if (currentLevel === "level1" && score >= 7) { // pass mark ~70%
    if (confirm("🎉 Congratulations! Proceed to Level 2?")) {
      currentLevel = "level2";
      startQuiz();
    }
  } else if (currentLevel === "level2" && score >= 7) {
    if (confirm("👏 Great job! Proceed to Level 3?")) {
      currentLevel = "level3";
      startQuiz();
    }
  } else if (currentLevel === "level3" && score >= 7) {
    alert("🏆 You earned the crown! Well done!");
  } else {
    alert("Try again!");
    startQuiz();
  }
}

// Timer
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

function shuffleArray(array) {
  return [...array].sort(() => Math.random() - 0.5);
}


/*
let questions = {};
let currentSubject = "Mathematics"; // can be set dynamically
let currentLevel = "level1";
let currentIndex = 0;
let score = 0;
let timer;
let timePerQuestion = 15; // seconds

// Load sound effects (online free sounds)
const clickSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-cool-interface-click-tone-2568.mp3");
const flipSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-page-turn-single-1103.mp3");

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
      handleAnswer(btn, opt, q.correct);
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

function handleAnswer(button, selected, correct) {
  const allButtons = document.querySelectorAll(".option-btn");

  allButtons.forEach(btn => btn.disabled = true); // disable multiple clicks

  if (selected === correct) {
    score++;
    button.style.backgroundColor = "#4CAF50"; // green for correct
  } else {
    button.style.backgroundColor = "#f44336"; // red for wrong
    // highlight correct one
    allButtons.forEach(btn => {
      if (btn.innerText === correct) {
        btn.style.backgroundColor = "#4CAF50";
      }
    });
  }

  currentIndex++;

  // play flip sound then move on
  setTimeout(() => {
    flipSound.currentTime = 0;
    flipSound.play();
    loadQuestion();
  }, 1000);
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
