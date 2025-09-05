
const QUESTION_TIME = 15;
const PASS_MARKS = {
  1:{questions:50,pass:45},
  2:{questions:60,pass:55},
  3:{questions:80,pass:75}
};

let questionsByLevel = {};
let currentLevel = 1;
let currentIndex = 0;
let score = 0;
let timerInterval = null;

const urlParams = new URLSearchParams(window.location.search);
const subjectParam = urlParams.get("subject");

const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const progressText = document.getElementById("progress-text");
const progressFill = document.getElementById("progress-fill");
const timerEl = document.getElementById("timer");
const levelStatus = document.getElementById("level-status");
const quizBoard = document.getElementById("quiz-board");

const correctSound = new Audio("sounds/correct.mp3");
const wrongSound = new Audio("sounds/wrong.mp3");

function startQuiz(){
  currentLevel=1;currentIndex=0;score=0;
  loadQuestions();
}

function loadQuestions(){
  const levelKey=`level${currentLevel}`;
  const questions=questionsByLevel[levelKey];
  if(!Array.isArray(questions)||currentIndex>=questions.length){
    // check pass mark
    if(score>=PASS_MARKS[currentLevel].pass && currentLevel<3){
      // passed
      showLevelModal(currentLevel,score);
    }else{
      endQuiz();
    }
    return;
  }

  const q=questions[currentIndex];
  questionEl.textContent=q.question;
  levelStatus.textContent=`Level ${currentLevel}`;
  progressText.textContent=`Question ${currentIndex+1} of ${questions.length}`;
  progressFill.style.width=((currentIndex+1)/questions.length)*100+"%";

  optionsEl.innerHTML="";
  q.options.forEach(opt=>{
    const btn=document.createElement("button");
    btn.className="option-btn";
    btn.textContent=opt;
    btn.onclick=()=>checkAnswer(opt,q.correct);
    optionsEl.appendChild(btn);
  });

  startTimer();
}

function startTimer(){
  let timeLeft=QUESTION_TIME;
  timerEl.textContent=timeLeft;
  clearInterval(timerInterval);
  timerInterval=setInterval(()=>{
    timeLeft--;
    timerEl.textContent=timeLeft;
    if(timeLeft<=0){
      clearInterval(timerInterval);
      nextQuestion();
    }
  },1000);
}

function checkAnswer(selected,correct){
  clearInterval(timerInterval);
  const buttons=optionsEl.querySelectorAll("button");
  buttons.forEach(btn=>{
    btn.disabled=true;
    if(btn.textContent===correct){btn.classList.add("correct");}
    if(btn.textContent===selected && selected!==correct){btn.classList.add("wrong");}
  });

  if(selected===correct){
    score++;correctSound.play();showEmoji("🎉");
  }else{wrongSound.play();showEmoji("😢");}

  setTimeout(nextQuestion,1500);
}

function nextQuestion(){currentIndex++;loadQuestions();}

function showEmoji(emoji){
  const e=document.createElement("div");
  e.textContent=emoji;
  e.className="bounce-emoji";
  e.style.top="50%";e.style.left="50%";
  e.style.transform="translate(-50%,-50%)";
  e.style.animation="bounce 1s ease forwards";
  document.body.appendChild(e);
  setTimeout(()=>e.remove(),1000);
}

function showLevelModal(level,score){
  document.getElementById("levelModalTitle").textContent=`🎉 You passed Level ${level}`;
  document.getElementById("levelModalText").textContent=
    `Your score: ${score}. Click Continue for Level ${level+1}.`;
  document.getElementById("levelModal").style.display="flex";
}

function endQuiz(){
  quizBoard.innerHTML=`
    <h2>Quiz Completed!</h2>
    <p>You scored <strong>${score}</strong> in Level ${currentLevel} of ${subjectParam}</p>
    <a href="subjects.html" class="start-btn">Back to Subjects</a>
  `;
}

// attach events after DOM ready
window.addEventListener('DOMContentLoaded',()=>{
  // load JSON first
  fetch("questions.json").then(res=>res.json()).then(data=>{
    if(!data[subjectParam]){
      questionEl.textContent=`No questions for ${subjectParam}`;
      return;
    }
    questionsByLevel=data[subjectParam];
  });

  document.getElementById('welcomeModal').style.display='flex';
  document.getElementById('closeWelcome').addEventListener('click',()=>{
    document.getElementById('welcomeModal').style.display='none';
  });
  document.getElementById('startQuizBtn').addEventListener('click',()=>{
    document.getElementById('welcomeModal').style.display='none';
    startQuiz();
  });
  document.getElementById('nextLevelBtn').addEventListener('click',()=>{
    document.getElementById('levelModal').style.display='none';
    currentLevel++;currentIndex=0;score=0;
    loadQuestions();
  });
});

