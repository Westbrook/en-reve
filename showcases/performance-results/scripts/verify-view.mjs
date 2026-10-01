import { validateAcquisitionTable } from './acquisition-tables.mjs';
import { verificationOutput, readerURL } from './verification-output.mjs';
import { chromium, firefox, webkit } from "@playwright/test";
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { validateReaderTestReceipts } from "./reader-test-receipts.mjs";
const root = resolve(import.meta.dirname, "..");
const output = await verificationOutput(import.meta.url, root);
const source = JSON.parse(await readFile(resolve(root, "public/source.json")));
const tables = JSON.parse(await readFile(resolve(root, "src/tables.json")));
const webAwesomeTables = tables.filter((table) =>
  table.title.startsWith("Web Awesome "),
);
const nineSystemTables = tables.filter((table) =>
  table.title.startsWith("Nine-system "),
);
if (!webAwesomeTables.length || !nineSystemTables.length)
  throw new Error("Integrate the completed Web Awesome report before verifying its reader");
for (const table of nineSystemTables) validateAcquisitionTable(table);
const receiptPaths = [process.env.EN_READER_TEST_RECEIPT ?? "artifacts/browser-tests.json"];
const initialBytes = await readFile(resolve(root, receiptPaths[0]));
const tests = JSON.parse(initialBytes);
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const receiptHashes = { [receiptPaths[0]]: digest(initialBytes) };
let focused;
if (tests.stats.unexpected) throw new Error('Retain failed receipts and run the complete partitioned reader suite again.');

