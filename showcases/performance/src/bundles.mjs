import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { resolve, posix, dirname } from "node:path";
import { TraceMap, decodedMappings } from "@jridgewell/trace-mapping";
import { root, json, selectSystems } from "./config.mjs";
export function packageOf(source) {
  if (!source.includes("node_modules/")) return "application/fixture";
  const parts = source.split("node_modules/").at(-1).split("/");
  return parts[0].startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}
export async function bundleReport(args = {}) {
  const inventory = JSON.parse(
      await readFile(resolve(root, ".cache/inventory.json")),
    ),
    results = [];
  const selected = selectSystems(args.systems, inventory.systems);
  const output = resolve(root, args.output || "reports/bundles.json");
  const markdown = output.replace(/\.json$/, "") + ".md";
  if (args.output) {
    for (const path of [output, markdown]) {
      try { await access(path); }
      catch (error) { if (error.code === "ENOENT") continue; throw error; }
      throw new Error("Bundle evidence already exists: " + path);
    }
  }
  await mkdir(dirname(output), { recursive: true });
  for (const system of selected) {
    const dir = resolve(root, ".cache/snapshots", system.id),
      html = await readFile(resolve(dir, "index.html"), "utf8");
    const roots = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map(
      (m) => m[1].replace(/^\//, ""),
    );
    const initial = new Set();
    function visit(name) {
      if (initial.has(name)) return;
      initial.add(name);
      const asset = system.assets.find((a) => a.path === name);
      for (const imp of asset?.imports || [])
        if (!imp.dynamic && imp.specifier.startsWith("."))
          visit(
            posix.normalize(posix.join(posix.dirname(name), imp.specifier)),
          );
    }
    roots.forEach(visit);
    const totals = {},
      attribution = {},
      sources = new Map();
    for (const asset of system.assets.filter((a) => !a.diagnostic)) {
      const type = asset.path.endsWith(".js")
        ? "js"
        : asset.path.endsWith(".css")
          ? "css"
          : /\.woff2?$/.test(asset.path)
            ? "fonts"
            : "other";
      totals[type] ||= {
        files: 0,
        raw: 0,
        gzip: 0,
        brotli: 0,
        initialBrotli: 0,
      };
      totals[type].files++;
      for (const encoding of ["raw", "gzip", "brotli"])
        totals[type][encoding] += asset[encoding];
      if (initial.has(asset.path)) totals[type].initialBrotli += asset.brotli;
      if (!asset.path.endsWith(".js")) continue;
      try {
        const map = new TraceMap(
            JSON.parse(
              await readFile(resolve(dir, asset.path + ".map"), "utf8"),
            ),
          ),
          lines = (await readFile(resolve(dir, asset.path), "utf8")).split(
            "\n",
          );
        decodedMappings(map).forEach((segments, line) =>
          segments.forEach((segment, index) => {
            const source =
                segment.length >= 4 ? map.sources[segment[1]] : "unmapped",
              group = source === "unmapped" ? source : packageOf(source);
            attribution[group] =
              (attribution[group] || 0) +
              Math.max(
                0,
                (segments[index + 1]?.[0] ??
                  lines[line]?.length ??
                  segment[0]) - segment[0],
              );
            if (source !== "unmapped") {
              if (!sources.has(source)) sources.set(source, new Set());
              sources.get(source).add(asset.path);
            }
          }),
        );
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }
    results.push({
      id: system.id,
      fingerprint: system.fingerprint,
      totals,
      initialStaticFiles: [...initial],
      dynamicImportEdges: system.assets.flatMap((a) =>
        (a.imports || [])
          .filter((i) => i.dynamic)
          .map((i) => ({ from: a.path, ...i })),
      ),
      approximateGeneratedCharactersByPackage: Object.fromEntries(
        Object.entries(attribution).sort((a, b) => b[1] - a[1]),
      ),
      sourceModulesInMultipleChunks: [...sources]
        .filter(([, chunks]) => chunks.size > 1)
        .map(([source, chunks]) => ({ source, chunks: [...chunks] })),
    });
  }
  const result = {
    schema: 1,
    note: "Identical gzip9/Brotli11 offline sizes. Initial JS/CSS follows static HTML/import graph; fonts are listed separately because their actual use is browser-dependent. Remote fonts require network evidence. Source-map attribution estimates generated characters, not compressed marginal bytes; modules in multiple chunks require inspection before calling them duplicates.",
    systems: results,
  };
  await writeFile(output, json(result));
  const kb = (x) => (x / 1024).toFixed(1);
  const rows = results.map(
    (r) =>
      `| ${r.id} | ${r.totals.js?.files || 0} | ${kb(r.totals.js?.raw || 0)} | ${kb(r.totals.js?.gzip || 0)} | ${kb(r.totals.js?.initialBrotli || 0)} | ${kb(r.totals.js?.brotli || 0)} | ${kb(r.totals.css?.brotli || 0)} | ${kb(r.totals.fonts?.brotli || 0)} | ${r.dynamicImportEdges.length} |`,
  );
  await writeFile(
    markdown,
    "# Frozen production bundles\n\nSizes are KiB (1024 bytes). Initial JS follows static HTML/preload/import reachability; runtime dynamic requests are additional and retained in browser evidence. All-JS columns include every emitted chunk. Fonts listed here are local files only.\n\n| System | JS files | All JS raw | All JS gzip | Initial JS Brotli | All JS Brotli | CSS Brotli | Local fonts Brotli | Dynamic edges |\n| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |\n" +
      rows.join("\n") +
      "\n",
  );
  console.log(markdown);
  return result;
}
