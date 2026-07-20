// Services seam: where the card grid's bottom sits inside the coral block's top padding.
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
  const grid = document.querySelector(".cd-svc-grid");
  const coral = document.querySelector(".cd-svc-row")?.parentElement;
  const firstRow = document.querySelector(".cd-svc-row");
  const card = grid?.firstElementChild;
  const sy = window.scrollY;
  const gb = grid.getBoundingClientRect().bottom + sy;   // cards' bottom edge
  const ct = coral.getBoundingClientRect().top + sy;      // coral block top edge
  const rt = firstRow.getBoundingClientRect().top + sy;   // first hairline row
  const pad = rt - ct;                                    // coral top padding region
  const overlap = gb - ct;                                // how deep cards hang in
  return {
    cardH: Math.round(card.getBoundingClientRect().height),
    coralTop: Math.round(ct),
    cardsBottom: Math.round(gb),
    firstRowTop: Math.round(rt),
    topPadding: Math.round(pad),
    overlap: Math.round(overlap),
    halfPadding: Math.round(pad / 2),
    offBy: Math.round(overlap - pad / 2),
  };
});
console.log(`${w}x${h}`, JSON.stringify(m, null, 1));
console.log(Math.abs(m.offBy) <= 2 ? "CENTRED in top padding OK" : `off by ${m.offBy}px (negative = cards too shallow)`);
await browser.close();
