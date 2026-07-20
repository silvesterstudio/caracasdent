// Where does the timeline's last pinned block end, and where does the coral
// footer start climbing over it? Reports the overlap at the scroll position
// where the last step is pinned.
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

const geo = await page.evaluate(() => {
  const s = document.querySelector("#drumul");
  return { top: s.getBoundingClientRect().top + window.scrollY, h: s.offsetHeight };
});

// Walk the tail AND keep going past the section end into the footer: the text
// stays stuck at the pin line until its column runs out, so the collision
// happens after the section's own scroll range is spent.
let worst = null;
for (let i = 0; i <= 30; i++) {
  const f = 0.55 + (0.95 * i) / 30; // deliberately overruns p=1
  await page.evaluate((t, hh, ff) => window.scrollTo(0, t + (hh - window.innerHeight) * ff), geo.top, geo.h, f);
  await new Promise((r) => setTimeout(r, 200));
  const m = await page.evaluate(() => {
    const items = [...document.querySelectorAll(".cd-tl-item")];
    const last = items[items.length - 1];
    const txt = last.querySelector(".cd-tl-name");
    const t = txt.getBoundingClientRect();
    // the coral footer is the first element after the section with a coral bg
    // the footer is the coral-domed div right after the section (pulled up by
    // a negative margin so it overlaps the timeline's dark tail)
    const foot = document.querySelector("#drumul").nextElementSibling;
    const fr = foot ? foot.getBoundingClientRect() : null;
    return {
      textTop: Math.round(t.top),
      textBottom: Math.round(t.bottom),
      footTop: fr ? Math.round(fr.top) : null,
      overlap: fr ? Math.round(t.bottom - fr.top) : null,
    };
  });
  if (!worst || (m.overlap ?? -1e9) > worst.overlap) worst = { f: +f.toFixed(2), ...m };
}
console.log(`${w}x${h}`);
console.log(`  worst at p=${worst.f}: pinned text ${worst.textTop}..${worst.textBottom}, footer top ${worst.footTop}`);
console.log(
  worst.overlap > 0
    ? `  TEXT RUNS ${worst.overlap}px UNDER THE FOOTER`
    : `  clear of the footer by ${-worst.overlap}px`
);
await browser.close();
