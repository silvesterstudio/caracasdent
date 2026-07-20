// Mobile team service rows, 2-PER-ROW: measures the grid block (height saved vs
// the old 1-per-row stack), checks every cell for horizontal overflow, and
// screenshots the visible doctor.
import puppeteer from "puppeteer-core";
import { mkdirSync } from "fs";

const [w = "390", h = "844"] = process.argv.slice(2);
mkdirSync("shots", { recursive: true });
const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
});
const page = await browser.newPage();
await page.setViewport({ width: parseInt(w), height: parseInt(h) });
await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 60000 });
const y = await page.evaluate(() => {
  const el = document.querySelector("#echipa");
  return el.getBoundingClientRect().top + window.scrollY + window.innerHeight * 0.4;
});
await page.evaluate((yy) => window.scrollTo(0, yy), y);
await new Promise((r) => setTimeout(r, 2000));

const out = await page.evaluate(() => {
  const caps = [...document.querySelectorAll("#echipa .cd-team-caption")];
  const res = [];
  for (const c of caps) {
    const grid = c.nextElementSibling;
    if (!grid) continue;
    const g = grid.getBoundingClientRect();
    const cells = [...grid.children].map((cell) => {
      const span = cell.querySelector("span");
      const lh = parseFloat(getComputedStyle(span).lineHeight);
      const r = cell.getBoundingClientRect();
      return {
        label: span.textContent.trim(),
        w: Math.round(r.width),
        h: Math.round(r.height),
        lines: Math.round(span.getBoundingClientRect().height / lh),
        // does the text box exceed its cell's content width?
        overflow: Math.round(span.scrollWidth - span.clientWidth),
      };
    });
    res.push({
      doctor: c.previousElementSibling.textContent.trim().replace(/\s+/g, " "),
      cols: getComputedStyle(grid).gridTemplateColumns,
      gridTop: Math.round(g.top),
      gridH: Math.round(g.height),
      bottomGap: Math.round(window.innerHeight - g.bottom),
      cells,
    });
  }
  return { vh: window.innerHeight, res };
});

console.log(`viewport ${w}x${h} (innerHeight ${out.vh})`);
for (const d of out.res) {
  console.log(`\n${d.doctor}  cols="${d.cols}"  grid top=${d.gridTop} h=${d.gridH} bottomGap=${d.bottomGap}`);
  console.table(d.cells);
  const bad = d.cells.filter((c) => c.overflow > 0);
  if (bad.length) console.log("  OVERFLOWING:", bad.map((b) => b.label).join(", "));
}
const heights = [...new Set(out.res.map((d) => d.gridH))];
console.log(`\ngrid heights: ${heights.join(", ")}${heights.length === 1 ? " (consistent)" : " (DIFFER)"}`);
const anyOverflow = out.res.some((d) => d.cells.some((c) => c.overflow > 0));
console.log(anyOverflow ? "TEXT OVERFLOW PRESENT" : "no text overflow");
const minGap = Math.min(...out.res.map((d) => d.bottomGap));
console.log(minGap < 0 ? `BLOCK OVERRUNS FRAME by ${-minGap}px` : `clear of frame bottom by ${minGap}px`);

await page.screenshot({ path: `shots/team-grid-${w}.png` });
console.log(`\nshot: shots/team-grid-${w}.png`);
await browser.close();
