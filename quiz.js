<script>
  // ===== Utility: Get query parameters =====
  function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      category: params.get("category"),
      subject: params.get("subject")
    };
  }

  const { category, subject } = getQueryParams();

  // ===== Quiz State =====
  let questions = [];
  let currentQuestionIndex = 0;
  let score = 0;

  // ===== DOM Elements =====
  const questionEl = document.getElementById("question");
  const optionsEl = document.getElementById("options");
  const nextBtn = document.getElementById("next-btn");
  const scoreEl = document.getElementById("score");
  const subjectTitleEl = document.getElementById("subject-title");

  // ===== Audio =====
  const correctSound = new Audio("assets/audio/correct.mp3");
  const wrongSound = new Audio("assets/audio/wrong.mp3");

  // ===== Load Questions =====
  async function loadQuestions() {
    if (!category || !subject) {
      alert("Invalid subject selection!");
      return;
    }

    // Try to load from questions/<category>/<subject>.json
    const subjectPath = `questions/${category}/${subject}.json`;

    try {
      const res = await fetch(subjectPath);
      if (res.ok) {
        questions = await res.json();
        startQuiz();
        return;
      } else {
        throw new Error("Subject file not found");
      }
    } catch (err) {
      console.warn(`Could not load ${subjectPath}. Falling back to questions.json`, err);

      // Fallback: Load from global questions.json
      try {
        const res = await fetch("questions.json");
        if (!res.ok) throw new Error("questions.json not found");

        const allData = await res.json();
        if (allData[subject]) {
          questions = allData[subject];
          startQuiz();
        } else {
          throw new Error("Subject not in questions.json");
        }
      } catch (finalErr) {
        console.error("No questions available!", finalErr);
        questionEl.textContent = "No questions found for this subject.";
        nextBtn.style.display = "none";
      }
    }
  }

  // ===== Start Quiz =====
  function startQuiz() {
    subjectTitleEl.textContent = `${category} - ${subject}`;
    currentQuestionIndex = 0;
    score = 0;
    scoreEl.textContent = `Score: ${score}`;
    showQuestion();
  }

  // ===== Show Question =====
  function showQuestion() {
    const q = questions[currentQuestionIndex];
    questionEl.textContent = q.question;
    optionsEl.innerHTML = "";

    q.options.forEach(option => {
      const btn = document.createElement("button");
      btn.className =
        "w-full text-left px-4 py-2 mb-2 bg-gray-100 rounded-lg hover:bg-indigo-500 hover:text-white transition";
      btn.textContent = option;

      btn.onclick = () => selectAnswer(option, q.answer, btn);

      optionsEl.appendChild(btn);
    });

    nextBtn.style.display = "none";
  }

  // ===== Select Answer =====
  function selectAnswer(selected, correct, btn) {
    const buttons = optionsEl.querySelectorAll("button");

    buttons.forEach(b => (b.disabled = true));

    if (selected === correct) {
      btn.classList.add("bg-green-500", "text-white");
      score++;
      scoreEl.textContent = `Score: ${score}`;
      correctSound.play();
    } else {
      btn.classList.add("bg-red-500", "text-white");
      wrongSound.play();

      // highlight correct answer
      buttons.forEach(b => {
        if (b.textContent === correct) {
          b.classList.add("bg-green-500", "text-white");
        }
      });
    }

    nextBtn.style.display = "block";
  }

  // ===== Next Question =====
  nextBtn.addEventListener("click", () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
      showQuestion();
    } else {
      endQuiz();
    }
  });

  // ===== End Quiz =====
  function endQuiz() {
    questionEl.textContent = "Quiz Completed!";
    optionsEl.innerHTML = `<p class="text-lg font-semibold">Your final score is ${score} / ${questions.length}</p>`;
    nextBtn.style.display = "none";
  }

  // ===== Start on page load =====
  loadQuestions();
</script>
