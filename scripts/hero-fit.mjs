// Hero one-screen check: is the .cd-hero-frame svh rule actually in the served
// CSS (an invalid declaration would be silently dropped), and does the hero's
// bottom-anchored content sit inside the first viewport? Headless Chrome has no
// dynamic URL bar, so svh === vh here — the rule's PRESENCE is the testable
// part, plus the CTA's position within the frame.
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
await new Promise((r) => setTimeout(r, 1200));

const r = await page.evaluate(() => {
  const rules = [];
  for (const sheet of document.styleSheets) {
    let list;
    try { list = sheet.cssRules; } catch { continue; }
    const walk = (rs) => {
      for (const rule of rs) {
        // check BEFORE recursing: modern Chrome gives style rules a cssRules
        // property too (CSS nesting), so an else-if never sees their selector
        if (rule.selectorText?.includes("cd-hero-frame")) rules.push(rule.cssText);
        if (rule.cssRules?.length) walk(rule.cssRules);
      }
    };
    walk(list);
  }
  const frame = document.querySelector(".cd-hero-frame");
  const fr = frame.getBoundingClientRect();
  const cta = document.querySelector(".cd-hero-cta");
  const cr = cta ? cta.getBoundingClientRect() : null;
  return {
    svhRule: rules.find((t) => t.includes("100svh")) || null,
    supports: CSS.supports("height", "100svh"),
    frameH: Math.round(fr.height),
    ctaBottom: cr ? Math.round(cr.bottom) : null,
    vh: window.innerHeight,
  };
});
console.log(`${w}x${h}: svh supported=${r.supports} | rule ${r.svhRule ? "PRESENT: " + r.svhRule : "MISSING"}`);
console.log(
  `  frame ${r.frameH}px (vh ${r.vh}) | CTA bottom ${r.ctaBottom} ${r.ctaBottom !== null && r.ctaBottom <= r.vh ? "(inside first screen)" : "(BELOW FOLD)"}`
);
await page.screenshot({ path: `shots/hero-${w}.png` });
console.log(`shots/hero-${w}.png`);
await browser.close();
