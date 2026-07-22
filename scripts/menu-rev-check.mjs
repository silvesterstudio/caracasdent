// 1) opens the menu and screenshots it (new "Recenzii" link, sheet still fits);
// 2) taps a review card on a TOUCH viewport and verifies the marquee keeps running.
// usage: node scripts/menu-rev-check.mjs [w] [h] [touch]
import puppeteer from "puppeteer-core";
import { mkdirSync } from "fs";

const [w = "390", h = "844", touch = "1"] = process.argv.slice(2);
mkdirSync("shots", { recursive: true });
const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
});
const page = await browser.newPage();
await page.setViewport({ width: parseInt(w), height: parseInt(h), hasTouch: touch === "1" });
await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 60000 });
await new Promise((r) => setTimeout(r, 1200));

// ── menu shot ──
await page.click(".cd-menu-btn");
await new Promise((r) => setTimeout(r, 1000));
const links = await page.evaluate(() => [...document.querySelectorAll(".cd-menu-big")].map((b) => b.textContent.trim()));
console.log(`${w}x${h} menu links: ${links.join(" | ")}`);
await page.screenshot({ path: `shots/menu-${w}.png` });

// clicking the Recenzii link must land on #recenzii
const revBtn = await page.evaluateHandle(() => [...document.querySelectorAll(".cd-menu-big")].find((b) => /Recenzii/i.test(b.textContent)));
await revBtn.asElement().click();
await new Promise((r) => setTimeout(r, 2500));
const landed = await page.evaluate(() => {
  const r = document.querySelector("#recenzii").getBoundingClientRect();
  return { top: Math.round(r.top), vh: window.innerHeight };
});
console.log(`after menu click: #recenzii top=${landed.top} (viewport ${landed.vh}) ${landed.top > -50 && landed.top < landed.vh ? "IN VIEW ✓" : "NOT IN VIEW ✗"}`);

// ── marquee tap test (touch viewports only) ──
if (touch === "1") {
  await new Promise((r) => setTimeout(r, 800));
  const sample = () =>
    page.evaluate(() => [...document.querySelectorAll(".cd-rev-track")].map((t) => new DOMMatrixReadOnly(getComputedStyle(t).transform).m41));
  // tap the middle of the first marquee row
  const box = await page.evaluate(() => {
    const r = document.querySelector(".cd-rev-marquee").getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  await page.touchscreen.tap(box.x, box.y);
  await new Promise((r) => setTimeout(r, 300));
  const state = await page.evaluate(() => getComputedStyle(document.querySelector(".cd-rev-track")).animationPlayState);
  const s1 = await sample();
  await new Promise((r) => setTimeout(r, 1500));
  const s2 = await sample();
  const v = (s2[0] - s1[0]) / 1.5;
  console.log(`after tap: play-state=${state}, row0 velocity=${v.toFixed(1)}px/s ${state === "running" && Math.abs(v) > 1 ? "NONSTOP ✓" : "PAUSED ✗"}`);
}
await browser.close();
