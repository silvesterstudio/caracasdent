// Fetch ALL Google reviews for Caracaș-Dental via the unofficial listugcposts RPC,
// executed inside a real Chrome page context (raw curl gets an in-band 403).
// Usage: node scripts/fetch-reviews.mjs
import puppeteer from "puppeteer-core";
import { mkdirSync, writeFileSync } from "fs";

const FID = "0x40c97e9110f2d09f:0x5d1fbf8a400aed44";
const OUT = "shots";
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--lang=ro"],
});
const page = await browser.newPage();
await page.setUserAgent(
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
);
await page.goto(
  "https://www.google.com/maps/place/Caraca%C8%99-Dental/@46.9977739,28.8180013,17z/data=!3m1!4b1!4m6!3m5!1s0x40c97e9110f2d09f:0x5d1fbf8a400aed44!8m2!3d46.9977703!4d28.8205762!16s%2Fg%2F11gznv0v0?hl=ro",
  { waitUntil: "networkidle2", timeout: 60000 }
);
await new Promise((r) => setTimeout(r, 2500));

// Handle possible consent interstitial
const url = page.url();
if (/consent\.google/.test(url)) {
  console.log("Consent page hit, trying to accept...");
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll("button")];
    const b = btns.find((x) => /accept|agree|acceptă|de acord/i.test(x.textContent));
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 3000));
}

function buildUrl(token, session) {
  const pb =
    `!1m6!1s${encodeURIComponent(FID)}` +
    `!6m4!4m1!1e1!4m1!1e3` +
    `!2m2!1i20!2s${encodeURIComponent(token)}` +
    `!5m2!1s${session}!7e81` +
    `!8m9!2b1!3b1!5b1!7b1!12m4!1b1!2b1!4m1!1e1!11m0!13m1!1e2`; // 1e2 = newest first
  return `https://www.google.com/maps/rpc/listugcposts?authuser=0&hl=ro&gl=md&pb=${pb}`;
}

const session = Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 12);
let token = "";
const pages = [];
for (let i = 0; i < 30; i++) {
  const u = buildUrl(token, session);
  const body = await page.evaluate(async (u) => {
    const r = await fetch(u, { credentials: "include" });
    return { status: r.status, text: await r.text() };
  }, u);
  console.log(`page ${i + 1}: http ${body.status}, ${body.text.length} bytes`);
  if (body.status !== 200) break;
  const json = JSON.parse(body.text.replace(/^\)\]\}'\n?/, ""));
  if (Array.isArray(json) && json[0] && json[0][0] === "er") {
    console.log("in-band error:", JSON.stringify(json).slice(0, 200));
    break;
  }
  writeFileSync(`${OUT}/reviews-raw-p${i + 1}.json`, body.text);
  pages.push(json);
  token = typeof json[1] === "string" ? json[1] : "";
  const n = Array.isArray(json[2]) ? json[2].length : 0;
  console.log(`  reviews on page: ${n}, next token: ${token ? token.slice(0, 20) + "…" : "(none)"}`);
  if (!token || n === 0) break;
  await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
}
console.log(`TOTAL PAGES: ${pages.length}`);
await browser.close();
