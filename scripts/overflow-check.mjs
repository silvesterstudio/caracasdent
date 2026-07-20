import puppeteer from "puppeteer-core";
const [w = "390", h = "844"] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: "new", args: ["--no-sandbox","--disable-gpu","--hide-scrollbars"] });
const p = await b.newPage();
await p.setViewport({ width: +w, height: +h });
await p.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 60000 });
await new Promise(r => setTimeout(r, 2500));
const r = await p.evaluate(() => {
  const de = document.documentElement;
  const wide = [...document.querySelectorAll("*")]
    .filter(e => e.getBoundingClientRect().right > de.clientWidth + 1)
    .slice(0, 6)
    .map(e => `${e.tagName}.${e.className?.toString?.().slice(0,40)} right=${Math.round(e.getBoundingClientRect().right)}`);
  return { scrollW: de.scrollWidth, clientW: de.clientWidth, wide };
});
console.log(`${w}x${h}`, JSON.stringify(r, null, 1), r.scrollW <= r.clientW ? "NO H-OVERFLOW ✓" : "H-OVERFLOW ✗");
await b.close();
