import { readFile, writeFile, mkdir, cp } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { root, json, sha } from "./config.mjs";
import { report, readRun } from "./report.mjs";
import { independentDifference, describe } from "./analysis.mjs";
export const timingBudgets = {
  lcp: { absolute: 50, relative: 0.1 },
  fcp: { absolute: 50, relative: 0.1 },
  cardsFrameOpportunity: { absolute: 50, relative: 0.1 },
  scriptedINP: { absolute: 16, relative: 0.1 },
  cls: { absolute: 0.01, relative: 0.1 },
};
export function timingLifecycleProtocol(options = {}) {
  const protocol = options.lifecycle ?? "fixed-wait-v1";
  return ["fixed-wait-v1", "ack-v1"].includes(protocol) ? protocol : null;
}
export function timingProtocolMatches(run) {
  const protocol = timingLifecycleProtocol(run.manifest.options);
  // Historical fixed-wait samples predate the explicit field. An ack capture
  // must carry its explicit protocol on every successful instrumented sample.
  return protocol !== null && run.samples.every(sample => sample.status !== "ok"
    || sample.instrument === false
    || (sample.lifecycleProtocol ?? "fixed-wait-v1") === protocol);
}
export function compatibleTimingRuns(current, prior) {
  return current.manifest.harnessSha256 === prior.manifest.harnessSha256
    && current.manifest.host.cpu === prior.manifest.host.cpu
    && current.manifest.host.platform === prior.manifest.host.platform
    && current.manifest.host.release === prior.manifest.host.release
    && JSON.stringify(current.manifest.profiles) === JSON.stringify(prior.manifest.profiles)
    && current.manifest.options.suite === prior.manifest.options.suite
    && timingLifecycleProtocol(current.manifest.options) === timingLifecycleProtocol(prior.manifest.options)
    && timingProtocolMatches(current) && timingProtocolMatches(prior);
}
export function totals(inventory) {
  return Object.fromEntries(
    inventory.systems.map((s) => [
      s.id,
      Object.fromEntries(
        ["raw", "gzip", "brotli"].map((encoding) => [
          encoding,
          s.assets
            .filter((a) => !a.diagnostic && /\.(js|css)$/.test(a.path))
            .reduce((n, a) => n + a[encoding], 0),
        ]),
      ),
    ]),
  );
}
function measuredInventory(run) {
  if (!run.manifest.variant) return run.manifest.inventory;
  if (run.manifest.variant.cohort !== "current-library-native")
    throw new Error(
      "Consumer optimization experiments do not belong in the native regression lane",
    );
  return {
    ...run.manifest.inventory,
    systems: run.manifest.inventory.systems.map((s) =>
      s.id === "en-reve" ? { ...s, assets: run.manifest.variant.assets } : s,
    ),
  };
}
export async function promote(args) {
  if (
    !args.run ||
    !args.name ||
    !args.reason ||
    !/^[a-zA-Z0-9_-]+$/.test(args.name)
  )
    throw new Error(
      "Promotion requires --run, simple --name, and a substantive --reason",
    );
  const run = await readRun(args.run),
    summary = await report(args.run);
  if (!summary.complete || summary.failures.length)
    throw new Error("Cannot promote an incomplete or failed run");
  if (!["load", "interactions"].includes(run.manifest.options.suite))
    throw new Error(
      "Promote a native load or interaction baseline; other suites remain supporting evidence",
    );
  if (
    run.manifest.variant &&
    run.manifest.variant.cohort !== "current-library-native"
  )
    throw new Error(
      "Consumer variants require a separate lane, not the native anchor",
    );
  if (summary.groups.some((g) => g.total < 30))
    throw new Error("Timing baselines require at least 30 samples per group");
  const dir = resolve(root, "baselines", args.name);
  await mkdir(dir, { recursive: true });
  const baseline = {
    schema: 1,
    name: args.name,
    createdAt: new Date().toISOString(),
    reason: args.reason,
    sourceRun: run.manifest.id,
    harnessSha256: run.manifest.harnessSha256,
    host: run.manifest.host,
    timingBudgets,
    sizes: totals(measuredInventory(run)),
    runSummarySha256: sha(json(summary)),
    qualification:
      "Exploratory workstation baseline; timing gates require same host/browser/protocol and independent confirmation.",
  };
  await writeFile(resolve(dir, "baseline.json"), json(baseline), {
    flag: "wx",
  });
  for (const file of [
    "manifest.json",
    "samples.jsonl",
    "summary.json",
    "report.md",
    "collector.js",
    "harness",
  ])
    await cp(resolve(run.directory, file), resolve(dir, file), {
      recursive: true,
    });
  console.log(`Promoted ${args.name}: ${args.reason}`);
}
export function sizeCheck(
  current,
  reference,
  { absolute = 1024, relative = 0.02 } = {},
) {
  const changes = [];
  for (const [system, sizes] of Object.entries(current)) {
    if (!reference[system]) {
      changes.push({ system, status: "new-system", requiresReview: true });
      continue;
    }
    for (const encoding of ["raw", "gzip", "brotli"]) {
      const delta = sizes[encoding] - reference[system][encoding],
        budget = Math.max(absolute, reference[system][encoding] * relative);
      changes.push({
        system,
        encoding,
        current: sizes[encoding],
        reference: reference[system][encoding],
        delta,
        budget,
        status: delta > budget ? "regression" : "pass",
      });
    }
  }
  for (const system of Object.keys(reference))
    if (!current[system]) changes.push({ system, status: "missing-system" });
  return changes;
}
export async function check(args) {
  if (args.output !== undefined && (typeof args.output !== "string" || !args.output))
    throw new Error("Regression --output must be a nonempty file path");
  if (!args.baseline)
    throw new Error(
      "Select an explicit --baseline path; baselines never advance automatically",
    );
  const baselinePath = resolve(root, args.baseline),
    baseline = JSON.parse(await readFile(baselinePath));
  const current = args.run ? await readRun(args.run) : null;
  const inventory = current
    ? measuredInventory(current)
    : JSON.parse(
        await readFile(
          resolve(root, args.inventory || ".cache/inventory.json"),
        ),
      );
  const result = {
    checkedAt: new Date().toISOString(),
    baseline: baseline.name,
    sizes: sizeCheck(totals(inventory), baseline.sizes),
    timing: [],
  };
  if (current) {
    const prior = await readRun(resolve(baselinePath, ".."));
    const compatible = compatibleTimingRuns(current, prior);
    if (!compatible)
      result.timing.push({
        status: "incomparable",
        reason:
          "Protocol, host, cohort or profile changed; run an overlap study and deliberately establish a new baseline.",
      });
    else {
      const summary = await report(args.run);
      if (!summary.complete || summary.failures.length)
        result.timing.push({
          status: "qualification-failed",
          failures: summary.failures.length,
          complete: summary.complete,
        });
      for (const group of summary.groups) {
        const matches = (s) =>
          s.system === group.system &&
          s.profile === group.profile &&
          s.cache === group.cache &&
          s.status === "ok";
        const now = current.samples.filter(matches),
          before = prior.samples.filter(matches);
        if (
          now.length < 30 ||
          before.length < 30 ||
          now[0]?.browser !== before[0]?.browser
        ) {
          result.timing.push({
            system: group.system,
            profile: group.profile,
            cache: group.cache,
            status: "insufficient-or-browser-changed",
          });
          continue;
        }
        for (const [metric, budget] of Object.entries(timingBudgets)) {
          const comparison = independentDifference(
            now.map((s) => s.metrics[metric]),
            before.map((s) => s.metrics[metric]),
          );
          const baselineValues = before
              .map((s) => s.metrics[metric])
              .filter(Number.isFinite)
              .sort((a, b) => a - b),
            median = describe(baselineValues).median,
            limit = Math.max(budget.absolute, median * budget.relative);
          result.timing.push({
            system: group.system,
            profile: group.profile,
            cache: group.cache,
            metric,
            ...comparison,
            limit,
            status: comparison.ci95
              ? comparison.ci95[0] > limit
                ? "needs-confirmation"
                : "pass"
              : "unavailable",
          });
        }
        // Session INP can stay unchanged while a different action regresses.
        // Compare each successful semantic result and subsequent frame opportunity too.
        for (const action of Object.keys(group.actions)) {
          for (const metric of ["semanticMs", "frameOpportunityMs"]) {
            const values = (samples) =>
              samples.map(
                (s) =>
                  s.metrics.actions?.find((a) => a.name === action)?.[metric],
              );
            const referenceValues = values(before),
              currentValues = values(now);
            const reference = describe(referenceValues),
              candidate = describe(currentValues);
            const comparison = independentDifference(
              currentValues,
              referenceValues,
            );
            const limit = Math.max(16, (reference.median || 0) * 0.1);
            result.timing.push({
              system: group.system,
              profile: group.profile,
              cache: group.cache,
              action,
              metric,
              ...comparison,
              limit,
              status:
                Math.min(reference.n, candidate.n) < 30
                  ? "insufficient-or-browser-changed"
                  : comparison.ci95?.[0] > limit
                    ? "needs-confirmation"
                    : "pass",
            });
          }
        }
      }
    }
  }
  const output = resolve(root, args.output ?? "reports/regression-check.json");
  if (args.output) await mkdir(dirname(output), { recursive: true });
  await writeFile(output, json(result), args.output ? { flag: "wx" } : undefined);
  console.log(json(result));
  if (
    result.sizes.some((x) =>
      ["regression", "missing-system", "new-system"].includes(x.status),
    ) ||
    result.timing.some((x) =>
      [
        "needs-confirmation",
        "qualification-failed",
        "incomparable",
        "insufficient-or-browser-changed",
      ].includes(x.status),
    )
  )
    process.exitCode = 1;
  return result;
}
