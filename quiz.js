// quiz.js

let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let level = 1;
let totalQuestions = 0;
let passMark = 0;

// CLOCK
function startClock() {
  setInterval(() => {
    const now = new Date();
    document.getElementById("clock").textContent =
      now.toLocaleTimeString("en-GB");
  }, 1000);
}

// SHUFFLE FUNCTION
function shuffleArray(array) {
  return array
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

// LOAD QUESTIONS JSON
async function loadQuestions() {
  try {
    const res = await fetch("questions.json");
    const data = await res.json();
    questions = shuffleArray(data[`level${level}`]);

    if (level === 1) {
      totalQuestions = 50;
      passMark = 45;
    } else if (level === 2) {
      totalQuestions = 60;
      passMark = 54;
    } else {
      totalQuestions = 80;
      passMark = 72;
    }

    questions = questions.slice(0, totalQuestions);
    currentQuestionIndex = 0;
    score = 0;

    document.getElementById("levelDisplay").textContent = `Level ${level}`;
    document.getElementById("scoreDisplay").textContent = `Score: 0/${totalQuestions}`;

    showQuestion();
  } catch (err) {
    console.error("Error loading questions:", err);
  }
}

// SHOW QUESTION
function showQuestion() {
  const questionObj = questions[currentQuestionIndex];
  document.getElementById("questionText").textContent = questionObj.question;

  const optionsContainer = document.getElementById("optionsContainer");
  optionsContainer.innerHTML = "";

  // Shuffle options
  const shuffledOptions = shuffleArray(questionObj.options);

  shuffledOptions.forEach(option => {
    const btn = document.createElement("button");
    btn.textContent = option;
    btn.className =
      "w-full text-left px-4 py-2 border rounded-lg transition transform hover:scale-105 bg-gray-100";

    btn.onclick = () => selectAnswer(btn, option, questionObj.answer);

    optionsContainer.appendChild(btn);
  });

  // Update progress bar
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  document.getElementById("progressBar").style.width = `${progress}%`;
}

// SELECT ANSWER
function selectAnswer(button, selected, correct) {
  const options = document.querySelectorAll("#optionsContainer button");

  options.forEach(opt => (opt.disabled = true)); // lock all after one choice

  if (selected === correct) {
    button.classList.add("bg-green-500", "text-white");
    button.innerHTML += " ✅";
    score++;
  } else {
    button.classList.add("bg-red-500", "text-white");
    button.innerHTML += " ❌";

    // highlight correct one
    options.forEach(opt => {
      if (opt.textContent.trim().replace(" ✅","") === correct) {
        opt.classList.add("bg-green-500", "text-white");
        opt.innerHTML += " ✅";
      }
    });
  }

  document.getElementById(
    "scoreDisplay"
  ).textContent = `Score: ${score}/${totalQuestions}`;

  // Next after short delay
  setTimeout(nextQuestion, 1000);
}

// NEXT QUESTION
function nextQuestion() {
  currentQuestionIndex++;

  if (currentQuestionIndex < totalQuestions) {
    showQuestion();
  } else {
    checkPassMark();
  }
}

// CHECK PASS MARK
function checkPassMark() {
  if (score >= passMark) {
    alert(`🎉 Congratulations! You passed Level ${level}.`);

    if (level < 3) {
      level++;
      loadQuestions();
    } else {
      alert("🏆 You’ve completed all levels! Well done!");
    }
  } else {
    alert(`❌ You scored ${score}/${totalQuestions}. You need ${passMark} to pass. Try again!`);
    loadQuestions(); // reshuffle and retry
  }
}

// START QUIZ
document.getElementById("startQuizBtn").addEventListener("click", () => {
  document.getElementById("instructionModal").style.display = "none";
  startClock();
  loadQuestions();
});
