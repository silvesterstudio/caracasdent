// Does each square node sit dead on the track? The square is auto-margined
// inside the rail column while the track is positioned by percentage, so the
// two are computed independently and can drift apart.
import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
});
for (const [w, h] of [
  [360, 800],
  [390, 844],
  [430, 932],
  [1440, 900],
]) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h });
  await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 60000 });
  await page.evaluate(() => {
    const s = document.querySelector("#drumul");
    window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY + 400);
  });
  await new Promise((r) => setTimeout(r, 800));
  const r = await page.evaluate(() => {
    const line = document.querySelector(".cd-tl-line").getBoundingClientRect();
    const lineMid = line.x + line.width / 2;
    const sq = [...document.querySelectorAll(".cd-tl-rail > div")].map((e) => {
      const b = e.getBoundingClientRect();
      return +(b.x + b.width / 2 - lineMid).toFixed(1);
    });
    return { lineMid: Math.round(lineMid), offsets: sq };
  });
  const worst = Math.max(...r.offsets.map(Math.abs));
  console.log(
    `${w}x${h}: track at x=${r.lineMid} | square offsets ${r.offsets.join(", ")} | worst ${worst}px ${worst <= 1 ? "OK" : "DRIFT"}`
  );
  await page.close();
}
await browser.close();
