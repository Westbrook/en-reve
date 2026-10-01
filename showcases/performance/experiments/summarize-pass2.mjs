import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { resolve } from "node:path";
import { root, registry, json, sha } from "../src/config.mjs";
import { blockingExcess } from "./pass2-metrics.mjs";
import { metrics, describe, pairedDifference } from "../src/analysis.mjs";

const names = {
  "en-reve": "En Reve",
  "radix-react": "Radix React",
  "fluent-react": "Fluent React",
  "spectrum-react": "Spectrum React S2",
  "astryx-react": "Astryx React",
  "shadcn-react": "shadcn React",
  "fluent-web-components": "Fluent Web Components",
  "spectrum-web-components": "Spectrum Web Components",
};
const ids = [
  "en-reve",
  ...registry.map((s) => s.id).filter((id) => id !== "en-reve"),
];
const suites = {
  load: "pass2-load-matrix-v1",
  startup: "pass2-startup-v3",
  interactions: "pass2-interactions-v1",
  lighthouse: "pass2-lighthouse-v1",
  memory: "pass2-memory-50-v1",
};
const campaigns = {};
for (const [suite, id] of Object.entries(suites)) {
  try {
    const directory = resolve(root, "runs", id);
    const manifest = JSON.parse(
      await readFile(resolve(directory, "manifest.json")),
    );
    let raw = "";
    try {
      raw = await readFile(resolve(directory, "samples.jsonl"), "utf8");
    } catch {}
    const samples = raw
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((l) => {
        const s = JSON.parse(l);
        if (s.collector) s.metrics = metrics(s);
        return s;
      });
    campaigns[suite] = {
      id,
      manifest,
      samples,
      completed: samples.length === manifest.jobs.length,
      rawHash: sha(raw),
    };
  } catch {
    campaigns[suite] = { id, manifest: null, samples: [], completed: false };
  }
}
const tables = [];
const sections = [];
const distributions = [];
const num = (
  label,
  key,
  { digits = 1, scale = 1, stat = "median", get } = {},
) => ({ label, key, digits, scale, stat, get });
const fmt = (v, digits = 1) =>
  Number.isFinite(v)
    ? v.toLocaleString("en-US", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })
    : "—";
function table(title, headers, rows, note, source) {
  const id = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-$/, "");
  tables.push({ id, title, headers, rows, note, source });
  return `### ${title}\n\n${note}\n\n| ${headers.join(" | ")} |\n| ${headers.map((_, i) => (i ? "---:" : "---")).join(" | ")} |\n${rows.map((row) => "| " + row.join(" | ") + " |").join("\n")}\n`;
}
function subset(suite, system, profile = "mobile", cache = "cold") {
  return campaigns[suite].samples.filter(
    (s) => s.system === system && s.profile === profile && s.cache === cache,
  );
}
function metricTable(title, suite, profile, cache, columns, note) {
  const rows = ids.map((id) => {
    const all = subset(suite, id, profile, cache),
      ok = all.filter((s) => s.status === "ok");
    distributions.push({
      table: title,
      system: id,
      successful: ok.length,
      failed: all.length - ok.length,
      metrics: Object.fromEntries(
        columns.map((c) => [
          c.key,
          describe(ok.map((s) => (c.get ? c.get(s) : s.metrics?.[c.key]))),
        ]),
      ),
    });
    return [
      names[id],
      String(ok.length),
      String(all.length - ok.length),
      ...columns.map((c) =>
        fmt(
          describe(ok.map((s) => (c.get ? c.get(s) : s.metrics?.[c.key])))[
            c.stat
          ] / c.scale,
          c.digits,
        ),
      ),
    ];
  });
  // Null must remain unavailable; division must not coerce it to numeric zero.
  for (let i = 0; i < ids.length; i++)
    for (let j = 0; j < columns.length; j++) {
      const c = columns[j];
      const v = describe(
        subset(suite, ids[i], profile, cache)
          .filter((s) => s.status === "ok")
          .map((s) => (c.get ? c.get(s) : s.metrics?.[c.key])),
      )[c.stat];
      rows[i][j + 3] = v === null ? "—" : fmt(v / c.scale, c.digits);
    }
  return table(
    title,
    [
      "Implementation",
      "Successful n",
      "Failed n",
      ...columns.map((c) => c.label),
    ],
    rows,
    `${note} Cohort: ${campaigns[suite].id}; ${profile}/${cache}. Values are per-system sample medians unless labeled p75. ${campaigns[suite].completed ? "Campaign complete." : "Collection in progress; counts will increase."}`,
    campaigns[suite].id,
  );
}
const evidence = {
  generatedAt: new Date().toISOString(),
  status: Object.values(campaigns).every((c) => c.completed)
    ? "complete"
    : "collecting",
  campaigns: Object.fromEntries(
    Object.entries(campaigns).map(([key, c]) => [
      key,
      {
        id: c.id,
        expected: c.manifest?.jobs.length ?? null,
        observed: c.samples.length,
        successful: c.samples.filter((s) => s.status === "ok").length,
        failed: c.samples.filter((s) => s.status !== "ok").length,
        completed: c.completed,
        rawHash: c.rawHash ?? null,
        harnessSha256: c.manifest?.harnessSha256 ?? null,
        host: c.manifest?.host ?? null,
      },
    ]),
  ),
  tables,
};
sections.push(
  `## Second pass measurements\n\nThis expands the historical comparison below. Every table can be sorted by its measurement columns in the HTML reader. **KiB = 1,024 bytes; MiB = 1,048,576 bytes.** A dash means unavailable or no successful measurement, never zero. Tables show successful and failed samples separately. Missing values stay last in either sort direction. These are exploratory workstation measurements of the frozen CSR fixtures, not release gates or a universal ranking.\n\n[Second-pass machine-readable tables and cohort receipts](../showcases/performance/reports/pass2-tables.json). [Execution receipt](../showcases/performance/reports/pass2-execution.json). [Retained raw evidence receipt](../showcases/performance/reports/pass2-evidence/receipt.json).\n\nRead loading and startup usability first, then transfer and main-thread work to identify a likely cost. Use interaction tables to check whether an optimization merely moves that cost to the first click. Memory and diagnostics support hypotheses; they do not prove leaks or causality. Historical first-pass evidence is kept separately below.\n`,
);
sections.push(
  table(
    "Campaign coverage",
    [
      "Campaign",
      "Planned samples",
      "Recorded samples",
      "Successful samples",
      "Failed samples",
    ],
    Object.entries(campaigns).map(([key, c]) => [
      key,
      String(
        c.manifest?.jobs.length ??
          {
            load: 320,
            startup: 160,
            interactions: 160,
            lighthouse: 40,
            memory: 8,
          }[key],
      ),
      String(c.samples.length),
      String(c.samples.filter((s) => s.status === "ok").length),
      String(c.samples.filter((s) => s.status !== "ok").length),
    ]),
    "The panel uses eight implementations. Load: ten blocks across four profile/cache cells. Startup and interactions: ten blocks per profile. Lighthouse: five mobile audits each. Memory: one desktop session each, at 0, 10 and 50 repeated journeys. No failed sample is retried or replaced.",
    "pass2-execution",
  ),
);
const failureRows = [];
for (const [suite, c] of Object.entries(campaigns))
  for (const id of ids)
    for (const profile of ["mobile", "desktop"]) {
      const failed = c.samples.filter(
        (s) => s.system === id && s.profile === profile && s.status !== "ok",
      );
      if (!failed.length) continue;
      const stages = [
        ...new Set(
          failed.map(
            (s) => s.collector?.actions?.at(-1)?.name ?? "See raw error",
          ),
        ),
      ];
      const errors = [
        ...new Set(
          failed
            .flatMap((s) => s.errors ?? [])
            .map(
              (e) => (e.message ?? e.type ?? "Unknown error").split("\n")[0],
            ),
        ),
      ];
      failureRows.push([
        suite,
        names[id],
        profile,
        String(failed.length),
        stages.join(", "),
        errors.join("; "),
      ]);
    }
