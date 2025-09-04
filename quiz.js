let current = 0, score = 0, timer, questions = [];
let timePerQ = 15; // seconds per question

function shuffle(arr){ return arr.sort(()=>Math.random()-0.5); }
function getParam(name){
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

async function loadQuestions(){
  const subject = getParam("subject") || "Mathematics";
  const level = getParam("level") || "level1";

  const res = await fetch("questions.json");
  const data = await res.json();

  if(data[subject] && data[subject][level]){
    questions = shuffle([...data[subject][level]]);
    document.getElementById("quiz-title").innerText = `${subject} - ${level.toUpperCase()}`;
    renderQuestion();
  } else {
    document.querySelector(".quiz-board").innerHTML = `<h2>No questions for ${subject} ${level}</h2>`;
  }
}

function startTimer(){
  let timeLeft = timePerQ;
  document.getElementById("timer").innerText = `⏰ ${timeLeft}s`;
  timer = setInterval(()=>{
    timeLeft--;
    document.getElementById("timer").innerText = `⏰ ${timeLeft}s`;
    if(timeLeft <= 0){
      clearInterval(timer);
      nextQuestion();
    }
  },1000);
}

function renderQuestion(){
  const q = questions[current];
  document.getElementById("question").innerText = q.question;

  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "";
  shuffle([...q.options]).forEach(opt=>{
    const btn = document.createElement("button");
    btn.innerText = opt;
    btn.onclick = ()=> checkAnswer(btn, q.correct);
    optionsDiv.appendChild(btn);
  });

  updateProgress();
  clearInterval(timer);
  startTimer();
  document.getElementById("sound-flip").play();
}

function checkAnswer(btn, correct){
  clearInterval(timer);
  const buttons = document.querySelectorAll("#options button");
  buttons.forEach(b=>{
    b.disabled = true;
    if(b.innerText === correct) b.classList.add("correct");
    else if(b === btn) b.classList.add("wrong");
  });

  if(btn.innerText === correct){
    score++;
    document.getElementById("score").innerText = `Score: ${score}`;
    document.getElementById("sound-correct").play();
  } else {
    document.getElementById("sound-wrong").play();
  }
  setTimeout(nextQuestion,1000);
}

function nextQuestion(){
  current++;
  if(current < questions.length){ renderQuestion(); }
  else{ showResult(); }
}

function updateProgress(){
  const progress = ((current+1)/questions.length)*100;
  document.getElementById("progress").style.width = progress + "%";
}

function showResult(){
  const subject = getParam("subject") || "Mathematics";
  const level = getParam("level") || "level1";
  const modal = document.getElementById("level-modal");
  const message = document.getElementById("level-message");
  const req = document.getElementById("level-requirement");

  let passScore = (level==="level1"?45 : level==="level2"?55 : 75);
  let nextLevel = (level==="level1"?"level2":level==="level2"?"level3":null);

  if(score >= passScore){
    message.innerText = `🎉 You passed ${level.toUpperCase()}!`;
    req.innerText = `Score: ${score}/${questions.length}`;
    modal.classList.remove("hidden");

    if(nextLevel){
      document.getElementById("next-level-btn").onclick = ()=>{
        window.location.href=`quiz.html?subject=${subject}&level=${nextLevel}`;
      };
    } else {
      document.getElementById("next-level-btn").onclick = ()=>{
        alert("👑 You are crowned champion!");
        window.location.href="index.html";
      };
    }
  } else {
    message.innerText = "😢 Try Again";
    req.innerText = `Score: ${score}/${questions.length}`;
    modal.classList.remove("hidden");
    document.getElementById("next-level-btn").innerText = "Retry";
    document.getElementById("next-level-btn").onclick = ()=> location.reload();
  }

  document.getElementById("exit-btn").onclick = ()=> window.location.href="index.html";
}

loadQuestions();
