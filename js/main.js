// main.js — RCChallengeApp v16
"use strict";

(async function () {
  // ---------- Safe helpers ----------
  function on(el, evt, fn) { if (el) el.addEventListener(evt, fn); }
  function showScreen(name) { if (window.UI && typeof UI.show === "function") UI.show(name); }

  // ---------- Grab UI elements ----------
  // Start/Filters/Game nav
  const btnLetsGo       = document.getElementById("btn-letsgo");
  const btnBackStart    = document.getElementById("btn-back-to-start");
  const btnStart        = document.getElementById("btn-start");
  const btnBackFilters  = document.getElementById("btn-back-to-filters");

  // Mode + score/labels
  const modeRadios      = document.querySelectorAll("input[name='mode']");
  const scoreBox        = document.getElementById("score-box");
  const scoreEl         = document.getElementById("score");
  const matchCount      = document.getElementById("match-count");

  // New Level/Subset UI
  const levelNovice     = document.getElementById("level-novice");
  const levelJunior     = document.getElementById("level-junior");
  const levelSenior     = document.getElementById("level-senior");

  const panelNovice     = document.getElementById("panel-novice");
  const panelJunior     = document.getElementById("panel-junior");
  const panelSenior     = document.getElementById("panel-senior");

  // Novice
  const noviceToss      = document.getElementById("novice-tossup");
  const noviceBonus     = document.getElementById("novice-bonus");
  const noviceTossPages = document.getElementById("novice-tossup-pages");
  const noviceBonusPages= document.getElementById("novice-bonus-pages");
  const hintNoviceToss  = document.getElementById("hint-novice-tossup");
  const hintNoviceBonus = document.getElementById("hint-novice-bonus");

  // Junior
  const juniorToss      = document.getElementById("junior-tossup");
  const juniorBonus     = document.getElementById("junior-bonus");
  const juniorTossPages = document.getElementById("junior-tossup-pages");
  const juniorBonusPages= document.getElementById("junior-bonus-pages");
  const hintJuniorToss  = document.getElementById("hint-junior-tossup");
  const hintJuniorBonus = document.getElementById("hint-junior-bonus");

  // Senior
  const seniorToss      = document.getElementById("senior-tossup");
  const seniorBonus     = document.getElementById("senior-bonus");
  const seniorTossPages = document.getElementById("senior-tossup-pages");
  const seniorBonusPages= document.getElementById("senior-bonus-pages");
  const hintSeniorToss  = document.getElementById("hint-senior-tossup");
  const hintSeniorBonus = document.getElementById("hint-senior-bonus");

  // Game screen
  const screenGame      = document.getElementById("screen-game");
  const qBox            = document.getElementById("question-box");
  const aBox            = document.getElementById("answer-box");
  const btnBuzzer       = document.getElementById("btn-buzzer");
  const btnReveal       = document.getElementById("btn-reveal");
  const btnNext         = document.getElementById("btn-next");
  const choicesWrap     = document.getElementById("choices");
  const choiceButtons   = Array.from(document.querySelectorAll(".choice"));

  // ---------- App State ----------
  let data = [];
  let queue = [];
  let index = 0;
  let score = 0;
  let mode = "mc";       // "mc" | "flashcard"
  let current = null;
  let answered = false;  // prevent double picks in MC

  // ---------- Helpers ----------
  function updateModeClass() {
    if (!screenGame) return;
    screenGame.classList.toggle("mode-flashcard", mode === "flashcard");
    screenGame.classList.toggle("mode-mc",        mode === "mc");
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function resetSession() {
    score = 0;
    index = 0;
    current = null;
    answered = false;
    if (scoreEl) scoreEl.textContent = "0";
  }

  function updatePanelsVisibility() {
    if (panelNovice) panelNovice.style.display = levelNovice?.checked ? "block" : "none";
    if (panelJunior) panelJunior.style.display = levelJunior?.checked ? "block" : "none";
    if (panelSenior) panelSenior.style.display = levelSenior?.checked ? "block" : "none";
  }

  function pageHint(level, type) {
    const subsetPages = Array.from(new Set(
      data.filter(r => r.Level === level && r.Type === type).map(r => r.Page)
    )).sort((a, b) => a - b);
    if (subsetPages.length) return `Pages available: ${subsetPages[0]} to ${subsetPages[subsetPages.length - 1]}`;
    return "";
  }

  function readSelections() {
    const sel = [];
    function pushSubset(level, type, checked, pagesInput) {
      if (!checked) return;
      const pages = Filters.parsePageRanges(pagesInput?.value || "");
      sel.push({ level, type, pages }); // pages.length === 0 => all
    }
    if (levelNovice?.checked) {
      pushSubset("Novice", "Toss-up", noviceToss?.checked,  noviceTossPages);
      pushSubset("Novice", "Bonus",   noviceBonus?.checked, noviceBonusPages);
    }
    if (levelJunior?.checked) {
      pushSubset("Junior", "Toss-up", juniorToss?.checked,  juniorTossPages);
      pushSubset("Junior", "Bonus",   juniorBonus?.checked, juniorBonusPages);
    }
    if (levelSenior?.checked) {
      pushSubset("Senior", "Toss-up", seniorToss?.checked,  seniorTossPages);
      pushSubset("Senior", "Bonus",   seniorBonus?.checked, seniorBonusPages);
    }
    return sel;
  }

  function computeMatches() {
    const selections = readSelections();
    let result = [];

    if (selections.length === 0) {
      if (matchCount) matchCount.textContent = "0 matching questions";
      if (btnStart) btnStart.disabled = true;
      return result;
    }

    for (const { level, type, pages } of selections) {
      let subset = data.filter(r => r.Level === level && r.Type === type);
      if (pages.length) subset = subset.filter(r => pages.includes(r.Page));
      result = result.concat(subset);
    }

    // de-dupe by ID
    const seen = new Set();
    result = result.filter(r => {
      if (seen.has(r.ID)) return false;
      seen.add(r.ID);
      return true;
    });

    if (matchCount) matchCount.textContent = `${result.length} matching questions`;
    if (btnStart) btnStart.disabled = result.length === 0;
    return result;
  }

// Toggle visual selected-state on labels when checkboxes change
function styleToggleFor(inputEl) {
  if (!inputEl) return;
  const label = inputEl.closest("label");
  if (!label || !label.classList.contains("toggle-btn")) return;
  label.classList.toggle("selected", !!inputEl.checked);
}

function initToggleSync() {
  const toggleInputs = [
    // Levels
    levelNovice, levelJunior, levelSenior,
    // Novice
    noviceToss, noviceBonus,
    // Junior
    juniorToss, juniorBonus,
    // Senior
    seniorToss, seniorBonus
  ].filter(Boolean);

  // Initial paint
  toggleInputs.forEach(styleToggleFor);

  // Keep in sync on change
  toggleInputs.forEach(el => {
    el.addEventListener("change", () => styleToggleFor(el));
  });
}
  
  function renderQuestion() {
    if (!queue.length) return;
    current = queue[index];

    // Reset UI
    if (qBox) qBox.textContent = "";
    if (aBox) { aBox.textContent = ""; aBox.classList.add("hidden"); }
    if (btnReveal) btnReveal.classList.add("hidden");
    if (btnNext)   btnNext.classList.add("hidden");
    if (choicesWrap) choicesWrap.classList.add("hidden");
    choiceButtons.forEach(b => { b.textContent = ""; b.classList.remove("correct","incorrect"); b.disabled = false; });
    answered = false;

    if (scoreBox) scoreBox.classList.toggle("hidden", mode !== "mc");
    updateModeClass();

    if (mode === "mc") {
      if (btnBuzzer) btnBuzzer.classList.remove("hidden");
      Game.startReveal(qBox, current.Question);          // slow reveal in MC
    } else {
      if (btnBuzzer) btnBuzzer.classList.add("hidden");
      if (btnReveal) btnReveal.classList.remove("hidden");
      Game.revealInstant(qBox, current.Question);        // instant reveal in Flashcard
    }
  }

  function nextQuestion() {
    if (!queue.length) return;
    index = (index + 1) % queue.length;
    renderQuestion();
  }

  // ---------- PWA SW ----------
  if ("serviceWorker" in navigator) {
    try { navigator.serviceWorker.register("pwa/service-worker.js"); } catch {}
  }

  // ---------- Load Data ----------
  try {
    data = await DataLoader.load();

    // Per-subset page hints
    if (hintNoviceToss)  hintNoviceToss.textContent  = pageHint("Novice", "Toss-up");
    if (hintNoviceBonus) hintNoviceBonus.textContent = pageHint("Novice", "Bonus");
    if (hintJuniorToss)  hintJuniorToss.textContent  = pageHint("Junior", "Toss-up");
    if (hintJuniorBonus) hintJuniorBonus.textContent = pageHint("Junior", "Bonus");
    if (hintSeniorToss)  hintSeniorToss.textContent  = pageHint("Senior", "Toss-up");
    if (hintSeniorBonus) hintSeniorBonus.textContent = pageHint("Senior", "Bonus");

    if (matchCount) matchCount.textContent = "Select levels/subsets to see matches.";
    if (btnStart) btnStart.disabled = true;

updatePanelsVisibility();
computeMatches();
initToggleSync();  
    
  } catch (e) {
    if (matchCount) matchCount.textContent = "Could not load questions.csv";
  }

  // ---------- Wire Events ----------
  on(btnLetsGo, "click", () => showScreen("filters"));
  on(btnBackStart, "click", () => showScreen("start"));
  on(btnBackFilters, "click", () => { resetSession(); showScreen("filters"); });

  // Level checkboxes → show panels + recompute
  [levelNovice, levelJunior, levelSenior].forEach(el => {
    on(el, "change", () => { updatePanelsVisibility(); computeMatches(); });
  });

  // Subset checks + page inputs → recompute
  [
    noviceToss, noviceBonus, juniorToss, juniorBonus, seniorToss, seniorBonus,
    noviceTossPages, noviceBonusPages, juniorTossPages, juniorBonusPages, seniorTossPages, seniorBonusPages
  ].forEach(el => {
    on(el, "input",  computeMatches);
    on(el, "change", computeMatches);
  });

  // Mode radio → just store mode and recompute count (for Start enable)
  modeRadios.forEach(r => on(r, "change", () => {
    mode = Array.from(modeRadios).find(r => r.checked)?.value || "mc";
    computeMatches();
  }));

  // Start session
  on(btnStart, "click", () => {
    const matches = computeMatches();
    queue = shuffle(matches.slice());
    resetSession();
    mode = Array.from(modeRadios).find(r => r.checked)?.value || "mc";
    updateModeClass();
    showScreen("game");
    renderQuestion();
  });

  // BUZZER (MC only)
  on(btnBuzzer, "click", () => {
    if (!current || mode !== "mc") return;
    Game.markInterrupted();
    Game.stopReveal();

    const opts = ["OptionA","OptionB","OptionC","OptionD"].map(k => current[k]);
    const letters = ["A","B","C","D"];
    opts.forEach((text, i) => {
      const btn = choiceButtons[i];
      if (btn) btn.textContent = `${letters[i]}. ${text || ""}`;
    });
    if (choicesWrap) choicesWrap.classList.remove("hidden");
  });

  // REVEAL (Flashcard only)
  on(btnReveal, "click", () => {
    if (!current) return;
    Game.stopReveal();
    if (aBox) { aBox.textContent = current.Answer; aBox.classList.remove("hidden"); }
    if (mode === "flashcard" && btnNext) btnNext.classList.remove("hidden");
  });

  // NEXT (shared)
  on(btnNext, "click", nextQuestion);

  // MC choices
  choiceButtons.forEach(btn => {
    on(btn, "click", () => {
      if (!current || mode !== "mc" || answered) return;
      answered = true;

      const picked      = btn.getAttribute("data-letter");
      const correct     = current.CorrectOption || "A";
      const interrupted = Game.wasInterrupted();
      const fully       = Game.isFullyDisplayed();

      if (picked === correct) {
        score += 10;
        btn.classList.add("correct");
      } else {
        if (!fully && interrupted) score -= 5; // -5 only if buzzed early
        btn.classList.add("incorrect");
        const correctBtn = choiceButtons.find(b => b.getAttribute("data-letter") === correct);
        if (correctBtn) correctBtn.classList.add("correct");
      }
      if (scoreEl) scoreEl.textContent = String(score);

      // lock choices
      choiceButtons.forEach(b => b.disabled = true);

      if (aBox) { aBox.textContent = current.Answer; aBox.classList.remove("hidden"); }
      if (btnNext) btnNext.classList.remove("hidden");
    });
  });

  // ---------- Init ----------
  showScreen("start");
  computeMatches();
})();
