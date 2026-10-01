import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const artifacts = new URL(process.env.SHOWCASE_ARTIFACTS || "../artifacts/", import.meta.url);
const names = [
  "radix-react",
  "fluent-react",
  "spectrum-react",
  "astryx-react",
  "shadcn-react",
  "fluent-web-components",
  "spectrum-web-components",
  "en-reve",
  "web-awesome",
];
await mkdir(artifacts, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
for (let i = 0; i < names.length; i++) {
  if (process.env.SHOWCASE_FILTER && !process.env.SHOWCASE_FILTER.split(",").includes(names[i])) continue;
  const page = await browser.newPage({
    viewport: { width: 1500, height: 1100 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (e) => {
    if (e.type() === "error") errors.push(e.text());
  });
  await page.goto("http://127.0.0.1:" + (4510 + i));
  await page.waitForTimeout(1200);
  if (names[i] === "web-awesome") {
    // Stock CSR tab activation is deferred until viewport exposure. Capture a
    // usable full-page review without changing the performance fixture's policy.
    await page.locator("#showcase-brief").scrollIntoViewIfNeeded();
    await expect(page.getByRole("checkbox", { name: "Keep the headline editable", exact: true })).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  const r = {
    name: names[i],
    cards: await page.locator(".showcase-card").count(),
    errors,
    body: (await page.locator("body").innerText()).slice(0, 500),
    overflow: await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    visualState: names[i] === "web-awesome" ? "First brief tab activated by viewport exposure, then returned to page top for full-page review; timing samples remain untouched" : "Initial page",
  };
  results.push(r);
  await page.screenshot({
    path: new URL(names[i] + ".png", artifacts)
      .pathname,
    fullPage: true,
  });
  console.log(JSON.stringify(r));
  await page.close();
}
await writeFile(
  new URL("inspection.json", artifacts),
  JSON.stringify(results, null, 2),
);
await browser.close();
