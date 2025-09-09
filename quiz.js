// quiz.js

// Audio feedback
const correctAudio = new Audio("audio/correct.mp3");
const wrongAudio = new Audio("audio/wrong.mp3");

// Parse URL params
const urlParams = new URLSearchParams(window.location.search);
const category = urlParams.get("category");
const subject = urlParams.get("subject");

// Elements
const questionContainer = document.getElementById("question-container");
const nextBtn = document.getElementById("next-btn");
const scoreContainer = document.getElementById("score-container");

let questions = [];
let currentQuestionIndex = 0;
let score = 0;

// Load questions JSON
async function loadQuestions() {
  if (!category || !subject) {
    questionContainer.innerHTML = `<p class="text-red-600">Invalid subject/category.</p>`;
    return;
  }

  const filePath = `questions/${category}/${subject}.json`;
  try {
    const res = await fetch(filePath);
    if (!res.ok) throw new Error("File not found");
    const data = await res.json();

    if (!data || data.length === 0) {
      throw new Error("No questions in file");
    }

    // Shuffle and take 5
    questions = shuffle(data).slice(0, 5);
    currentQuestionIndex = 0;
    score = 0;
    showQuestion();
  } catch (err) {
    console.error(err);
    questionContainer.innerHTML = `<p class="text-red-600">Quiz not available for ${subject} (${category}).</p>`;
  }
}

// Shuffle helper
function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

// Display one question
function showQuestion() {
  const q = questions[currentQuestionIndex];
  questionContainer.innerHTML = `
    <h2 class="text-xl font-semibold mb-4">${q.question}</h2>
    <div class="space-y-2">
      ${q.options
        .map(
          (opt) => `
        <button class="option w-full px-4 py-2 bg-gray-100 rounded hover:bg-indigo-500 hover:text-white transition">
          ${opt}
        </button>`
        )
        .join("")}
    </div>
  `;

  document.querySelectorAll(".option").forEach((btn) => {
    btn.addEventListener("click", () => selectAnswer(btn.textContent, q.answer));
  });
}

// Handle answer selection
function selectAnswer(selected, correct) {
  if (selected === correct) {
    score++;
    correctAudio.play();
  } else {
    wrongAudio.play();
  }
  nextBtn.classList.remove("hidden");
}

// Next button logic
nextBtn.addEventListener("click", () => {
  currentQuestionIndex++;
  if (currentQuestionIndex < questions.length) {
    showQuestion();
    nextBtn.classList.add("hidden");
  } else {
    showScore();
  }
});

// Final score
function showScore() {
  questionContainer.innerHTML = `
    <h2 class="text-2xl font-bold">Quiz Completed!</h2>
    <p class="mt-4">You scored <span class="font-semibold">${score}</span> out of <span class="font-semibold">${questions.length}</span>.</p>
  `;
  scoreContainer.classList.remove("hidden");
}

// Load on page start
loadQuestions();