if (failureRows.length)
  sections.push(
    table(
      "Failed journeys retained",
      [
        "Campaign",
        "Implementation",
        "Profile",
        "Failed n",
        "Last observed action",
        "Recorded failure",
      ],
      failureRows,
      "Failed journeys are retained in the raw evidence and excluded from successful timing distributions. The last observed action is a diagnostic clue, not a proven root cause or a library-wide performance judgment. Memory checkpoints reached before a later failure remain explicitly labeled in their own tables.",
      "pass2 raw samples",
    ),
  );
sections.push(
  `## Loading and visual stability\n\nThe load suite sends no input, so LCP collection is not cut short by a test click. The observation window ends after load plus 1.5 seconds and card readiness; CLS is bounded to this visit. TTFB is a loopback timestamp and does not establish deployed backend performance.\n`,
);
for (const profile of ["mobile", "desktop"])
  for (const cache of ["cold", "warm"])
    sections.push(
      metricTable(
        `${profile} ${cache} loading`,
        "load",
        profile,
        cache,
        [
          num("FCP ms", "fcp"),
          num("LCP ms", "lcp"),
          num("LCP p75 ms", "lcp", { stat: "p75" }),
          num("CLS", "cls", { digits: 6 }),
          num("CLS p75", "cls", { stat: "p75", digits: 6 }),
          num("CLS max", "cls", { stat: "max", digits: 6 }),
          num("TTFB ms", "ttfb"),
          num("Cards frame opportunity ms", "cardsFrameOpportunity"),
          num("Last webfont response ms", "lastFontResponse", {
            get: (s) => {
              const urls = new Set(
                (s.networkObservation ?? s.network ?? [])
                  .filter((r) => r.type === "Font")
                  .map((r) => r.url),
              );
              const times = (s.collector?.entries?.resource ?? [])
                .filter((r) => urls.has(r.name) && r.responseEnd > 0)
                .map((r) => r.responseEnd);
              return times.length ? Math.max(...times) : null;
            },
          }),
        ],
        "FCP: first contentful paint. LCP: largest contentful paint. Card/frame and last-webfont-response milestones are navigation-relative; neither proves every control is usable. A dash in the webfont column means no measurable downloaded-font response. The older load-time document.fonts.ready promise can resolve before dynamically registered fonts start loading; it is not used as final font readiness here. Warm visits reuse a primed browser context.",
      ),
    );
for (const profile of ["mobile", "desktop"])
  sections.push(
    metricTable(
      `${profile} cold LCP attribution`,
      "load",
      profile,
      "cold",
      [
        num("TTFB portion ms", "lcpTTFB", {
          get: (s) => s.collector?.vitals?.LCP?.attribution?.timeToFirstByte,
        }),
        num("Resource delay ms", "lcpDelay", {
          get: (s) => s.collector?.vitals?.LCP?.attribution?.resourceLoadDelay,
        }),
        num("Resource duration ms", "lcpResource", {
          get: (s) =>
            s.collector?.vitals?.LCP?.attribution?.resourceLoadDuration,
        }),
        num("Element render delay ms", "lcpRender", {
          get: (s) => s.collector?.vitals?.LCP?.attribution?.elementRenderDelay,
        }),
      ],
      "LCP attribution from web-vitals. A text LCP can have zero image-resource phases; its render-delay portion includes discovery, JS/CSS/fonts and rendering, not just CPU rendering time. Independent medians are not guaranteed to sum to the median LCP.",
    ),
  );
sections.push(
  `## Startup usability\n\nA separate cold-navigation suite sends one trusted mouse click at the first Landscape control geometry observed by an injected animation-frame probe. It does not wait for the load event or the usual 1.5-second settling interval. It refreshes coordinates immediately before its one click, verifies the actual composed-path target, and verifies the canvas result and a subsequent two-rAF frame opportunity. Discovery and dispatch overhead are exposed: this is an observed successful probe, **not the mathematically earliest usable instant, legacy TTI, or field FID**. Early input ends LCP eligibility, so these samples do not enter load comparisons. The probe records its cumulative synchronous discovery elapsed time, including any forced style/layout; this is not a thread-CPU measurement. The [superseded 160-sample v1 pilot](../showcases/performance/reports/pass2-startup-superseded.json) used host-side visibility polling with up to 500 ms backoff and is excluded from these comparisons. A subsequent v2 qualification had two stale-coordinate failures in Fluent WC; those are retained as invalid probe attempts. The current v3 probe passed all sixteen qualification cases before its timing cohort. [Discovery calibration](../showcases/performance/reports/startup-discovery-calibration-pass2.json) verifies the replacement. [Probe calibration](../showcases/performance/reports/startup-calibration-pass2.json) confirms that a click lost before handler attachment fails rather than being retried.\n`,
);
for (const profile of ["mobile", "desktop"])
  sections.push(
    metricTable(
      `${profile} startup click`,
      "startup",
      profile,
      "cold",
      [
        num("Control observed ms", "startupVisible"),
        num("Click from navigation ms", "startupInput"),
        num("Result from navigation ms", "startupResult"),
        num("Result p75 ms", "startupResult", { stat: "p75" }),
        num("Dispatch overhead ms", "startupDispatchLag"),
        num("Discovery probe ms", "startupProbeDuration", {
          get: (s) => s.startup?.probeDurationMs,
        }),
        num("Click to result ms", "startupSemantic"),
        num("Click to frame ms", "startupFeedback"),
        num("First input delay ms", "firstInputDelay"),
      ],
      "Navigation-relative timestamps include automation overhead; click-to-result/frame measures the response to that single input.",
    ),
  );
