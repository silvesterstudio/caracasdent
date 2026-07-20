// Timeline mobile ARRANGEMENT experiments. Injects a variant's CSS over the
// live page (nothing in the repo changes) and shoots the section, so options can
// be compared before one is committed.
// usage: node scripts/tl-variants.mjs <a|b|d|current> [w] [h]
import puppeteer from "puppeteer-core";
import { mkdirSync } from "fs";

const [variant = "current", w = "390", h = "844"] = process.argv.slice(2);
mkdirSync("shots", { recursive: true });

// DOM inside .cd-tl-item (a grid): 1 = .cd-tl-img (absolute, JS writes its
// parallax transform), 2 = left col (name), 3 = centre col (square), 4 = right
// col (body). The track .cd-tl-line is absolute in the 92.85vw component.
const VARIANTS = {
  current: "",

  // A — LEFT RAIL: track + squares move to the left edge; photo, name and body
  // all get the full remaining width. Text stops being a 148px column.
  a: `
    .cd-tl-line { left: 6% !important; }
    .cd-tl-item {
      grid-template-columns: 12% 88% !important;
      padding: 3vh 0 5vh !important;
    }
    .cd-tl-img { left: 56% !important; width: 82vw !important; height: 32vh !important; }
    .cd-tl-item > *:nth-child(2) {
      grid-column: 2 !important; grid-row: 1 !important;
      height: auto !important; margin-top: calc(32vh + 2vh) !important;
    }
    .cd-tl-item > *:nth-child(3) {
      grid-column: 1 !important; grid-row: 1 / span 2 !important; height: 100% !important;
    }
    .cd-tl-item > *:nth-child(4) {
      grid-column: 2 !important; grid-row: 2 !important;
      height: auto !important; margin-top: 10px !important;
    }
    .cd-tl-name { font-size: clamp(22px, 6.4vw, 34px) !important; }
    .cd-tl-body { font-size: clamp(14px, 3.9vw, 17px) !important; }
  `,

  // B — CARDS ON A THREAD: the track stays centred and continuous, but each step
  // is a full-width opaque block sitting OVER it, so the line and its squares
  // show only in the gaps — stitching the steps together.
  b: `
    .cd-tl-item {
      grid-template-columns: 100% !important;
      padding: calc(34vh + 3vh) 5vw 4vh !important;
      margin-bottom: 9vh !important;
      background: #161516 !important;
      z-index: 4 !important;
    }
    .cd-tl-img { left: 50% !important; width: 100% !important; height: 34vh !important; }
    .cd-tl-item > *:nth-child(2) {
      grid-column: 1 !important; grid-row: 1 !important; height: auto !important;
    }
    .cd-tl-item > *:nth-child(3) {
      position: absolute !important; left: 50% !important; bottom: -5.5vh !important;
      transform: translateX(-50%) !important; height: auto !important; z-index: 6 !important;
    }
    .cd-tl-item > *:nth-child(3) > div { position: static !important; }
    .cd-tl-item > *:nth-child(4) {
      grid-column: 1 !important; grid-row: 2 !important;
      height: auto !important; margin-top: 10px !important;
    }
    .cd-tl-name { font-size: clamp(22px, 6.4vw, 34px) !important; }
    .cd-tl-body { font-size: clamp(14px, 3.9vw, 17px) !important; }
  `,

  // D — ALTERNATING SIDES: keeps the centred track and the desktop left/right
  // rhythm, but stacks name+body together on ONE side per step (~47%).
  d: `
    .cd-tl-item { grid-template-columns: 47% 6% 47% !important; }
    .cd-tl-item > *:nth-child(2) { grid-column: 1 !important; grid-row: 1 !important; height: auto !important; margin-top: 30vh !important; }
    .cd-tl-item > *:nth-child(4) { grid-column: 1 !important; grid-row: 2 !important; height: auto !important; margin-top: 8px !important; }
    .cd-tl-item > *:nth-child(3) { grid-column: 2 !important; grid-row: 1 / span 2 !important; }
    .cd-tl-item:nth-child(odd) > *:nth-child(2),
    .cd-tl-item:nth-child(odd) > *:nth-child(4) { grid-column: 3 !important; }
    .cd-tl-name { font-size: clamp(19px, 5.6vw, 30px) !important; }
    .cd-tl-body { font-size: clamp(13px, 3.6vw, 16px) !important; }
  `,
};

