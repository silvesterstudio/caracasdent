import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844 });
await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 60000 });
await new Promise((r) => setTimeout(r, 2000));

const out = await page.evaluate(() => {
  const cs = (sel, p) => {
    const el = document.querySelector(sel);
    return el ? getComputedStyle(el).getPropertyValue(p) : "MISSING EL";
  };
  // does the media query match? does the rule exist in any sheet?
  let ruleFound = false;
  for (const sheet of document.styleSheets) {
    try {
      for (const r of sheet.cssRules) {
        if (r.media && r.cssText.includes("cd-nav-cta")) ruleFound = true;
      }
    } catch (e) {}
  }
  return {
    mqMatches: matchMedia("(max-width: 860px)").matches,
    ruleFound,
    navCtaFont: cs(".cd-nav-cta", "font-size"),
    heroRowDir: cs(".cd-hero-row", "flex-direction"),
    heroSubFont: cs(".cd-hero-sub", "font-size"),
    sheets: document.styleSheets.length,
  };
});
console.log(JSON.stringify(out, null, 2));
await browser.close();
