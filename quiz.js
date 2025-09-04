let current = 0, score = 0, questions = [], timer;
let level = parseInt(new URLSearchParams(window.location.search).get("level")) || 1;
const subject = new URLSearchParams(window.location.search).get("subject") || "Mathematics";

const requirements = {
  1: { count: 50, pass: 45 },
  2: { count: 60, pass: 55 },
  3: { count: 80, pass: 75 }
};

async function loadQuestions() {
  const res = await fetch("questions.json");
  const data = await res.json();
  if (data[subject] && data[subject][`level${level}`]) {
    questions = shuffle([...data[subject][`level${level}`]]);
    questions = questions.slice(0, requirements[level].count);
    document.getElementById("quiz-title").innerText = `${subject} - Level ${level}`;
    renderQuestion();
  } else {
    document.querySelector(".quiz-board").innerHTML = `<h2>No questions available for ${subject} - Level ${level}</h2>`;
  }
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function renderQuestion() {
  if (current >= questions.length) return showResult();

  const q = questions[current];
  document.getElementById("question").innerText = q.question;

  const optionsBox = document.getElementById("options");
  optionsBox.innerHTML = "";

  shuffle(q.options).forEach(opt => {
    const btn = document.createElement("button");
    btn.innerText = opt;
    btn.onclick = () => checkAnswer(btn, q.correct);
    optionsBox.appendChild(btn);
  });

  updateProgress();
  document.getElementById("sound-flip").play();
}

function checkAnswer(btn, correct) {
  const buttons = document.querySelectorAll("#options button");
  buttons.forEach(b => b.disabled = true);

  if (btn.innerText === correct) {
    btn.classList.add("correct");
    score++;
    document.getElementById("score").innerText = `Score: ${score}`;
    document.getElementById("sound-correct").play();
  } else {
    btn.classList.add("wrong");
    document.getElementById("sound-wrong").play();
  }

  setTimeout(() => {
    current++;
    renderQuestion();
  }, 1000);
}

function updateProgress() {
  const percent = ((current + 1) / questions.length) * 100;
  document.getElementById("progress-bar").style.width = percent + "%";
}

function showResult() {
  const modal = document.getElementById("level-modal");
  const message = document.getElementById("level-message");
  const requirement = document.getElementById("level-requirement");

  if (score >= requirements[level].pass) {
    if (level < 3) {
      message.innerText = `🎉 Great! You passed Level ${level}`;
      requirement.innerText = `Your Score: ${score}/${questions.length}. Ready for Level ${level + 1}?`;
      document.getElementById("next-level-btn").onclick = () => {
        window.location.href = `quiz.html?subject=${subject}&level=${level + 1}`;
      };
    } else {
      message.innerText = `👑 Congratulations! You completed all levels!`;
      requirement.innerText = `Final Score: ${score}/${questions.length}`;
      document.getElementById("next-level-btn").style.display = "none";
    }
  } else {
    message.innerText = `😢 You didn’t pass Level ${level}`;
    requirement.innerText = `Score: ${score}/${questions.length}. You need ${requirements[level].pass} to pass.`;
    document.getElementById("next-level-btn").style.display = "none";
  }

  document.getElementById("retry-btn").onclick = () => window.location.reload();
  modal.classList.add("show");
}

// Init
loadQuestions();
