// Does the footer's bottom bar actually hold ONE row, or is its text spilling /
// wrapping? Measures each block's intrinsic text width against the row.
import puppeteer from "puppeteer-core";

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
  [860, 900],
  [1440, 900],
]) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h });
  await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  const r = await page.evaluate(() => {
    const bar = document.querySelector(".cd-foot-bar");
    const copy = bar.querySelector(".cd-foot-copy") || bar.children[0];
    const dev = bar.querySelector(".cd-foot-dev") || bar.children[1];
    const gap = parseFloat(getComputedStyle(bar).columnGap) || 0;
    const lineH = (el) => parseFloat(getComputedStyle(el).lineHeight);
    return {
      barW: Math.round(bar.clientWidth),
      barH: Math.round(bar.getBoundingClientRect().height),
      // how many text lines each block occupies (2 = it wrapped)
      copyLines: Math.round(copy.getBoundingClientRect().height / lineH(copy)),
      devLines: Math.round(dev.getBoundingClientRect().height / lineH(dev)),
      copyW: Math.round(copy.getBoundingClientRect().width),
      devW: Math.round(dev.getBoundingClientRect().width),
      gap: Math.round(gap),
      sameRow:
        Math.abs(copy.getBoundingClientRect().top - dev.getBoundingClientRect().top) < 6,
    };
  });
  console.log(
    `${w}x${h}: bar ${r.barW}px h=${r.barH}px | copy ${r.copyW}px/${r.copyLines}ln + dev ${r.devW}px/${r.devLines}ln ` +
      `| ${r.sameRow ? "ONE ROW" : "stacked"}${r.copyLines > 1 || r.devLines > 1 ? " (text wrapped)" : ""}`
  );
  await page.close();
}
await browser.close();
