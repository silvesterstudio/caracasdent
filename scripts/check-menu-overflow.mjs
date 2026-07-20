// Verifies the mobile menu sheet fits its viewport without scrolling.
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
await new Promise((r) => setTimeout(r, 1500));
await page.click(".cd-menu-btn");
await new Promise((r) => setTimeout(r, 1200));
const m = await page.evaluate(() => {
  const el = document.querySelector(".cd-menu-inner");
  return { scrollH: el.scrollHeight, clientH: el.clientHeight };
});
console.log(`${w}x${h} menu inner:`, JSON.stringify(m), m.scrollH <= m.clientH ? "NO SCROLL ✓" : "STILL SCROLLS ✗");
await browser.close();
