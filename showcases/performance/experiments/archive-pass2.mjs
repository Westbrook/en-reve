import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { resolve } from "node:path";
import { root, json, sha } from "../src/config.mjs";
const summary = JSON.parse(
  await readFile(resolve(root, "reports/pass2-tables.json")),
);
if (summary.status !== "complete")
  throw new Error("Only archive the completed named second-pass campaigns");
const receipts = [];
const historical = [
  "diagnostic-desktop-v1",
  "bfcache-direct-cdp-v2",
  "experiment-native-interaction-v2",
  "experiment-lazy-commands-interaction-v2",
  "experiment-intent-commands-interaction-v2",
];
const qualification = [
  "pass2-startup-qualification-v1",
  "pass2-startup-qualification-v2",
  "pass2-startup-qualification-v3",
];
const runs = [
  ...Object.values(summary.campaigns),
  {
    id: "pass2-startup-v1",
    status: "superseded",
    reason:
      "Host-side polling discovery bias; excluded from current startup comparisons.",
  },
  ...historical.map((id) => ({
    id,
    role: "historical supporting table input",
  })),
  ...qualification.map((id) => ({
    id,
    role: "startup qualification; excluded from timing distributions",
  })),
];
for (const run of runs) {
  const source = resolve(root, "runs", run.id),
    target = resolve(root, "reports/pass2-evidence", run.id);
  await mkdir(target, { recursive: true });
  const files = [];
  for (const name of [
    "samples.jsonl",
    "manifest.json",
    "summary.json",
    "collector.js",
    ...(run.id === "diagnostic-desktop-v1" ? ["diagnostics-summary.json"] : []),
  ]) {
    let data;
    try {
      data = await readFile(resolve(source, name));
    } catch (e) {
      if (name === "collector.js" && e.code === "ENOENT") continue;
      throw e;
    }
    const filename = name + ".gz";
    const zipped = gzipSync(data, { level: 9 });
    await writeFile(resolve(target, filename), zipped);
    files.push({
      path: filename,
      sourceSha256: sha(data),
      archiveSha256: sha(zipped),
      rawBytes: data.length,
      archiveBytes: zipped.length,
    });
  }
  // Preserve the actual measurement/analysis sources, excluding unrelated cache or dependencies.
  const harnessFiles = [];
  async function snapshot(folder, prefix = "") {
    const { readdir } = await import("node:fs/promises");
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      const relative = prefix + entry.name,
        path = resolve(folder, entry.name);
      if (entry.isDirectory()) await snapshot(path, relative + "/");
      else
        harnessFiles.push({
          path: relative,
          content: await readFile(path, "utf8"),
        });
    }
  }
  await snapshot(resolve(source, "harness"));
  const harness = Buffer.from(json(harnessFiles));
  const archive = gzipSync(harness, { level: 9 });
  await writeFile(resolve(target, "harness.json.gz"), archive);
  files.push({
    path: "harness.json.gz",
    sourceSha256: sha(harness),
    archiveSha256: sha(archive),
    rawBytes: harness.length,
    archiveBytes: archive.length,
  });
  receipts.push({ ...run, files });
}
const analysisFiles = [];
for (const path of [
  "experiments/summarize-pass2.mjs",
  "experiments/pass2-metrics.mjs",
  "experiments/archive-pass2.mjs",
  "experiments/startup-v2.mjs",
  "experiments/startup-v3.mjs",
  "experiments/finish-startup-v3.mjs",
  "experiments/calibrate-startup.mjs",
  "experiments/calibrate-startup-discovery.mjs",
  "experiments/calibrate-delivery.mjs",
  "experiments/calibrate-cdp-scope.mjs",
])
  analysisFiles.push({
    path,
    content: await readFile(resolve(root, path), "utf8"),
  });
const analysis = Buffer.from(json(analysisFiles));
await writeFile(
  resolve(root, "reports/pass2-evidence/analysis-sources.json.gz"),
  gzipSync(analysis, { level: 9 }),
);
await writeFile(
  resolve(root, "reports/pass2-evidence/receipt.json"),
  json({
    archivedAt: new Date().toISOString(),
    note: "Raw JSONL, manifests, summaries and exact harness sources retained outside ignored runs. Lighthouse HTML/JSON audits and full browser run folders also remain in runs. Decompress *.gz to inspect. Existing frozen vendor tarballs and inventory hashes identify measured artifacts.",
    analysisSourcesSha256: sha(analysis),
    campaigns: receipts,
  }),
);
console.log("Retained raw evidence for", receipts.length, "campaigns");
