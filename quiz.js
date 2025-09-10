// ==========================
// Quiz.js (Updated - No Modal, Auto Start)
// ==========================

// Global variables
let subject = "";
let subjectData = {};
let availableLevels = [];
let currentLevelIndex = 0;
let progressKey = "";
let currentLevel = "";
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let correctSound = new Audio("audio/correct.mp3");
let wrongSound = new Audio("audio/wrong.mp3");

// ========== LOAD SUBJECT DATA ==========
async function loadSubjectData() {
  subject = decodeURIComponent(new URLSearchParams(window.location.search).get("subject") || "Mathematics");
  const category = decodeURIComponent(new URLSearchParams(window.location.search).get("category") || "");
  progressKey = `${subject}_progress`;

  // Try category-specific JSON
  if (category) {
    const path = `questions/${category}/${subject}.json`;
    try {
      const res = await fetch(path);
      if (res.ok) {
        subjectData = await res.json();
        console.log(`✅ Loaded ${subject} from ${path}`);
        setupLevels();
        startLevel(); // 🚀 auto start
        return true;
      }
    } catch (err) {
      console.warn(`⚠️ Could not load ${path}, falling back...`, err);
    }
  }

  // Fallback to global questions.json
  try {
    const res = await fetch("questions.json");
    if (!res.ok) throw new Error("questions.json not found");
    const data = await res.json();

    if (category && data[category] && data[category][subject]) {
      subjectData = data[category][subject];
    } else if (data[subject]) {
      subjectData = data[subject];
    } else {
      // scan all categories
      for (const k of Object.keys(data)) {
        if (typeof data[k] === "object" && data[k][subject]) {
          subjectData = data[k][subject];
          break;
        }
      }
    }

    if (!subjectData || Object.keys(subjectData).length === 0) {
      console.error("No question data found for subject:", subject);
      return false;
    }

    console.log(`✅ Loaded ${subject} from fallback questions.json`);
    setupLevels();
    startLevel(); // 🚀 auto start
    return true;
  } catch (err) {
    console.error("❌ Failed to load questions.json", err);
    return false;
  }
}

// ========== SETUP LEVELS ==========
function setupLevels() {
  availableLevels = Object.keys(subjectData)
    .filter(k => /^Level\s*\d+/i.test(k))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)[0], 10);
      const nb = parseInt(b.match(/\d+/)[0], 10);
      return na - nb;
    });

  if (availableLevels.length === 0) {
    alert(`Sorry, no playable levels found for ${subject}.`);
    return;
  }

  // Handle missing/only levels
  if (availableLevels.length === 1) {
    alert(`You only have ${availableLevels[0]} to play for ${subject}.`);
  } else {
    const nums = availableLevels.map(l => parseInt(l.match(/\d+/)[0], 10));
    const missing = [];
    for (let i = nums[0]; i <= nums[nums.length - 1]; i++) {
      if (!nums.includes(i)) missing.push(i);
    }
    if (missing.length > 0) {
      alert(
        `Note: Level${missing.length > 1 ? "s" : ""} ${missing.join(", ")} ${
          missing.length > 1 ? "are" : "is"
        } missing. You can only play ${availableLevels.join(", ")} for ${subject}.`
      );
    }
  }

  // Track progress
  const progress = JSON.parse(localStorage.getItem(progressKey) || "{}");
  let firstNotPassed = availableLevels.findIndex(l => !progress[l]);
  currentLevelIndex = (firstNotPassed === -1) ? availableLevels.length : firstNotPassed;
}

// ========== START LEVEL ==========
function startLevel() {
  if (currentLevelIndex >= availableLevels.length) {
    alert("🎉 Congratulations! You’ve completed all levels for " + subject);
    return;
  }

  currentLevel = availableLevels[currentLevelIndex];
  questions = subjectData[currentLevel];
  currentQuestionIndex = 0;
  score = 0;

  document.getElementById("quiz-board").innerHTML = `<h2>${currentLevel}</h2>`;
  showQuestion();
}

// ========== SHOW QUESTION ==========
function showQuestion() {
  if (currentQuestionIndex >= questions.length) {
    endLevel();
    return;
  }

  const q = questions[currentQuestionIndex];
  const quizBoard = document.getElementById("quiz-board");

  quizBoard.innerHTML = `
    <div class="question">
      <p>${q.question}</p>
      <div class="options">
        ${q.options.map((opt, i) => `<button onclick="checkAnswer('${opt}')">${opt}</button>`).join("")}
      </div>
    </div>
  `;
}

// ========== CHECK ANSWER ==========
function checkAnswer(answer) {
  const q = questions[currentQuestionIndex];
  if (answer === q.answer) {
    correctSound.play();
    score++;
  } else {
    wrongSound.play();
  }

  currentQuestionIndex++;
  showQuestion();
}

// ========== END LEVEL ==========
function endLevel() {
  const quizBoard = document.getElementById("quiz-board");

  quizBoard.innerHTML = `
    <h2>${currentLevel} Completed!</h2>
    <p>Your Score: ${score} / ${questions.length}</p>
    <button onclick="nextLevel()">Next Level</button>
  `;

  // Save progress
  const progress = JSON.parse(localStorage.getItem(progressKey) || "{}");
  progress[currentLevel] = { score, total: questions.length, passed: true };
  localStorage.setItem(progressKey, JSON.stringify(progress));
}

// ========== NEXT LEVEL ==========
function nextLevel() {
  currentLevelIndex++;
  startLevel();
}

// ========== INIT ==========
window.onload = () => {
  loadSubjectData();
};
