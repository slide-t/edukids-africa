<script>
/* ================================
   EduKids Africa Quiz Script
   ================================ */

let subject = "";
let subjectData = {};
let currentLevel = "";
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;

/* -------------------------------
   Load subject data (repo → fallback)
-------------------------------- */
async function loadSubjectData() {
  subject = decodeURIComponent(new URLSearchParams(window.location.search).get("subject") || "Mathematics");
  const category = decodeURIComponent(new URLSearchParams(window.location.search).get("category") || "");

  // 1. Try edukids-africa repo path
  if (category) {
    const repoPath = `./questions/${category}/${subject}.json`; 
    try {
      const res = await fetch(repoPath);
      if (res.ok) {
        subjectData = await res.json();
        console.log(`✅ Loaded ${subject} from ${repoPath}`);
        setupLevels();
        return true;
      } else {
        console.warn(`⚠️ ${repoPath} not found (status ${res.status})`);
      }
    } catch (err) {
      console.warn(`⚠️ Could not load ${repoPath}`, err);
    }
  }

  // 2. Fallback to global questions.json
  try {
    const fallbackPath = "./questions.json";
    const res = await fetch(fallbackPath);
    if (!res.ok) throw new Error("questions.json not found");
    const data = await res.json();

    if (category && data[category] && data[category][subject]) {
      subjectData = data[category][subject];
    } else if (data[subject]) {
      subjectData = data[subject];
    } else {
      for (const k of Object.keys(data)) {
        if (typeof data[k] === "object" && data[k][subject]) {
          subjectData = data[k][subject];
          break;
        }
      }
    }

    if (!subjectData || Object.keys(subjectData).length === 0) {
      alert(`❌ No question data found for ${subject}.`);
      return false;
    }

    console.log(`✅ Loaded ${subject} from fallback ${fallbackPath}`);
    setupLevels();
    return true;
  } catch (err) {
    console.error("❌ Failed to load questions.json", err);
    alert("Sorry, we could not load your questions. Please try again later.");
    return false;
  }
}

/* -------------------------------
   Setup level selection
-------------------------------- */
function setupLevels() {
  const levelSelection = document.getElementById("level-selection");
  levelSelection.innerHTML = "<h2>Select Your Level</h2>";

  Object.keys(subjectData).forEach(level => {
    const btn = document.createElement("button");
    btn.textContent = level;
    btn.onclick = () => startQuiz(level);
    levelSelection.appendChild(btn);
  });
}

/* -------------------------------
   Start quiz
-------------------------------- */
function startQuiz(level) {
  currentLevel = level;
  currentQuestions = [...subjectData[level]];
  currentQuestionIndex = 0;
  score = 0;

  document.getElementById("level-selection").style.display = "none";
  document.getElementById("quiz-board").style.display = "block";

  loadQuestion();
}

/* -------------------------------
   Load question
-------------------------------- */
function loadQuestion() {
  if (currentQuestionIndex >= currentQuestions.length) {
    endQuiz();
    return;
  }

  const q = currentQuestions[currentQuestionIndex];
  document.getElementById("question").textContent = q.question;

  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "";

  q.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.onclick = () => checkAnswer(opt, q.answer);
    optionsDiv.appendChild(btn);
  });

  document.getElementById("progress").textContent =
    `Question ${currentQuestionIndex + 1} of ${currentQuestions.length}`;
}

/* -------------------------------
   Check answer
-------------------------------- */
function checkAnswer(selected, correct) {
  if (selected === correct) {
    score++;
    alert("✅ Correct!");
  } else {
    alert(`❌ Wrong! Correct answer is: ${correct}`);
  }

  currentQuestionIndex++;
  loadQuestion();
}

/* -------------------------------
   End quiz
-------------------------------- */
function endQuiz() {
  document.getElementById("quiz-board").style.display = "none";
  document.getElementById("result").style.display = "block";

  document.getElementById("score").textContent =
    `You scored ${score} out of ${currentQuestions.length}`;
}

/* -------------------------------
   Restart quiz
-------------------------------- */
function restartQuiz() {
  document.getElementById("result").style.display = "none";
  document.getElementById("level-selection").style.display = "block";
}

/* -------------------------------
   Auto-start (removed “I’m Ready”)
-------------------------------- */
window.onload = async () => {
  const ok = await loadSubjectData();
  if (!ok) {
    document.getElementById("level-selection").innerHTML =
      "<p>⚠️ Failed to load questions. Please check file paths.</p>";
  }
};
</script>
