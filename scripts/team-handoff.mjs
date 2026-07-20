// Doctor-text hand-off: scrolls through the pinned team section while sampling
// every frame, and reports the worst SECOND-HIGHEST wrapper opacity. That is the
// fusion metric — if two doctors' stacks are ever both visible (the old
// scroll-tied crossfade sat both at ~0.5 mid-wipe) it shows up here.
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

const report = await page.evaluate(async () => {
  const sec = document.querySelector("#echipa");
  const top = sec.getBoundingClientRect().top + window.scrollY;
  const span = sec.offsetHeight - window.innerHeight;
  const wraps = [...document.querySelectorAll("#echipa .cd-team-name")].map((n) =>
    n.closest("[style*='opacity']")
  );

  const samples = [];
  const STEPS = 140;
  for (let i = 0; i <= STEPS; i++) {
    window.scrollTo(0, top + (span * i) / STEPS);
    // sample a few frames per step so in-flight CSS transitions are caught
    for (let f = 0; f < 3; f++) {
      await new Promise((r) => requestAnimationFrame(r));
      const os = wraps.map((el) => parseFloat(getComputedStyle(el).opacity));
      const sorted = [...os].sort((a, b) => b - a);
      samples.push({ p: i / STEPS, first: sorted[0], second: sorted[1] });
    }
  }
  const worst = samples.reduce((a, b) => (b.second > a.second ? b : a));
  // how often is BOTH-visible true enough to read as fused text?
  const fused = samples.filter((s) => s.second > 0.15).length;
  const blank = samples.filter((s) => s.first < 0.5).length;
  return {
    n: samples.length,
    worstSecond: +worst.second.toFixed(3),
    worstAtP: +worst.p.toFixed(3),
    fusedSamples: fused,
    blankSamples: blank,
  };
});

console.log(`viewport ${w}x${h}`);
console.log(`samples: ${report.n}`);
console.log(`worst second-highest opacity: ${report.worstSecond} (at p=${report.worstAtP})`);
console.log(`samples with two stacks readable (>0.15): ${report.fusedSamples}`);
console.log(`samples with NO stack at full strength (<0.5): ${report.blankSamples}`);
console.log(report.fusedSamples === 0 ? "PASS — never fused" : "FAIL — text overlaps");
await browser.close();
