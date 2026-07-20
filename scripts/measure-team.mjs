// Team section: are all three doctor names at the same Y, and do all three
// captions wrap to the same number of lines? (All 3 doctors are always in the
// DOM — only opacity differs — so every one can be measured at once.)
import puppeteer from "puppeteer-core";

const [w = "390", h = "844", lang = "ro"] = process.argv.slice(2);
const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
});
const page = await browser.newPage();
await page.setViewport({ width: parseInt(w), height: parseInt(h) });
await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 60000 });
// the RU bios are longer than the RO ones — they are the real wrap test
if (lang.toLowerCase() === "ru") {
  const hit = await page.evaluate(() => {
    const el = [...document.querySelectorAll("button, a, span, div")].find(
      (e) => e.children.length === 0 && e.textContent.trim() === "RU"
    );
    if (!el) return false;
    el.click();
    return true;
  });
  console.log(hit ? "switched to RU" : "RU toggle NOT FOUND");
  await new Promise((r) => setTimeout(r, 1200));
}
// park inside the pinned team section so it is laid out
const y = await page.evaluate(() => {
  const el = document.querySelector("#echipa");
  return el.getBoundingClientRect().top + window.scrollY + window.innerHeight;
});
await page.evaluate((yy) => window.scrollTo(0, yy), y);
await new Promise((r) => setTimeout(r, 2000));

const rows = await page.evaluate(() => {
  const names = [...document.querySelectorAll(".cd-team-name")];
  const caps = [...document.querySelectorAll(".cd-team-caption")];
  return names.map((n, i) => {
    const c = caps[i];
    const lh = c ? parseFloat(getComputedStyle(c).lineHeight) : 0;
    const ch = c ? c.getBoundingClientRect().height : 0;
    return {
      doctor: n.textContent.trim().replace(/\s+/g, " "),
      nameTop: Math.round(n.getBoundingClientRect().top),
      capH: Math.round(ch),
      capLines: lh ? Math.round(ch / lh) : 0,
    };
  });
});
console.table(rows);
const tops = new Set(rows.map((r) => r.nameTop));
const lines = new Set(rows.map((r) => r.capLines));
console.log(tops.size === 1 ? `names ALIGNED at ${[...tops][0]}` : `names MISALIGNED: ${[...tops].join(", ")}`);
console.log(lines.size === 1 ? `captions all ${[...lines][0]} lines` : `captions DIFFER: ${[...lines].join(", ")} lines`);
await browser.close();
