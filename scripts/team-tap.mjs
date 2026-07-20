// Taps a mobile team service row and screenshots the resulting bottom sheet —
// the name/caption wrapper sets pointer-events:none, so this proves the rows
// still receive taps.
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

// the visible doctor is the one whose wrapper is opaque
const hit = await page.evaluate(() => {
  const wraps = [...document.querySelectorAll("#echipa .cd-team-name")].map((n) => n.closest("[style*='opacity']"));
  const rowsWrap = [...document.querySelectorAll("#echipa .cd-team-caption")].map((c) => c.nextElementSibling);
  for (let i = 0; i < rowsWrap.length; i++) {
    const w = wraps[i];
    if (w && parseFloat(getComputedStyle(w).opacity) > 0.5 && rowsWrap[i]) {
      const row = rowsWrap[i].firstElementChild;
      const r = row.getBoundingClientRect();
      return { label: row.textContent.trim(), x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
    }
  }
  return null;
});
if (!hit) {
  console.log("no visible row found");
} else {
  console.log("tapping row:", JSON.stringify(hit));
  await page.mouse.click(hit.x, hit.y);
  await new Promise((r) => setTimeout(r, 1400));
  await page.screenshot({ path: "shots/team-tap.png" });
  const open = await page.evaluate(() => {
    const s = [...document.querySelectorAll("#echipa ~ div, #echipa div")].find(
      (d) => d.getAttribute("aria-hidden") === "false"
    );
    return !!s;
  });
  console.log(open ? "sheet OPENED" : "sheet did NOT open");
}
await browser.close();
