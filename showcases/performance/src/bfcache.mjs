// BFCache deliberately bypasses Playwright's Page lifecycle after launch.
// https://playwright.dev/docs/navigations#backforward-cache
import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { registry, profiles } from "./config.mjs";
import { lifecycleSnapshots } from "./server.mjs";
import { metrics } from "./analysis.mjs";
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export async function sampleBFCache(job, options, directory) {
  const result = {
    ...job,
    suite: "bfcache",
    variant: options.variant || "native",
    startedAt: new Date().toISOString(),
    status: "running",
    errors: [],
  };
  let browser;
  try {
    browser = await chromium.launch({
      channel: "chromium",
      headless: true,
      ignoreDefaultArgs: ["--disable-back-forward-cache"],
      args: ["--ignore-certificate-errors"],
    });
    const profile = profiles[job.profile];
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: profile.viewport,
      deviceScaleFactor: profile.deviceScaleFactor,
    });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    result.browser = browser.version();
    result.browserMode = "bundled-full-chromium-new-headless-direct-cdp";
    for (const domain of ["Page", "Runtime", "Network", "Performance"])
      await cdp.send(domain + ".enable");
    cdp.on("Runtime.exceptionThrown", (e) =>
      result.errors.push({
        type: "pageerror",
        message:
          e.exceptionDetails.exception?.description || e.exceptionDetails.text,
      }),
    );
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: profile.cpuRate });
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: profile.latency,
      downloadThroughput: profile.download,
      uploadThroughput: profile.upload,
    });
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
      source: await readFile(resolve(directory, "collector.js"), "utf8"),
    });
    const evaluate = async (expression) => {
      const value = await cdp.send("Runtime.evaluate", {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (value.exceptionDetails) throw new Error(value.exceptionDetails.text);
      return value.result.value;
    };
    const until = async (expression) => {
      const deadline = Date.now() + 15000;
      while (Date.now() < deadline) {
        try {
          if (await evaluate(expression)) return;
        } catch {}
        await delay(50);
      }
      throw new Error("Direct CDP readiness timeout: " + expression);
    };
    const system = registry.find((s) => s.id === job.system);
    const url = `https://127.0.0.1:${system.port}/`;
    const ready = `location.href === ${JSON.stringify(url)} && document.readyState === 'complete' && document.querySelectorAll('.showcase-card').length === 16 && window.__perf?.state.milestones.cardsFrameOpportunity`;
    await cdp.send("Page.navigate", { url });
    await until(ready);
    await delay(1500);
    const initial = await evaluate("window.__perf.state.documentId");
    await cdp.send("Page.navigate", { url: url + "__perf/away" });
    await until(
      `location.pathname === '/__perf/away' && document.readyState === 'complete'`,
    );
    const history = await cdp.send("Page.getNavigationHistory");
    const previous = history.entries[history.currentIndex - 1];
    if (!previous || previous.url !== url)
      throw new Error("Unexpected back-navigation target");
    await cdp.send("Page.navigateToHistoryEntry", { entryId: previous.id });
    await until(ready);
    await delay(500);
    result.bfcache = await evaluate(
      `({sameDocument: window.__perf.state.documentId === ${JSON.stringify(initial)}, pageshow: window.__perf.state.milestones.pageshow, notRestoredReasons: performance.getEntriesByType('navigation')[0]?.notRestoredReasons?.toJSON?.() ?? null, note: 'Direct CDP diagnostic; no Playwright lifecycle waits after restore; not a field hit rate'})`,
    );
    for (const [label, value] of [
      ["Landscape", "landscape"],
      ["Portrait", "portrait"],
    ]) {
      const position = await evaluate(`(() => {
        const candidate = [...document.querySelector('#showcase-actions').querySelectorAll('button,en-button,sp-button,swc-button,swc-action-button,fluent-button,wa-button')].find(e => e.textContent.trim() === ${JSON.stringify(label)} && e.getBoundingClientRect().width > 0);
        if (!candidate) return null;
        candidate.scrollIntoView({block:'center'});
        const rect = candidate.getBoundingClientRect(); return {x: rect.x + rect.width / 2, y: rect.y + rect.height / 2};
      })()`);
      if (!position)
        throw new Error("Missing restored canvas control: " + label);
      await cdp.send("Input.dispatchMouseEvent", {
        type: "mouseMoved",
        ...position,
      });
      await cdp.send("Input.dispatchMouseEvent", {
        type: "mousePressed",
        button: "left",
        clickCount: 1,
        ...position,
      });
      await cdp.send("Input.dispatchMouseEvent", {
        type: "mouseReleased",
        button: "left",
        clickCount: 1,
        ...position,
      });
      await until(
        `document.querySelector('#showcase-asset [data-layout]')?.getAttribute('data-layout') === ${JSON.stringify(value)}`,
      );
    }
    result.bfcache.interactiveAfterReturn = true;
    result.collector = await evaluate("window.__perf.snapshot()");
    result.browserMetrics = Object.fromEntries(
      (await cdp.send("Performance.getMetrics")).metrics.map((m) => [
        m.name,
        m.value,
      ]),
    );
    const documentId = result.collector.documentId;
    lifecycleSnapshots.delete(documentId); // Require a new finalization, not the first departure's beacon.
    await cdp.send("Page.navigate", { url: url + "__perf/away" });
    await until(
      `location.pathname === '/__perf/away' && document.readyState === 'complete'`,
    );
    await delay(150);
    const finalized = lifecycleSnapshots.get(documentId);
    lifecycleSnapshots.delete(documentId);
    result.lifecycleFinalized = Boolean(finalized);
    if (!finalized)
      throw new Error(
        "Missing final lifecycle beacon after restored-page input",
      );
    result.collector = { ...result.collector, ...finalized };
    result.metrics = metrics(result);
    result.status = result.errors.length ? "failed" : "ok";
  } catch (error) {
    result.status = "failed";
    result.errors.push({ type: "bfcache-diagnostic", message: error.stack });
  } finally {
    await browser?.close();
  }
  result.finishedAt = new Date().toISOString();
  return result;
}
