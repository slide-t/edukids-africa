// quiz.js (minimal version with category + subject separation)

// ✅ Parse URL parameters
const urlParams = new URLSearchParams(window.location.search);
const category = urlParams.get("category");
const subject = urlParams.get("subject");
const key = `${category}-${subject}`;

// ✅ Question bank (namespaced by category-subject)
const questions = {
  "Mathematics": [
    { question: "What is 2 + 2?", options: ["3", "4", "5", "6"], answer: "4" },
    { question: "What is 5 × 3?", options: ["15", "10", "20", "25"], answer: "15" }
  ],
  "Secondary-Mathematics": [
    { question: "Simplify: 2x + 3x", options: ["5x", "6x", "x^2", "2x^2"], answer: "5x" },
    { question: "Solve: 4y = 20", options: ["4", "5", "10", "20"], answer: "5" }
  ],
  "English Language": [
    { question: "Choose the correct spelling:", options: ["becos", "because", "becaus", "becuz"], answer: "because" },
    { question: "Select the noun:", options: ["run", "happy", "book", "quickly"], answer: "book" }
  ],
  "Secondary-English Language": [
    { question: "What is a synonym for 'happy'?", options: ["sad", "angry", "joyful", "tired"], answer: "joyful" },
    { question: "Identify the adverb:", options: ["quickly", "dog", "blue", "teacher"], answer: "quickly" }
  ]
};

// ✅ State variables
let currentQuestionIndex = 0;
let score = 0;
const quizQuestions = questions[key] || [];

// ✅ DOM elements
const questionText = document.getElementById("questionText");
const optionsContainer = document.getElementById("optionsContainer");
const scoreDisplay = document.getElementById("scoreDisplay");
const levelDisplay = document.getElementById("levelDisplay");
const progressBar = document.getElementById("progressBar");

// ✅ Load a question
function renderQuestion() {
  if (currentQuestionIndex >= quizQuestions.length) {
    showSummary();
    return;
  }

  const q = quizQuestions[currentQuestionIndex];
  questionText.textContent = q.question;
  optionsContainer.innerHTML = "";

  q.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.className =
      "w-full px-4 py-2 bg-gray-200 rounded-lg hover:bg-purple-600 hover:text-white transition";
    btn.onclick = () => handleAnswer(opt);
    optionsContainer.appendChild(btn);
  });

  scoreDisplay.textContent = `Score: ${score}/${quizQuestions.length}`;
  progressBar.style.width = `${
    (currentQuestionIndex / quizQuestions.length) * 100
  }%`;
}

// ✅ Handle answer
function handleAnswer(selected) {
  const correct = quizQuestions[currentQuestionIndex].answer;
  if (selected === correct) {
    score++;
  }
  currentQuestionIndex++;
  renderQuestion();
}

// ✅ Show summary
function showSummary() {
  questionText.textContent = "Quiz Complete!";
  optionsContainer.innerHTML = `<p class="text-center text-lg">Your score: ${score} / ${quizQuestions.length}</p>`;
  progressBar.style.width = "100%";
}

// ✅ Initialize
if (!quizQuestions.length) {
  questionText.textContent = `No questions available for ${category} - ${subject}`;
} else {
  renderQuestion();
}
