// Footer audit: total height, and every direct block's height + the vertical
// gaps between them, so the space hogs are obvious before anything is changed.
// usage: node scripts/footer.mjs [w] [h]
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

const info = await page.evaluate(() => {
  const foot = document.querySelector("#drumul").nextElementSibling;
  const fr = foot.getBoundingClientRect();
  const cs = getComputedStyle(foot);
  const rows = [];
  let prevBottom = null;
  [...foot.children].forEach((c, i) => {
    const r = c.getBoundingClientRect();
    if (r.height === 0) return;
    const label = (c.className || c.tagName).toString().slice(0, 28) ||
      (c.textContent || "").trim().slice(0, 24);
    rows.push({
      i,
      block: label,
      h: Math.round(r.height),
      gapAbove: prevBottom === null ? "-" : Math.round(r.top - prevBottom),
      text: (c.textContent || "").trim().replace(/\s+/g, " ").slice(0, 30),
    });
    prevBottom = r.bottom;
  });
  return {
    total: Math.round(fr.height),
    padTop: cs.paddingTop,
    padBottom: cs.paddingBottom,
    tailGap: prevBottom === null ? 0 : Math.round(fr.bottom - prevBottom),
    rows,
  };
});

console.log(`viewport ${w}x${h}`);
console.log(`footer total ${info.total}px (${(info.total / parseInt(h)).toFixed(2)} screens) | padding ${info.padTop} / ${info.padBottom} | tail gap ${info.tailGap}px`);
console.table(info.rows);

await page.evaluate(() => {
  const foot = document.querySelector("#drumul").nextElementSibling;
  window.scrollTo(0, foot.getBoundingClientRect().top + window.scrollY);
});
await new Promise((r) => setTimeout(r, 800));
await page.screenshot({ path: `shots/footer-${w}-top.png` });
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await new Promise((r) => setTimeout(r, 800));
await page.screenshot({ path: `shots/footer-${w}-bottom.png` });
console.log(`shots/footer-${w}-top.png, shots/footer-${w}-bottom.png`);
await browser.close();
