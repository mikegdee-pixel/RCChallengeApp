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

  // Competition controls
const compControls   = document.getElementById("comp-controls");
const bonusControls  = document.getElementById("bonus-controls");
const btnT1Plus10    = document.getElementById("t1-plus10");
const btnT1Minus5    = document.getElementById("t1-minus5");
const btnT2Plus10    = document.getElementById("t2-plus10");
const btnT2Minus5    = document.getElementById("t2-minus5");
const btnCompNoScore = document.getElementById("comp-noscore");

// Bonus
const btnBonusPlus10 = document.getElementById("bonus-plus10");
const btnBonusNo     = document.getElementById("bonus-noscore");
const activeTeamBanner = document.getElementById("active-team-banner");

// Team score readouts
const t1ScoreEl = document.getElementById("t1-score");
const t2ScoreEl = document.getElementById("t2-score");

  // Wrong list UI
const btnToggleWrongList = document.getElementById("btn-toggle-wronglist");
const wronglistModal     = document.getElementById("wronglist-modal");
const wronglistBackdrop  = document.getElementById("wronglist-backdrop");
const btnCloseWrongList  = document.getElementById("btn-close-wronglist");
const btnCopyWrongList   = document.getElementById("btn-copy-wronglist");
const wronglistCount     = document.getElementById("wronglist-count");
const wronglistText      = document.getElementById("wronglist-text");

// Flashcard 'Mark Wrong'
const btnMarkWrong       = document.getElementById("btn-mark-wrong");



  // ---------- App State ----------
  let data = [];
  let queue = [];
  let index = 0;
  let score = 0;
  let mode = "mc";       // "mc" | "flashcard"
  let current = null;
  let answered = false;  // prevent double picks in MC

  // Competition state
  let t1 = 0;
  let t2 = 0;
  let compPhase = "tossup";      // "tossup" | "bonus"
  let bonusFor = null;           // 1 | 2 | null

  // dynamic pools filtered by selections when session starts
  let tossPool = [];
  let bonusPool = [];

  // Track wrong IDs for the current session
let wrongIds = new Set();

function getRecordId(r) {
  // Try common ID field names; fall back to first column detection if needed
  return (
    r?.ID ?? r?.Id ?? r?.id ?? r?.QID ?? r?.QuestionID ?? r?.idx ?? r?.index ?? r?.["ID"] ?? r?.["Question ID"] ?? null
  );
}

function trackWrong(record) {
  const id = getRecordId(record);
  if (id == null) return;
  wrongIds.add(String(id));
  updateWrongListUI();
}

function updateWrongListUI() {
  if (wronglistCount) wronglistCount.textContent = `${wrongIds.size} unique`;
  if (wronglistText)  wronglistText.value = Array.from(wrongIds).join("\n");
}

function toggleWrongList() {
  updateWrongListUI();
  if (!wronglistModal) return;
  wronglistModal.classList.toggle("hidden");
}

