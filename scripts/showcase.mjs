// Rezultate (#rezultate) showcase grid: reports the column track, the tall-cell
// pattern and whether any chips are still painted over the cards, then shoots
// the whole section. usage: node scripts/showcase.mjs [w] [h]
import puppeteer from "puppeteer-core";
import { mkdirSync } from "fs";

// pass "expand" as the 3rd arg to click "Vezi mai multe" and measure all 16 cells
const [w = "390", h = "844", mode = ""] = process.argv.slice(2);
mkdirSync("shots", { recursive: true });
const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
});
const page = await browser.newPage();
await page.setViewport({ width: parseInt(w), height: parseInt(h) });
await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 60000 });
await page.evaluate(() => {
  const el = document.querySelector("#rezultate");
  window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY);
});
await new Promise((r) => setTimeout(r, 1500));

if (mode === "expand") {
  const ok = await page.evaluate(() => {
    // scope to the section: .cd-btn-pink is the site-wide CTA class and the
    // first match on the page belongs to another section entirely
    const b = document.querySelector("#rezultate .cd-btn-pink");
    if (!b) return false;
    b.click();
    return true;
  });
  console.log(ok ? "expanded" : "expand button NOT FOUND");
  await new Promise((r) => setTimeout(r, 1500));
}

const info = await page.evaluate(() => {
  const grid = document.querySelector(".cd-showcase-grid");
  const cs = getComputedStyle(grid);
  const g = grid.getBoundingClientRect();
  const colW = g.width / cs.gridTemplateColumns.split(" ").length;
  const cells = [...grid.children].map((c, i) => {
    const r = c.getBoundingClientRect();
    return {
      i,
      tag: c.querySelector("video") ? "video" : "img",
      w: Math.round(r.width),
      h: Math.round(r.height),
      // which column the cell actually landed in, and its top edge — together
      // these prove the repeating unit really alternates sides
      col: Math.round((r.x - g.x) / colW) + 1,
      top: Math.round(r.y - g.y),
      tall: Math.round(r.height) > Math.round(r.width * 0.8),
    };
  });
  const chips = [...document.querySelectorAll(".cd-showcase-chips")];
  const visibleChips = chips.filter((c) => getComputedStyle(c).display !== "none").length;
  return {
    cols: cs.gridTemplateColumns,
    colCount: cs.gridTemplateColumns.split(" ").length,
    gap: cs.gap,
    cells,
    chipsTotal: chips.length,
    visibleChips,
  };
});

console.log(`viewport ${w}x${h}`);
console.log(`columns: ${info.colCount}  (${info.cols})   gap: ${info.gap}`);
console.log(`chips: ${info.visibleChips} visible of ${info.chipsTotal} rendered`);
console.table(info.cells);
console.log(`tall cells at index: ${info.cells.filter((c) => c.tall).map((c) => c.i).join(", ") || "none"}`);

// park the grid in the viewport (the section is taller than the screen and its
// scroll-driven mask overlay covers the top) and let the photos actually arrive
await page.evaluate(() => {
  const g = document.querySelector(".cd-showcase-grid");
  window.scrollTo(0, g.getBoundingClientRect().top + window.scrollY - 10);
});
await page.evaluate(async () => {
  await Promise.all(
    [...document.querySelectorAll(".cd-showcase-grid img")].map((im) =>
      im.complete ? null : new Promise((r) => im.addEventListener("load", r, { once: true }))
    )
  );
});
await new Promise((r) => setTimeout(r, 1500));
await page.screenshot({ path: `shots/showcase-${w}.png` });
console.log(`shot: shots/showcase-${w}.png`);
await browser.close();
