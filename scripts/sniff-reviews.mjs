// Open the place page, click the Recenzii tab, and capture the listugcposts
// request URLs + response bodies that Google Maps itself issues.
import puppeteer from "puppeteer-core";
import { mkdirSync, writeFileSync } from "fs";

const OUT = "shots";
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: false,
  args: [
    "--no-sandbox",
    "--disable-gpu",
    "--lang=ro-RO,ro",
    "--disable-blink-features=AutomationControlled",
    "--window-position=20,20",
    "--window-size=1400,950",
  ],
  ignoreDefaultArgs: ["--enable-automation"],
});
const page = await browser.newPage();
await page.evaluateOnNewDocument(() => {
  Object.defineProperty(navigator, "webdriver", { get: () => undefined });
});
await page.setUserAgent(
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
);
await page.setViewport({ width: 1400, height: 900 });

let n = 0;
const captured = [];
page.on("response", async (res) => {
  const u = res.url();
  if (u.includes("listugcposts")) {
    n++;
    let body = "";
    try {
      body = await res.text();
    } catch (e) {
      body = "ERR " + e.message;
    }
    captured.push({ url: u, status: res.status(), len: body.length });
    writeFileSync(`${OUT}/reviews-raw-p${n}.json`, body);
    writeFileSync(`${OUT}/reviews-url-p${n}.txt`, u);
    console.log(`captured #${n} status=${res.status()} len=${body.length}`);
  }
});

await page.goto(
  "https://www.google.com/maps/place/Caraca%C8%99-Dental/@46.9977739,28.8205762,17z/data=!4m6!3m5!1s0x40c97e9110f2d09f:0x5d1fbf8a400aed44!8m2!3d46.9977703!4d28.8205762!16s%2Fg%2F11gznv0v0?hl=ro",
  { waitUntil: "networkidle2", timeout: 60000 }
);
await new Promise((r) => setTimeout(r, 3000));
console.log("landed on:", page.url());

if (/consent\.google/.test(page.url())) {
  await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) =>
      /accept|agree|acceptă|de acord/i.test(x.textContent)
    );
    if (b) b.click();
  });
  await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 3000));
  console.log("after consent:", page.url());
}

// Click the Recenzii / Reviews tab
const clicked = await page.evaluate(() => {
  const tabs = [...document.querySelectorAll('button[role="tab"], button')];
  const t = tabs.find((x) => /recenzii|reviews|отзывы/i.test(x.textContent || "") || /recenzii|reviews/i.test(x.getAttribute("aria-label") || ""));
  if (t) {
    t.click();
    return t.textContent || t.getAttribute("aria-label");
  }
  return null;
});
console.log("clicked tab:", clicked);
await new Promise((r) => setTimeout(r, 4000));

// Scroll the reviews panel to trigger pagination
for (let i = 0; i < 25; i++) {
  await page.evaluate(() => {
    const els = document.querySelectorAll('div[role="main"] div');
    // the scrollable reviews container
    const sc = [...document.querySelectorAll("div")].filter(
      (d) => d.scrollHeight > d.clientHeight + 100 && d.clientHeight > 300
    );
    const target = sc[sc.length - 1];
    if (target) target.scrollBy(0, 3000);
    else window.scrollBy(0, 3000);
  });
  await new Promise((r) => setTimeout(r, 1500));
}
await new Promise((r) => setTimeout(r, 3000));

console.log("captured requests:", JSON.stringify(captured, null, 2).slice(0, 3000));
await page.screenshot({ path: `${OUT}/reviews-sniff.png` });
await browser.close();
console.log("done, total captured:", n);
