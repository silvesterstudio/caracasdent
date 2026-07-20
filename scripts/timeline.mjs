// "Drumul tău" (#drumul): walks the section and shoots it at N scroll positions,
// reporting the scroll-driven state at each — red bar fill, which step names have
// latched to coral, and whether the name/body are actually pinned (sticky).
// usage: node scripts/timeline.mjs [w] [h] [shots]
import puppeteer from "puppeteer-core";
import { mkdirSync } from "fs";

const [w = "390", h = "844", n = "4"] = process.argv.slice(2);
mkdirSync("shots", { recursive: true });
const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
});
const page = await browser.newPage();
await page.setViewport({ width: parseInt(w), height: parseInt(h) });
await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 60000 });

const geo = await page.evaluate(() => {
  const sec = document.querySelector("#drumul");
  const r = sec.getBoundingClientRect();
  const line = document.querySelector(".cd-tl-line");
  return {
    top: r.top + window.scrollY,
    height: sec.offsetHeight,
    lineShown: line ? getComputedStyle(line).display !== "none" : false,
  };
});
console.log(`viewport ${w}x${h} — section height ${geo.height}px, centre line ${geo.lineShown ? "SHOWN" : "hidden"}`);

const steps = parseInt(n);
for (let i = 0; i < steps; i++) {
  const frac = i / (steps - 1 || 1);
  await page.evaluate(
    (t, hh, f) => window.scrollTo(0, t + (hh - window.innerHeight) * f),
    geo.top,
    geo.height,
    frac
  );
  await new Promise((r) => setTimeout(r, 900));
  const state = await page.evaluate(() => {
    const bar = document.querySelector(".cd-tl-line > div");
    const names = [...document.querySelectorAll("#drumul [style*='sticky'], #drumul [style*='static']")];
    // a name has latched when its colour is the coral accent
    const coral = [...document.querySelectorAll("#drumul *")].filter((e) => {
      const c = getComputedStyle(e).color;
      return c === "rgb(248, 65, 49)";
    }).length;
    const pinned = names.filter((e) => getComputedStyle(e).position === "sticky").length;
    // is any image parallaxed (a non-identity transform)?
    const moved = [...document.querySelectorAll("#drumul [style*='translate']")].filter((e) => {
      const t = getComputedStyle(e).transform;
      return t && t !== "none" && !t.endsWith(", 0, 0)");
    }).length;
    return { bar: bar ? Math.round(bar.getBoundingClientRect().height) : -1, coral, pinned, moved };
  });
  console.log(
    `  p=${frac.toFixed(2)}  redBar=${state.bar}px  coralNames=${state.coral}  stickyEls=${state.pinned}  parallaxed=${state.moved}`
  );
  await page.screenshot({ path: `shots/tl-${w}-${i}.png` });
}
console.log(`shots: shots/tl-${w}-0..${steps - 1}.png`);
await browser.close();