sections.push(
  `## Production files and chunking\n\nDeterministic emitted asset sizes for the complete fixture, including application and framework/runtime code, before and after transport compression. These are not library-only marginal costs. Raw JS means production/minified bytes before gzip or Brotli, not browser compiled-code memory. All emitted chunks are counted even if not initially downloaded. CSS-in-JS remains in JS. Local-font columns exclude remote fonts, which are counted in browser transfer below. HTML is the actual CSR shell; **no SSR/hydration cohort has been built or measured in this pass**.\n`,
);
const bundle = JSON.parse(
  await readFile(resolve(root, "reports/bundles.json")),
);
const inventory = JSON.parse(
  await readFile(resolve(root, ".cache/inventory.json")),
);
sections.push(
  table(
    "Production payload sizes",
    [
      "Implementation",
      "JS raw KiB",
      "JS gzip KiB",
      "JS Brotli KiB",
      "Initial JS Brotli KiB",
      "CSS raw KiB",
      "CSS Brotli KiB",
      "Local fonts Brotli KiB",
      "HTML raw KiB",
      "HTML Brotli KiB",
    ],
    ids.map((id) => {
      const b = bundle.systems.find((b) => b.id === id),
        html = inventory.systems
          .find((s) => s.id === id)
          .assets.find((a) => a.path === "index.html");
      return [
        names[id],
        ...["raw", "gzip", "brotli", "initialBrotli"].map((key) =>
          fmt(b.totals.js[key] / 1024),
        ),
        fmt((b.totals.css?.raw ?? 0) / 1024),
        fmt((b.totals.css?.brotli ?? 0) / 1024),
        fmt((b.totals.fonts?.brotli ?? 0) / 1024),
        fmt(html.raw / 1024, 3),
        fmt(html.brotli / 1024, 3),
      ];
    }),
    "Frozen production assets; one deterministic build per implementation. Source maps and diagnostic metadata are excluded.",
    "bundles.json",
  ),
);
sections.push(
  table(
    "Chunk structure",
    [
      "Implementation",
      "JS files",
      "CSS files",
      "Static initial assets",
      "Dynamic import edges",
      "Sources in multiple chunks",
    ],
    ids.map((id) => {
      const b = bundle.systems.find((b) => b.id === id);
      return [
        names[id],
        String(b.totals.js.files),
        String(b.totals.css?.files ?? 0),
        String(b.initialStaticFiles.length),
        String(b.dynamicImportEdges.length),
        String(b.sourceModulesInMultipleChunks.length),
      ];
    }),
    "These are the emitted graphs of the current native fixtures, not a ceiling on each library’s possible splitting. A dynamic edge is a capability to load later, not proof of initial-byte savings. Sources in multiple chunks need inspection before treating them as removable duplication.",
    "bundles.json",
  ),
);
sections.push(
  `## Whole-page delivery\n\n**Browser-reported response transfer includes the HTML document, scripts, styles, fonts and other responses.** It uses completed CDP response byte counts captured before leaving the page; lifecycle beacons and destination pages are excluded. These are response bytes, not packet captures of TCP/TLS traffic. Resource Timing totals are retained separately because its header accounting and cache/privacy rules differ. Cache reuse counts timing entries with zero transfer and a positive encoded body size, including memory-cache reuse not represented by the CDP disk-cache flag. A missing completion makes the total unavailable; missing resources are not free. Load tables cover the bounded load visit, not future clicks. Separate cumulative interaction-journey tables include requests made by the tested actions; offline all-JS inventory also includes chunks never requested in either journey.\n`,
);
for (const profile of ["mobile", "desktop"])
  for (const cache of ["cold", "warm"])
    sections.push(
      metricTable(
        `${profile} ${cache} response transfer`,
        "load",
        profile,
        cache,
        [
          num("Total response KiB", "responseTransferBytes", { scale: 1024 }),
          num("HTML KiB", "htmlTransferBytes", { scale: 1024, digits: 3 }),
          num("JS KiB", "jsTransferBytes", { scale: 1024 }),
          num("CSS KiB", "cssTransferBytes", { scale: 1024 }),
          num("Fonts KiB", "fontTransferBytes", { scale: 1024 }),
          num("Other KiB", "otherTransferBytes", { scale: 1024 }),
          num("HTTP responses", "responseCount", {
            digits: 0,
            get: (s) =>
              (s.networkObservation ?? s.network ?? []).filter(
                (r) =>
                  /^https?:/.test(r.url) &&
                  !new URL(r.url).pathname.startsWith("/__perf/"),
              ).length,
          }),
          num("Cache reuse entries", "cacheReuse", {
            digits: 0,
            get: (s) =>
              (s.collector?.entries?.resource ?? []).filter(
                (r) => r.transferSize === 0 && r.encodedBodySize > 0,
              ).length,
          }),
          num("Incomplete responses", "incompleteResponses", { digits: 0 }),
        ],
        "Response categories are measured in each sample. Independently calculated medians need not sum exactly to the median total.",
      ),
    );
for (const profile of ["mobile", "desktop"])
  sections.push(
    metricTable(
      `${profile} cumulative interaction transfer`,
      "interactions",
      profile,
      "cold",
      [
        num("Total response KiB", "responseTransferBytes", { scale: 1024 }),
        num("HTML KiB", "htmlTransferBytes", { scale: 1024, digits: 3 }),
        num("JS KiB", "jsTransferBytes", { scale: 1024 }),
        num("CSS KiB", "cssTransferBytes", { scale: 1024 }),
        num("Fonts KiB", "fontTransferBytes", { scale: 1024 }),
        num("Incomplete responses", "incompleteResponses", { digits: 0 }),
      ],
      "Fresh page plus the complete successful scripted interaction journey. This is a cumulative total from a different cohort, not the incremental cost of one action or the difference of two medians.",
    ),
  );
