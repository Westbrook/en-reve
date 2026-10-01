import { readFile, writeFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { root, json, sha } from "./config.mjs";
import { describe, pairedDifference, metrics } from "./analysis.mjs";
export async function readRun(path) {
  const directory = resolve(root, "runs", path);
  const manifest = JSON.parse(
    await readFile(resolve(directory, "manifest.json")),
  );
  const text = await readFile(resolve(directory, "samples.jsonl"), "utf8");
  return {
    manifest,
    samples: text
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const sample = JSON.parse(line);
        if (sample.collector) sample.metrics = metrics(sample);
        return sample;
      }),
    directory,
  };
}
const metricNames = [
  "startupVisible",
  "startupInput",
  "startupResult",
  "startupFrame",
  "startupDispatchLag",
  "startupSemantic",
  "startupFeedback",
  "firstInputDelay",
  "responseTransferBytes",
  "htmlTransferBytes",
  "jsTransferBytes",
  "cssTransferBytes",
  "fontTransferBytes",
  "otherTransferBytes",
  "responseCount",
  "cachedResponses",
  "incompleteResponses",
  "timingTransferBytes",
  "htmlEncodedBodyBytes",
  "htmlDecodedBodyBytes",
  "decodedPageBodyBytes",
  "timingZeroSizeEntries",
  "tbt",
  "speedIndex",
  "ttfb",
  "fcp",
  "lcp",
  "cls",
  "scriptedINP",
  "cardsDOM",
  "cardsFrameOpportunity",
  "fontsReady",
  "longTaskMs",
  "loafMs",
  "resourceTransferBytes",
  "scriptMs",
  "layoutMs",
  "styleMs",
  "taskMs",
];
export async function report(id) {
  const { manifest, samples, directory } = await readRun(id);
  const groups = [];
  for (const key of [
    ...new Set(
      samples.map((s) =>
        [s.system, s.profile, s.cache, s.instrument].join("|"),
      ),
    ),
  ]) {
    const subset = samples.filter(
        (s) => [s.system, s.profile, s.cache, s.instrument].join("|") === key,
      ),
      passed = subset.filter((s) => s.status === "ok");
    const [system, profile, cache, instrument] = key.split("|");
    const actions = {};
    for (const name of [
      ...new Set(
        passed.flatMap((s) => s.metrics?.actions?.map((a) => a.name) || []),
      ),
    ]) {
      const values = passed.map((s) =>
        s.metrics.actions.find((a) => a.name === name),
      );
      actions[name] = {
        semanticMs: describe(values.map((a) => a?.semanticMs)),
        frameOpportunityMs: describe(values.map((a) => a?.frameOpportunityMs)),
        eventDuration: describe(values.map((a) => a?.eventTiming.duration)),
        eventMissing: values.filter((a) => a?.eventTiming.duration === null)
          .length,
      };
    }
    groups.push({
      system,
      profile,
      cache,
      instrument,
      total: subset.length,
      failed: subset.length - passed.length,
      metrics: Object.fromEntries(
        metricNames.map((name) => [
          name,
          describe(passed.map((s) => s.metrics?.[name])),
        ]),
      ),
      actions,
      memory: [
        ...new Set(passed.flatMap((s) => s.memory?.map((m) => m.cycles) || [])),
      ].map((cycles) => {
        const points = passed.flatMap(
          (s) => s.memory?.filter((m) => m.cycles === cycles) || [],
        );
        return {
          cycles,
          apiStatuses: Object.fromEntries(
            [...new Set(points.map((p) => p.api.status))].map((status) => [
              status,
              points.filter((p) => p.api.status === status).length,
            ]),
          ),
          apiBytes: describe(
            points.filter((p) => p.api.status === "ok").map((p) => p.api.bytes),
          ),
          chromiumJSHeapUsedSize: describe(
            points.map((p) => p.chromiumJSHeapUsedSize),
          ),
          browserDOMNodes: describe(points.map((p) => p.dom.nodes)),
        };
      }),
      bfcache: passed.some((s) => s.bfcache)
        ? {
            attempts: passed.filter((s) => s.bfcache).length,
            restored: passed.filter(
              (s) => s.bfcache?.sameDocument && s.bfcache.pageshow?.persisted,
            ).length,
            interactiveAfterReturn: passed.filter(
              (s) => s.bfcache?.interactiveAfterReturn,
            ).length,
          }
        : null,
      scrollMaximumIntervalMs: describe(
        passed
          .filter((s) => s.scroll?.intervals?.length)
          .map((s) => Math.max(...s.scroll.intervals)),
      ),
    });
  }
  const comparisons = [];
  for (const group of groups.filter((g) => g.system !== "en-reve")) {
    const reference = samples.filter(
      (s) =>
        s.system === group.system &&
        s.profile === group.profile &&
        s.cache === group.cache &&
        String(s.instrument) === group.instrument &&
        s.status === "ok",
    );
    const en = samples.filter(
      (s) =>
        s.system === "en-reve" &&
        s.profile === group.profile &&
        s.cache === group.cache &&
        String(s.instrument) === group.instrument &&
        s.status === "ok",
    );
    for (const metric of ["lcp", "fcp", "cardsFrameOpportunity", "scriptedINP"])
      comparisons.push({
        against: group.system,
        profile: group.profile,
        cache: group.cache,
        metric,
        ...pairedDifference(
          en.map((s) => ({ block: s.block, value: s.metrics[metric] })),
          reference.map((s) => ({ block: s.block, value: s.metrics[metric] })),
        ),
      });
  }
  const summary = {
    schema: 1,
    id: manifest.id,
    harnessSha256: manifest.harnessSha256,
    analysisSha256: sha(await readFile(resolve(root, "src/analysis.mjs"))),
    expected: manifest.jobs.length,
    observed: samples.length,
    complete: samples.length === manifest.jobs.length,
    failures: samples
      .filter((s) => s.status !== "ok")
      .map((s) => ({ id: s.id, system: s.system, errors: s.errors })),
    groups,
    comparisons,
  };
  await writeFile(resolve(directory, "summary.json"), json(summary));
  const fmt = (x, digits = 1) => (Number.isFinite(x) ? x.toFixed(digits) : "—");
  const lines = [
    `# ${manifest.id}`,
    "",
    `Protocol: ${manifest.harnessSha256}. ${samples.length}/${manifest.jobs.length} samples retained; ${summary.failures.length} failures. Developer workstation measurements; see manifest for limitations.`,
    "",
    "Times in milliseconds. Every cell is a median of successful samples; failures remain explicit. No overall ranking.",
    "",
    "| System | Profile/cache | Collector | n / failures | FCP | LCP | CLS | Card frame opportunity | Scripted INP |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |",
  ];
  for (const g of groups)
    lines.push(
      `| ${g.system} | ${g.profile}/${g.cache} | ${manifest.options.suite === "lighthouse" ? "Lighthouse" : g.instrument === "false" ? "off" : "on"} | ${g.total} / ${g.failed} | ${fmt(g.metrics.fcp.median)} | ${fmt(g.metrics.lcp.median)} | ${fmt(g.metrics.cls.median, 4)} | ${fmt(g.metrics.cardsFrameOpportunity.median)} | ${fmt(g.metrics.scriptedINP.median)} |`,
    );
  if (groups.some((g) => g.memory.length)) {
    lines.push(
      "",
      "## Separate memory diagnostics",
      "",
      "Bytes; medians of available samples only. API statuses remain explicit. JS heap and browser-wide DOM counters are different scopes from API memory and connected DOM. A short lifecycle pilot does not establish a leak.",
      "",
      "| System | Cycles | API statuses | API bytes | JS heap bytes | Browser DOM nodes |",
      "| --- | ---: | --- | ---: | ---: | ---: |",
    );
    for (const g of groups)
      for (const m of g.memory)
        lines.push(
          `| ${g.system} | ${m.cycles} | ${JSON.stringify(m.apiStatuses)} | ${fmt(m.apiBytes.median, 0)} | ${fmt(m.chromiumJSHeapUsedSize.median, 0)} | ${fmt(m.browserDOMNodes.median, 0)} |`,
        );
  }
  if (groups.some((g) => g.bfcache)) {
    lines.push(
      "",
      "## Return navigation",
      "",
      "Automation diagnostic, not field hit rate. Non-restoration is an explicit outcome; raw navigation entries retain available reasons.",
      "",
      "| System | Attempts | Same document and persisted pageshow | Interactive after return |",
      "| --- | ---: | ---: | ---: |",
    );
    for (const g of groups.filter((g) => g.bfcache))
      lines.push(
        `| ${g.system} | ${g.bfcache.attempts} | ${g.bfcache.restored} | ${g.bfcache.interactiveAfterReturn} |`,
      );
  }
  lines.push(
    "",
    "Raw per-action timings, confidence intervals, native attribution, resources, failures and manifests accompany this report. Frame opportunity uses two requestAnimationFrame callbacks and does not prove pixels were presented. Scripted-session INP is not field INP. Resource transfer sizes of zero may mean cache or cross-origin restriction.",
    "",
  );
  await writeFile(resolve(directory, "report.md"), lines.join("\n"));
  console.log(`${directory}/report.md`);
  return summary;
}
export async function latestRun() {
  const runs = [];
  for (const id of await readdir(resolve(root, "runs"))) {
    try {
      const manifest = JSON.parse(
        await readFile(resolve(root, "runs", id, "manifest.json")),
      );
      runs.push({ id, at: manifest.createdAt });
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  const latest = runs.sort((a, b) => a.at.localeCompare(b.at)).at(-1);
  if (!latest) throw new Error("No recorded campaigns");
  return latest.id;
}
