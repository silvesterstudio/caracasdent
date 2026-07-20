// Headless screenshot rig for responsive iteration.
// Usage: node scripts/shoot.mjs <width> <height> <outPrefix> [scrollList]
//   scrollList = comma-separated scroll positions in px, or "auto" to shoot
//   every viewport-height step through the whole page.
import puppeteer from "puppeteer-core";
import { mkdirSync } from "fs";

const [w = "390", h = "844", prefix = "m", scrolls = "auto"] = process.argv.slice(2);
const W = parseInt(w), H = parseInt(h);
const OUT = "shots";
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
});
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 60000 });
await new Promise((r) => setTimeout(r, 2500));

const docH = await page.evaluate(() => document.documentElement.scrollHeight);
let positions;
if (scrolls === "auto") {
  positions = [];
  for (let y = 0; y < docH - H / 2; y += Math.round(H * 0.85)) positions.push(y);
} else {
  positions = scrolls.split(",").map(Number);
}

let n = 0;
for (const y of positions) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  // let lenis settle + reveals fire + lazy media load
  await new Promise((r) => setTimeout(r, 1400));
  await page.screenshot({ path: `${OUT}/${prefix}-${String(n).padStart(2, "0")}-y${y}.png` });
  n++;
}
console.log(`docH=${docH} shots=${n} -> ${OUT}/${prefix}-*.png`);
await browser.close();
