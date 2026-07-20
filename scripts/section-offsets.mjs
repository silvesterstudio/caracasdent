// Prints each section's scroll offset, so screenshots can target them exactly.
import puppeteer from "puppeteer-core";

const [w = "390", h = "844"] = process.argv.slice(2);
const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
});
const page = await browser.newPage();
await page.setViewport({ width: parseInt(w), height: parseInt(h) });
await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 60000 });
await new Promise((r) => setTimeout(r, 2500));

const rows = await page.evaluate(() =>
  ["#servicii", "#echipa", "#rezultate", "#drumul"].map((id) => {
    const el = document.querySelector(id);
    const r = el.getBoundingClientRect();
    return { id, top: Math.round(r.top + window.scrollY), height: Math.round(r.height) };
  })
);
console.log(`${w}x${h} docH=${await page.evaluate(() => document.documentElement.scrollHeight)}`);
console.table(rows);
await browser.close();