sections.push(
  `## Main-thread work and load blocking\n\nCDP script/style/layout/task counters are captured at the bounded load endpoint. The [counter-scope calibration](../showcases/performance/reports/cdp-scope-calibration-pass2.json) checks that prior-document work is excluded in this pinned browser/navigation pattern. They are not a decomposition of LCP and can overlap. Long-task and long-animation-frame totals sum whole durations, **not TBT**, and are not additive to one another. The two blocking-excess columns count only each long task’s portion beyond 50 ms, clipped before FCP or from FCP to the bounded observation endpoint. They are named separately from Lighthouse TBT, whose endpoint differs. Lighthouse TBT is reported in its separate cohort below.\n`,
);
for (const profile of ["mobile", "desktop"])
  for (const cache of ["cold", "warm"])
    sections.push(
      metricTable(
        `${profile} ${cache} main-thread work`,
        "load",
        profile,
        cache,
        [
          num("Script ms", "scriptMs"),
          num("Style ms", "styleMs"),
          num("Layout ms", "layoutMs"),
          num("Task ms", "taskMs"),
          num("Layout passes", "layoutPasses", {
            digits: 0,
            get: (s) => s.browserMetrics?.LayoutCount,
          }),
          num("Style recalcs", "styleRecalcs", {
            digits: 0,
            get: (s) => s.browserMetrics?.RecalcStyleCount,
          }),
          num("Long tasks ms", "longTaskMs"),
          num("Pre-FCP blocking excess ms", "preFCPBlocking", {
            get: (s) =>
              blockingExcess(s.collector?.entries?.longtask, 0, s.metrics?.fcp),
          }),
          num("Post-FCP blocking excess ms", "postFCPBlocking", {
            get: (s) =>
              blockingExcess(
                s.collector?.entries?.longtask,
                s.metrics?.fcp,
                s.collector?.timestamp,
              ),
          }),
          num("Long animation frames ms", "loafMs"),
        ],
        "Use traces to test which costs actually lie on the critical path before assigning implementation work.",
      ),
    );
sections.push(
  metricTable(
    "Repeated mobile Lighthouse audits",
    "lighthouse",
    "mobile",
    "cold",
    [
      num("FCP ms", "fcp"),
      num("LCP ms", "lcp"),
      num("LCP p75 ms", "lcp", { stat: "p75" }),
      num("LCP max ms", "lcp", { stat: "max" }),
      num("TBT ms", "tbt"),
      num("TBT p75 ms", "tbt", { stat: "p75" }),
      num("TBT max ms", "tbt", { stat: "max" }),
      num("Speed Index ms", "speedIndex"),
      num("CLS", "cls", { digits: 6 }),
    ],
    "Five fresh full-Chromium audits per implementation, separate from the headless-shell load suite. Only Lighthouse applies DevTools throttling. TBT counts the blocking portion of long tasks after FCP; zero TBT does not mean no startup work.",
  ),
);
sections.push(
  `## Interaction responsiveness\n\nThese journeys begin after load plus settling. They test first/repeated canvas changes, asset edits, dialogs, review submission and command opening. These seven reported actions do not cover every component; calendar/picker, typing and keyboard-specific performance require additional scenarios before optimizing those paths. Scripted-session INP is not field INP. First-input delay comes from the browser first-input entry for a scripted trusted input; it excludes handler and rendering time and is not a field FID sample. A failed journey contributes to failure counts and not to successful timing distributions; an empty timing cell does not mean unsupported or zero. Event Timing has a 16 ms reporting threshold and quantization. Semantic completion is observed DOM state; frame opportunity is two rAFs, not a compositor presentation timestamp.\n`,
);
for (const profile of ["mobile", "desktop"])
  sections.push(
    metricTable(
      `${profile} interaction summary`,
      "interactions",
      profile,
      "cold",
      [
        num("Scripted INP ms", "scriptedINP"),
        num("Scripted INP p75 ms", "scriptedINP", { stat: "p75" }),
        num("First input delay ms", "firstInputDelay"),
        num("Journey CLS", "cls", { digits: 6 }),
        num("Max scroll rAF gap ms", "scrollGap", {
          get: (s) =>
            s.scroll?.intervals?.length
              ? Math.max(...s.scroll.intervals)
              : null,
        }),
      ],
      "rAF gaps are scheduling diagnostics; the refresh rate is not normalized into an invented dropped-frame percentage.",
    ),
  );
