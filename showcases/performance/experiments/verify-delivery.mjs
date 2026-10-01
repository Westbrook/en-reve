import { writeExperimentReceipt } from './receipt-output.mjs';
// Correctness/cache diagnostic only; excluded from timing distributions.
import { chromium, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { root, registry, json } from "../src/config.mjs";
import { startServers } from "../src/server.mjs";
import { exclusiveBrowserWork } from "../src/lock.mjs";

await exclusiveBrowserWork(async () => {
  const system = registry.find((s) => s.id === "en-reve");
  const url = `https://127.0.0.1:${system.port}/`;
  const results = [];
  for (const variant of [
    "lazy-commands",
    "intent-commands",
    "content-visibility",
  ]) {
    const stop = await startServers({ systems: [system], variant });
    let browser, failure;
    let failed = false;
    try {
      browser = await chromium.launch({ headless: true });
      const page = await browser.newPage({
        ignoreHTTPSErrors: true,
        viewport: { width: 390, height: 844 },
      });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(url);
      const trigger = page
        .locator("#showcase-actions")
        .getByRole("button", { name: "All commands", exact: true });
      await trigger.focus();
      await page.keyboard.press("Enter");
      const dialog = page.getByRole("dialog", {
        name: "Studio commands",
        exact: true,
      });
      await expect(dialog).toBeVisible();
      await dialog.getByRole("button", { name: "Close", exact: true }).click();
      await expect(dialog).not.toBeVisible();
      const cards = page.locator(".showcase-card");
      for (let i = 0; i < (await cards.count()); i++) {
        await cards.nth(i).scrollIntoViewIfNeeded();
        await expect(cards.nth(i)).toBeVisible();
      }
      expect(errors).toEqual([]);
      results.push({
        variant,
        coldKeyboardCommands: true,
        allCardsReveal: true,
        errors,
      });
    } catch (error) {
      failed = true;
      failure = error;
      throw error;
    } finally {
      const cleanupErrors = [];
      for (const release of [() => browser?.close(), () => stop()]) {
        try { await release(); } catch (error) { cleanupErrors.push(error); }
      }
      if (cleanupErrors.length) throw new AggregateError(failed ? [failure, ...cleanupErrors] : cleanupErrors, "Delivery verification resource cleanup failed");
    }
  }
  let browser, stop, failure;
  let failed = false;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ ignoreHTTPSErrors: true });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Network.enable");
    const responses = [];
    const cachedRequests = new Set();
    cdp.on("Network.requestServedFromCache", ({ requestId }) =>
      cachedRequests.add(requestId),
    );
    cdp.on("Network.responseReceived", ({ response, requestId }) =>
      responses.push({
        requestId,
        url: response.url,
        diskCache: response.fromDiskCache,
        status: response.status,
      }),
    );
    stop = await startServers({ systems: [system], variant: "split-vendor" });
    await page.goto(url);
    await expect(page.locator(".showcase-card")).toHaveCount(16);
    await page.goto(url + "__perf/away");
    await stop();
    stop = undefined;
    stop = await startServers({
      systems: [system],
      variant: "split-vendor-edit",
    });
    responses.length = 0;
    await page.goto(url);
    await expect(page.locator(".showcase-card")).toHaveCount(16);
    const vendor = responses.find((r) => /vendor-.*\.js$/.test(r.url));
    expect(
      Boolean(vendor?.diskCache || cachedRequests.has(vendor?.requestId)),
    ).toBe(true);
    results.push({
      variant: "split-vendor-edit",
      stableVendorRetrievedFromBrowserCache: true,
      memoryOrDiskCacheEvent: cachedRequests.has(vendor.requestId),
      responses,
    });
  } catch (error) {
    failed = true;
    failure = error;
    throw error;
  } finally {
    const cleanupErrors = [];
    for (const release of [() => browser?.close(), () => stop?.()]) {
      try { await release(); } catch (error) { cleanupErrors.push(error); }
    }
    if (cleanupErrors.length) throw new AggregateError(failed ? [failure, ...cleanupErrors] : cleanupErrors, "Delivery cache verification resource cleanup failed");
  }
  await writeExperimentReceipt(
    "reports/delivery-correctness.json",
    json(results),
  );
  console.log(
    "Cold keyboard activation, reveal of all cards, and cross-deployment vendor browser-cache retention passed.",
  );
});
