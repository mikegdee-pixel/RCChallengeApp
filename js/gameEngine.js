// gameEngine.js
window.Game = (function () {
  const REVEAL_DELAY_MS = 40;
  let revealTimer = null;
  let fullyDisplayed = false;
  let interrupted = false;

  function* wordIterator(text) {
    const words = text.split(/(\s+)/);
    for (const w of words) yield w;
  }
  function startReveal(el, text) {
    stopReveal();
    el.textContent = "";
    fullyDisplayed = false;
    interrupted = false;
    const iter = wordIterator(text);
    function tick() {
      const nxt = iter.next();
      if (nxt.done) { fullyDisplayed = true; revealTimer = null; return; }
      el.textContent += nxt.value;
      revealTimer = setTimeout(tick, REVEAL_DELAY_MS);
    }
    tick();
  }
  function stopReveal() { if (revealTimer) clearTimeout(revealTimer); revealTimer = null; }
  function markInterrupted() { if (!fullyDisplayed) interrupted = true; }
  function wasInterrupted() { return interrupted; }
  function isFullyDisplayed() { return fullyDisplayed; }

  return { startReveal, stopReveal, markInterrupted, wasInterrupted, isFullyDisplayed };
})();