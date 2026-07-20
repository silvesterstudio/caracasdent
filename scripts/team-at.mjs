// Screenshot the pinned team section at a given progress p (0..1) through its
// 300vh scroll — used to inspect the mid-wipe hand-off.
// usage: node scripts/team-at.mjs <p> [w] [h]
import puppeteer from "puppeteer-core";
import { mkdirSync } from "fs";

const [p = "0.3", w = "390", h = "844"] = process.argv.slice(2);
mkdirSync("shots", { recursive: true });
const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
});
const page = await browser.newPage();
await page.setViewport({ width: parseInt(w), height: parseInt(h) });
await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 60000 });
await page.evaluate((pp) => {
  const sec = document.querySelector("#echipa");
  const top = sec.getBoundingClientRect().top + window.scrollY;
  window.scrollTo(0, top + (sec.offsetHeight - window.innerHeight) * parseFloat(pp));
}, p);
await new Promise((r) => setTimeout(r, 1200)); // let the triggered fade finish
const os = await page.evaluate(() =>
  [...document.querySelectorAll("#echipa .cd-team-name")].map((n) =>
    parseFloat(getComputedStyle(n.closest("[style*='opacity']")).opacity).toFixed(2)
  )
);
console.log(`p=${p} opacities: ${os.join(", ")}`);
const out = `shots/team-at-${p.replace(".", "")}-${w}.png`;
await page.screenshot({ path: out });
console.log("shot:", out);
await browser.close();
