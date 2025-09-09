// Get subject from URL
const params = new URLSearchParams(window.location.search);
const subject = params.get("subject");

// Update title
document.getElementById("quiz-title").textContent = subject ? `${subject} Quiz` : "Quiz";

// Questions stored directly in JS for now
const quizData = {
  English: [
    {
      question: "What is the plural of 'child'?",
      options: ["Childs", "Children", "Childes", "Childer"],
      answer: "Children"
    },
    {
      question: "Which of these is a vowel?",
      options: ["B", "C", "E", "G"],
      answer: "E"
    },
    {
      question: "Choose the correct spelling:",
      options: ["becos", "because", "becaus", "becuz"],
      answer: "because"
    }
  ],
  Mathematics: [
    {
      question: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      answer: "4"
    },
    {
      question: "What is 10 ÷ 2?",
      options: ["2", "4", "5", "10"],
      answer: "5"
    },
    {
      question: "Solve: 5 × 3",
      options: ["8", "10", "15", "20"],
      answer: "15"
    }
  ]
};

const quizContainer = document.getElementById("quiz-container");
const resultDiv = document.getElementById("result");

function loadQuiz() {
  quizContainer.innerHTML = "";

  if (!quizData[subject]) {
    quizContainer.innerHTML = `<p class="text-red-600">No quiz available for ${subject}.</p>`;
    document.getElementById("submitBtn").style.display = "none";
    return;
  }

  quizData[subject].forEach((q, index) => {
    const div = document.createElement("div");
    div.className = "mb-4";

    const question = document.createElement("p");
    question.className = "font-medium";
    question.textContent = `${index + 1}. ${q.question}`;
    div.appendChild(question);

    q.options.forEach(opt => {
      const label = document.createElement("label");
      label.className = "block";
      label.innerHTML = `
        <input type="radio" name="q${index}" value="${opt}" class="mr-2"> ${opt}
      `;
      div.appendChild(label);
    });

    quizContainer.appendChild(div);
  });
}

function checkAnswers() {
  if (!quizData[subject]) return;

  let score = 0;
  quizData[subject].forEach((q, index) => {
    const selected = document.querySelector(`input[name="q${index}"]:checked`);
    if (selected && selected.value === q.answer) {
      score++;
    }
  });

  resultDiv.textContent = `You scored ${score} out of ${quizData[subject].length}`;
}

// Load on start
loadQuiz();

// Button action
document.getElementById("submitBtn").addEventListener("click", checkAnswers);
