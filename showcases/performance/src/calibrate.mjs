import { lifecycleReceipts } from './lifecycle-receipt.mjs';
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { writeFile, readFile, mkdir, access } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { root, registry, json, sha } from "./config.mjs";
import { startServers, lifecycleSnapshots } from "./server.mjs";
import { build } from "esbuild";
export async function calibrate(args = {}) {
  if (args.lifecycle && !["ack-v1", "fixed-wait-v1"].includes(args.lifecycle)) throw new Error("Unknown lifecycle protocol");
  const output = resolve(args.output ?? resolve(root, "reports/collector-calibration.json"));
  if (args.output) {
    try { await access(output); throw new Error("Calibration receipt already exists: " + output); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
    await mkdir(dirname(output), { recursive: true });
  }
  await build({
    entryPoints: [resolve(root, "src/collector.js")],
    outfile: resolve(root, ".cache/collector.js"),
    bundle: true,
    format: "iife",
    platform: "browser",
    minify: true,
  });
  const stop = await startServers({ systems: [registry[0]] });
  let browser;
  try {
    browser = await chromium.launch({ args: ["--ignore-certificate-errors"] });
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    if (args.lifecycle === "ack-v1") {
      await context.addInitScript({ content: `globalThis.__perfLifecycleProtocol = "ack-v1";\n${await readFile(resolve(root, ".cache/collector.js"), "utf8")}` });
    } else await context.addInitScript({ path: resolve(root, ".cache/collector.js") });
    const page = await context.newPage();
    await page.goto("https://127.0.0.1:4610/__perf/calibration");
    await page.waitForTimeout(200);
    await page.evaluate(() =>
      window.__perf.arm("known-60ms-work", { target: "#result", text: "Done" }),
    );
    await page.getByRole("button", { name: "Run 60ms task" }).click();
    await page.waitForFunction(
      () => window.__perf.state.actions.at(-1).completed,
    );
    await page.waitForTimeout(400);
    const raw = await page.evaluate(() => window.__perf.snapshot());
    assert.ok(raw.actions[0].semanticReady - raw.actions[0].eventStart >= 55);
    assert.ok(
      raw.entries.event.some((e) => e.processingEnd - e.processingStart >= 55),
    );
    assert.ok(raw.entries.longtask.some((e) => e.duration >= 55));
    assert.ok(raw.entries["largest-contentful-paint"].some((e) => e.element));
    await page.evaluate(() => {
      const host = document.createElement("en-command-palette");
      host.setAttribute("label", "Deferred calibration commands");
      document.body.append(host);
      const trigger = document.createElement("button");
      trigger.textContent = "Load deferred calibration dialog";
      trigger.onclick = () =>
        setTimeout(() => {
          window.__lazyDefinedAt = performance.now();
          customElements.define(
            "en-command-palette",
            class extends HTMLElement {
              constructor() {
                super();
                this.open = true;
                this.attachShadow({ mode: "open" }).innerHTML =
                  '<dialog open aria-label="Deferred calibration commands">Ready</dialog>';
              }
            },
          );
        }, 120);
      document.body.append(trigger);
      window.__perf.arm("deferred-definition", {
        dialogName: "Deferred calibration commands",
      });
    });
    await page
      .getByRole("button", { name: "Load deferred calibration dialog" })
      .click();
    await page.waitForFunction(
      () => window.__perf.state.actions.at(-1).completed,
    );
    const deferred = await page.evaluate(() => ({
      action: window.__perf.state.actions.at(-1),
      definedAt: window.__lazyDefinedAt,
    }));
    assert.ok(deferred.action.semanticReady >= deferred.definedAt);
    assert.ok(
      deferred.action.semanticReady - deferred.action.eventStart >= 100,
    );
    const acknowledgement = args.lifecycle === "ack-v1" ? lifecycleReceipts.expect(raw) : null;
    let final;
    try {
      await page.goto("https://127.0.0.1:4610/__perf/away");
      if (acknowledgement) final = await acknowledgement.promise;
      else { await page.waitForTimeout(150); final = lifecycleSnapshots.get(raw.documentId); }
    } catch (error) { acknowledgement?.cancel(); throw error; }
    assert.ok(final);
    assert.equal(final.visibility, "hidden");
    assert.ok(final.vitals.INP?.value >= 48);
    const receipt = {
      at: new Date().toISOString(),
      browser: browser.version(),
      status: "passed",
      lifecycleProtocol: args.lifecycle === "ack-v1" ? "ack-v1" : "fixed-wait-v1",
      collectorSha256: sha(
        await readFile(resolve(root, ".cache/collector.js")),
      ),
      deferred,
      assertions: [
        "Semantic timer measures known 60ms work",
        "Native Event Timing sees handler duration",
        "Long Tasks sees blocking work",
        "LCP retains candidate identity",
        "Real navigation hide finalizes scripted INP",
        "Unregistered lazy dialog cannot satisfy readiness before definition/upgrade",
      ],
      raw,
      final,
    };
    await writeFile(
      output,
      json(receipt),
      { flag: args.output ? "wx" : "w" },
    );
    console.log(
      "Collector calibration passed: known work, native entries, candidate identity, lifecycle finalization.",
    );
  } finally {
    await browser?.close();
    await stop();
  }
}
