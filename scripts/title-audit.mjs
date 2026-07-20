// Audits every section title on mobile: font-size, gap below, and scroll offset.
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

const rows = await page.evaluate(() => {
  const sel = [
    [".cd-cine-heading", "Cine suntem?"],
    ["#servicii h2", "Ce oferim?"],
    [".cd-showcase-title", "Rezultate"],
    ["#drumul h2", "Drumul tau"],
  ];
  return sel.map(([s, label]) => {
    const el = document.querySelector(s);
    if (!el) return { label, sel, missing: true };
    const cs = getComputedStyle(el);
    return {
      label,
      sel,
      fontSize: cs.fontSize,
      marginBottom: cs.marginBottom,
      lineHeight: cs.lineHeight,
      textTransform: cs.textTransform,
      pageY: Math.round(el.getBoundingClientRect().top + window.scrollY),
    };
  });
});
console.table(rows);
await browser.close();
