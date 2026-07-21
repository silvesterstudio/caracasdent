// Recenzii marquee (#recenzii): verifies the two rows actually animate in
// OPPOSITE directions (samples transforms twice and compares), that the -50%
// loop math is seamless (track = exactly 2 × group), that the page gained no
// horizontal scroll, and screenshots the section.
// usage: node scripts/reviews-shot.mjs [w] [h]
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
await page.evaluate(async () => {
  const sec = document.querySelector("#recenzii");
  window.scrollTo(0, sec.getBoundingClientRect().top + window.scrollY - 20);
  // lazy avatars outside the viewport never fire load — cap the wait
  await Promise.race([
    Promise.all(
      [...sec.querySelectorAll("img")].map((im) =>
        im.complete ? null : new Promise((r) => { im.addEventListener("load", r, { once: true }); im.addEventListener("error", r, { once: true }); })
      )
    ),
    new Promise((r) => setTimeout(r, 4000)),
  ]);
});
await new Promise((r) => setTimeout(r, 1000));

const sample = () =>
  page.evaluate(() =>
    [...document.querySelectorAll(".cd-rev-track")].map((t) => {
      const m = new DOMMatrixReadOnly(getComputedStyle(t).transform);
      return m.m41; // current translateX
    })
  );

const s1 = await sample();
await new Promise((r) => setTimeout(r, 1500));
const s2 = await sample();

const info = await page.evaluate(() => {
  const tracks = [...document.querySelectorAll(".cd-rev-track")];
  return tracks.map((t) => {
    const cs = getComputedStyle(t);
    const groups = [...t.children];
    const gw = groups[0].getBoundingClientRect().width;
    return {
      anim: cs.animationName,
      dur: cs.animationDuration,
      dir: cs.animationDirection,
      state: cs.animationPlayState,
      cards: groups[0].children.length,
      groupW: Math.round(gw),
      trackW: Math.round(t.getBoundingClientRect().width),
      seamErr: Math.abs(t.getBoundingClientRect().width - 2 * gw).toFixed(1),
    };
  });
});
const hOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

console.log(`${w}x${h}`);
info.forEach((t, i) => {
  const v = (s2[i] - s1[i]) / 1.5;
  console.log(
    `  row${i}: ${t.anim} ${t.dur} ${t.dir} [${t.state}] | ${t.cards} cards | group ${t.groupW}px, track ${t.trackW}px (seam err ${t.seamErr}px) | velocity ${v.toFixed(1)}px/s`
  );
});
const [v0, v1] = [(s2[0] - s1[0]) / 1.5, (s2[1] - s1[1]) / 1.5];
console.log(
  `  directions: ${v0 < -1 && v1 > 1 ? "OPPOSITE (top ←, bottom →) OK" : "WRONG (v0=" + v0.toFixed(1) + ", v1=" + v1.toFixed(1) + ")"}`
);
console.log(`  ${hOverflow > 0 ? `H-OVERFLOW ${hOverflow}px` : "no horizontal overflow"}`);

await page.screenshot({ path: `shots/rev-${w}-a.png` });
await page.evaluate(() => {
  const btn = document.querySelector("#recenzii a[href='/recenzie']");
  window.scrollTo(0, btn.getBoundingClientRect().bottom + window.scrollY - window.innerHeight + 40);
});
await new Promise((r) => setTimeout(r, 500));
await page.screenshot({ path: `shots/rev-${w}-b.png` });
console.log(`  shots/rev-${w}-a.png + rev-${w}-b.png`);
await browser.close();
