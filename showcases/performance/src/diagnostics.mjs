import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { readRun } from "./report.mjs";
import { json, root } from "./config.mjs";
import { TraceMap, originalPositionFor } from "@jridgewell/trace-mapping";
export function unionLength(ranges) {
  let end = -Infinity,
    count = 0;
  for (const range of [...ranges].sort((a, b) => a.start - b.start)) {
    count += Math.max(0, range.end - Math.max(end, range.start));
    end = Math.max(end, range.end);
  }
  return count;
}
export function v8CoveredLength(functions) {
  const events = functions.flatMap((fn) =>
    fn.ranges
      .filter((r) => r.endOffset > r.startOffset)
      .flatMap((range) => [
        { at: range.startOffset, start: true, range },
        { at: range.endOffset, start: false, range },
      ]),
  );
  events.sort(
    (a, b) =>
      a.at - b.at ||
      Number(a.start) - Number(b.start) ||
      b.range.endOffset - a.range.endOffset,
  );
  const active = [];
  let previous = 0,
    used = 0;
  for (const event of events) {
    if (active.at(-1)?.count > 0) used += event.at - previous;
    previous = event.at;
    if (event.start) active.push(event.range);
    else active.splice(active.lastIndexOf(event.range), 1);
  }
  return used;
}
export function coverageSummary(entry) {
  const source = entry.source ?? entry.text,
    covered = entry.functions
      ? v8CoveredLength(entry.functions)
      : unionLength(entry.ranges || []);
  return {
    url: entry.url,
    totalCharacters: source?.length ?? null,
    coveredCharacters: source ? covered : null,
    uncoveredFraction: source?.length ? 1 - covered / source.length : null,
  };
}
async function mappedCPU(trace, sample, manifest) {
  const chunks = trace.traceEvents.filter(
      (e) => e.name === "ProfileChunk" && e.args?.data?.cpuProfile,
    ),
    nodes = new Map(),
    maps = new Map(),
    totals = new Map();
  const key = (event) => [event.pid, event.tid, event.id].join(":");
  for (const chunk of chunks) {
    if (!nodes.has(key(chunk))) nodes.set(key(chunk), new Map());
    for (const node of chunk.args.data.cpuProfile.nodes || [])
      nodes.get(key(chunk)).set(node.id, node);
  }
  for (const chunk of chunks) {
    const data = chunk.args.data;
    for (const [index, id] of (data.cpuProfile.samples || []).entries()) {
      const frame = nodes.get(key(chunk)).get(id)?.callFrame;
      if (!frame?.url?.startsWith("https://127.0.0.1:")) continue;
      const path = new URL(frame.url).pathname.slice(1);
      if (!maps.has(path)) {
        try {
          const dir = manifest.options.variant
            ? resolve(root, ".cache/variants", manifest.options.variant)
            : resolve(root, ".cache/snapshots", sample.system);
          maps.set(
            path,
            new TraceMap(
              JSON.parse(await readFile(resolve(dir, path + ".map"))),
            ),
          );
        } catch {
          maps.set(path, null);
        }
      }
      const map = maps.get(path),
        original = map
          ? originalPositionFor(map, {
              line: frame.lineNumber + 1,
              column: frame.columnNumber,
            })
          : null;
      const label = [
        original?.source || path,
        original?.line ?? frame.lineNumber + 1,
        original?.name || frame.functionName || "(anonymous)",
      ].join(":");
      if (!totals.has(label))
        totals.set(label, {
          source: original?.source || path,
          line: original?.line ?? frame.lineNumber + 1,
          function: original?.name || frame.functionName || "(anonymous)",
          samples: 0,
          sampledSelfMs: 0,
          mapped: Boolean(original?.source),
        });
      const total = totals.get(label);
      total.samples++;
      total.sampledSelfMs += (data.timeDeltas?.[index] || 0) / 1000;
    }
  }
  return [...totals.values()]
    .sort((a, b) => b.sampledSelfMs - a.sampledSelfMs)
    .slice(0, 80);
}
export async function diagnosticReport(id) {
  const { samples, directory, manifest } = await readRun(id),
    result = [];
  for (const sample of samples.filter((s) => s.diagnostics)) {
    const coverage = JSON.parse(
        await readFile(resolve(directory, sample.diagnostics.coverage)),
      ),
      trace = JSON.parse(
        await readFile(resolve(directory, sample.diagnostics.trace)),
      );
    const navigation = trace.traceEvents.find(
      (e) =>
        e.name === "navigationStart" &&
        e.args?.data?.documentLoaderURL === sample.collector?.navigation?.name,
    );
    const durations = {},
      startupDurations = {};
    for (const event of trace.traceEvents)
      if (
        event.ph === "X" &&
        navigation &&
        event.pid === navigation.pid &&
        event.tid === navigation.tid &&
        [
          "EvaluateScript",
          "FunctionCall",
          "Layout",
          "UpdateLayoutTree",
          "Paint",
          "ParseHTML",
          "v8.compile",
          "V8.CompileCode",
          "RunTask",
        ].includes(event.name)
      ) {
        durations[event.name] ||= { count: 0, totalMs: 0, maximumMs: 0 };
        const bucket = durations[event.name];
        bucket.count++;
        bucket.totalMs += (event.dur || 0) / 1000;
        bucket.maximumMs = Math.max(bucket.maximumMs, (event.dur || 0) / 1000);
        const startupEnd = navigation.ts + (sample.metrics?.lcp || 0) * 1000;
        const clipped =
          Math.max(
            0,
            Math.min(event.ts + (event.dur || 0), startupEnd) -
              Math.max(event.ts, navigation.ts),
          ) / 1000;
        if (clipped)
          startupDurations[event.name] =
            (startupDurations[event.name] || 0) + clipped;
      }
    result.push({
      system: sample.system,
      profile: sample.profile,
      sampleId: sample.id,
      status: sample.status,
      trace: sample.diagnostics.trace,
      durations,
      startupDurations,
      durationScope:
        "Renderer main thread only. Startup values are clipped to navigation through this diagnostic session’s LCP. Whole-journey categories may overlap; never sum them as independent work.",
      topSampledFunctions: await mappedCPU(trace, sample, manifest),
      coverage: Object.fromEntries(
        ["js", "css"].map((type) => [
          type,
          coverage[type].map(coverageSummary),
        ]),
      ),
      dom: sample.dom,
      connectedDOM: sample.connectedDOM,
      browserMetrics: sample.browserMetrics,
      lcpAttribution: sample.collector?.vitals.LCP?.attribution,
      inpAttribution: sample.collector?.vitals.INP?.attribution,
    });
  }
  await writeFile(
    resolve(directory, "diagnostics-summary.json"),
    json({
      note: "Diagnostic reruns only. Trace categories can overlap; do not add category totals. Coverage means unexercised in this journey, not removable. Native source maps live in the frozen snapshots.",
      samples: result,
    }),
  );
  console.log(resolve(directory, "diagnostics-summary.json"));
}