const actions = [
  ["canvas-landscape-first", "First canvas change"],
  ["canvas-landscape-warm", "Repeated canvas change"],
  ["asset-add-first", "First asset addition"],
  ["dialog-open-first", "First dialog opening"],
  ["dialog-open-warm", "Repeated dialog opening"],
  ["review-submit", "Review submission"],
  ["commands-first", "First command opening"],
];
for (const profile of ["mobile", "desktop"]) {
  const rows = [];
  for (const [action, label] of actions)
    for (const id of ids) {
      const all = subset("interactions", id, profile),
        passed = all.filter((s) => s.status === "ok"),
        values = passed.flatMap(
          (s) => s.metrics?.actions?.filter((a) => a.name === action) ?? [],
        ),
        event = values.filter((a) => Number.isFinite(a.eventTiming?.duration));
      rows.push([
        names[id],
        label,
        String(values.length),
        String(all.length - passed.length),
        fmt(describe(values.map((a) => a.semanticMs)).median),
        fmt(describe(values.map((a) => a.frameOpportunityMs)).median),
        fmt(describe(values.map((a) => a.frameOpportunityMs)).p75),
        String(event.length),
        fmt(describe(event.map((a) => a.eventTiming.inputDelay)).median),
        fmt(describe(event.map((a) => a.eventTiming.processing)).median),
        fmt(describe(event.map((a) => a.eventTiming.presentation)).median),
      ]);
    }
  sections.push(
    table(
      `${profile} action details`,
      [
        "Implementation",
        "Action",
        "Successful n",
        "Failed journeys",
        "Result ms",
        "Frame opportunity ms",
        "Frame p75 ms",
        "Event entries n",
        "Input delay ms",
        "Processing ms",
        "Presentation ms",
      ],
      rows,
      "Each row isolates one action. Sort Action to compare libraries within the same operation; compare the first and repeated operation to expose deferred work. Missing Event Timing entries remain unavailable; event-entry n shows their coverage.",
      campaigns.interactions.id,
    ),
  );
}
sections.push(
  `## Memory and lifecycle\n\nA full-Chromium cross-origin-isolated lane with timing observers disabled repeats the native journey to 50 cycles. Each cycle submits the same review and replaces its status text; it does not append review records. The earlier narrative was incorrect. [Frozen-source interpretation correction](../showcases/performance/reports/memory-interpretation-correction-pass2.json). Node or heap growth remains unattributed until application retention, browser input/undo state, automation retention and garbage collection are separated. One session per implementation is exploratory and cannot establish a leak or a memory ranking. API timeouts/errors remain explicit. JS heap and browser DOM counters have different scopes from API memory.\n`,
);
for (const cycles of [0, 10, 50]) {
  const rows = ids.map((id) => {
    const all = subset("memory", id, "desktop");
    const points = all.flatMap(
      (s) => s.memory?.filter((p) => p.cycles === cycles) ?? [],
    );
    const ok = points.filter((p) => p.api.status === "ok");
    return [
      names[id],
      String(points.length),
      String(ok.length),
      String(points.length - ok.length),
      fmt(
        describe(ok.map((p) => p.api.bytes)).median === null
          ? null
          : describe(ok.map((p) => p.api.bytes)).median / 1048576,
        2,
      ),
      fmt(
        describe(points.map((p) => p.chromiumJSHeapUsedSize)).median === null
          ? null
          : describe(points.map((p) => p.chromiumJSHeapUsedSize)).median /
              1048576,
        2,
      ),
      fmt(describe(points.map((p) => p.dom.nodes)).median, 0),
      fmt(describe(points.map((p) => p.dom.jsEventListeners)).median, 0),
      points.map((p) => p.api.status).join(", ") || "Not reached",
    ];
  });
  sections.push(
    table(
      `Memory after ${cycles} cycles`,
      [
        "Implementation",
        "Checkpoints n",
        "API success n",
        "API unavailable n",
        "API MiB",
        "JS heap MiB",
        "Browser DOM nodes",
        "Event listeners",
        "API status",
      ],
      rows,
      `Checkpoints retained even if a later journey fails. Zero cycles is after page load/settling. ${campaigns.memory.completed ? "Campaign complete." : "Collection in progress."}`,
      campaigns.memory.id,
    ),
  );
}
sections.push(
  table(
    "Memory change from 10 to 50 cycles",
    [
      "Implementation",
      "Paired API readings n",
      "API growth MiB",
      "JS heap growth MiB",
      "DOM node growth",
      "Listener growth",
    ],
    ids.map((id) => {
      const sample = subset("memory", id, "desktop")[0],
        a = sample?.memory?.find((p) => p.cycles === 10),
        b = sample?.memory?.find((p) => p.cycles === 50),
        ok = a?.api.status === "ok" && b?.api.status === "ok";
      return [
        names[id],
        String(ok ? 1 : 0),
        fmt(ok ? (b.api.bytes - a.api.bytes) / 1048576 : null, 2),
        fmt(
          a && b
            ? (b.chromiumJSHeapUsedSize - a.chromiumJSHeapUsedSize) / 1048576
            : null,
          2,
        ),
        fmt(a && b ? b.dom.nodes - a.dom.nodes : null, 0),
        fmt(a && b ? b.dom.jsEventListeners - a.dom.jsEventListeners : null, 0),
      ];
    }),
    "Paired checkpoint changes within the same session. These are 40 additional repeated journeys with replacement status, not 40 appended review records. Garbage collection, native input state and automation can affect the counters; investigate growth with controls and heap/retainer evidence before calling it a library leak.",
    campaigns.memory.id,
  ),
);
sections.push(
  "## Supporting diagnostics\n\nThese structural and trace measurements come from the retained first-pass diagnostic cohort. They help choose experiments; they are not new primary timing measurements.\n",
);
const diagnostic = (
  await readFile(
    resolve(root, "runs/diagnostic-desktop-v1/samples.jsonl"),
    "utf8",
  )
)
  .trim()
  .split("\n")
  .map((l) => JSON.parse(l));
sections.push(
  table(
    "Historical connected DOM diagnostics",
    [
      "Implementation",
      "Connected nodes",
      "Connected elements",
      "Open shadow roots",
      "Style elements",
      "Stylesheet adoptions",
      "Unique adopted sheets",
    ],
    ids.map((id) => {
      const sample = diagnostic.find(
        (s) => s.system === id && s.status === "ok",
      );
      const d = sample?.connectedDOM;
      return [
        names[id],
        ...[
          "connectedNodes",
          "connectedElements",
          "openShadowRoots",
          "styleElements",
          "stylesheetAdoptions",
          "uniqueAdoptedStylesheets",
        ].map((key) => fmt(d?.[key], 0)),
      ];
    }),
    "One desktop diagnostic journey per implementation from the first pass, not remeasured here. Includes accessible open shadow roots; closed roots are not inspected. More nodes can reflect richer features. Adoption counts do not equal separately allocated sheets.",
    "diagnostic-desktop-v1",
  ),
);
const diagSummary = JSON.parse(
  await readFile(
    resolve(root, "runs/diagnostic-desktop-v1/diagnostics-summary.json"),
  ),
);
sections.push(
  table(
    "Historical exercised code coverage",
    [
      "Implementation",
      "Loaded JS characters",
      "Exercised JS characters",
      "Unexercised JS percent",
      "External CSS characters",
      "Unexercised external CSS percent",
    ],
    ids.map((id) => {
      const d = diagSummary.samples.find((s) => s.system === id);
      const js = d.coverage.js.filter(
        (r) => /^https?:/.test(r.url) && !r.url.includes("/__perf/"),
      );
      const css = d.coverage.css.filter((r) => /^https?:/.test(r.url));
      const sum = (xs, key) => xs.reduce((n, r) => n + r[key], 0);
      const jt = sum(js, "totalCharacters"),
        jc = sum(js, "coveredCharacters"),
        ct = sum(css, "totalCharacters"),
        cc = sum(css, "coveredCharacters");
      return [
        names[id],
        fmt(jt, 0),
        fmt(jc, 0),
        fmt(jt ? (100 * (jt - jc)) / jt : null),
        fmt(ct || null, 0),
        fmt(ct ? (100 * (ct - cc)) / ct : null),
      ];
    }),
    "One first-pass diagnostic journey. Counts generated characters, not UTF-8 bytes; excludes the injected collector and non-HTTP scripts. External CSS coverage does not cover all adopted or CSS-in-JS styles. Unexercised code is not necessarily removable.",
    "diagnostic-desktop-v1",
  ),
);
sections.push(
  table(
    "Historical rendering trace through LCP",
    [
      "Implementation",
      "Main-thread RunTask ms",
      "HTML parse ms",
      "Layout tree update ms",
      "Layout ms",
      "Paint ms",
      "Script evaluation ms",
    ],
    ids.map((id) => {
      const d = diagSummary.samples.find(
        (s) => s.system === id,
      ).startupDurations;
      return [
        names[id],
        ...[
          "RunTask",
          "ParseHTML",
          "UpdateLayoutTree",
          "Layout",
          "Paint",
          "EvaluateScript",
        ].map((key) => fmt(d[key] ?? null)),
      ];
    }),
    "One first-pass desktop diagnostic trace each, clipped from navigation to that trace’s LCP. Nested categories overlap; do not sum them, compare them with the new primary run as one cohort, or infer paint-to-screen latency.",
    "diagnostic-desktop-v1",
  ),
);
const bfcache = (
  await readFile(
    resolve(root, "runs/bfcache-direct-cdp-v2/samples.jsonl"),
    "utf8",
  )
)
  .trim()
  .split("\n")
  .map((l) => JSON.parse(l));
