// Solves for the font-size that makes a one-line title exactly fill its
// container, at several phone widths. Text width scales linearly with
// font-size, so one measurement per width gives the answer directly.
// usage: node scripts/title-fit.mjs [selector]
import puppeteer from "puppeteer-core";

const sel = process.argv[2] || ".cd-tl-title";
const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
});
for (const [w, h] of [
  [320, 700],
  [360, 800],
  [390, 844],
  [430, 932],
  [600, 900],
  [860, 900],
]) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h });
  await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  const r = await page.evaluate((s) => {
    const t = document.querySelector(s);
    const head = t.parentElement;
    const cs = getComputedStyle(head);
    const avail = head.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    return { textW: t.scrollWidth, fs: parseFloat(getComputedStyle(t).fontSize), avail };
  }, sel);
  const fit = (r.avail / (r.textW / r.fs)) * 0.995; // 0.5% safety for rounding
  console.log(
    `${w}x${h}: text ${Math.round(r.textW)}px @ ${r.fs.toFixed(1)}px | avail ${Math.round(r.avail)}px | ` +
      `overflow ${Math.round(r.textW - r.avail)}px -> fits at ${fit.toFixed(1)}px = ${((fit / w) * 100).toFixed(2)}vw`
  );
  await page.close();
}
await browser.close();
