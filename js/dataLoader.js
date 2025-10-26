// dataLoader.js — robust CSV parsing (handles quotes and commas)
window.DataLoader = (function () {
  function parseCsvLine(line) {
    const cells = [];
    let cell = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cell += '"'; i++; }
        else { inQuotes = !inQuotes; }
      } else if (ch === ',' && !inQuotes) {
        cells.push(cell); cell = "";
      } else {
        cell += ch;
      }
    }
    cells.push(cell);
    return cells.map(s => s.trim());
  }

  function parseCSV(text) {
    const lines = text.replace(/\r/g, "").split("\n").filter(l => l.length > 0);
    if (lines.length === 0) return [];
    const headers = parseCsvLine(lines[0]);
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = parseCsvLine(lines[i]);
      while (parts.length < headers.length) parts.push("");
      if (parts.length > headers.length) parts.length = headers.length;
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = parts[idx] ?? ""; });
      obj.Page = parseInt(obj.Page, 10) || 0;
      if (obj.ID && obj.Question && obj.Answer) rows.push(obj);
    }
    return rows;
  }

  async function load() {
    const res = await fetch("data/questions.csv", { cache: "no-store" });
    const text = await res.text();
    return parseCSV(text);
  }

  return { load };
})();
