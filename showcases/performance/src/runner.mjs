import { variantQualification } from './variant-qualification.mjs';
import { lifecycleReceipts } from './lifecycle-receipt.mjs';
import { chromium } from "@playwright/test";
import {
  mkdir,
  readFile,
  writeFile,
  appendFile,
  cp,
  access,
} from "node:fs/promises";
import { resolve } from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { build } from "esbuild";
import {
  root,
  registry,
  profiles,
  rng,
  shuffle,
  json,
  sha,
} from "./config.mjs";
import { files } from "./prepare.mjs";
import { startServers, lifecycleSnapshots } from "./server.mjs";
import {
  qualify,
  journey,
  scrollFrames,
  version as scenarioVersion,
} from "../scenarios/journey.mjs";
import { startupInteraction, installStartupProbe } from "../scenarios/startup.mjs";
import { metrics } from "./analysis.mjs";
import { domDiagnostics } from "./dom-diagnostics.mjs";
import { calendarJourney } from "../scenarios/calendar.mjs";
import { sampleBFCache } from "./bfcache.mjs";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export async function labIdentity() {
  const paths = [
    ...(await files(resolve(root, "src"))),
    ...(await files(resolve(root, "scenarios"))),
    ...(await files(resolve(root, "profiles"))),
    ...(await files(resolve(root, "registry"))),
    resolve(root, "package-lock.json"),
  ];
  return sha(
    json(
      await Promise.all(
        paths.map(async (path) => [
          path.slice(root.length),
          sha(await readFile(path)),
        ]),
      ),
    ),
  );
}
async function browserSession(
  profile,
  instrument = true,
  collectorPath,
  suite,
  lifecycleProtocol,
) {
  const browser = await chromium.launch({
    headless: true,
    ...(["memory", "bfcache"].includes(suite) ? { channel: "chromium" } : {}),
    ...(suite === "bfcache"
      ? { ignoreDefaultArgs: ["--disable-back-forward-cache"] }
      : {}),
    args: [
      "--ignore-certificate-errors",
      "--enable-precise-memory-info",
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
    ],
  });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: profile.viewport,
    deviceScaleFactor: profile.deviceScaleFactor,
    serviceWorkers: "block",
  });
  const lifecycle = [];
  if (instrument) {
    await context.exposeBinding("__perfSink", (_, data) => {
      lifecycle.push(data);
    });
    if (lifecycleProtocol === "ack-v1") {
      await context.addInitScript({ content: `globalThis.__perfLifecycleProtocol = "ack-v1";\n${await readFile(collectorPath, "utf8")}` });
    } else await context.addInitScript({ path: collectorPath });
  }
  if (suite === "startup") await context.addInitScript(installStartupProbe);
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  page.setDefaultNavigationTimeout(30000);
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Performance.enable");
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: profile.cpuRate });
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: profile.latency,
    downloadThroughput: profile.download,
    uploadThroughput: profile.upload,
  });
  return { browser, context, page, cdp, lifecycle };
}
async function traceStop(cdp, path) {
  const done = new Promise((resolve) =>
    cdp.once("Tracing.tracingComplete", resolve),
  );
  await cdp.send("Tracing.end");
  const { stream } = await done;
  let content = "";
  for (;;) {
    const chunk = await cdp.send("IO.read", { handle: stream });
    content += chunk.data;
    if (chunk.eof) break;
  }
  await cdp.send("IO.close", { handle: stream });
  await writeFile(path, content);
}
async function memorySample(page, cdp) {
  const api = await page.evaluate(async () => {
    if (
      !crossOriginIsolated ||
      typeof performance.measureUserAgentSpecificMemory !== "function"
    )
      return { status: "unsupported", isolated: crossOriginIsolated };
    let timer;
    try {
      return await Promise.race([
        performance
          .measureUserAgentSpecificMemory()
          .then((result) => ({ status: "ok", ...result })),
        new Promise((resolve) => {
          timer = setTimeout(
            () => resolve({ status: "timeout", timeoutMs: 15000 }),
            15000,
          );
        }),
      ]);
    } catch (error) {
      return { status: "error", message: error.message };
    } finally {
      clearTimeout(timer);
    }
  });
  const heap = (await cdp.send("Performance.getMetrics")).metrics;
  return {
    api,
    chromiumJSHeapUsedSize: heap.find((x) => x.name === "JSHeapUsedSize")
      ?.value,
    dom: await cdp.send("Memory.getDOMCounters"),
  };
}
export async function sample(job, options, outputDir) {
  if (options.suite === "bfcache")
    return sampleBFCache(job, options, outputDir);
  const profile = profiles[job.profile],
    system = registry.find((s) => s.id === job.system),
    isolated = options.suite === "memory";
  const url = `https://127.0.0.1:${system.port + (isolated ? 100 : 0)}/`;
  const result = {
    ...job,
    suite: options.suite,
    variant: options.variant || "native",
    startedAt: new Date().toISOString(),
    environmentBefore: { load: os.loadavg(), freeMemory: os.freemem() },
    errors: [],
    network: [],
    status: "running",
  };
  let session,
    tracing = false;
  try {
    session = await browserSession(
      profile,
      job.instrument !== false,
      resolve(outputDir, "collector.js"),
      options.suite,
      options.lifecycle,
    );
    const { browser, page, cdp, lifecycle } = session;
    result.browser = browser.version();
    result.browserMode = ["memory", "bfcache"].includes(options.suite)
      ? "bundled-full-chromium-new-headless"
      : "bundled-chromium-headless-shell";
    if (job.cache === "warm") {
      await page.goto(url, { waitUntil: "load" });
      await page.locator(".showcase-card").last().waitFor();
      await delay(1500);
      await page.goto(url + "__perf/away");
    }
    page.on("pageerror", (error) =>
      result.errors.push({ type: "pageerror", message: error.message }),
    );
    page.on("requestfailed", (request) =>
      result.errors.push({
        type: "requestfailed",
        url: request.url(),
        message: request.failure()?.errorText,
      }),
    );
    cdp.on("Network.responseReceived", ({ requestId, response, type }) => {
      result.network.push({
        requestId,
        url: response.url,
        status: response.status,
        protocol: response.protocol,
        mimeType: response.mimeType,
        fromDiskCache: response.fromDiskCache,
        fromServiceWorker: response.fromServiceWorker,
        encodedDataLength: response.encodedDataLength,
        headers: response.headers,
        type,
      });
      if (
        response.status >= 400 &&
        ["Document", "Script", "Stylesheet", "Font"].includes(type)
      )
        result.errors.push({
          type: "http-resource-error",
          url: response.url,
          status: response.status,
          message: `HTTP ${response.status} for ${type}`,
        });
    });
    cdp.on("Network.loadingFinished", (event) => {
      const item = result.network.find((x) => x.requestId === event.requestId);
      if (item) item.finishedEncodedDataLength = event.encodedDataLength;
    });
    if (options.suite === "diagnostic") {
      await page.coverage.startJSCoverage({ resetOnNavigation: false });
      await page.coverage.startCSSCoverage({ resetOnNavigation: false });
      await cdp.send("Tracing.start", {
        categories:
          "devtools.timeline,v8,blink.user_timing,disabled-by-default-devtools.timeline,disabled-by-default-v8.cpu_profiler",
        transferMode: "ReturnAsStream",
      });
      tracing = true;
    }
    if (options.suite === "startup") {
      await page.goto(url, { waitUntil: "commit" });
      result.startup = await startupInteraction(page, job.system);
      await page.waitForLoadState("load");
    } else {
      await page.goto(url, { waitUntil: "load" });
      await page.locator(".showcase-card").last().waitFor();
      await delay(1500);
    }
    if (job.instrument !== false)
      await page.waitForFunction(
        () => window.__perf?.state.milestones.cardsFrameOpportunity,
      );
    result.document = await page.evaluate(() => ({
      cardCount: document.querySelectorAll(".showcase-card").length,
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      secure: isSecureContext,
      isolated: crossOriginIsolated,
      viewport: { width: innerWidth, height: innerHeight },
    }));
    if (result.document.cardCount !== 16)
      throw new Error("Expected sixteen native cards");
    if (options.suite === "qualify") await qualify(page, job.system);
    if (options.calendarWorkload) {
      if (options.suite === "memory") result.calendarMemory = [{calendarOpenings: 0, ...(await memorySample(page, cdp))}];
      result.calendar = await calendarJourney(page, {preparation: options.preparation || "none", cycles: Number(options.calendarCycles || 0)});
      if (options.suite === "memory") result.calendarMemory.push({calendarOpenings: 2 + Number(options.calendarCycles || 0), ...(await memorySample(page, cdp))});
    }
    if (
      ["interactions", "diagnostic"].includes(options.suite) ||
      (options.suite === "overhead" && options.workload === "interactions")
    ) {
      await journey(page, job.system, { measure: job.instrument !== false });
      result.scroll = await scrollFrames(page);
    }
    if (options.suite === "memory") {
      result.memory = [];
      const checkpoints = (options.checkpoints || "0,10,50,100")
        .split(",")
        .map(Number);
      let cycles = 0;
      for (const checkpoint of checkpoints) {
        while (cycles < checkpoint) {
          await journey(page, job.system, { repeats: 1, measure: false });
          cycles++;
        }
        await delay(1000);
        result.memory.push({ cycles, ...(await memorySample(page, cdp)) });
      }
    }
    if (options.suite === "diagnostic") {
      const [js, css] = await Promise.all([
        page.coverage.stopJSCoverage(),
        page.coverage.stopCSSCoverage(),
      ]);
      await writeFile(
        resolve(outputDir, job.id + "-coverage.json"),
        json({ js, css }),
      );
      await traceStop(cdp, resolve(outputDir, job.id + "-trace.json"));
      tracing = false;
      result.diagnostics = {
        trace: job.id + "-trace.json",
        coverage: job.id + "-coverage.json",
      };
      result.connectedDOM = await domDiagnostics(page);
      for (const response of result.network.filter(
        (r) => r.type === "Font" || !r.url.startsWith(url),
      )) {
        try {
          const body = await cdp.send("Network.getResponseBody", {
            requestId: response.requestId,
          });
          response.bodySha256 = sha(
            Buffer.from(body.body, body.base64Encoded ? "base64" : "utf8"),
          );
        } catch {
          response.bodySha256 = null;
        }
      }
    }
    result.browserMetrics = Object.fromEntries(
      (await cdp.send("Performance.getMetrics")).metrics.map((m) => [
        m.name,
        m.value,
      ]),
    );
    result.dom = await cdp.send("Memory.getDOMCounters");
    result.networkObservation = structuredClone(result.network);
    if (job.instrument !== false) {
      result.collector = await page.evaluate(() => window.__perf.snapshot());
      const id = result.collector.documentId;
      // Opt-in until old/new calibration and full affected qualification pass.
      const acknowledgement = options.lifecycle === 'ack-v1' ? lifecycleReceipts.expect(result.collector) : null;
      let finalized;
      try {
        await page.goto(url + "__perf/away");
        if (acknowledgement) finalized = await acknowledgement.promise;
        else {
          await delay(100);
          finalized = lifecycleSnapshots.get(id) || lifecycle.findLast((c) => c.documentId === id);
        }
      } finally { acknowledgement?.cancel(); }
      result.lifecycleProtocol = acknowledgement ? 'ack-v1' : 'fixed-wait-v1';
      lifecycleSnapshots.delete(id);
      result.lifecycleFinalized = Boolean(finalized);
      if (finalized) result.collector = { ...result.collector, ...finalized };
      if (!result.lifecycleFinalized)
        throw new Error("Missing visibility lifecycle flush");
      if (result.collector.resourceBufferFull)
        throw new Error("Resource timing buffer overflow");
    } else
      result.uninstrumented = await page.evaluate(() => ({
        navigation: performance.getEntriesByType("navigation")[0].toJSON(),
        paint: performance.getEntriesByType("paint").map((e) => e.toJSON()),
      }));
    result.status = result.errors.length ? "failed" : "ok";
    result.metrics = result.uninstrumented
      ? {
          ttfb: result.uninstrumented.navigation.responseStart,
          fcp: result.uninstrumented.paint.find(
            (p) => p.name === "first-contentful-paint",
          )?.startTime,
        }
      : metrics(result);
    for (const [key, source] of [
      ["scriptMs", "ScriptDuration"],
      ["styleMs", "RecalcStyleDuration"],
      ["layoutMs", "LayoutDuration"],
      ["taskMs", "TaskDuration"],
    ])
      result.metrics[key] = result.browserMetrics[source] * 1000;
  } catch (error) {
    result.status = "failed";
    result.errors.push({ type: "harness-or-scenario", message: error.stack });
    try {
      result.collector ||= await session.page.evaluate(() =>
        window.__perf?.snapshot(),
      );
    } catch {}
  } finally {
    if (tracing)
      try {
        await traceStop(
          session.cdp,
          resolve(outputDir, job.id + "-trace-failed.json"),
        );
      } catch {}
    await session?.browser.close();
  }
  result.finishedAt = new Date().toISOString();
  result.environmentAfter = { load: os.loadavg(), freeMemory: os.freemem() };
  return result;
}
export async function run(options) {
  const allowed = [
    "load",
    "startup",
    "qualify",
    "interactions",
    "memory",
    "diagnostic",
    "bfcache",
    "overhead",
  ];
  if (!allowed.includes(options.suite))
    throw new Error(`Unknown suite ${options.suite}`);
  const systems = options.systems
    ? registry.filter((s) => options.systems.split(",").includes(s.id))
    : registry;
  if (!systems.length) throw new Error("No matching systems");
  if (
    options.systems &&
    options.systems.split(",").some((id) => !registry.some((s) => s.id === id))
  )
    throw new Error("Unknown system in requested comparison matrix");
  if (options.lifecycle && !['ack-v1', 'fixed-wait-v1'].includes(options.lifecycle)) throw new Error('Unknown lifecycle protocol');
  if (options['functional-receipt'] !== undefined && !options.variant) throw new Error('--functional-receipt requires a consumer variant');
  const selectedProfiles = (options.profiles || "desktop,mobile").split(",");
  for (const name of selectedProfiles)
    if (!profiles[name]) throw new Error(`Unknown profile ${name}`);
  const caches = (
    options.caches || (options.suite === "load" ? "cold,warm" : "cold")
  ).split(",");
  if (caches.some((c) => !["cold", "warm"].includes(c)))
    throw new Error("Cache must be cold or warm");
  const count = Number(options.samples || 5);
  if (!Number.isInteger(count) || count < 1)
    throw new Error("Positive integer samples required");
  const seed = Number(options.seed || 20260920),
    random = rng(seed);
  const id =
    options.id ||
    new Date().toISOString().replace(/[:.]/g, "-") + "-" + options.suite;
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error("Use a simple run ID");
  const directory = resolve(root, "runs", id);
  await mkdir(directory, { recursive: true });
  try {
    await access(resolve(directory, "manifest.json"));
    throw new Error("Run ID already exists; evidence is immutable");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  await writeFile(
    resolve(directory, "run-started.json"),
    json({ at: new Date().toISOString(), pid: process.pid }),
    { flag: "wx" },
  );
  const jobs = [];
  let index = 0;
  for (let block = 0; block < count; block++) {
    const combinations = systems.flatMap((s) =>
      selectedProfiles.flatMap((profile) =>
        caches.flatMap((cache) =>
          (options.suite === "overhead"
            ? [false, true]
            : options.suite === "memory"
              ? [false]
              : [true]
          ).map((instrument) => ({
            system: s.id,
            profile,
            cache,
            instrument,
            block,
          })),
        ),
      ),
    );
    for (const job of shuffle(combinations, random))
      jobs.push({ ...job, id: String(++index).padStart(5, "0") });
  }
  let power = "unavailable";
  try {
    power = execFileSync("pmset", ["-g", "batt"], { encoding: "utf8" }).trim();
  } catch {}
  const manifest = {
    schema: 1,
    id,
    createdAt: new Date().toISOString(),
    options,
    seed,
    sampleCount: count,
    jobs,
    scenarioVersion,
    harnessSha256: await labIdentity(),
    inventory: JSON.parse(
      await readFile(resolve(root, ".cache/inventory.json")),
    ),
    profiles,
    host: {
      platform: os.platform(),
      release: os.release(),
      architecture: os.arch(),
      cpu: os.cpus()[0]?.model,
      logicalCpus: os.cpus().length,
      totalMemory: os.totalmem(),
      node: process.version,
      power,
    },
    methodology: {
      cold: "Fresh browser process and temporary profile per sample; OS DNS and server cache shared; loopback TLS/HTTP2",
      warm: "Fresh process; prime same URL, navigate away, revisit using same context; inspect network cache evidence",
      observation:
        options.suite === "startup"
          ? "Animation-frame geometry probe and one trusted Landscape click before load/settling; probe elapsed time and dispatch overhead recorded. Input terminates LCP eligibility; startup LCP excluded."
          : "Load event plus 1500ms, then card readiness. No input in load suite.",
      instruments:
        "Primary PerformanceObserver/web-vitals; diagnostics and memory separate",
      environment:
        "Developer workstation, concurrent activity possible; exploratory laboratory results, not a certified quiet reference machine",
      percentile:
        "p95 only at n>=100; p75 lab distributions are not field Core Web Vitals",
      failures:
        "Retained and excluded from successful metric distributions; no silent retries",
    },
  };
  if (options.variant) {
    if (systems.some((s) => s.id !== "en-reve"))
      throw new Error(
        "En Reve consumer variants must be run with --systems en-reve",
      );
    const experiments = JSON.parse(
      await readFile(resolve(root, "reports/en-reve-experiments.json")),
    );
    manifest.variant = experiments.find((e) => e.id === options.variant);
    if (!manifest.variant) throw new Error("Unknown consumer experiment");
    const qualification = await variantQualification({
      root, variant: manifest.variant, functionalReceipt: options['functional-receipt'],
    });
    manifest.variantQualification = qualification.receipt;
    manifest.variantQualificationSource = qualification.source;
  }
  if (
    manifest.inventory.requiresFunctionalQualification &&
    options.suite !== "qualify"
  )
    throw new Error(
      "Candidate snapshot requires the full functional suite before timing runs",
    );
  for (const system of systems) {
    const entry = options.variant
      ? manifest.variant
      : manifest.inventory.systems.find((s) => s.id === system.id);
    const dir = options.variant
      ? resolve(root, ".cache/variants", options.variant)
      : resolve(root, ".cache/snapshots", system.id);
    for (const asset of entry.assets)
      if (sha(await readFile(resolve(dir, asset.path))) !== asset.sha256)
        throw new Error(
          `Artifact changed after preparation: ${system.id}/${asset.path}`,
        );
  }
  await build({
    entryPoints: [resolve(root, "src/collector.js")],
    outfile: resolve(directory, "collector.js"),
    bundle: true,
    format: "iife",
    platform: "browser",
    minify: true,
  });
  manifest.collectorSha256 = sha(
    await readFile(resolve(directory, "collector.js")),
  );
  await writeFile(resolve(directory, "manifest.json"), json(manifest), {
    flag: "wx",
  });
  for (const folder of ["src", "registry", "profiles", "scenarios"])
    await cp(resolve(root, folder), resolve(directory, "harness", folder), {
      recursive: true,
    });
  await cp(
    resolve(root, "package-lock.json"),
    resolve(directory, "harness/package-lock.json"),
  );
  await cp(
    resolve(root, "package.json"),
    resolve(directory, "harness/package.json"),
  );
  const stop = await startServers({
    isolated: options.suite === "memory",
    systems,
    variant: options.variant,
  });
  console.log(`RUN ${id}: ${jobs.length} serial samples`);
  try {
    for (const job of jobs) {
      const result = await sample(job, options, directory);
      await appendFile(
        resolve(directory, "samples.jsonl"),
        JSON.stringify(result) + "\n",
      );
      console.log(
        `${job.id}/${jobs.length} ${job.system} ${job.profile}/${job.cache} ${result.status} LCP=${result.metrics?.lcp?.toFixed(1) ?? "n/a"} ${result.errors.map((e) => e.message.split("\n")[0]).join("; ")}`,
      );
    }
  } finally {
    await stop();
  }
  console.log(`Saved ${directory}`);
  return directory;
}
