import { readFile, readdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root));
const artifacts = new URL(process.env.SHOWCASE_ARTIFACTS || "artifacts/", root);
if (process.env.SHOWCASE_FILTER && !process.env.SHOWCASE_RECEIPT)
  throw new Error("Filtered qualification requires SHOWCASE_RECEIPT to preserve the original panel receipt");
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const smoke = JSON.parse(await readFile(new URL("smoke.json", artifacts)));
const secondary = JSON.parse(await readFile(new URL("secondary.json", artifacts)));
const inspection = JSON.parse(await readFile(new URL("inspection.json", artifacts)));
async function files(directory) {
  const entries = await readdir(new URL(directory, root), {
    withFileTypes: true,
  });
  const result = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (["node_modules", "dist", ".vite", "artifacts"].includes(entry.name))
      continue;
    const path = directory + "/" + entry.name;
    if (entry.isDirectory()) result.push(...(await files(path)));
    else result.push(path);
  }
  return result;
}
async function outputFilesIn(directory) {
  const result = [];
  for (const entry of await readdir(new URL(directory + "/", root), { withFileTypes: true })) {
    const path = directory + "/" + entry.name;
    if (entry.isDirectory()) result.push(...await outputFilesIn(path));
    else result.push(path);
  }
  return result.sort();
}
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
const projects = [];
for (const [index, name] of names.entries()) {
  if (process.env.SHOWCASE_FILTER && !process.env.SHOWCASE_FILTER.split(",").includes(name)) continue;
  const runs = [smoke, secondary].map((results) =>
    results.find((r) => r.name === name),
  );
  const visual = inspection.find((r) => r.name === name);
  if (
    runs.some((r) => !r || r.checks.some((c) => !c.pass) || r.errors.length) ||
    !visual ||
    visual.errors.length ||
    visual.cards !== 16 ||
    visual.overflow
  )
    throw new Error("Failed qualification: " + name);
  const sourceFiles = [
    ...(await files(name)),
    ...(await files("shared")),
    "tools/isolation-plugin.mjs",
  ];
  const sourceHashes = Object.fromEntries(
    await Promise.all(sourceFiles.map(async (p) => [p, digest(await read(p))])),
  );
  const sourceSha256 = digest(JSON.stringify(sourceHashes));
  const build = JSON.parse(await read(name + "/dist/build-metadata.json"));
  if (build.lockfileSha256 !== digest(await read(name + "/package-lock.json")))
    throw new Error("Stale build: " + name);
  const outputFiles = await outputFilesIn(name + "/dist");
  const outputHashes = Object.fromEntries(
    await Promise.all(outputFiles.map(async (p) => [p, digest(await read(p))])),
  );
  projects.push({
    name,
    url: "http://127.0.0.1:" + (4510 + index),
    sourceSha256,
    sourceHashes,
    build,
    outputHashes,
    checks: runs.flatMap((r) => r.checks),
    vendorLimitations: runs.flatMap((r) => r.vendorLimitations || []),
    consoleErrors: visual.errors,
    desktopOverflow: false,
    screenshot: fileURLToPath(new URL(name + ".png", artifacts)),
  });
}
if (!projects.length) throw new Error("No selected projects qualified");
const browser = await chromium.launch();
const browserVersion = browser.version();
await browser.close();
const receipt = {
  verifiedAt: new Date().toISOString(),
  browser: "Chromium " + browserVersion,
  node: process.version,
  platform: process.platform,
  rendering: "client",
  scope:
    "Functional qualification and desktop visual review; not performance profiling or accessibility certification",
  checksPassed: projects.reduce((n, p) => n + p.checks.length, 0),
  projects,
};
await writeFile(
  new URL(process.env.SHOWCASE_RECEIPT || "verification.json", root),
  JSON.stringify(receipt, null, 2) + "\n",
);
console.log(
  `${receipt.checksPassed} checks passed; ${projects.length} isolated production builds recorded in ${fileURLToPath(new URL(process.env.SHOWCASE_RECEIPT || "verification.json", root))}`,
);
