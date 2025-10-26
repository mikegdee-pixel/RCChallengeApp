// main.js
(async function () {
  const btnLetsGo = document.getElementById("btn-letsgo");
  const btnBackStart = document.getElementById("btn-back-to-start");
  const btnStart = document.getElementById("btn-start");
  const btnBackFilters = document.getElementById("btn-back-to-filters");
  const btnBuzzer = document.getElementById("btn-buzzer");
  const btnReveal = document.getElementById("btn-reveal");
  const btnNext = document.getElementById("btn-next");
  const screenGame = document.getElementById("screen-game");
function updateModeClass() {
  screenGame.classList.toggle("mode-flashcard", mode === "flashcard");
  screenGame.classList.toggle("mode-mc", mode === "mc");
}


  const scoreBox = document.getElementById("score-box");
  const scoreEl = document.getElementById("score");
  const matchCount = document.getElementById("match-count");

  const levelSelect = document.getElementById("level-select");
  const pageInput = document.getElementById("page-input");
  const pageHint = document.getElementById("page-hint");
  const typeToss = document.getElementById("type-tossup");
  const typeBonus = document.getElementById("type-bonus");
  const modeRadios = document.querySelectorAll("input[name='mode']");

  const qBox = document.getElementById("question-box");
  const aBox = document.getElementById("answer-box");
  const choicesWrap = document.getElementById("choices");
  const choiceButtons = Array.from(document.querySelectorAll(".choice"));

  let data = [];
  let queue = [];
  let index = 0;
  let score = 0;
  let mode = "mc";
  let current = null;
  let answered = false; // MC: prevents double-clicks and controls Next button


  if ("serviceWorker" in navigator) {
    try { navigator.serviceWorker.register("pwa/service-worker.js"); } catch {}
  }

  try {
    data = await DataLoader.load();
    const pages = Array.from(new Set(data.map(r => r.Page))).sort((a,b) => a-b);
    if (pages.length) pageHint.textContent = `Pages available: ${pages[0]} to ${pages[pages.length - 1]}`;
    matchCount.textContent = "Select filters to see matches.";
    btnStart.disabled = true;
  } catch (e) {
    matchCount.textContent = "Could not load questions.csv";
  }

  function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]];} return arr; }
  function computeMatches(){
    const level = levelSelect.value;
    const pageList = Filters.parsePageRanges(pageInput.value);
    const wantTypes = new Set([ ...(typeToss.checked ? ["Toss-up"] : []), ...(typeBonus.checked ? ["Bonus"] : []) ]);
    let result = data.filter(r => !!r.ID);
    if (level) result = result.filter(r => r.Level === level);
    if (pageList.length) result = result.filter(r => pageList.includes(r.Page));
    if (wantTypes.size) result = result.filter(r => wantTypes.has(r.Type));
    matchCount.textContent = `${result.length} matching questions`;
    btnStart.disabled = result.length === 0 || !level;
    return result;
  }
  function resetSession(){ score=0; scoreEl.textContent="0"; index=0; current=null; }
  
 function renderQuestion() {
  current = queue[index];

  // Reset UI
  qBox.textContent = "";
  aBox.textContent = "";
  aBox.classList.add("hidden");

  // Hide all action bits first
  btnReveal.classList.add("hidden");
  btnNext.classList.add("hidden");
  choicesWrap.classList.add("hidden");
   
  choiceButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    if (!current || mode !== "mc" || answered) return; // block double scoring
    answered = true;

    const picked = btn.getAttribute("data-letter");
    const correct = current.CorrectOption || "A";
    const interrupted = Game.wasInterrupted();
    const fully = Game.isFullyDisplayed();

    // Score logic
    if (picked === correct) {
      score += 10;
      btn.classList.add("correct");
    } else {
      if (!fully && interrupted) score -= 5;  // -5 only if buzzed early
      btn.classList.add("incorrect");
      const correctBtn = choiceButtons.find(b => b.getAttribute("data-letter") === correct);
      if (correctBtn) correctBtn.classList.add("correct");
    }
    scoreEl.textContent = String(score);

    // Lock the choices so user can't change answer
    choiceButtons.forEach(b => b.disabled = true);

    // Show the answer text
    aBox.textContent = current.Answer;
    aBox.classList.remove("hidden");

    // IMPORTANT: No setTimeout here — manual progression only
    btnNext.classList.remove("hidden");
  });
});



  function nextQuestion(){ index = (index + 1) % queue.length; renderQuestion(); }

  btnLetsGo.addEventListener("click", () => { UI.show("filters"); });
  btnBackStart.addEventListener("click", () => { UI.show("start"); });
  [levelSelect, pageInput, typeToss, typeBonus].forEach(el => { el.addEventListener("input", computeMatches); el.addEventListener("change", computeMatches); });
  modeRadios.forEach(r => r.addEventListener("change", () => { mode = Array.from(modeRadios).find(r => r.checked)?.value || "mc"; computeMatches(); }));

  btnStart.addEventListener("click", () => {
    const matches = computeMatches();
    queue = shuffle(matches.slice());
    resetSession();
    mode = Array.from(modeRadios).find(r => r.checked)?.value || "mc";
    updateModeClass();     
    UI.show("game"); renderQuestion();
  });
  btnBackFilters.addEventListener("click", () => { resetSession(); UI.show("filters"); });
  btnBuzzer.addEventListener("click", () => {
    Game.markInterrupted(); Game.stopReveal();
    if (mode === "mc") {
      const opts = ["OptionA","OptionB","OptionC","OptionD"].map(k => current[k]);
      const letters = ["A","B","C","D"];
      opts.forEach((text, i) => { choiceButtons[i].textContent = `${letters[i]}. ${text || ""}`; });
      choicesWrap.classList.remove("hidden");
    } else {
      btnReveal.classList.remove("hidden");
    }
  });
 btnReveal.addEventListener("click", () => {
  // Stop the reveal, show the answer
  Game.stopReveal();
  aBox.textContent = current.Answer;
  aBox.classList.remove("hidden");

  if (mode === "mc") {
    // In MC mode, Reveal is only used after picking; do nothing special here
  } else {
    // FLASHCARD: show Next and wait for user click
    btnNext.classList.remove("hidden");
  }
});

  btnNext.addEventListener("click", () => {
  nextQuestion();
});


  choiceButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      if (!current || mode !== "mc") return;
      const picked = btn.getAttribute("data-letter");
      const correct = current.CorrectOption || "A";
      const interrupted = Game.wasInterrupted();
      const fully = Game.isFullyDisplayed();
      if (picked === correct) { score += 10; btn.classList.add("correct"); }
      else { if (!fully && interrupted) score -= 5; btn.classList.add("incorrect"); const cbtn = choiceButtons.find(b => b.getAttribute("data-letter") === correct); if (cbtn) cbtn.classList.add("correct"); }
      scoreEl.textContent = String(score);
      aBox.textContent = current.Answer; aBox.classList.remove("hidden");
    });
  });
  UI.show("start"); computeMatches();
})();
