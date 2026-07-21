// /recenzie funnel: drives BOTH branches headlessly.
//   low path  — pick 2★ → the message form must appear → type → Trimite →
//               the "sent" confirmation must appear (and NO network request
//               may have left the page: the send is UI-only by design).
//   high path — fresh load, pick 5★ → the redirect line must appear and the
//               page must attempt navigation to google.com/maps (the attempt
//               is intercepted and aborted so the test stays local).
// usage: node scripts/recenzie-test.mjs [w] [h]
import puppeteer from "puppeteer-core";
import { mkdirSync } from "fs";

const [w = "390", h = "844"] = process.argv.slice(2);
mkdirSync("shots", { recursive: true });
const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
});

// ── low path ──
{
  const page = await browser.newPage();
  await page.setViewport({ width: parseInt(w), height: parseInt(h) });
  await page.goto("http://localhost:3000/recenzie", { waitUntil: "networkidle2", timeout: 60000 });
  const external = [];
  page.on("request", (r) => {
    const u = r.url();
    if (!u.startsWith("http://localhost") && !u.startsWith("data:")) external.push(u);
  });
  await page.evaluate(() => document.querySelectorAll("button[aria-label='2/5']")[0].click());
  await new Promise((r) => setTimeout(r, 400));
  const formShown = await page.evaluate(() => !!document.querySelector("textarea"));
  await page.screenshot({ path: `shots/recenzie-${w}-low-form.png` });
  await page.type("textarea", "Timpul de așteptare a fost cam lung la ultima vizită.");
  await page.evaluate(() => {
    [...document.querySelectorAll("button")].find((b) => /Trimite|Отправить/.test(b.textContent)).click();
  });
  await new Promise((r) => setTimeout(r, 1600));
  const sent = await page.evaluate(() => /Mulțumim!|Спасибо!/.test(document.body.textContent));
  await page.screenshot({ path: `shots/recenzie-${w}-low-sent.png` });
  console.log(`${w}x${h} LOW  (2★): form ${formShown ? "shown" : "MISSING"} | sent-state ${sent ? "shown" : "MISSING"} | network calls out: ${external.length === 0 ? "none (correct)" : external.join(", ")}`);
  await page.close();
}

// ── high path ──
{
  const page = await browser.newPage();
  await page.setViewport({ width: parseInt(w), height: parseInt(h) });
  await page.goto("http://localhost:3000/recenzie", { waitUntil: "networkidle2", timeout: 60000 });
  await page.setRequestInterception(true);
  let googleNav = null;
  page.on("request", (r) => {
    if (r.url().includes("google.com/maps")) {
      googleNav = r.url();
      r.abort();
    } else r.continue();
  });
  await page.evaluate(() => document.querySelectorAll("button[aria-label='5/5']")[0].click());
  await new Promise((r) => setTimeout(r, 300));
  const line = await page.evaluate(() => /Google/.test(document.body.textContent));
  await page.screenshot({ path: `shots/recenzie-${w}-high.png` });
  await new Promise((r) => setTimeout(r, 1600));
  console.log(`${w}x${h} HIGH (5★): redirect line ${line ? "shown" : "MISSING"} | google nav ${googleNav ? "ATTEMPTED → " + googleNav.slice(0, 60) + "…" : "NOT ATTEMPTED"}`);
  await page.close();
}

await browser.close();