function closeWrongList() {
  if (!wronglistModal) return;
  wronglistModal.classList.add("hidden");
}



  // ---------- Helpers ----------
  function updateModeClass() {
    if (!screenGame) return;
    screenGame.classList.toggle("mode-flashcard", mode === "flashcard");
    screenGame.classList.toggle("mode-mc",        mode === "mc");
    screenGame.classList.toggle("mode-competition", mode === "competition");
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function nextTossUpQuestion() {
  const q = pickRandom(tossPool);
  return q || null;
}
function nextBonusQuestion() {
  const q = pickRandom(bonusPool);
  return q || null;
}


  function resetSession() {
    score = 0;
    index = 0;
    current = null;
    answered = false;
    if (scoreEl) scoreEl.textContent = "0";
    wrongIds = new Set();
  updateWrongListUI();
  closeWrongList();

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

function setTypesForLevel(level, isChecked) {
  if (level === "Novice") {
    if (noviceToss)  { noviceToss.checked  = isChecked; styleToggleFor(noviceToss); }
    if (noviceBonus) { noviceBonus.checked = isChecked; styleToggleFor(noviceBonus); }
  } else if (level === "Junior") {
    if (juniorToss)  { juniorToss.checked  = isChecked; styleToggleFor(juniorToss); }
    if (juniorBonus) { juniorBonus.checked = isChecked; styleToggleFor(juniorBonus); }
  } else if (level === "Senior") {
    if (seniorToss)  { seniorToss.checked  = isChecked; styleToggleFor(seniorToss); }
    if (seniorBonus) { seniorBonus.checked = isChecked; styleToggleFor(seniorBonus); }
  }
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
  // Build the full result (your app’s existing logic usually lives here).
  // Keep your existing merge/de-dupe logic if you have it; here’s a safe default:
  let result = [];

  for (const sel of selections) {
    // sel = { level, type, pages[] } from your UI
    let subset = data.filter(r =>
      r.Level === sel.level &&
      r.Type === sel.type &&
      (!sel.pages || sel.pages.length === 0 || sel.pages.includes(r.Page))
    );
    result = result.concat(subset);
  }

  // De-dupe by (Level, Type, Page, Question) if desired:
  const seen = new Set();
  result = result.filter(r => {
    const key = `${r.Level}|${r.Type}|${r.Page}|${r.Question}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Count toss-ups specifically (Competition requires at least one Toss-up)
  const tossCount = result.filter(r => r.Type === "Toss-up").length;

  if (matchCount) matchCount.textContent = `${result.length} matching questions`;

  // Gate the Start button: Competition needs at least one Toss-up
  if (btnStart) {
    const ok = (mode === "competition") ? (tossCount > 0) : (result.length > 0);
    btnStart.disabled = !ok;
  }
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

  function renderQAToBoxes(record) {
  // Reset
  if (qBox) qBox.textContent = "";
  if (aBox) { aBox.textContent = ""; aBox.classList.add("hidden"); }
  if (btnReveal) btnReveal.classList.remove("hidden");

  // Show question instantly for Competition (moderator reads it)
  Game.revealInstant(qBox, record.Question);
  current = record;
}

function renderCompetitionQuestion() {

const tossupTitle = document.getElementById("tossup-title");
const bonusTitle  = document.getElementById("bonus-title");
if (tossupTitle && bonusTitle) {
  if (compPhase === "tossup") {
    tossupTitle.classList.remove("hidden");
    bonusTitle.classList.add("hidden");
  } else {
    tossupTitle.classList.add("hidden");
    bonusTitle.classList.remove("hidden");
  }
}

  
  if (compPhase === "tossup") {
    const q = nextTossUpQuestion();
    if (!q) { Game.revealInstant(qBox, "No more Toss-up questions."); return; }
    renderQAToBoxes(q);
    // Controls: show comp controls, hide bonus controls
    if (compControls)  compControls.classList.remove("hidden");
    if (bonusControls) bonusControls.classList.add("hidden");
  } else {
    const q = nextBonusQuestion();
    if (!q) {
      // If no bonus pool, just skip straight back to Toss-up
      compPhase = "tossup";
      bonusFor  = null;
      renderCompetitionQuestion();
      return;
    }
    renderQAToBoxes(q);
    // Paint dynamic colors/text for the active team banner
    if (activeTeamBanner) {
      activeTeamBanner.textContent = `Active Team: ${bonusFor === 1 ? "Red Team" : "Blue Team"}`;
      activeTeamBanner.style.color = (bonusFor === 1 ? "#c53c3c" : "#234fb0");
    }
    if (compControls)  compControls.classList.add("hidden");
    if (bonusControls) bonusControls.classList.remove("hidden");

    // Color both bonus buttons to match the active team
    const teamBg = (bonusFor === 1 ? "#e54b4b" : "#2f6fed");
    const teamText = "#fff";
    const teamAltText = (bonusFor === 1 ? "#b02020" : "#0f2e7a");
    if (btnBonusPlus10) {
      btnBonusPlus10.style.background = teamBg;
      btnBonusPlus10.style.color = teamText;
    }
    if (btnBonusNo) {
      btnBonusNo.style.background = (bonusFor === 1 ? "#ffd9d9" : "#d9e6ff");
      btnBonusNo.style.color = (bonusFor === 1 ? "#7a1212" : "#163b83");
    }
  }
}

function competitionToNextTossUp() {
  compPhase = "tossup";
  bonusFor  = null;
  renderCompetitionQuestion();
}

function adjustTeamScore(team, delta) {
  if (team === 1) { t1 += delta; if (t1ScoreEl) t1ScoreEl.textContent = String(t1); }
  if (team === 2) { t2 += delta; if (t2ScoreEl) t2ScoreEl.textContent = String(t2); }
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
// Enforce the initial rule: when a level is selected, both its Types are selected
setTypesForLevel("Novice", !!levelNovice.checked);
setTypesForLevel("Junior", !!levelJunior.checked);
setTypesForLevel("Senior", !!levelSenior.checked);
computeMatches();

    
    
  } catch (e) {
    if (matchCount) matchCount.textContent = "Could not load questions.csv";
  }

  // ---------- Wire Events ----------
  on(btnLetsGo, "click", () => showScreen("filters"));
  on(btnBackStart, "click", () => showScreen("start"));
  on(btnBackFilters, "click", () => { resetSession(); showScreen("filters"); });

  // Level checkboxes → show panels + recompute
  [levelNovice, levelJunior, levelSenior].forEach(el => {
  on(el, "change", () => {
    updatePanelsVisibility();

    // Auto-toggle both Types for the level that changed
    if (el === levelNovice)  setTypesForLevel("Novice",  !!levelNovice.checked);
    if (el === levelJunior)  setTypesForLevel("Junior",  !!levelJunior.checked);
    if (el === levelSenior)  setTypesForLevel("Senior",  !!levelSenior.checked);

    computeMatches();
  });
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

on(btnStart, "click", () => {
  const matches = computeMatches();
  resetSession();

  mode = Array.from(modeRadios).find(r => r.checked)?.value || "mc";
  updateModeClass();
  showScreen("game");

  if (mode === "competition") {
    // Build Toss-up and Bonus pools from current selections
    const selections = readSelections();
    tossPool = [];
    bonusPool = [];
    for (const sel of selections) {
      let subset = data.filter(r =>
        r.Level === sel.level &&
        r.Type  === sel.type &&
        (!sel.pages || sel.pages.length === 0 || sel.pages.includes(r.Page))
      );
      if (sel.type === "Toss-up") tossPool = tossPool.concat(subset);
      if (sel.type === "Bonus")   bonusPool = bonusPool.concat(subset);
    }

    // initialize competition state
    t1 = 0; t2 = 0;
    compPhase = "tossup";
    bonusFor  = null;
    if (t1ScoreEl) t1ScoreEl.textContent = "0";
    if (t2ScoreEl) t2ScoreEl.textContent = "0";

    // Show comp UI / hide MC UI
    if (compControls)  compControls.classList.remove("hidden");
    if (bonusControls) bonusControls.classList.add("hidden");
    if (btnBuzzer)     btnBuzzer.classList.add("hidden");
    if (choicesWrap)   choicesWrap.classList.add("hidden");
    if (btnNext)       btnNext.classList.add("hidden");
    if (btnMarkWrong) btnMarkWrong.classList.add("hidden");


    renderCompetitionQuestion();
  } else {
    // ===== hide all Competition UI when NOT in Competition =====
    const tossupTitle = document.getElementById("tossup-title");
    const bonusTitle  = document.getElementById("bonus-title");
    if (tossupTitle) tossupTitle.classList.add("hidden");
    if (bonusTitle)  bonusTitle.classList.add("hidden");
    if (compControls)  compControls.classList.add("hidden");
    if (bonusControls) bonusControls.classList.add("hidden");
    if (t1ScoreEl)     t1ScoreEl.textContent = "0";
    if (t2ScoreEl)     t2ScoreEl.textContent = "0";

      // Flashcard-only 'Mark Wrong'
  if (btnMarkWrong) {
    if (mode === "flashcard") btnMarkWrong.classList.remove("hidden");
    else btnMarkWrong.classList.add("hidden");
  }

    // PRACTICE MODES
    queue = shuffle(matches.slice());
    renderQuestion();
  }
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
        if (current) trackWrong(current);
      }
      if (scoreEl) scoreEl.textContent = String(score);

      // lock choices
      choiceButtons.forEach(b => b.disabled = true);

      if (aBox) { aBox.textContent = current.Answer; aBox.classList.remove("hidden"); }
      if (btnNext) btnNext.classList.remove("hidden");
    });
  });

  // --- Competition: Toss-up actions ---
  on(btnT1Plus10, "click", () => {
    if (mode !== "competition") return;
    adjustTeamScore(1, 10);
    bonusFor  = 1;
    compPhase = "bonus";
    renderCompetitionQuestion();
  });

  on(btnT1Minus5, "click", () => {
    if (mode !== "competition") return;
    adjustTeamScore(1, -5);
    if (current) trackWrong(current);
    competitionToNextTossUp();
  });

  on(btnT2Plus10, "click", () => {
    if (mode !== "competition") return;
    adjustTeamScore(2, 10);
    bonusFor  = 2;
    compPhase = "bonus";
    renderCompetitionQuestion();
  });

  on(btnT2Minus5, "click", () => {
    if (mode !== "competition") return;
    adjustTeamScore(2, -5);
    if (current) trackWrong(current);
    competitionToNextTossUp();
  });

  on(btnCompNoScore, "click", () => {
    if (mode !== "competition") return;
    if (current) trackWrong(current);
    competitionToNextTossUp();
  });

  // --- Competition: Bonus actions ---
  on(btnBonusPlus10, "click", () => {
    if (mode !== "competition" || !bonusFor) return;
    adjustTeamScore(bonusFor, 10);
    competitionToNextTossUp();
  });

  on(btnBonusNo, "click", () => {
    if (mode !== "competition") return;
    if (current) trackWrong(current);
    competitionToNextTossUp();
  });

on(btnToggleWrongList, "click", toggleWrongList);
on(btnCloseWrongList,  "click", closeWrongList);
on(wronglistBackdrop,  "click", closeWrongList);

on(btnCopyWrongList, "click", async () => {
  if (!wronglistText) return;
  try {
    await navigator.clipboard.writeText(wronglistText.value);
    btnCopyWrongList.textContent = "Copied!";
    setTimeout(() => (btnCopyWrongList.textContent = "Copy to Clipboard"), 1200);
  } catch {
    // Fallback: select text
    wronglistText.select();
    document.execCommand("copy");
  }
});

  on(btnMarkWrong, "click", () => {
  if (mode !== "flashcard") return;
  if (current) trackWrong(current);
});


  
  // ---------- Init ----------
  showScreen("start");
  computeMatches();
})();