sections.push(
  table(
    "Historical back-forward cache checks",
    [
      "Implementation",
      "Attempts n",
      "Restored n",
      "Interactive after return n",
    ],
    ids.map((id) => {
      const samples = bfcache.filter((s) => s.system === id);
      return [
        names[id],
        String(samples.length),
        String(
          samples.filter(
            (s) => s.bfcache?.sameDocument && s.bfcache?.pageshow?.persisted,
          ).length,
        ),
        String(samples.filter((s) => s.bfcache?.interactiveAfterReturn).length),
      ];
    }),
    "One first-pass direct-CDP desktop diagnostic per implementation. Counts verify a real same-document restoration and trusted post-return interaction; they are neither field hit rates nor measured restoration latency.",
    "bfcache-direct-cdp-v2",
  ),
);
const overhead = JSON.parse(
  await readFile(resolve(root, "reports/observer-overhead.json")),
);
sections.push(
  table(
    "Historical observer overhead calibration",
    [
      "Implementation",
      "Metric",
      "Paired blocks n",
      "Collector on minus off ms",
      "95% interval low ms",
      "95% interval high ms",
    ],
    overhead.effects.map((e) => [
      names[e.system],
      e.metric,
      String(e.n),
      fmt(e.difference),
      fmt(e.ci95?.[0]),
      fmt(e.ci95?.[1]),
    ]),
    "Five first-pass paired on/off blocks for En Reve and Fluent WC. A confidence interval spanning zero does not prove no measurement cost. Startup probe elapsed time is additionally reported in the new startup tables.",
    "observer-overhead-v1",
  ),
);
sections.push(
  `## Comparing gaps and choosing remediation\n\nPositive differences below mean En Reve took longer than that peer. Differences are calculated from matched blocks in the **new** cohort only. The 95% intervals are exploratory paired-block bootstrap intervals, with no multiple-comparison correction. These are signals to confirm, not automatic release failures. Feature/layout/font differences remain part of the native comparison.\n`,
);
const contrasts = [];
for (const [suite, key, title, profile, cache] of [
  ["load", "lcp", "Cold mobile load LCP", "mobile", "cold"],
  ["load", "lcp", "Warm mobile load LCP", "mobile", "warm"],
  ["load", "lcp", "Cold desktop load LCP", "desktop", "cold"],
  [
    "startup",
    "startupResult",
    "Navigation to startup result",
    "mobile",
    "cold",
  ],
  ["interactions", "scriptedINP", "Scripted interaction INP", "mobile", "cold"],
]) {
  const rows = ids
    .filter((id) => id !== "en-reve")
    .map((id) => {
      const en = subset(suite, "en-reve", profile, cache).filter(
          (s) => s.status === "ok",
        ),
        peer = subset(suite, id, profile, cache).filter(
          (s) => s.status === "ok",
        ),
        c = pairedDifference(
          en.map((s) => ({ block: s.block, value: s.metrics?.[key] })),
          peer.map((s) => ({ block: s.block, value: s.metrics?.[key] })),
        );
      contrasts.push({ suite, metric: key, profile, cache, against: id, ...c });
      return [
        names[id],
        String(c.n),
        fmt(c.difference),
        fmt(c.ci95?.[0]),
        fmt(c.ci95?.[1]),
      ];
    });
  sections.push(
    table(
      `${title} gaps against peers`,
      [
        "Peer",
        "Matched blocks n",
        "En Reve minus peer ms",
        "95% interval low ms",
        "95% interval high ms",
      ],
      rows,
      `${profile}/${cache}. Fewer than five successful matched blocks gives an unavailable contrast. Confidence intervals do not remove workstation noise or prove a cause.`,
      campaigns[suite].id,
    ),
  );
}
const actionContrasts = [];
const actionGapRows = [];
for (const [action, label] of actions)
  for (const peer of ["fluent-web-components", "radix-react"]) {
    const measured = (id) =>
      subset("interactions", id)
        .filter((s) => s.status === "ok")
        .map((s) => ({
          block: s.block,
          value: s.metrics?.actions?.find((a) => a.name === action)
            ?.frameOpportunityMs,
        }));
    const en = measured("en-reve"),
      other = measured(peer),
      gap = pairedDifference(en, other);
    actionContrasts.push({
      action,
      against: peer,
      profile: "mobile",
      metric: "frameOpportunityMs",
      ...gap,
    });
    actionGapRows.push([
      label,
      names[peer],
      String(gap.n),
      fmt(describe(en.map((s) => s.value)).median),
      fmt(describe(other.map((s) => s.value)).median),
      fmt(gap.difference),
      fmt(gap.ci95?.[0]),
      fmt(gap.ci95?.[1]),
    ]);
  }
sections.push(
  table(
    "Mobile action frame gaps against Fluent WC and Radix",
    [
      "Action",
      "Peer",
      "Matched blocks n",
      "En Reve frame ms",
      "Peer frame ms",
      "En Reve minus peer ms",
      "95% interval low ms",
      "95% interval high ms",
    ],
    actionGapRows,
    "Fixed comparators across all seven actions; differences use successful matched journeys. Positive values mean En Reve took longer. Exploratory unadjusted intervals and two-rAF opportunities do not establish compositor presentation timing. Inspect the complete action table for all other libraries.",
    campaigns.interactions.id,
  ),
);
evidence.actionContrasts = actionContrasts;
evidence.contrasts = contrasts;
evidence.distributions = distributions;
const med = (suite, id, key, profile = "mobile", cache = "cold") =>
  describe(
    subset(suite, id, profile, cache)
      .filter((s) => s.status === "ok")
      .map((s) => s.metrics?.[key]),
  ).median;
const coldGap = contrasts.find(
  (c) =>
    c.suite === "load" &&
    c.profile === "mobile" &&
    c.cache === "cold" &&
    c.against === "fluent-web-components",
);
const warmGap = contrasts.find(
  (c) =>
    c.suite === "load" &&
    c.profile === "mobile" &&
    c.cache === "warm" &&
    c.against === "fluent-web-components",
);
const enActions = actions
  .map(([name, label]) => ({
    name,
    label,
    frame: describe(
      subset("interactions", "en-reve")
        .filter((s) => s.status === "ok")
        .map(
          (s) =>
            s.metrics?.actions?.find((a) => a.name === name)
              ?.frameOpportunityMs,
        ),
    ),
  }))
  .filter((a) => a.frame.n)
  .sort((a, b) => b.frame.p75 - a.frame.p75);
