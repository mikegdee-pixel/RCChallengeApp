// filters.js
window.Filters = (function () {
  function parsePageRanges(input) {
    if (!input) return [];
    const parts = input.split(",").map(s => s.trim()).filter(Boolean);
    const pages = new Set();
    for (const part of parts) {
      const m = part.match(/^(\d+)\s*-\s*(\d+)$/);
      if (m) {
        let a = parseInt(m[1], 10), b = parseInt(m[2], 10);
        if (a > b) [a, b] = [b, a];
        for (let x = a; x <= b; x++) pages.add(x);
      } else if (/^\d+$/.test(part)) {
        pages.add(parseInt(part, 10));
      }
    }
    return Array.from(pages).sort((a,b) => a - b);
  }
  return { parsePageRanges };
})();