// Hero one-screen check (reworked 2026-07-22): the sticky FRAME stays a stable
// inline 100vh (svh/dvh on it caused the Cine dead-band / resize-jank bugs);
// the one-screen fix lives on the hero OVERLAY — .cd-hero-ui gets height:100svh
// ≤860 so the bottom-anchored headline/CTA sit inside the first visible screen.
// Headless Chrome has no dynamic URL bar (svh === vh), so the testable parts are
// the rule's PRESENCE in served CSS (an invalid declaration is silently
// dropped), that NO svh/dvh rule remains on the frame, and the CTA position.
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
  const frameRules = [];
  const uiRules = [];
  for (const sheet of document.styleSheets) {
    let list;
    try { list = sheet.cssRules; } catch { continue; }
    const walk = (rs) => {
      for (const rule of rs) {
        // check BEFORE recursing: modern Chrome gives style rules a cssRules
        // property too (CSS nesting), so an else-if never sees their selector
        if (rule.selectorText?.includes("cd-hero-frame")) frameRules.push(rule.cssText);
        if (rule.selectorText?.includes("cd-hero-ui")) uiRules.push(rule.cssText);
        if (rule.cssRules?.length) walk(rule.cssRules);
      }
    };
    walk(list);
  }
  const frame = document.querySelector(".cd-hero-frame");
  const fr = frame.getBoundingClientRect();
  const ui = document.querySelector(".cd-hero-ui");
  const cta = document.querySelector(".cd-hero-cta");
  const cr = cta ? cta.getBoundingClientRect() : null;
  return {
    uiRule: uiRules.find((t) => t.includes("100svh")) || null,
    frameViewportRule: frameRules.find((t) => t.includes("svh") || t.includes("dvh")) || null,
    supports: CSS.supports("height", "100svh"),
    frameH: Math.round(fr.height),
    uiH: ui ? Math.round(ui.getBoundingClientRect().height) : null,
    ctaBottom: cr ? Math.round(cr.bottom) : null,
    vh: window.innerHeight,
  };
});
console.log(`${w}x${h}: svh supported=${r.supports} | ui rule ${r.uiRule ? "PRESENT: " + r.uiRule : "MISSING"}`);
console.log(`  frame svh/dvh rule: ${r.frameViewportRule ? "STILL PRESENT (should be gone!): " + r.frameViewportRule : "none (stable 100vh) ✓"}`);
console.log(
  `  frame ${r.frameH}px, hero-ui ${r.uiH}px (vh ${r.vh}) | CTA bottom ${r.ctaBottom} ${r.ctaBottom !== null && r.ctaBottom <= r.vh ? "(inside first screen)" : "(BELOW FOLD)"}`
);
await page.screenshot({ path: `shots/hero-${w}.png` });
console.log(`shots/hero-${w}.png`);
await browser.close();
