// quiz.js

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const category = params.get("category");   // Primary / Secondary
  const subject = params.get("subject");     // Mathematics, English Language, etc.

  const questionContainer = document.getElementById("question-container");
  const nextBtn = document.getElementById("next-btn");
  const prevBtn = document.getElementById("prev-btn");
  const submitBtn = document.getElementById("submit-btn");
  const resultContainer = document.getElementById("result-container");

  let questions = [];
  let currentQuestionIndex = 0;
  let score = 0;
  let userAnswers = {};

  if (!category || !subject) {
    questionContainer.innerHTML = `<p class="text-red-500">Quiz not available. Missing category or subject.</p>`;
    return;
  }

  // Build correct file path
  const subjectFile = subject.replace(/\s+/g, "-"); // English Language -> English-Language
  const filePath = `questions/${category}/${subjectFile}.json`;

  // Load questions
  fetch(filePath)
    .then((res) => {
      if (!res.ok) throw new Error("File not found");
      return res.json();
    })
    .then((data) => {
      questions = data;
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error("No questions found in file");
      }
      showQuestion();
    })
    .catch((err) => {
      questionContainer.innerHTML = `<p class="text-red-500">Error: ${err.message}</p>`;
    });

  // Show current question
  function showQuestion() {
    const q = questions[currentQuestionIndex];
    questionContainer.innerHTML = `
      <div class="p-4 border rounded-lg shadow">
        <h2 class="text-lg font-semibold mb-4">Q${currentQuestionIndex + 1}. ${q.question}</h2>
        <div class="space-y-2">
          ${q.options
            .map(
              (opt, i) => `
              <label class="block p-2 border rounded cursor-pointer hover:bg-purple-100">
                <input type="radio" name="question${currentQuestionIndex}" value="${opt}" 
                  ${userAnswers[currentQuestionIndex] === opt ? "checked" : ""}>
                ${opt}
              </label>`
            )
            .join("")}
        </div>
      </div>
    `;

    prevBtn.style.display = currentQuestionIndex === 0 ? "none" : "inline-block";
    nextBtn.style.display =
      currentQuestionIndex === questions.length - 1 ? "none" : "inline-block";
    submitBtn.style.display =
      currentQuestionIndex === questions.length - 1 ? "inline-block" : "none";
  }

  // Save selected answer
  function saveAnswer() {
    const selected = document.querySelector(
      `input[name="question${currentQuestionIndex}"]:checked`
    );
    if (selected) {
      userAnswers[currentQuestionIndex] = selected.value;
    }
  }

  nextBtn.addEventListener("click", () => {
    saveAnswer();
    if (currentQuestionIndex < questions.length - 1) {
      currentQuestionIndex++;
      showQuestion();
    }
  });

  prevBtn.addEventListener("click", () => {
    saveAnswer();
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
      showQuestion();
    }
  });

  submitBtn.addEventListener("click", () => {
    saveAnswer();
    score = 0;
    questions.forEach((q, i) => {
      if (userAnswers[i] === q.answer) {
        score++;
      }
    });

    questionContainer.innerHTML = "";
    resultContainer.innerHTML = `
      <div class="p-6 text-center">
        <h2 class="text-2xl font-bold">Quiz Completed!</h2>
        <p class="mt-2 text-lg">Your score: ${score} / ${questions.length}</p>
      </div>
    `;
  });
});
