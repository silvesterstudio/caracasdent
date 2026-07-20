// Measures the Cine panel geometry: chunk box vs the bottom-pinned collage.
import puppeteer from "puppeteer-core";

const [w = "390", h = "844"] = process.argv.slice(2);
const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
});
const page = await browser.newPage();
await page.setViewport({ width: parseInt(w), height: parseInt(h) });
await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 60000 });
await new Promise((r) => setTimeout(r, 2500));

const m = await page.evaluate(() => {
  const ch = document.querySelector(".cd-cine-chunk");
  const co = document.querySelector(".cd-cine-collage");
  const hd = document.querySelector(".cd-cine-heading");
  const H = window.innerHeight;
  const cs = getComputedStyle(ch);
  const chunkTop = ch.offsetTop;
  const headBottom = hd.offsetTop + hd.offsetHeight;
  window.__head = {
    headFont: getComputedStyle(hd).fontSize,
    headBottom,
    headToChunk: chunkTop - headBottom,
    targetGap: +(H * 0.045).toFixed(1),
  };
  const chunkH = ch.scrollHeight;
  const colTop = co.offsetTop;
  return {
    H,
    fontSize: cs.fontSize,
    chunkTop,
    chunkH,
    chunkBottom: chunkTop + chunkH,
    chunkPctOfH: +(((chunkTop + chunkH) / H) * 100).toFixed(1),
    colTop,
    colW: co.offsetWidth,
    colH: co.offsetHeight,
    square: co.offsetWidth === co.offsetHeight ? "1:1" : (co.offsetWidth / co.offsetHeight).toFixed(3),
    gap: colTop - (chunkTop + chunkH),
    ...window.__head,
  };
});
console.log(`${w}x${h}`, JSON.stringify(m, null, 1));
console.log(m.gap >= 0 ? `FITS, gap ${m.gap}px` : `OVERLAPS collage by ${-m.gap}px`);
await browser.close();
