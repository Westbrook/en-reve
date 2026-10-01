// Diagnostic-only event tracing. Never used for headline timing measurements.
import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { root, registry, profiles, json } from "../src/config.mjs";
import { startServers } from "../src/server.mjs";
import { exclusiveBrowserWork } from "../src/lock.mjs";
import { journey } from "../scenarios/journey.mjs";
const instrumented = process.argv.includes("--instrumented");
await exclusiveBrowserWork(async () => {
  const system = registry.find((s) => s.id === "spectrum-web-components"),
    stop = await startServers({ systems: [system] });
  let browser;
  try {
    browser = await chromium.launch({ args: ["--ignore-certificate-errors"] });
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: profiles.mobile.viewport,
    });
    if (instrumented)
      await context.addInitScript({
        path: resolve(root, "runs/spectrum-gen2-interactions-v1/collector.js"),
      });
    await context.addInitScript(() => {
      window.clickDiagnostics = [];
      for (const method of [
        "stopImmediatePropagation",
        "stopPropagation",
        "preventDefault",
      ]) {
        const original = Event.prototype[method];
        Event.prototype[method] = function (...args) {
          if (this.type === "click")
            window.clickDiagnostics.push({
              kind: method,
              at: performance.now(),
              stack: new Error().stack,
            });
          return original.apply(this, args);
        };
      }
      for (const capture of [true, false])
        document.addEventListener(
          "click",
          (event) => {
            const target = event
              .composedPath()
              .find(
                (node) => node instanceof HTMLElement && node.dataset.action,
              );
            const entry = {
              kind: capture ? "capture" : "bubble",
              at: performance.now(),
              action: target?.dataset.action,
              label: target?.textContent,
              disabled: target?.disabled,
              trusted: event.isTrusted,
            };
            window.clickDiagnostics.push(entry);
            queueMicrotask(() => {
              entry.prevented = event.defaultPrevented;
              entry.layoutAfter = document
                .querySelector("#showcase-asset [data-layout]")
                ?.getAttribute("data-layout");
            });
          },
          capture,
        );
    });
    const page = await context.newPage(),
      cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: profiles.mobile.latency,
      downloadThroughput: profiles.mobile.download,
      uploadThroughput: profiles.mobile.upload,
    });
    await page.goto(`https://127.0.0.1:${system.port}/`);
    await page.waitForTimeout(1500);
    let error = null;
    try {
      await journey(page, system.id, { measure: instrumented });
    } catch (e) {
      error = e.message;
    }
    const evidence = await page.evaluate(() => ({
      events: window.clickDiagnostics,
      focusTrapResources: performance.getEntriesByType('resource').filter(e => e.name.includes('focus-trap')).map(e => e.toJSON()),
      overlays: [...document.querySelectorAll("sp-overlay")].map((e) => ({
        id: e.id,
        open: e.open,
        state: e.state,
        focusTrapActive: e._focusTrap?.active ?? null,
      })),
    }));
    await writeFile(
      resolve(
        root,
        "reports/spectrum-gen2/lifecycle-diagnostic" +
          (instrumented ? "-instrumented" : "") +
          ".json",
      ),
      json({
        diagnosticOnly: true,
        instrumented,
        at: new Date().toISOString(),
        error,
        ...evidence,
      }),
    );
    console.log(
      error
        ? "Reproduced Spectrum mobile lifecycle failure; event evidence retained."
        : "Spectrum lifecycle passed in this isolated diagnostic; retain prior failures.",
    );
  } finally {
    await browser?.close();
    await stop();
  }
});
