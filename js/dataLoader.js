// dataLoader.js
window.DataLoader = (function () {
  function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    const headers = lines.shift().split(",");
    return lines.map(line => {
      const parts = line.split(",").map(s => s.trim());
      const obj = {};
      headers.forEach((h, i) => obj[h] = parts[i] ?? "");
      obj.Page = parseInt(obj.Page, 10) || 0;
      return obj;
    }).filter(r => r.ID && r.Question && r.Answer);
  }
  async function load() {
    const res = await fetch("data/questions.csv");
    const text = await res.text();
    return parseCSV(text);
  }
  return { load };
})();