const slowAction = enActions[0];
const leadingActionGap = actionContrasts
  .filter((c) => c.n >= 5 && c.ci95?.[0] > 0)
  .sort((a, b) => b.difference - a.difference)[0];
const enMemory = subset("memory", "en-reve", "desktop")[0];
const m10 = enMemory?.memory?.find((p) => p.cycles === 10),
  m50 = enMemory?.memory?.find((p) => p.cycles === 50);
const signals = {
  startup: `New mobile LCP gap against Fluent WC: cold ${fmt(coldGap?.difference)} ms, warm ${fmt(warmGap?.difference)} ms; ${coldGap?.n ?? 0}/${warmGap?.n ?? 0} matched blocks.`,
  interaction: leadingActionGap
    ? `${actions.find((a) => a[0] === leadingActionGap.action)?.[1]}: En Reve frame opportunity is ${fmt(leadingActionGap.difference)} ms slower than ${names[leadingActionGap.against]} (95% interval ${fmt(leadingActionGap.ci95[0])} to ${fmt(leadingActionGap.ci95[1])}; n=${leadingActionGap.n}). This post-analysis candidate needs independent confirmation.`
    : slowAction
      ? `Largest En Reve action frame p75: ${slowAction.label}, ${fmt(slowAction.frame.p75)} ms (n=${slowAction.frame.n}); no positive interval against the two fixed peers establishes a clear action gap.`
      : "Interaction collection pending.",
  delivery: `En Reve response transfer: cold ${fmt(med("load", "en-reve", "responseTransferBytes") === null ? null : med("load", "en-reve", "responseTransferBytes") / 1024)} KiB; warm ${fmt(med("load", "en-reve", "responseTransferBytes", "mobile", "warm") === null ? null : med("load", "en-reve", "responseTransferBytes", "mobile", "warm") / 1024, 3)} KiB. See raw/all-chunk costs separately.`,
  memory:
    m10 && m50
      ? `En Reve 10-to-50-cycle change: ${fmt((m50.chromiumJSHeapUsedSize - m10.chromiumJSHeapUsedSize) / 1048576, 2)} MiB JS heap; ${fmt(m50.dom.nodes - m10.dom.nodes, 0)} browser DOM nodes; ${fmt(m50.dom.jsEventListeners - m10.dom.jsEventListeners, 0)} listeners. One session with 40 more journeys; review status is replaced, so the growth is not explained by appended records.`
      : "50-cycle checkpoint collection pending.",
};
evidence.remediationSignals = signals;
if (campaigns.load.completed) {
  const lc = (id) => med("load", id, "lcp");
  const lw = (id) => med("load", id, "lcp", "mobile", "warm");
  const highlights = [
    `Mobile cold LCP: En Reve ${fmt(lc("en-reve"), 0)} ms; Fluent Web Components ${fmt(lc("fluent-web-components"), 0)} ms; Radix React ${fmt(lc("radix-react"), 0)} ms. Ten successful samples per cell.`,
    `Mobile warm LCP: En Reve ${fmt(lw("en-reve"), 0)} ms; Fluent Web Components ${fmt(lw("fluent-web-components"), 0)} ms; Radix React ${fmt(lw("radix-react"), 0)} ms. Cache reuse changes the relative tradeoff; inspect warm main-thread work as well as cold transfer.`,
    signals.delivery,
  ];
  if (campaigns.startup.completed)
    highlights.push(
      `The early-click probe reached its canvas result at ${fmt(med("startup", "en-reve", "startupResult"))} ms from navigation for En Reve versus ${fmt(med("startup", "fluent-web-components", "startupResult"))} ms for Fluent Web Components. These include exposed automation overhead and do not establish a universal earliest-ready time.`,
    );
  if (campaigns.interactions.completed) {
    highlights.push(
      `Scripted mobile INP medians: En Reve ${fmt(med("interactions", "en-reve", "scriptedINP"))} ms; Radix ${fmt(med("interactions", "radix-react", "scriptedINP"))} ms; Fluent Web Components ${fmt(med("interactions", "fluent-web-components", "scriptedINP"))} ms. These bounded scripted journeys are not field INP.`,
    );
    highlights.push(signals.interaction);
  }
  if (campaigns.lighthouse.completed) {
    const en = subset("lighthouse", "en-reve").filter((s) => s.status === "ok");
    highlights.push(
      `En Reve Lighthouse medians: TBT ${fmt(describe(en.map((s) => s.metrics?.tbt)).median)} ms; Speed Index ${fmt(describe(en.map((s) => s.metrics?.speedIndex)).median)} ms; LCP ${fmt(describe(en.map((s) => s.metrics?.lcp)).median)} ms (n=${en.length}). These independent full-browser audits do not replace the primary load measurements.`,
    );
  }
  const enLoad = campaigns.load.samples.filter(
    (s) => s.system === "en-reve" && s.status === "ok",
  );
  if (enLoad.length === 40 && enLoad.every((s) => s.metrics.cls === 0))
    highlights.push(
      "En Reve recorded zero CLS across all 40 load samples. These bounded visits do not presently suggest a layout-stability remediation priority; they do not cover every consumer application or interaction.",
    );

  evidence.highlights = highlights;
  sections[0] += "\n" + highlights.map((text) => "- " + text).join("\n") + "\n";
}

