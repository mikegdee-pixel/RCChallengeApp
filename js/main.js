// main.js — RCChallengeApp v9
(async function () {
  // --- Buttons & UI elements ---
  const btnLetsGo = document.getElementById("btn-letsgo");
  const btnBackStart = document.getElementById("btn-back-to-start");
  const btnStart = document.getElementById("btn-start");
  const btnBackFilters = document.getElementById("btn-back-to-filters");
  const btnBuzzer = document.getElementById("btn-buzzer");
  const btnReveal = document.getElementById("btn-reveal");
  const btnNext = document.getElementById("btn-next");

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
  const screenGame = document.getElementById("screen-game");

  // --- State ---
  let data = [];
  let queue = [];
  let index = 0;
  let score = 0;
  let mode = "mc";
  let current = null;
  let answered = false;

  // --- Helpers ---
  function updateModeClass() {
    screenGame.classList.toggle("mode-flashcard", mode === "flashcard");
    screenGame.classList.toggle("mode-mc", mode === "mc");
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(
