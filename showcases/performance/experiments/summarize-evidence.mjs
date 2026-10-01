import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { root, json, sha } from "../src/config.mjs";
import { pairedDifference } from "../src/analysis.mjs";
const runs = [];
let invalidation = null;
try {
  invalidation = JSON.parse(
    await readFile(resolve(root, "reports/invalidated-metrics.json")),
  );
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
for (const id of (await readdir(resolve(root, "runs"))).sort()) {
  try {
    const summaryText = await readFile(
      resolve(root, "runs", id, "summary.json"),
      "utf8",
    );
    const summary = JSON.parse(summaryText);
    const manifest = JSON.parse(
      await readFile(resolve(root, "runs", id, "manifest.json")),
    );
    const invalidated = invalidation?.affectedRuns.includes(id);
    if (invalidated) {
      for (const group of summary.groups) {
        const action = group.actions["commands-first"];
        if (action)
          for (const metric of ["semanticMs", "frameOpportunityMs"])
            action[metric] = {
              n: 0,
              median: null,
              p75: null,
              status: "invalidated-readiness",
              reason: invalidation.reason,
            };
      }
    }
    runs.push({
      id,
      suite: manifest.options.suite,
      variant: manifest.options.variant || "native",
      harnessSha256: manifest.harnessSha256,
      summarySha256: sha(summaryText),
      expected: summary.expected,
      observed: summary.observed,
      complete: summary.complete,
      failures: summary.failures,
      invalidatedMetrics: invalidated ? invalidation.invalidMetrics : [],
      groups: summary.groups,
    });
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
}
await writeFile(
  resolve(root, "reports/evidence-ledger.json"),
  json({
    generatedAt: new Date().toISOString(),
    note: "Exploratory workstation evidence. Failed/incomplete campaigns retained. Different protocol hashes, suites and browser modes are separate cohorts. See raw run manifests and source snapshots. This ledger does not certify a reference runner.",
    runs,
    invalidation,
  }),
);
const fmt = (n, places = 1) => (Number.isFinite(n) ? n.toFixed(places) : "—");
const lines = [
  "# En Reve consumer experiments",
  "",
  "Five samples per load/cache cell. Sequential exploratory campaigns with native controls before and after; variants were not randomized together. No causal speedup or confidence claim follows from these small medians. Native controls reveal session drift. Separate interaction pilots test first-use cost and scroll/CLS displacement.",
  "The first lazy/intent command semantic and frame timings were invalidated because the collector accepted an unregistered element. Those cells are omitted here; raw runs and the invalidation receipt remain available. Replacement v2 runs use the corrected collector.",
  "",
  "| Run / variant | Suite | Cache | n / failures | LCP ms | CLS | Scripted INP ms | First commands semantic ms |",
  "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |",
];
for (const run of runs.filter((r) => r.id.startsWith("experiment-")))
  for (const g of run.groups)
    lines.push(
      `| ${run.id} / ${run.variant} | ${run.suite} | ${g.cache} | ${g.total} / ${g.failed} | ${fmt(g.metrics.lcp.median)} | ${fmt(g.metrics.cls.median, 4)} | ${fmt(g.metrics.scriptedINP.median)} | ${fmt(g.actions["commands-first"]?.semanticMs.median)} |`,
    );
await writeFile(
  resolve(root, "reports/experiment-comparison.md"),
  lines.join("\n") + "\n",
);
console.log(
  `Retained ${runs.length} campaign summaries in the evidence ledger.`,
);
try {
  const samples = (
    await readFile(
      resolve(root, "runs/observer-overhead-v1/samples.jsonl"),
      "utf8",
    )
  )
    .trim()
    .split("\n")
    .map(JSON.parse);
  const effects = [];
  for (const system of [...new Set(samples.map((s) => s.system))]) {
    for (const metric of ["fcp", "scriptMs", "styleMs", "layoutMs", "taskMs"]) {
      const values = (instrument) =>
        samples
          .filter(
            (s) =>
              s.system === system &&
              s.instrument === instrument &&
              s.status === "ok",
          )
          .map((s) => ({ block: s.block, value: s.metrics[metric] }));
      effects.push({
        system,
        metric,
        ...pairedDifference(values(true), values(false)),
      });
    }
  }
  await writeFile(
    resolve(root, "reports/observer-overhead.json"),
    json({
      note: "Collector on minus off; five paired blocks. Exploratory, not evidence of zero instrumentation cost.",
      effects,
    }),
  );
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
