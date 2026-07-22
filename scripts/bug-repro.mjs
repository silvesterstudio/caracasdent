// Repro for two mobile reports (2026-07-22):
//  A) "Cine suntem": white padding at the bottom during the scrub that only
//     goes away when the chunk finishes revealing — step through the scrub,
//     sample the bottom rows of pixels for near-white bands, shoot each step.
//  B) "Ce spun pacienții noștri": the pink marker sweeps BEFORE the text is
//     visible — scroll the title into view and shoot 0/300/600/1000ms after.
// usage: node scripts/bug-repro.mjs [w] [h]
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
// hidden-tab rAF freeze workaround (see memory): patch rAF to keep drivers alive
await page.evaluateOnNewDocument(() => {
  window.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), 16);
});
await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 60000 });
await new Promise((r) => setTimeout(r, 1200));

// ── A) the Cine scrub ──
const scrub = await page.evaluate(() => {
  // the scrub container is the hero root: position:relative + huge vh height
  const goal = document.querySelector(".cd-cine-heading").closest('[style*="position"]');
  // walk up to the tallest ancestor that is the scrub root
  let el = document.querySelector(".cd-cine-heading");
  let root = null;
  while (el) {
    if (el instanceof HTMLElement && el.offsetHeight > window.innerHeight * 1.5) { root = el; break; }
    el = el.parentElement;
  }
  const r = root.getBoundingClientRect();
  return { top: r.top + window.scrollY, height: root.offsetHeight, vh: window.innerHeight };
});
console.log(`scrub root: top ${Math.round(scrub.top)}, height ${scrub.height} (${(scrub.height / scrub.vh).toFixed(1)}vh)`);

const total = scrub.height - scrub.vh;
for (const f of [0.3, 0.5, 0.65, 0.8, 0.9, 0.99]) {
  const y = Math.round(scrub.top + f * total);
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await new Promise((r) => setTimeout(r, 700));
  const shot = `shots/cine-p${String(f).replace(".", "")}-${w}.png`;
  await page.screenshot({ path: shot });
  // sample bottom 25% rows: report the background color of the bottom strip
  const probe = await page.evaluate(() => {
    const pts = [0.6, 0.75, 0.85, 0.92, 0.97].map((fy) => {
      const el = document.elementFromPoint(window.innerWidth / 2, Math.floor(window.innerHeight * fy));
      const bg = el ? getComputedStyle(el).backgroundColor : "?";
      return `${Math.round(window.innerHeight * fy)}px:${el ? el.className || el.tagName : "none"}(${bg})`;
    });
    return pts.join(" | ");
  });
  console.log(`p=${f}: ${shot}\n   ${probe}`);
}

// ── B) the Recenzii title entrance ──
await page.evaluate(() => {
  const t = document.querySelector(".cd-rev-title");
  // park the title just BELOW the fold, then step it in
  window.scrollTo(0, t.getBoundingClientRect().top + window.scrollY - window.innerHeight - 10);
});
await new Promise((r) => setTimeout(r, 600));
await page.evaluate(() => {
  const t = document.querySelector(".cd-rev-title");
  window.scrollTo(0, t.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.5);
});
for (const ms of [0, 300, 600, 1000, 1600]) {
  await new Promise((r) => setTimeout(r, ms === 0 ? 50 : ms));
  const t = await page.evaluate(() => {
    const el = document.querySelector(".cd-rev-title .cd-mark-wrap");
    const cs = getComputedStyle(el, "::before");
    const m = new DOMMatrixReadOnly(cs.transform);
    const title = document.querySelector(".cd-rev-title");
    return {
      markScaleX: m.a.toFixed(2),
      markOn: title.classList.contains("cd-mark-on"),
      font: getComputedStyle(el).fontFamily.split(",")[0],
      loaded: document.fonts.status,
    };
  });
  const shot = `shots/rev-title-${ms}ms-${w}.png`;
  await page.screenshot({ path: shot });
  console.log(`+${ms}ms: mark scaleX=${t.markScaleX} on=${t.markOn} font=${t.font} fonts=${t.loaded} → ${shot}`);
}

await browser.close();
