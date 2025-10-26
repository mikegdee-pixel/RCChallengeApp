// ui.js
window.UI = (function () {
  const screens = {
    start: document.getElementById("screen-start"),
    filters: document.getElementById("screen-filters"),
    game: document.getElementById("screen-game"),
  };
  function show(name) {
    Object.values(screens).forEach(s => s.classList.remove("active"));
    screens[name].classList.add("active");
  }
  return { show };
})();