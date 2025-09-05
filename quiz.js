// ==== CONFIG ====
const PASS_MARKS = {
  1: { pass: 45 },
  2: { pass: 55 },
  3: { pass: 75 }
};

// your questions grouped by level
const questionsByLevel = {
  level1: [
    { question: "What is 2 + 2?", options: ["3","4","5"], correct: "4" },
    { question: "What is 5 x 3?", options: ["8","15","10"], correct: "15" }
    // ... add up to 50 questions
  ],
  level2: [
    { question: "What is 12 ÷ 3?", options: ["3","4","6"], correct: "4" }
    // ... add up to 60 questions
  ],
  level3: [
    { question: "What is 25 + 30?", options: ["45","55","65"], correct: "55" }
    // ... add up to 80 questions
  ]
};

// ==== STATE ====
let currentLevel = 1;
let currentIndex = 0;
let score = 0;

// ==== DOM ELEMENTS ====
const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const levelStatus = document.getElementById("level-status");
const progressText = document.getElementById("progress-text");
const progressFill = document.getElementById("progress-fill");

// ==== WELCOME MODAL ====
document.addEventListener("DOMContentLoaded", () => {
  const modalHTML = `
  <div id="welcomeModal" class="welcome-modal">
    <div class="welcome-content">
      <button class="close-modal">&times;</button>
      <h2>Welcome to the Quiz!</h2>
      <p>Level 1: 50 questions (Pass: 45)</p>
      <p>Level 2: 60 questions (Pass: 55)</p>
      <p>Level 3: 80 questions (Pass: 75)</p>
      <p style="font-size:12px;color:#fff;">
        ⚠ Please avoid copyright violations and cyber crimes.
      </p>
      <button id="startQuizBtn" class="start-btn">I am ready</button>
    </div>
  </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // inject styles
  const style = document.createElement("style");
  style.textContent = `
  .welcome-modal {
    position: fixed; top:0; left:0; width:100%; height:100%;
    background-color: rgba(128,0,128,0.6);
    display:flex; justify-content:center; align-items:center; z-index:9999;
  }
  .welcome-content {
    background-color: purple; color:white;
    padding:20px; border-radius:10px; max-width:400px; width:90%;
    text-align:center; position:relative;
  }
  .close-modal {
    position:absolute; top:10px; right:10px;
    background:none; border:none; font-size:24px; color:white; cursor:pointer;
  }
  .start-btn {
    background-color:white; color:purple; border:none;
    width:100%; padding:12px; font-size:16px; border-radius:5px;
    cursor:pointer; margin-top:15px;
  }
  `;
  document.head.appendChild(style);

  const modal = document.getElementById("welcomeModal");
  document.querySelector(".close-modal").onclick = () => modal.remove();
  document.getElementById("startQuizBtn").onclick = () => modal.remove();

  loadQuestions();
});

// ==== QUIZ LOGIC ====
function loadQuestions() {
  const levelKey = `level${currentLevel}`;
  const questions = questionsByLevel[levelKey];

  if (!Array.isArray(questions) || currentIndex >= questions.length) {
    // level ended
    if (score >= PASS_MARKS[currentLevel].pass && currentLevel < 3) {
      // passed – go to next level automatically
      currentLevel++;
      currentIndex = 0;
      score = 0;
      alert(`🎉 Congratulations! Welcome to Level ${currentLevel}`);
      loadQuestions();
    } else {
      endQuiz();
    }
    return;
  }

  const q = questions[currentIndex];
  questionEl.textContent = q.question;
  levelStatus.textContent = `Level ${currentLevel}`;
  progressText.textContent = `Question ${currentIndex + 1} of ${questions.length}`;
  progressFill.style.width = ((currentIndex + 1) / questions.length) * 100 + "%";

  optionsEl.innerHTML = "";
  q.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = opt;
    btn.onclick = () => checkAnswer(opt, q.correct);
    optionsEl.appendChild(btn);
  });
}

function checkAnswer(selected, correct) {
  if (selected === correct) {
    score++;
    showEmoji("🎉");
  }
  currentIndex++;
  loadQuestions();
}

function endQuiz() {
  // your end screen or redirect here
  alert(`Quiz Finished! Your score: ${score}`);
  // for example:
  window.location.href = "subjects.html";
}

// ==== BOUNCE EMOJI ====
function showEmoji(emoji) {
  const e = document.createElement("div");
  e.textContent = emoji;
  e.className = "bounce-emoji";
  e.style.position = "fixed";
  e.style.top = "50%";
  e.style.left = "50%";
  e.style.transform = "translate(-50%,-50%)";
  e.style.fontSize = "3rem";
  e.style.animation = "bounce 1s ease forwards";
  document.body.appendChild(e);
  setTimeout(() => e.remove(), 1000);
}

// inject bounce animation
const bounceStyle = document.createElement("style");
bounceStyle.textContent = `
@keyframes bounce {
  0% {transform:translate(-50%,-50%) scale(0.5);opacity:0;}
  50% {transform:translate(-50%,-60%) scale(1.2);opacity:1;}
  100% {transform:translate(-50%,-50%) scale(1);opacity:0;}
}
.bounce-emoji {pointer-events:none;}
`;
document.head.appendChild(bounceStyle);
