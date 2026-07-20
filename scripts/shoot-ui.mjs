// Screenshots of interactive states: menu overlay + a service bottom sheet.
import puppeteer from "puppeteer-core";
import { mkdirSync } from "fs";

const [w = "390", h = "844", prefix = "ui"] = process.argv.slice(2);
mkdirSync("shots", { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
});
const page = await browser.newPage();
await page.setViewport({ width: parseInt(w), height: parseInt(h) });
await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 60000 });
await new Promise((r) => setTimeout(r, 2000));

// 1) menu overlay (top + scrolled)
await page.click(".cd-menu-btn");
await new Promise((r) => setTimeout(r, 1300));
await page.screenshot({ path: `shots/${prefix}-menu-top.png` });
await page.evaluate(() => {
  const inner = document.querySelector(".cd-menu-inner");
  if (inner) inner.scrollTop = inner.scrollHeight;
});
await new Promise((r) => setTimeout(r, 600));
await page.screenshot({ path: `shots/${prefix}-menu-bottom.png` });
await page.click(".cd-menu-btn"); // close
await new Promise((r) => setTimeout(r, 900));

// 2) a services bottom sheet: scroll to services, click the hero card
await page.evaluate(() => {
  const sv = document.querySelector("#servicii");
  window.scrollTo(0, sv.getBoundingClientRect().top + window.scrollY + 100);
});
await new Promise((r) => setTimeout(r, 1200));
await page.click(".cd-svc-hero");
await new Promise((r) => setTimeout(r, 1300));
await page.screenshot({ path: `shots/${prefix}-sheet.png` });

console.log("done");
await browser.close();
