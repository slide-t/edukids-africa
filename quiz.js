// quiz.js

// ===== Question Bank =====
const questions = {
  Primary: {
    "Mathematics": [
      {
        question: "What is 2 + 2?",
        options: ["3", "4", "5", "6"],
        answer: "4"
      },
      {
        question: "What is 10 - 7?",
        options: ["2", "3", "4", "5"],
        answer: "3"
      }
    ],
    "English Language": [
      {
        question: "Which one is a noun?",
        options: ["Run", "Book", "Quickly", "Happy"],
        answer: "Book"
      },
      {
        question: "Choose the correct spelling:",
        options: ["Baloone", "Balloon", "Baloon", "Balloone"],
        answer: "Balloon"
      }
    ],
    "Basic Science": [
      {
        question: "Which planet is known as the Red Planet?",
        options: ["Earth", "Mars", "Jupiter", "Venus"],
        answer: "Mars"
      }
    ],
    "Basic Technology": [
      {
        question: "Which tool is used to drive nails into wood?",
        options: ["Hammer", "Screwdriver", "Pliers", "Saw"],
        answer: "Hammer"
      }
    ]
  },
  Secondary: {
    "Mathematics": [
      {
        question: "Simplify: 2x + 3x",
        options: ["5", "5x", "6x", "x^5"],
        answer: "5x"
      }
    ],
    "English Language": [
      {
        question: "Identify the verb: She runs every morning.",
        options: ["She", "Runs", "Every", "Morning"],
        answer: "Runs"
      }
    ],
    "Biology": [
      {
        question: "What is the basic unit of life?",
        options: ["Cell", "Tissue", "Organ", "Organism"],
        answer: "Cell"
      }
    ],
    "Physics": [
      {
        question: "What is the SI unit of force?",
        options: ["Joule", "Newton", "Watt", "Pascal"],
        answer: "Newton"
      }
    ]
  }
};

// ===== Helper: Get query params =====
function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    category: params.get("category"),
    subject: params.get("subject")
  };
}

// ===== Load Quiz =====
function loadQuiz() {
  const { category, subject } = getQueryParams();
  const quizContainer = document.getElementById("quiz-container");
  const title = document.getElementById("quiz-title");

  if (!category || !subject || !questions[category] || !questions[category][subject]) {
    title.textContent = "Subject Not Found";
    quizContainer.innerHTML = `<p class="text-red-600">No quiz available for "${subject}" in ${category}.</p>`;
    return;
  }

  title.textContent = `${category} - ${subject} Quiz`;

  questions[category][subject].forEach((q, index) => {
    const div = document.createElement("div");
    div.className = "mb-6 p-4 bg-white rounded-lg shadow";

    const qText = document.createElement("p");
    qText.className = "font-semibold mb-2";
    qText.textContent = `${index + 1}. ${q.question}`;
    div.appendChild(qText);

    q.options.forEach(option => {
      const btn = document.createElement("button");
      btn.className = "block w-full text-left px-4 py-2 mb-2 border rounded hover:bg-yellow-300";
      btn.textContent = option;

      btn.addEventListener("click", () => {
        if (option === q.answer) {
          btn.classList.add("bg-green-400", "text-white");
        } else {
          btn.classList.add("bg-red-400", "text-white");
        }
      });

      div.appendChild(btn);
    });

    quizContainer.appendChild(div);
  });
}

// ===== Run =====
document.addEventListener("DOMContentLoaded", loadQuiz);