sections.push(
  table(
    "Remediation decision order",
    [
      "Priority",
      "Engineering area",
      "Signal to inspect",
      "Next experiment",
      "Acceptance condition",
    ],
    [
      [
        "1",
        "Startup rendering and consumer state",
        signals.startup,
        "Isolate delayed hidden-calendar construction and smaller card state boundaries in separate candidates",
        "Paired load improvement; early click and first calendar opening remain correct and fast",
      ],
      [
        "2",
        "Interaction paths",
        signals.interaction,
        "Trace only consistently slow actions; test batching repeated visibility/layout reads",
        "Improves the affected action without worsening startup, keyboard or focus behavior",
      ],
      [
        "3",
        "Delivery and cache reuse",
        signals.delivery,
        "Retain the stable vendor chunk across app edits; split only substantial optional features",
        "Verified cache retention plus acceptable cold and first-use performance",
      ],
      [
        "4",
        "Memory lifecycle",
        signals.memory,
        "Run a minimal repeated-input automation control, then compare connected/detached DOM and heap retainers",
        "Repeated sessions and controls distinguish browser/automation state, GC variation and application retention",
      ],
      [
        "5",
        "Deferred command loading",
        "Historical byte savings versus first-command semantic/frame penalty",
        "Keep lazy command delivery an opt-in hypothesis until a larger boundary exists",
        "Meaningful startup savings outweigh cold keyboard/first-command delay",
      ],
    ],
    "Priority is an engineering sequence, not a fabricated score. Validate the leading gap on a quiet runner, change one factor, then require both load and action receipts. Correctness failures in peer fixtures remain a separate benchmark compatibility issue.",
    "engineering-judgment",
  ),
);
const firstUse = [];
for (const [id, label] of [
  ["experiment-native-interaction-v2", "Native"],
  ["experiment-lazy-commands-interaction-v2", "Lazy commands"],
  ["experiment-intent-commands-interaction-v2", "Intent preload"],
]) {
  const samples = (
    await readFile(resolve(root, "runs", id, "samples.jsonl"), "utf8")
  )
    .trim()
    .split("\n")
    .map((l) => JSON.parse(l));
  const ok = samples.filter((s) => s.status === "ok");
  const actions = ok.map((s) =>
    metrics(s).actions.find((a) => a.name === "commands-first"),
  );
  firstUse.push([
    label,
    String(ok.length),
    fmt(describe(actions.map((a) => a?.semanticMs)).median),
    fmt(describe(actions.map((a) => a?.frameOpportunityMs)).median),
    fmt(describe(ok.map((s) => metrics(s).scriptedINP)).median),
  ]);
}
sections.push(
  table(
    "Historical deferred-command tradeoff",
    [
      "En Reve delivery",
      "Successful n",
      "First command result ms",
      "First command frame ms",
      "Scripted INP ms",
    ],
    firstUse,
    "Three corrected first-use samples per variant from the first pass. Sequential exploratory pilots, not a causal ranking. The earlier invalid pre-definition measurements are excluded. This illustrates why semantic readiness must accompany INP.",
    "experiment-*-interaction-v2",
  ),
);
sections.push(
  `## Test conditions and remaining scope\n\nThe second-pass primary runner uses Apple M5 Max, 18 logical CPUs, 64 GiB RAM, Darwin 25.6.0 and Node 24.16.0 on AC power. Primary timing uses Chromium headless shell; Lighthouse and memory use full bundled Chromium. The primary mobile profile is a constrained narrow desktop-Chromium viewport with trusted mouse input, not a touch-device or mobile-user-agent simulation. Lighthouse separately uses its mobile form factor. Browser versions and exact host/protocol details are retained in each manifest. The earlier reference was taken on battery, so the overlap table does not isolate a software effect.\n\n| Profile | CPU multiplier | Configured latency ms | Download Mbps | Upload Mbps | Viewport | DPR |\n| --- | ---: | ---: | ---: | ---: | --- | ---: |\n| Mobile | 4 | 100 | 8 | 2 | 390 × 844 | 1 |\n| Desktop | 1 | 0 | — | — | 1500 × 1100 | 1 |\n\nDesktop bandwidth is unthrottled. The [delivery calibration](../showcases/performance/reports/delivery-calibration-pass2.json) measured a 1 MB fetch at 1,111.6 ms mobile versus 4.5 ms desktop, and a 1 KiB fetch at 109.3 versus 1.9 ms. The short fixed-work CPU loop measured 13.0 versus 4.1 ms (about 3.2× observed for a 4× configured slowdown). Navigation response-start remained about 17–20 ms while body completion reflected throttling; do not interpret local TTFB as remote RTT. These checks demonstrate applied throttling, not equivalence to physical mobile hardware.\n\nStill outstanding: supported SSR/hydration fixtures (including meaningful HTML, hydration bytes and pre-hydration input), physical-device and deployed-backend cohorts, full reference-size confirmation on a quiet dedicated runner, multiple long memory sessions with cleanup/retainer analysis, and current-source qualification separate from the frozen native baseline. No field FID/INP or release baseline is inferred from these local scripts. Historical experiment and diagnostic tables below retain their own sample sizes and limitations.\n`,
);
const original = JSON.parse(
  await readFile(
    resolve(root, "baselines/exploratory-mobile-cold-2026-09-20/summary.json"),
  ),
);
sections.splice(
  2,
  0,
  table(
    "Historical overlap check",
    [
      "Implementation",
      "Historical samples n",
      "New samples n",
      "Historical LCP ms",
      "New LCP ms",
      "Median change ms",
    ],
    ids.map((id) => {
      const old = original.groups.find((g) => g.system === id).metrics.lcp;
      const current = describe(
        subset("load", id)
          .filter((s) => s.status === "ok")
          .map((s) => s.metrics.lcp),
      );
      return [
        names[id],
        String(old.n),
        String(current.n),
        fmt(old.median),
        fmt(current.median),
        fmt(current.median === null ? null : current.median - old.median),
      ];
    }),
    "Same frozen artifacts and mobile/cold profile, different campaign times, harness hashes and power states (first pass battery; second pass AC). This is a drift check, not a library change or paired experiment. Historical and new distributions remain separate.",
    "mobile-cold-reference-v1 / " + campaigns.load.id,
  ),
);
const calibration = JSON.parse(
  await readFile(resolve(root, "reports/delivery-calibration-pass2.json")),
);
evidence.calibration = calibration.summary;
evidence.measurementDefinitions = {
  units:
    "KiB=1024 bytes; MiB=1048576 bytes; milliseconds unless otherwise labeled",
  transfer:
    "Completed CDP response bytes including navigation; not TCP/TLS packet capture. Excludes /__perf/ lifecycle requests.",
  cache:
    "Resource Timing transferSize=0 and encodedBodySize>0; CDP disk-cache flags alone miss memory cache.",
  startup:
    "Animation-frame geometry discovery with probe elapsed time accounting; single trusted early visible-control click; navigation and dispatch overhead shown; no load/settling wait and no retry.",
  missing:
    "Unavailable values remain null in distributions and em dash in tables; never treated as zero.",
  font: "Last measured webfont response, not an early document.fonts.ready promise.",
  comparison:
    "New campaign matched-block bootstrap; historical runs kept separate; no multiple-comparison correction.",
};
const generated = sections.join("\n");
await writeFile(resolve(root, "reports/pass2-tables.json"), json(evidence));
await writeFile(resolve(root, "reports/pass2-tables.md"), generated);
const reportPath = resolve(
  root,
  "../../plans/native-showcase-performance-results.md",
);
let report = await readFile(reportPath, "utf8");
const start = "<!-- BEGIN SECOND PASS -->",
  end = "<!-- END SECOND PASS -->";
if (report.includes(start))
  report =
    report.slice(0, report.indexOf(start)) +
    report.slice(report.indexOf(end) + end.length).replace(/^\n+/, "");
report = report.replace(
  "## Reproduce and inspect",
  `${start}\n\n${generated}\n${end}\n\n## Reproduce and inspect`,
);
await writeFile(reportPath, report);
console.log(
  `Generated ${tables.length} grouped tables; status ${evidence.status}.`,
);