// A2 — left rail, but name AND body ride in ONE sticky block, so the step still
// PINS at the centre line (the part of the desktop animation worth keeping)
// without splitting the text into two narrow columns. Needs the body moved into
// the name's column, so it is a DOM change, not just CSS.
VARIANTS.a2 = `
  .cd-tl-line { left: 6% !important; }
  .cd-tl-item {
    grid-template-columns: 12% 88% !important;
    padding: 3vh 0 6vh !important;
  }
  .cd-tl-img { left: 56% !important; width: 82vw !important; height: 32vh !important; }
  .cd-tl-item > *:nth-child(2) {
    grid-column: 2 !important; grid-row: 1 !important;
    height: 62vh !important; margin-top: calc(32vh + 2vh) !important;
  }
  .cd-tl-item > *:nth-child(3) {
    grid-column: 1 !important; grid-row: 1 / span 2 !important; height: 100% !important;
  }
  .cd-tl-item > *:nth-child(4) { display: none !important; }
  .cd-tl-name { font-size: clamp(22px, 6.4vw, 34px) !important; }
  .cd-tl-body { font-size: clamp(14px, 3.9vw, 17px) !important; margin-top: 10px !important; }
`;

const css = VARIANTS[variant];
if (css === undefined) {
  console.error(`unknown variant "${variant}" — use one of: ${Object.keys(VARIANTS).join(", ")}`);
  process.exit(1);
}

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
});
const page = await browser.newPage();
await page.setViewport({ width: parseInt(w), height: parseInt(h) });
await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 60000 });
if (variant === "a2") {
  // move each step's body copy inside the name's sticky wrapper, so the two pin
  // together as one block (this is the bit that needs a component change)
  await page.evaluate(() => {
    document.querySelectorAll(".cd-tl-item").forEach((item) => {
      const nameSticky = item.children[1].firstElementChild; // the sticky div holding the name
      const body = item.children[3].firstElementChild; // the sticky div holding the copy
      if (nameSticky && body) nameSticky.appendChild(body);
    });
  });
}
if (css) await page.addStyleTag({ content: css });
await page.evaluate(() => window.dispatchEvent(new Event("resize")));
await new Promise((r) => setTimeout(r, 600));

const geo = await page.evaluate(() => {
  const sec = document.querySelector("#drumul");
  return { top: sec.getBoundingClientRect().top + window.scrollY, height: sec.offsetHeight };
});

// widest line of body copy, as a readability proxy
const read = await page.evaluate(() => {
  const b = document.querySelector(".cd-tl-body");
  const r = b.getBoundingClientRect();
  const words = b.textContent.trim().split(/\s+/).length;
  const lh = parseFloat(getComputedStyle(b).lineHeight);
  const lines = Math.round(r.height / lh);
  return { colW: Math.round(r.width), lines, wordsPerLine: (words / lines).toFixed(1) };
});
console.log(`variant ${variant} @ ${w}x${h}`);
console.log(`  section ${geo.height}px | body column ${read.colW}px | ${read.lines} lines | ~${read.wordsPerLine} words/line`);

for (let i = 0; i < 3; i++) {
  const frac = i / 2;
  await page.evaluate((t, hh, f) => window.scrollTo(0, t + (hh - window.innerHeight) * f), geo.top, geo.height, frac);
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: `shots/var-${variant}-${i}.png` });
}
console.log(`  shots/var-${variant}-0..2.png`);
await browser.close();
