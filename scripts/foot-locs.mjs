// The footer's lower block after going 2-up on mobile: are the schedule's
// nowrap rows ("Luni – Vineri" + "8:00 – 19:00") still fitting their column, or
// are they spilling past it? Reports per-cell overflow at several widths.
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
  [560, 900],
  [1440, 900],
]) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h });
  await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  const r = await page.evaluate(() => {
    const locs = document.querySelector(".cd-foot-locs");
    const cells = [...locs.children];
    const shown = cells.filter((c) => getComputedStyle(c).display !== "none");
    // widest nowrap row inside the schedule cell vs the space it has
    const sched = shown[1];
    let worstRow = 0;
    let schedTrack = 0;
    if (sched) {
      const grid = sched.lastElementChild;
      schedTrack = Math.round(grid.clientWidth);
      const cs = getComputedStyle(grid);
      const gap = parseFloat(cs.columnGap) || 0;
      // measure the TEXT, not the box: the time column is 1fr so its box always
      // stretches to the remaining track and would report a perfect fit forever
      const textW = (el) => {
        const rg = document.createRange();
        rg.selectNodeContents(el);
        return rg.getBoundingClientRect().width;
      };
      const spans = [...grid.querySelectorAll("span")];
      for (let i = 0; i < spans.length; i += 2) {
        const need = textW(spans[i]) + gap + textW(spans[i + 1]);
        worstRow = Math.max(worstRow, Math.ceil(need));
      }
    }
    return {
      cols: getComputedStyle(locs).gridTemplateColumns,
      visible: shown.length,
      total: cells.length,
      cellW: shown.map((c) => Math.round(c.getBoundingClientRect().width)),
      schedTrack,
      worstRow,
      blockH: Math.round(locs.getBoundingClientRect().height),
    };
  });
  const slack = r.schedTrack - r.worstRow;
  console.log(
    `${w}x${h}: ${r.visible}/${r.total} cells [${r.cellW.join(", ")}] | schedule needs ${r.worstRow}px in ${r.schedTrack}px ` +
      `-> ${slack >= 0 ? `${slack}px spare` : `OVERFLOWS by ${-slack}px`} | block ${r.blockH}px`
  );
  await page.close();
}
await browser.close();
