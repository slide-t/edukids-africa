// quiz.js
const QUESTIONS = {
  "Primary-Mathematics": [
    { question: "2 + 2 = ?", options: ["3", "4", "5"], answer: "4" },
    { question: "5 × 3 = ?", options: ["15", "10", "20"], answer: "15" }
  ],
  "Primary-English-Language": [
    { question: "Choose the correct spelling:", options: ["becos", "because", "becaus"], answer: "because" },
    { question: "Select the noun:", options: ["Run", "Book", "Quickly"], answer: "Book" }
  ],
  "Secondary-Mathematics": [
    { question: "Simplify: (2x + 3x)", options: ["5x", "6x", "x^2"], answer: "5x" },
    { question: "What is the derivative of x²?", options: ["x", "2x", "x²"], answer: "2x" }
  ],
  "Secondary-English-Language": [
    { question: "Identify the adjective: The tall boy runs fast.", options: ["boy", "tall", "runs"], answer: "tall" },
    { question: "Choose the synonym of 'happy':", options: ["sad", "joyful", "angry"], answer: "joyful" }
  ]
};

// --- Core Quiz Loader ---
const urlParams = new URLSearchParams(window.location.search);
const key = urlParams.get("key");  // expects e.g. "Primary-Mathematics"
const quizQuestions = QUESTIONS[key] || [];

const quizContainer = document.getElementById("quiz-container");
if (!quizQuestions.length) {
  quizContainer.innerHTML = "<p class='text-center text-red-500'>No questions found for this subject.</p>";
} else {
  renderQuiz();
}

function renderQuiz() {
  let current = 0;
  let score = 0;
  showQuestion();

  function showQuestion() {
    const q = quizQuestions[current];
    quizContainer.innerHTML = `
      <div class="p-6 bg-white rounded-lg shadow">
        <h2 class="text-xl font-bold mb-4">${q.question}</h2>
        <div id="options" class="space-y-2">
          ${q.options.map(opt => `
            <button class="w-full px-4 py-2 bg-gray-100 rounded hover:bg-yellow-400" data-answer="${opt}">
              ${opt}
            </button>`).join("")}
        </div>
      </div>
    `;

    document.querySelectorAll("#options button").forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.dataset.answer === q.answer) score++;
        current++;
        if (current < quizQuestions.length) {
          showQuestion();
        } else {
          quizContainer.innerHTML = `
            <div class="p-6 bg-white rounded-lg shadow text-center">
              <h2 class="text-2xl font-bold mb-4">Quiz Completed!</h2>
              <p class="text-lg">Your Score: ${score} / ${quizQuestions.length}</p>
              <a href="subjects.html" class="mt-4 inline-block bg-indigo-600 text-white px-4 py-2 rounded">Back to Subjects</a>
            </div>
          `;
        }
      });
    });
  }
}