const browserVerification = validateReaderTestReceipts(
  tests,
  focused,
  (await stat(resolve(root, "dist/index.html"))).mtimeMs,
);
const browsers = {};
for (const [name, type] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await type.launch();
  browsers[name] = browser.version();
  if (name === "chromium") {
    const page = await browser.newPage({
      viewport: { width: 1500, height: 1100 },
    });
    await mkdir(resolve(output, "artifacts"), { recursive: true });
    await page.goto(
      readerURL('/?progress-report#second-pass-measurements'),
    );
    await page.locator("en-data-table").last().waitFor();
    await page.waitForFunction(() =>
      [...document.querySelectorAll(".table-fallback")].every(
        (el) => el.hidden,
      ),
    );
    await page.locator("#second-pass-measurements").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: resolve(output, "artifacts/second-pass-overview.png"),
    });
    await page.goto(
      readerURL('/?progress-report#loading-and-visual-stability'),
    );
    await page.waitForFunction(() =>
      [...document.querySelectorAll(".table-fallback")].every(
        (el) => el.hidden,
      ),
    );
    await page
      .locator("#loading-and-visual-stability")
      .scrollIntoViewIfNeeded();
    await page.screenshot({
      path: resolve(output, "artifacts/second-pass-loading.png"),
    });
    await page.goto(
      readerURL('/?progress-report#comparing-gaps-and-choosing-remediation'),
    );
    await page.waitForFunction(() =>
      [...document.querySelectorAll(".table-fallback")].every(
        (el) => el.hidden,
      ),
    );
    await page
      .locator("#comparing-gaps-and-choosing-remediation")
      .scrollIntoViewIfNeeded();
    await page.screenshot({
      path: resolve(output, "artifacts/second-pass-gaps.png"),
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(
      readerURL('/?progress-report#mobile-cold-loading'),
    );
    await page.waitForFunction(() =>
      [...document.querySelectorAll(".table-fallback")].every(
        (el) => el.hidden,
      ),
    );
    await page.locator("#mobile-cold-loading").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: resolve(output, "artifacts/second-pass-mobile.png"),
    });
    await page.setViewportSize({ width: 1500, height: 1100 });
    await page.locator("#initial-connected-dom-with-and-without-dates").scrollIntoViewIfNeeded();
    await page.screenshot({ path: resolve(output, "artifacts/dom-review-counts.png") });
    await page.locator("#en-reve-mounted-base-responsibilities").scrollIntoViewIfNeeded();
    await page.screenshot({ path: resolve(output, "artifacts/dom-review-base.png") });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("#initial-connected-dom-with-and-without-dates").scrollIntoViewIfNeeded();
    await page.screenshot({ path: resolve(output, "artifacts/dom-review-mobile.png") });
    await page.setViewportSize({ width: 1500, height: 1100 });
    for (const [anchor, file] of [
      ["web-awesome-comparison", "web-awesome-overview.png"],
      ["web-awesome-mobile-cold-loading", "web-awesome-loading.png"],
      ["nine-system-production-payload-comparison", "web-awesome-nine-system-payload.png"],
      ["web-awesome-connected-totals-with-and-without-dates", "web-awesome-dom.png"],
    ]) {
      await page.locator(`#${anchor}`).scrollIntoViewIfNeeded();
      if (anchor !== "web-awesome-comparison") {
        const title = await page.locator(`#${anchor}`).textContent();
        const definition = tables.find((table) => table.title === title.trim());
        if (!definition) throw new Error(`Missing screenshot table: ${title}`);
        await page.locator(`[data-table-id="${definition.id}"]`).scrollIntoViewIfNeeded();
      }
      await page.screenshot({ path: resolve(output, "artifacts", file) });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    const mobileComparison = tables.find((table) => table.title === "Nine-system mobile cold loading comparison");
    await page.locator(`[data-table-id="${mobileComparison.id}"]`).scrollIntoViewIfNeeded();
    await page.screenshot({ path: resolve(output, "artifacts/web-awesome-mobile.png") });
  }
  await browser.close();
}
// Invoke after the complete reader receipt passes; historical timeout repairs remain separate.
await writeFile(
  resolve(output, "verification.json"),
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      ...source,
      browsers,
      tableCount: tables.length,
      webAwesomeTableCount: webAwesomeTables.length,
      nineSystemComparisonTableCount: nineSystemTables.length,
      numericColumns: tables.reduce(
        (n, t) => n + t.numeric.filter(Boolean).length,
        0,
      ),
      result: browserVerification.result,
      browserTestReceipt: receiptPaths[0],
      browserTestReceipts: receiptPaths,
      browserTestReceiptSha256: receiptHashes,
      browserVerification,
      checks: [
        "Every numeric column in every table sorts ascending and descending; missing values stay last",
        "Original reference columns and keyboard sorting, reset, focus and aria-sort",
        "CSV preserves current order, numeric separators and formula protection",
        "All source sections, explicit local evidence links and exact downloadable Markdown",
        "390px viewport without document overflow; independently scrolling tables",
        "Progress return shown only with the explicit flag",
        "Print and JavaScript-disabled fallbacks for grouped tables",
        "All Implementation columns remain pinned in narrow interactive and static tables",
        "Every nine-system comparison has nine implementations and an explicit acquisition column",
        "Web Awesome acquisition, grouped historical comparisons, payload, connected DOM and mobile screenshots",
      ],
      command: focused
        ? `npm run build && npm test; focused Firefox numeric-sort recheck (${browserVerification.correction.scope})`
        : "npm run build && npm test",
      preview:
        readerURL('/?progress-report#web-awesome-comparison'),
      screenshots: [
        "artifacts/second-pass-overview.png",
        "artifacts/second-pass-loading.png",
        "artifacts/second-pass-gaps.png",
        "artifacts/second-pass-mobile.png",
        "artifacts/dom-review-counts.png",
        "artifacts/dom-review-base.png",
        "artifacts/dom-review-mobile.png",
        "artifacts/web-awesome-overview.png",
        "artifacts/web-awesome-loading.png",
        "artifacts/web-awesome-nine-system-payload.png",
        "artifacts/web-awesome-dom.png",
        "artifacts/web-awesome-mobile.png",
      ],
    },
    null,
    2,
  ) + "\n",
);
