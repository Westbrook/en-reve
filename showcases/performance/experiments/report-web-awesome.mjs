import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { root, options, json, sha } from '../src/config.mjs';
import { metrics, describe, pairedDifference } from '../src/analysis.mjs';
import { integrateWebAwesomeMain } from './integrate-web-awesome-main.mjs';
import { metricGroups, actions } from './web-awesome-metric-groups.mjs';

const opts = options(['report-web-awesome', ...process.argv.slice(2)]);
const inputReceipts = [];
async function read(path, optional = false) {
  try {
    const absolute = resolve(root, path), bytes = await readFile(absolute);
    inputReceipts.push({ path: relative(root, absolute), bytes: bytes.length, sha256: sha(bytes) });
    return JSON.parse(bytes);
  } catch (error) {
    if (optional && error.code === 'ENOENT') return null;
    throw error;
  }
}
const config = await read(opts.config ?? 'reports/web-awesome/config.json');
const analysisSources = {};
for (const path of ['experiments/report-web-awesome.mjs', 'experiments/web-awesome-metric-groups.mjs', 'experiments/pass2-metrics.mjs', 'experiments/integrate-web-awesome-main.mjs', 'src/analysis.mjs', 'src/delivery.mjs']) {
  const bytes = await readFile(resolve(root, path));
  analysisSources[path] = sha(bytes);
  inputReceipts.push({ path, bytes: bytes.length, sha256: sha(bytes), role: 'post-acquisition analysis source' });
}
assert.equal(config.schema, 1, 'Expected schema 1 report configuration');
assert(config.systems?.includes('web-awesome'), 'Configuration must include Web Awesome');
assert.equal(new Set(config.systems).size, config.systems.length);
const ids = config.systems;
const names = {
  'en-reve': 'En Reve', 'web-awesome': 'Web Awesome', 'fluent-web-components': 'Fluent Web Components',
  'spectrum-web-components': 'Spectrum Web Components', 'radix-react': 'Radix React',
  'fluent-react': 'Fluent React', 'spectrum-react': 'Spectrum React S2', 'astryx-react': 'Astryx React', 'shadcn-react': 'shadcn React',
  ...config.names,
};
const campaigns = {};
const deliveryReplays = [];
for (const [suite, id] of Object.entries(config.campaigns)) {
  assert(/^[a-z0-9-]+$/.test(id), `Invalid campaign id: ${id}`);
  const manifest = await read(`runs/${id}/manifest.json`, true);
  let samples = [], rawHash = null;
  try {
    const bytes = await readFile(resolve(root, 'runs', id, 'samples.jsonl'));
    rawHash = sha(bytes);
    inputReceipts.push({ path: `runs/${id}/samples.jsonl`, bytes: bytes.length, sha256: rawHash });
    samples = bytes.toString().trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
    for (const s of samples) {
      assert(ids.includes(s.system), `${id} contains unexpected system ${s.system}`);
      assert.equal(s.suite, suite);
      const captured = s.metrics;
      s.metrics = s.collector ? metrics(s) : (s.metrics ?? s.lighthouse ?? {});
      if (s.collector) deliveryReplays.push({ campaign: id, suite, sampleId: s.id, system: s.system, profile: s.profile, cache: s.cache, status: s.status, capturedResponseBytes: captured?.responseTransferBytes ?? null, correctedHTTPResponseBytes: s.metrics.responseTransferBytes ?? null, nonHTTPResponseCount: s.metrics.nonHTTPResponseCount ?? null, nonHTTPCompletedResponseBytes: s.metrics.nonHTTPCompletedResponseBytes ?? null, nonHTTPIncompleteResponses: s.metrics.nonHTTPIncompleteResponses ?? null });
    }
    assert.equal(new Set(samples.map(s => s.id)).size, samples.length, `${id} contains duplicate sample ids`);
    if (manifest) for (const s of samples) {
      const job = manifest.jobs.find(j => j.id === s.id);
      assert(job && ['system', 'profile', 'cache', 'block'].every(k => job[k] === s[k]), `${id} sample ${s.id} differs from its scheduled job`);
    }
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (manifest) assert.equal(manifest.id, id);
  campaigns[suite] = { id, manifest, samples, rawHash, completed: !!manifest && samples.length === manifest.jobs.length };
}
for (const suite of ['load', 'startup', 'interactions', 'lighthouse', 'memory']) assert(campaigns[suite], `Required campaign missing: ${suite}`);
const bundle = await read(config.bundlePath), inventory = await read(config.inventoryPath);
const tables = [], distributions = [], sections = [], contrasts = [], coverageIssues = [];
const fmt = (value, digits = 1) => Number.isFinite(value) ? value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }) : '—';
const kib = (value, digits = 1) => fmt(Number.isFinite(value) ? value / 1024 : null, digits);
const mib = value => fmt(Number.isFinite(value) ? value / 1048576 : null, 2);
const safe = value => String(value ?? '—').replaceAll('|', '\\|').replaceAll('\n', ' ');
const pathLink = (path, title) => `[${title}](../showcases/performance/${path})`;
function table(title, headers, rows, note, source) {
  const clean = rows.map(row => row.map(safe));
  tables.push({ title, headers, rows: clean, note, source });
  sections.push(`### ${title}\n\n${note}\n\n| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n${clean.map(row => `| ${row.join(' | ')} |`).join('\n')}\n`);
}
const sub = (suite, id, profile = 'mobile', cache = 'cold') => campaigns[suite]?.samples.filter(s => s.system === id && s.profile === profile && s.cache === cache) ?? [];
function metricTable(title, suite, profile, cache, columns, note) {
  const rows = ids.map(id => {
    const all = sub(suite, id, profile, cache), ok = all.filter(s => s.status === 'ok');
    const stats = columns.map(c => describe(ok.map(s => c.get ? c.get(s) : s.metrics?.[c.key])));
    distributions.push({ title, system: id, successful: ok.length, failed: all.length - ok.length, metrics: columns.map((c, i) => ({ key: c.key, label: c.label, ...stats[i] })) });
    return [names[id], ok.length, all.length - ok.length, ...columns.map((c, i) => Number.isFinite(stats[i][c.stat]) ? fmt(stats[i][c.stat] / c.scale, c.digits) : '—')];
  });
  table(title, ['Implementation', 'Successful n', 'Failed n', ...columns.map(c => c.label)], rows,
    `${note} Cohort: **${campaigns[suite].id}**, ${profile}/${cache}. Values are successful-sample medians unless labeled otherwise. ${campaigns[suite].completed ? 'Acquisition complete.' : 'Acquisition incomplete.'}`, campaigns[suite].id);
}
const section = (title, text) => sections.push(`### ${title}\n\n${text}\n`);
const complete = Object.values(campaigns).every(c => c.completed);
sections.push(`## Web Awesome comparison\n\nThis supplemental acquisition adds Web Awesome using its native web components and default styling. Frozen En Reve and Fluent Web Components are remeasured as contemporaneous controls. **The earlier eight-system measurements remain historical and unchanged.** Their identical-looking block numbers do not pair with these new samples. The nine-system overview explicitly labels each acquisition; use the new three-system tables and within-cohort contrasts to investigate current delivery differences.\n\nEvery measurement table is sortable in the En Reve HTML reader. KiB = 1,024 bytes; MiB = 1,048,576 bytes. A dash is unavailable, never zero. Missing values sort last. Raw production JS means emitted/minified bytes before compression, not browser compiled-code memory. This is an exploratory workstation comparison of complete native fixtures, not a library-only ranking or a release gate.\n\n${config.context ?? ''}\n\n${pathLink('reports/web-awesome/tables.json', 'Machine-readable tables, distributions and input hashes')}. ${pathLink('reports/web-awesome/config.json', 'Campaign configuration')}. ${pathLink('reports/web-awesome/execution.json', 'Serial execution receipt')}. ${pathLink('reports/web-awesome/evidence/receipt.json', 'Retained raw evidence and source receipt')}.\n`);

table('Web Awesome native-library identity', ['Implementation', 'Direct dependency pins', 'Rendering', 'Native theme', 'Artifact SHA-256'], ids.map(id => { const i = inventory.systems.find(s => s.id === id); return [names[id], Object.entries(i.build?.dependencies ?? {}).map(([k, v]) => `${k}@${v}`).join('; '), i.build?.rendering, i.build?.theme, i.fingerprint]; }), `Pins, rendering, theme and artifact identity are read from the ${pathLink(config.inventoryPath, 'final frozen inventory')}, not current working-tree packages. En Reve's file/tarball dependency identifies its locally packed baseline. Source and lockfile hashes remain in that inventory. The Web Awesome-inspired En Reve theme is a separate artifact; it is not substituted into either native Web Awesome or the frozen En Reve control.`, config.inventoryPath);

table('Web Awesome acquisition coverage', ['Campaign', 'Acquisition ID', 'Planned samples', 'Recorded samples', 'Successful samples', 'Failed samples', 'Complete'],
  Object.entries(campaigns).map(([suite, c]) => [suite, c.id, c.manifest?.jobs.length ?? '—', c.samples.length, c.samples.filter(s => s.status === 'ok').length, c.samples.filter(s => s.status !== 'ok').length, c.completed ? 'Yes' : 'No']),
  'No failed sample is silently replaced. Primary loading, startup, settled interactions, Lighthouse, memory, tracing/coverage, observer overhead and back-forward cache have separate acquisitions and instrumentation. DOM census coverage is reported separately below.', 'campaign manifests');
table('Web Awesome browser and harness identity', ['Campaign', 'Started UTC', 'Browser', 'Browser mode', 'Harness SHA-256', 'Collector SHA-256'],
  Object.entries(campaigns).map(([suite, c]) => [suite, c.manifest?.createdAt, [...new Set(c.samples.map(s => s.browser).filter(Boolean))].join('; ') || '—', [...new Set(c.samples.map(s => s.browserMode).filter(Boolean))].join('; ') || 'See audit receipt', c.manifest?.harnessSha256, c.manifest?.collectorSha256]),
  'The exact browser, renderer mode and archived harness identify these new results. Matching the source fixture does not make historical timings contemporaneous. Full host metadata and collection options remain in each manifest.', 'campaign manifests and raw samples');
const profileRows = [], profileKeys = new Set();
for (const [suite, c] of Object.entries(campaigns)) for (const [profile, p] of Object.entries(c.manifest?.profiles ?? {})) {
  if (!c.manifest.jobs.some(j => j.profile === profile)) continue;
  const key = JSON.stringify([profile, p]); if (profileKeys.has(key)) continue; profileKeys.add(key);
  profileRows.push([profile, p.viewport?.width, p.viewport?.height, p.deviceScaleFactor, p.cpuRate, p.latency, p.download < 0 ? 'Unthrottled' : fmt(p.download * 8 / 1000000, 2), p.upload < 0 ? 'Unthrottled' : fmt(p.upload * 8 / 1000000, 2)]);
}
table('Web Awesome requested profiles', ['Profile', 'Viewport width px', 'Viewport height px', 'DPR', 'CPU slowdown', 'Network latency ms', 'Download Mbps', 'Upload Mbps'], profileRows,
  'These are requested CDP profile values. Desktop uses no simulated CPU/network throttling. The mobile profile is desktop Chromium with a narrow viewport and emulated CPU/network limits, not a physical phone. Lighthouse separately applies its DevTools throttling settings; memory and DOM diagnostics have their own recorded protocol. Browser implementation and loopback serving limit real-world inference.', 'manifest profiles');
const failures = Object.entries(campaigns).flatMap(([suite, c]) => c.samples.filter(s => s.status !== 'ok').map(s => [names[s.system], suite, s.profile, s.cache, s.id, s.collector?.actions?.at(-1)?.name ?? '—', (s.errors ?? []).map(e => e.message ?? e.type ?? String(e)).join('; ')]));
if (failures.length) table('Web Awesome retained acquisition failures', ['Implementation', 'Campaign', 'Profile', 'Cache', 'Sample', 'Last action', 'Failure'], failures, 'Failed samples remain in raw evidence and outside successful timing distributions. The last action is a diagnostic clue, not a demonstrated cause. Memory checkpoints reached before a failure remain available.', 'raw samples');

section('Web Awesome loading and visual stability', 'Loading sends no input, retaining LCP eligibility through the observation window. Load plus 1.5 seconds and card readiness bounds CLS and resource observation. TTFB is from a loopback server. Warm visits reuse a primed context. Text LCP may legitimately have zero resource phases; independent attribution medians need not add to median LCP. Card-frame and final downloaded-font response timestamps do not prove every control is usable.');
for (const profile of ['mobile', 'desktop']) {
  for (const cache of ['cold', 'warm']) metricTable(`Web Awesome ${profile} ${cache} loading`, 'load', profile, cache, metricGroups.loading, 'FCP is first contentful paint; LCP is largest contentful paint; CLS uses eligible session-window scoring.');
  metricTable(`Web Awesome ${profile} cold LCP attribution`, 'load', profile, 'cold', metricGroups.lcp, 'web-vitals attribution; render delay includes discovery, JS, CSS, fonts and rendering.');
  metricTable(`Web Awesome ${profile} startup usability`, 'startup', profile, 'cold', metricGroups.startup, 'One trusted click is dispatched at the first observed Landscape geometry, refreshed just before dispatch; the target, result and two-rAF frame opportunity are verified. This is an observed successful probe, not mathematically earliest usability, legacy TTI or field FID. Probe/dispatch overhead remains visible.');
}

const historicalBundles = await read(config.historicalBundlePath ?? 'reports/bundles.json');
for (const id of config.frozenControls ?? ['en-reve', 'fluent-web-components']) {
  assert.equal(bundle.systems.find(s => s.id === id)?.fingerprint, historicalBundles.systems.find(s => s.id === id)?.fingerprint, `Control ${id} no longer matches its historical frozen artifact`);
}
section('Web Awesome production payload and chunking', 'All emitted production assets include fixture code, library/runtime code and authored styles; source maps and diagnostic metadata are excluded. Brotli/gzip are deterministic offline compression, while browser transfer is measured separately. Initial JS follows HTML/preload/static import reachability. A dynamic edge permits deferred loading but does not establish that bytes were deferred. The HTML measured here is a CSR shell; no SSR/hydration performance cohort is represented.');
section('Web Awesome transfer accounting correction', 'The original delivery aggregate counted embedded `data:` SVG responses as transferred bytes, even though their content was already included in JavaScript. This report replays the retained raw network observations through an HTTP(S)-only delivery utility. Timing measurements, raw samples and historical table rows are unchanged; only derived delivery totals and completion counts are corrected. Web Awesome has nine embedded icon fetch responses totalling 4,683 reported bytes, plus a zero-byte data-image response: its original cold total of 98,794 bytes becomes **94,111 HTTP(S) response bytes**, and its original warm total of 4,943 becomes **260 bytes**. The eight historical reference fixtures have no non-HTTP response bytes in the retained comparison, so their existing values remain unchanged. The machine-readable report records captured and corrected values per sample and exact hashes of the post-acquisition analysis sources. Non-HTTP response accounting is diagnostic; it is not added to wire totals.');
table('Web Awesome production payload sizes', ['Implementation', 'JS raw KiB', 'JS gzip KiB', 'JS Brotli KiB', 'Initial JS Brotli KiB', 'CSS raw KiB', 'CSS Brotli KiB', 'Local fonts Brotli KiB', 'HTML raw KiB', 'HTML Brotli KiB'], ids.map(id => {
  const b = bundle.systems.find(s => s.id === id), inv = inventory.systems.find(s => s.id === id), html = inv?.assets.find(a => a.path === 'index.html');
  assert(b && inv, `Missing bundle/inventory for ${id}`); assert.equal(b.fingerprint, inv.fingerprint);
  for (const c of Object.values(campaigns)) {
    const measured = c.manifest?.artifacts?.find?.(s => s.id === id) ?? c.manifest?.inventory?.systems?.find(s => s.id === id);
    if (measured?.fingerprint) assert.equal(measured.fingerprint, b.fingerprint, `Measured artifact mismatch: ${id}`);
  }
  return [names[id], ...['raw', 'gzip', 'brotli', 'initialBrotli'].map(k => kib(b.totals.js?.[k] ?? 0)), kib(b.totals.css?.raw ?? 0), kib(b.totals.css?.brotli ?? 0), kib(b.totals.fonts?.brotli ?? 0), kib(html?.raw, 3), kib(html?.brotli, 3)];
}), 'One frozen build per implementation. Local-font zero does not imply no remote fonts; use browser transfer for actual responses.', config.bundlePath);
table('Web Awesome emitted chunk structure', ['Implementation', 'JS files', 'CSS files', 'Static initial assets', 'Dynamic import edges', 'Sources in multiple chunks'], ids.map(id => { const b = bundle.systems.find(s => s.id === id); return [names[id], b.totals.js?.files ?? 0, b.totals.css?.files ?? 0, b.initialStaticFiles.length, b.dynamicImportEdges.length, b.sourceModulesInMultipleChunks.length]; }), 'These are current fixture graphs, not the splitting ceiling of each library. Repeated source modules require inspection before claiming removable duplication.', config.bundlePath);

section('Web Awesome whole-page response delivery', 'Completed HTTP(S) CDP response bytes include HTML, JS, CSS, fonts and other network responses, excluding local schemes, collector endpoints and destination pages. These are browser response accounting, not TCP/TLS packet bytes. Incomplete HTTP responses make totals unavailable; missing assets are not free. The load visit is bounded; interaction transfer is a separate cumulative journey, not subtraction of two medians. Cache-reuse entries have zero Resource Timing transfer and a positive encoded body size.');
table('Web Awesome response-transfer derivation correction', ['Implementation', 'Profile', 'Cache', 'Successful n', 'Captured aggregate KiB', 'Corrected HTTP response KiB', 'Non-HTTP responses n', 'Non-HTTP completed KiB', 'Non-HTTP incomplete n'], ['mobile', 'desktop'].flatMap(profile => ['cold', 'warm'].flatMap(cache => ids.map(id => {
  const rows = deliveryReplays.filter(r => r.suite === 'load' && r.system === id && r.profile === profile && r.cache === cache && r.status === 'ok');
  return [names[id], profile, cache, rows.length, kib(describe(rows.map(r => r.capturedResponseBytes)).median), kib(describe(rows.map(r => r.correctedHTTPResponseBytes)).median), fmt(describe(rows.map(r => r.nonHTTPResponseCount)).median, 0), kib(describe(rows.map(r => r.nonHTTPCompletedResponseBytes)).median), fmt(describe(rows.map(r => r.nonHTTPIncompleteResponses)).median, 0)];
}))), 'Successful load-sample medians. Captured aggregates are retained historical fields inside the new raw files; every delivery table below uses the corrected HTTP(S)-only replay. Embedded/local responses are shown separately to make the correction inspectable. A missing completion remains unavailable rather than zero.', campaigns.load.id);
for (const profile of ['mobile', 'desktop']) {
  for (const cache of ['cold', 'warm']) metricTable(`Web Awesome ${profile} ${cache} response transfer`, 'load', profile, cache, metricGroups.transfer, 'Independently computed category medians need not sum exactly to median total.');
  metricTable(`Web Awesome ${profile} cumulative interaction transfer`, 'interactions', profile, 'cold', metricGroups.transfer, 'Whole successful journey, including requests caused by tested actions.');
}
section('Web Awesome main-thread and blocking work', 'CDP script, style, layout and task counters are measured at the bounded load endpoint and can overlap. Long-task and long-animation-frame totals include their whole durations and are not TBT. Blocking excess sums only long-task portions beyond 50 ms, clipped before FCP or from FCP to the observation endpoint. Lighthouse TBT has a different endpoint and is reported separately. Use traces before assigning critical-path causes.');
for (const profile of ['mobile', 'desktop']) for (const cache of ['cold', 'warm']) metricTable(`Web Awesome ${profile} ${cache} main-thread work`, 'load', profile, cache, metricGroups.thread, 'These are measured costs, not an additive decomposition of LCP.');
metricTable('Web Awesome repeated mobile Lighthouse audits', 'lighthouse', 'mobile', 'cold', metricGroups.lighthouse, 'Fresh full-Chromium audits, separate from headless-shell load samples. Lighthouse owns DevTools throttling in this lane. Zero TBT does not establish zero startup work.');
const lighthouseSettings = [];
for (const id of ids) {
  const groups = new Map();
  for (const sample of sub('lighthouse', id).filter(s => s.status === 'ok')) {
    const audit = await read(`runs/${campaigns.lighthouse.id}/${sample.id}-lighthouse.json`, true);
    if (!audit) continue;
    const settings = audit.configSettings, key = JSON.stringify([audit.lighthouseVersion, settings.throttlingMethod, settings.throttling, settings.screenEmulation]);
    if (!groups.has(key)) groups.set(key, { audit, count: 0 }); groups.get(key).count++;
  }
  for (const { audit, count } of groups.values()) { const s = audit.configSettings, t = s.throttling; lighthouseSettings.push([names[id], count, audit.lighthouseVersion, s.throttlingMethod, t.cpuSlowdownMultiplier, t.requestLatencyMs, t.downloadThroughputKbps, t.uploadThroughputKbps, s.screenEmulation.mobile ? 'Mobile' : 'Desktop']); }
}
table('Web Awesome recorded Lighthouse throttling', ['Implementation', 'Audits n', 'Lighthouse version', 'Throttle method', 'CPU slowdown', 'Request latency ms', 'Download Kbps', 'Upload Kbps', 'Screen emulation'], lighthouseSettings, 'Settings read from each retained Lighthouse JSON, rather than inferred from a generic mobile preset. DevTools uses request latency and download/upload values; the unused simulation rtt/throughput defaults are not presented as applied network limits. Lighthouse also emulates a mobile user agent/screen, unlike the primary narrow desktop-context lane.', campaigns.lighthouse.id);

section('Web Awesome interaction responsiveness', 'The settled journey tests first/repeated canvas changes, assets, dialogs, review submission and command opening. Scripted-session INP is not field INP. Browser first-input delay excludes handler and rendering time and is not a field FID sample. Event Timing has threshold/quantization limits; missing events remain unavailable. Semantic completion is verified DOM state; two rAFs indicate frame opportunity, not actual display presentation. Calendar interaction timings, typing and keyboard-specific paths are not covered by these seven actions.');
for (const profile of ['mobile', 'desktop']) {
  metricTable(`Web Awesome ${profile} interaction summary`, 'interactions', profile, 'cold', metricGroups.interactions, 'Maximum scroll rAF gap is a scheduler diagnostic, not an inferred dropped-frame percentage.');
  table(`Web Awesome ${profile} individual actions`, ['Implementation', 'Action', 'Successful n', 'Failed journeys', 'Result ms', 'Frame opportunity ms', 'Frame p75 ms', 'Event entries n', 'Input delay ms', 'Processing ms', 'Presentation ms'], actions.flatMap(([action, label]) => ids.map(id => {
    const all = sub('interactions', id, profile), ok = all.filter(s => s.status === 'ok');
    const values = ok.flatMap(s => s.metrics?.actions?.filter(a => a.name === action) ?? []), events = values.filter(a => Number.isFinite(a.eventTiming?.duration));
    return [names[id], label, values.length, all.length - ok.length, fmt(describe(values.map(a => a.semanticMs)).median), fmt(describe(values.map(a => a.frameOpportunityMs)).median), fmt(describe(values.map(a => a.frameOpportunityMs)).p75), events.length, ...['inputDelay', 'processing', 'presentation'].map(k => fmt(describe(events.map(a => a.eventTiming[k])).median))];
  })), `Cohort: ${campaigns.interactions.id}, ${profile}/cold. Sort Action to compare the same operation. First and repeated actions expose possible deferred work. Event-entry counts show attribution coverage.`, campaigns.interactions.id);
}

section('Web Awesome memory and lifecycle', 'A separate cross-origin-isolated full-Chromium lane disables timing observers and samples at 0, 10 and 50 native journeys. Reviews replace status text rather than append records. API memory, JS heap and browser DOM counters have different scopes. One session per implementation and GC-dependent API readings cannot establish leaks or a robust memory ranking. API timeout/error is explicit; checkpoints reached before later failure remain reported.');
for (const cycles of [0, 10, 50]) table(`Web Awesome memory after ${cycles} cycles`, ['Implementation', 'Checkpoints n', 'API success n', 'API unavailable n', 'API MiB', 'JS heap MiB', 'Browser DOM nodes', 'Event listeners', 'API status'], ids.map(id => {
  const points = sub('memory', id, 'desktop').flatMap(s => s.memory?.filter(p => p.cycles === cycles) ?? []), ok = points.filter(p => p.api?.status === 'ok');
  return [names[id], points.length, ok.length, points.length - ok.length, mib(describe(ok.map(p => p.api.bytes)).median), mib(describe(points.map(p => p.chromiumJSHeapUsedSize)).median), fmt(describe(points.map(p => p.dom?.nodes)).median, 0), fmt(describe(points.map(p => p.dom?.jsEventListeners)).median, 0), points.map(p => p.api?.status).join(', ') || 'Not reached'];
}), `Cohort: ${campaigns.memory.id}. Zero cycles means after initial load and settling.`, campaigns.memory.id);
table('Web Awesome memory change from 10 to 50 cycles', ['Implementation', 'Complete checkpoint pairs n', 'Paired API readings n', 'API growth MiB', 'JS heap growth MiB', 'DOM node growth', 'Listener growth'], ids.map(id => {
  const pairs = sub('memory', id, 'desktop').map(s => [s.memory?.find(p => p.cycles === 10), s.memory?.find(p => p.cycles === 50)]).filter(([a, b]) => a && b), api = pairs.filter(([a, b]) => a.api?.status === 'ok' && b.api?.status === 'ok');
  return [names[id], pairs.length, api.length, mib(describe(api.map(([a, b]) => b.api.bytes - a.api.bytes)).median), mib(describe(pairs.map(([a, b]) => b.chromiumJSHeapUsedSize - a.chromiumJSHeapUsedSize)).median), fmt(describe(pairs.map(([a, b]) => b.dom.nodes - a.dom.nodes)).median, 0), fmt(describe(pairs.map(([a, b]) => b.dom.jsEventListeners - a.dom.jsEventListeners)).median, 0)];
}), 'Within-session change across 40 more journeys; separate application/native input retention, automation and GC before calling growth a library leak.', campaigns.memory.id);

if (campaigns.diagnostic) {
  const c = campaigns.diagnostic, d = await read(`runs/${c.id}/diagnostics-summary.json`, true);
  if (!d) coverageIssues.push('Diagnostic summary not yet available');
  table('Web Awesome diagnostic coverage', ['Implementation', 'Successful n', 'Connected nodes', 'Connected elements', 'Open shadow roots', 'Style elements', 'Stylesheet adoptions', 'Unique adopted sheets'], ids.map(id => { const samples = c.samples.filter(s => s.system === id && s.status === 'ok'); return [names[id], samples.length, ...['connectedNodes', 'connectedElements', 'openShadowRoots', 'styleElements', 'stylesheetAdoptions', 'uniqueAdoptedStylesheets'].map(k => fmt(describe(samples.map(s => s.connectedDOM?.[k])).median, 0))]; }), `Cohort: ${c.id}. Tracing and coverage have measurement overhead and remain separate from primary timings. These post-journey connected counts are not the browser-wide memory counters.`, c.id);
  if (d) {
    assert.equal(new Set(d.samples.map(s => s.sampleId)).size, d.samples.length, 'Duplicate diagnostic summary sample IDs');
    for (const row of d.samples) {
      const raw = c.samples.find(s => s.id === row.sampleId);
      assert(raw && raw.system === row.system && raw.profile === row.profile && raw.status === row.status, 'Diagnostic summary does not match raw sample identity/status');
    }
    if (c.samples.filter(s => s.status === 'ok').some(s => !d.samples.some(row => row.sampleId === s.id))) coverageIssues.push('Successful raw diagnostics missing from summary');
    table('Web Awesome exercised code coverage', ['Implementation', 'Diagnostic n', 'Loaded JS characters', 'Exercised JS characters', 'Unexercised JS percent', 'External CSS characters', 'Unexercised external CSS percent'], ids.map(id => {
      const rows = d.samples.filter(s => s.system === id && s.status === 'ok').map(s => {
        const js = s.coverage.js.filter(r => /^https?:/.test(r.url) && !r.url.includes('/__perf/')), css = s.coverage.css.filter(r => /^https?:/.test(r.url));
        const sum = (a, k) => a.reduce((n, r) => n + r[k], 0), jt = sum(js, 'totalCharacters'), jc = sum(js, 'coveredCharacters'), ct = sum(css, 'totalCharacters'), cc = sum(css, 'coveredCharacters');
        return [jt, jc, jt ? 100 * (jt - jc) / jt : null, ct || null, ct ? 100 * (ct - cc) / ct : null];
      });
      return [names[id], rows.length, ...Array.from({ length: 5 }, (_, i) => fmt(describe(rows.map(r => r[i])).median, [2, 4].includes(i) ? 1 : 0))];
    }), 'Generated characters are not UTF-8 bytes. Injected collector and non-HTTP code are excluded. External CSS coverage does not include all adopted/CSS-in-JS styles; unexercised code is not necessarily removable.', c.id);
    table('Web Awesome trace through diagnostic LCP', ['Implementation', 'Diagnostic n', 'Main-thread RunTask ms', 'HTML parse ms', 'Layout tree update ms', 'Layout ms', 'Paint ms', 'Script evaluation ms'], ids.map(id => { const rows = d.samples.filter(s => s.system === id && s.status === 'ok'); return [names[id], rows.length, ...['RunTask', 'ParseHTML', 'UpdateLayoutTree', 'Layout', 'Paint', 'EvaluateScript'].map(k => fmt(describe(rows.map(s => s.startupDurations?.[k])).median))]; }), 'Renderer-main-thread categories clipped to each trace’s own LCP. Nested categories overlap; do not sum them or mix them with primary timings as one acquisition.', c.id);
    table('Web Awesome whole-journey sampled function leads', ['Implementation', 'Function', 'Source', 'Source line', 'Sample count', 'Sampled self ms'], d.samples.filter(s => s.status === 'ok').flatMap(s => s.topSampledFunctions.slice(0, 5).map(f => [names[s.system], f.function, f.source, f.line, f.samples, fmt(f.sampledSelfMs)])), `Top five sampled functions per diagnostic journey. These are sampling leads across the complete journey, not exhaustive CPU attribution or startup-only costs. Source mapping and exact intervals remain in the ${pathLink(`runs/${c.id}/diagnostics-summary.json`, 'diagnostic summary')} and retained trace.`, c.id);
  }
}
if (campaigns.bfcache) table('Web Awesome back-forward cache checks', ['Implementation', 'Attempts n', 'Successful samples', 'Restored n', 'Interactive after return n'], ids.map(id => { const rows = campaigns.bfcache.samples.filter(s => s.system === id); return [names[id], rows.length, rows.filter(s => s.status === 'ok').length, rows.filter(s => s.bfcache?.sameDocument && s.bfcache?.pageshow?.persisted).length, rows.filter(s => s.bfcache?.interactiveAfterReturn).length]; }), 'Direct-CDP diagnostics verify same-document restoration and trusted post-return input. For all three non-restores, the browser exposed only masked notRestoredReasons; every return remained interactive. This small sample does not attribute those outcomes to library code. These are repeatable checks, not field hit rates or measured restoration latency.', campaigns.bfcache.id);
if (campaigns.overhead) {
  const rows = [];
  for (const id of ids) for (const profile of [...new Set(campaigns.overhead.samples.map(s => s.profile))]) for (const key of ['scriptMs', 'taskMs', 'layoutMs', 'styleMs']) {
    const samples = sub('overhead', id, profile).filter(s => s.status === 'ok'), value = s => ({ block: s.block, value: s.browserMetrics?.[{ scriptMs: 'ScriptDuration', taskMs: 'TaskDuration', layoutMs: 'LayoutDuration', styleMs: 'RecalcStyleDuration' }[key]] * 1000 });
    const contrast = pairedDifference(samples.filter(s => s.instrument).map(value), samples.filter(s => !s.instrument).map(value));
    rows.push([names[id], profile, key, contrast.n, fmt(contrast.difference), fmt(contrast.ci95?.[0]), fmt(contrast.ci95?.[1])]);
  }
  table('Web Awesome observer overhead calibration', ['Implementation', 'Profile', 'Metric', 'Paired blocks n', 'Collector on minus off ms', '95% interval low ms', '95% interval high ms'], rows, 'Same-campaign paired on/off blocks; both variants use browser counters. The exploratory bootstrap interval can include zero without proving zero overhead. Probe work is also exposed separately in startup tables.', campaigns.overhead.id);
}

section('Web Awesome same-cohort gaps', 'Positive differences mean En Reve took longer than the peer. Differences are medians from complete matched blocks in the new acquisition only, with paired-block exploratory bootstrap intervals and no multiple-comparison correction. Fewer than five complete pairs is unavailable. Intervals do not erase workstation noise, feature/typography differences or demonstrate causes. Historical cohorts are never paired here.');
for (const [suite, key, label, cache] of [['load', 'lcp', 'Cold LCP', 'cold'], ['load', 'lcp', 'Warm LCP', 'warm'], ['startup', 'startupResult', 'Startup result', 'cold'], ['interactions', 'scriptedINP', 'Scripted INP', 'cold']]) {
  const rows = [];
  for (const profile of ['mobile', 'desktop']) for (const id of ids.filter(id => id !== 'en-reve')) {
    const values = system => sub(suite, system, profile, cache).filter(s => s.status === 'ok').map(s => ({ block: s.block, value: s.metrics?.[key] }));
    const c = pairedDifference(values('en-reve'), values(id)); contrasts.push({ suite, key, profile, cache, against: id, ...c });
    rows.push([names[id], profile, c.n, fmt(c.difference), fmt(c.ci95?.[0]), fmt(c.ci95?.[1])]);
  }
  table(`Web Awesome ${label} gaps`, ['Implementation', 'Profile', 'Matched blocks n', 'En Reve minus peer ms', '95% interval low ms', '95% interval high ms'], rows, `Cohort: ${campaigns[suite].id}, ${cache} cache.`, campaigns[suite].id);
}

// A clearly labelled unpaired overview adds the ninth system without changing
// any historical row, and without manufacturing contemporaneous comparisons.
if (config.historicalOverview !== false) {
  const historical = await read(config.historicalTablesPath ?? 'reports/pass2-tables.json');
  const hDOM = await read(config.historicalDOMPath ?? 'reports/dom-review/census.json');
  const histTable = title => historical.tables.find(t => t.title === title);
  section('Nine-system grouped historical comparisons', 'The following grouped tables preserve the original eight rows exactly and add only the new Web Awesome row, with acquisition identity beside every implementation. They extend visual coverage across the full reference panel without rewriting history. The groups expose related metrics together; they are unpaired descriptive comparisons. Use the contemporaneous three-system tables for current En Reve versus Web Awesome/Fluent differences. Browser/harness receipts and failure counts remain essential context.');
  const bridge = (historicalTitle, currentTitle, title) => {
    const old = histTable(historicalTitle), current = tables.find(t => t.title === currentTitle);
    assert(old && current, `Missing historical comparison source: ${historicalTitle}/${currentTitle}`);
    assert.deepEqual(old.headers, current.headers, `Comparison columns differ: ${historicalTitle}`);
    const wa = current.rows.find(r => r[0] === names['web-awesome']); assert(wa);
    const labelled = (row, cohort) => [row[0], cohort, ...row.slice(1)];
    table(title, [old.headers[0], 'Acquisition', ...old.headers.slice(1)], [...old.rows.map(row => labelled(row, `Historical ${old.source}`)), labelled(wa, `New ${current.source}`)],
      'Original eight-system values plus the new Web Awesome acquisition. These are independent acquisition cohorts, not contemporaneous paired samples or change estimates. Units, missing-value semantics and successful/failed coverage match their detailed source tables. Sort to explore a hypothesis, then confirm it with contemporaneous controls.', `${old.source}; ${current.source}`);
  };
  bridge('Production payload sizes', 'Web Awesome production payload sizes', 'Nine-system production payload comparison');
  bridge('Chunk structure', 'Web Awesome emitted chunk structure', 'Nine-system chunk structure comparison');
  for (const profile of ['mobile', 'desktop']) {
    for (const cache of ['cold', 'warm']) bridge(`${profile} ${cache} loading`, `Web Awesome ${profile} ${cache} loading`, `Nine-system ${profile} ${cache} loading comparison`);
    bridge(`${profile} cold response transfer`, `Web Awesome ${profile} cold response transfer`, `Nine-system ${profile} cold delivery comparison`);
    bridge(`${profile} startup click`, `Web Awesome ${profile} startup usability`, `Nine-system ${profile} startup comparison`);
    bridge(`${profile} interaction summary`, `Web Awesome ${profile} interaction summary`, `Nine-system ${profile} interaction comparison`);
    bridge(`${profile} cold main-thread work`, `Web Awesome ${profile} cold main-thread work`, `Nine-system ${profile} cold main-thread comparison`);
    bridge(`${profile} warm main-thread work`, `Web Awesome ${profile} warm main-thread work`, `Nine-system ${profile} warm main-thread comparison`);
  }
  bridge('Repeated mobile Lighthouse audits', 'Web Awesome repeated mobile Lighthouse audits', 'Nine-system mobile Lighthouse comparison');
  bridge('Memory after 50 cycles', 'Web Awesome memory after 50 cycles', 'Nine-system memory after 50 cycles comparison');
  config._historicalDOM = hDOM;
}

let domStatus = 'not configured';
if (config.dom) {
  const dm = await read(config.dom.manifestPath), snapshots = await read(config.dom.snapshotsPath), ownership = config.dom.ownershipPath ? await read(config.dom.ownershipPath) : null;
  assert(dm.completedAt, 'DOM acquisition has not finished');
  assert.equal(dm.successfulSnapshots, snapshots.filter(s => s.status === 'passed').length, 'DOM manifest success count differs from snapshots');
  assert.equal(dm.failures, snapshots.filter(s => s.status === 'failed').length, 'DOM manifest failure count differs from snapshots');
  for (const id of ids) assert(snapshots.some(s => s.system === id), `DOM acquisition missing ${id}`);
  for (const id of ids) for (const asset of inventory.systems.find(s => s.id === id).assets) assert.equal(dm.artifacts[id]?.[asset.path], asset.sha256, `DOM measured asset mismatch: ${id}/${asset.path}`);
  if (ownership) assert.equal(ownership.sources['experiments/dom-census.mjs'], dm.sources['experiments/dom-census.mjs'], 'Primary and ownership collector versions differ');
  const rows = snapshots.filter(s => s.status === 'passed');
  const snapshotKey = r => [r.system, r.session, r.stage, r.profile, r.repeat].join('/');
  assert.equal(new Set(rows.map(snapshotKey)).size, rows.length, 'Duplicate connected-DOM snapshot keys');
  const expectedKeys = [];
  for (const id of ids) {
    for (let repeat = 1; repeat <= dm.protocol.desktopRepetitions; repeat++) for (const stage of ['initial', 'after-journey']) expectedKeys.push(snapshotKey({ system: id, session: 'journey', stage, profile: 'desktop', repeat }));
    for (let repeat = 1; repeat <= dm.protocol.narrowRepetitions; repeat++) expectedKeys.push(snapshotKey({ system: id, session: 'initial-only', stage: 'initial', profile: 'narrow', repeat }));
    if ((config.dom.customDateSystems ?? ['en-reve']).includes(id)) for (let repeat = 1; repeat <= dm.protocol.desktopRepetitions; repeat++) for (const stage of ['initial', 'date-open', 'date-closed']) expectedKeys.push(snapshotKey({ system: id, session: 'date', stage, profile: 'desktop', repeat }));
  }
  const observedKeys = new Set(rows.map(snapshotKey));
  assert(rows.every(r => expectedKeys.includes(snapshotKey(r))), 'Unexpected connected-DOM snapshot slot');
  const missingKeys = expectedKeys.filter(k => !observedKeys.has(k));
  if (missingKeys.length) coverageIssues.push(`Connected-DOM successful snapshot slots missing: ${missingKeys.join(', ')}`);
  if (!ownership || ids.some(id => !ownership.rows.some(r => r.system === id))) coverageIssues.push('Initial shadow ownership coverage incomplete');
  if (ownership) assert.equal(new Set(ownership.rows.map(r => r.system)).size, ownership.rows.length, 'Duplicate ownership system snapshots');
  for (const r of rows) for (const scope of ['total', 'date', 'withoutDate']) {
    const c = r[scope]; assert.equal(c.nodes, c.elements + c.text + c.comments + c.shadowRoots + c.other, `${r.system}/${r.stage}: node categories do not reconcile`);
    for (const key of ['nodes', 'elements', 'text', 'comments', 'shadowRoots', 'other']) assert.equal(r.total[key], r.date[key] + r.withoutDate[key], `${r.system}/${r.stage}: date partition mismatch`);
  }
  domStatus = `${rows.length} successful / ${snapshots.length - rows.length} failed snapshots`;
  const pick = (id, stage = 'initial', profile = 'desktop', session = profile === 'narrow' ? 'initial-only' : 'journey') => rows.filter(s => s.system === id && s.stage === stage && s.profile === profile && s.session === session);
  const representative = (id, stage, profile, session) => {
    const group = pick(id, stage, profile, session); if (!group.length) return null;
    for (const r of group) for (const scope of ['total', 'date', 'withoutDate']) for (const key of Object.keys(group[0][scope])) assert.equal(r[scope][key], group[0][scope][key], `Unstable census ${id}/${stage}/${scope}/${key}: must report distributions rather than one representative`);
    return group[0];
  };
  section('Web Awesome connected DOM review', `Cohort **${dm.id}**; ${domStatus}. Browser: ${dm.browser}. Desktop ${dm.protocol.desktop.width} × ${dm.protocol.desktop.height}; narrow ${dm.protocol.narrow.width} × ${dm.protocol.narrow.height}; DPR ${dm.protocol.deviceScaleFactor}; CPU multiplier ${dm.protocol.cpuThrottle}; network throttling ${dm.protocol.networkThrottle}. ${pathLink(config.dom.manifestPath, 'Full DOM protocol and measured asset hashes')}. Connected-tree diagnostics include light DOM and accessible open shadow roots once, without double-counting slot assignment. Closed/UA shadow roots, disconnected templates and browser-native picker internals are not inspected. Complete date fields include labels, native controls and owned custom popups. Without-date totals are arithmetic exclusions, not rebuilt variants. Browser-native dates are not assumed free. This preserves the earlier En Reve date/base audits while extending structural coverage; it does not rerun source audits or prove CPU savings.`);
  if (dm.failures) table('Web Awesome DOM diagnostic failures', ['Implementation', 'Session', 'Profile', 'Repeat', 'Failure'], snapshots.filter(s => s.status === 'failed').map(s => [names[s.system], s.session, s.profile, s.repeat, s.error]), 'Failures remain in raw evidence; missing stages are not zero counts.', dm.id);
  table('Web Awesome connected DOM acquisition coverage', ['Implementation', 'Desktop initial snapshots', 'Desktop journey snapshots', 'Narrow initial snapshots', 'Date lifecycle snapshots', 'Ownership snapshots'], ids.map(id => [names[id], pick(id).length, pick(id, 'after-journey').length, pick(id, 'initial', 'narrow').length, rows.filter(r => r.system === id && r.session === 'date').length, ownership?.rows.filter(r => r.system === id).length ?? 0]), 'Fresh sessions keep primary initial/after-journey, custom date lifecycle and supplemental ownership separate.', dm.id);
  const fullRows = ids.map(id => { const r = representative(id); return [names[id], pick(id).length, ...['total', 'date', 'withoutDate'].flatMap(k => [r?.[k].nodes ?? '—', r?.[k].elements ?? '—'])]; });
  table('Web Awesome connected totals with and without dates', ['Implementation', 'Samples n', 'Full nodes', 'Full elements', 'Date nodes', 'Date elements', 'Without date nodes', 'Without date elements'], fullRows, 'Initial settled desktop tree. Date boundaries follow the entire field, rather than only the visible input. Current controls are remeasured with Web Awesome in the same diagnostic acquisition.', dm.id);
  for (const scope of ['total', 'withoutDate']) table(`Web Awesome ${scope === 'total' ? 'full' : 'non-date'} node composition`, ['Implementation', 'Elements', 'Text', 'Whitespace text', 'Comments', 'Open shadow roots', 'Other nodes', 'Slots', 'Base parts', 'Maximum physical depth'], ids.map(id => { const r = representative(id)?.[scope]; return [names[id], ...['elements', 'text', 'whitespaceText', 'comments', 'shadowRoots', 'other', 'slots', 'baseParts', 'maxDepth'].map(k => r?.[k] ?? '—')]; }), 'Whitespace is a subset of text. Comments can be renderer update/hydration markers and must not be mechanically removed. Physical depth includes shadow-root steps, not layout depth.', dm.id);
  table('Web Awesome connected lifecycle changes', ['Implementation', 'Initial nodes', 'After journey nodes', 'Node change', 'Initial elements', 'After journey elements', 'Element change', 'Narrow initial nodes', 'Narrow initial elements'], ids.map(id => { const a = representative(id), b = representative(id, 'after-journey'), n = representative(id, 'initial', 'narrow'); return [names[id], a?.total.nodes, b?.total.nodes, a && b ? b.total.nodes - a.total.nodes : '—', a?.total.elements, b?.total.elements, a && b ? b.total.elements - a.total.elements : '—', n?.total.nodes, n?.total.elements]; }), 'Connected lifecycle changes are not heap-retention or leak evidence. Narrow viewport retains desktop pointer behavior unless explicitly stated by the protocol.', dm.id);
  const dateRows = [];
  for (const id of ids) for (const stage of ['initial', 'date-open', 'date-closed']) { const r = representative(id, stage, 'desktop', 'date'); if (r) dateRows.push([names[id], stage, pick(id, stage, 'desktop', 'date').length, r.total.nodes, r.total.elements, r.date.nodes, r.date.elements, r.withoutDate.nodes, r.withoutDate.elements]); }
  if (dateRows.length) table('Web Awesome cohort custom-date lifecycle', ['Implementation', 'State', 'Samples n', 'Full nodes', 'Full elements', 'Date nodes', 'Date elements', 'Without date nodes', 'Without date elements'], dateRows, 'Only custom-calendar implementations have visible-grid open/closed diagnostic sessions. Native-picker browser internals are outside census scope. These measurements do not make Web Awesome native date equivalent to En Reve’s richer custom calendar.', dm.id);
  if (ownership) {
    table('Web Awesome light and shadow ownership', ['Implementation', 'Light-tree nodes', 'Shadow-tree nodes', 'Light-tree elements', 'Shadow-tree elements', 'Light whitespace', 'Shadow whitespace', 'Light comments', 'Shadow comments'], ids.map(id => { const r = ownership.rows.find(r => r.system === id), l = r?.byShadowHost['light-dom/document'], t = r?.census.total; if (!r) return [names[id], ...Array(8).fill('—')]; const repeated = representative(id); assert.equal(t.nodes, repeated.total.nodes); assert.equal(t.elements, repeated.total.elements); return [names[id], l.nodes, t.nodes - l.nodes, l.elements, t.elements - l.elements, l.whitespaceText, t.whitespaceText - l.whitespaceText, l.comments, t.comments - l.comments]; }), 'Physical ownership, not authorship or CPU cost. Host elements belong to their parent tree; their direct shadow internals, including ShadowRoot nodes, belong to that host bucket. Nested component internals belong to their own host.', config.dom.ownershipPath);
    table('Web Awesome repeated button shadow structure', ['Implementation', 'Button family', 'Instances', 'Owned nodes', 'Owned elements', 'Elements per instance', 'Slots per instance', 'Comments per instance', 'Whitespace per instance'], ids.map(id => { const family = { 'en-reve': 'en-button', 'fluent-web-components': 'fluent-button', 'web-awesome': 'wa-button' }[id], b = ownership.rows.find(r => r.system === id)?.byShadowHost[family]; return b ? [names[id], family, b.instances, b.nodes, b.elements, fmt(b.elements / b.instances, 2), fmt(b.slots / b.instances, 2), fmt(b.comments / b.instances, 2), fmt(b.whitespaceText / b.instances, 2)] : [names[id], family, ...Array(7).fill('—')]; }), 'Different native-control strategies and variant mixtures remain; this is an investigation guide, not a capability-matched microbenchmark. Slots and required semantic native controls are contracts, not automatic removal candidates.', config.dom.ownershipPath);
  }
  table('Web Awesome connected base parts', ['Implementation', 'All base parts', 'SVG base parts', 'Non-SVG base parts', 'Without-date base parts', 'Without-date non-SVG base parts'], ids.map(id => { const r = representative(id); if (!r) return [names[id], ...Array(5).fill('—')]; const svg = Object.values(r.baseOwners).filter(b => b.tag === 'svg'); return [names[id], r.total.baseParts, svg.reduce((n, b) => n + b.count, 0), r.total.baseParts - svg.reduce((n, b) => n + b.count, 0), r.withoutDate.baseParts, r.withoutDate.baseParts - svg.reduce((n, b) => n + b.withoutDate, 0)]; }), 'Part naming is a convention: no base part does not mean no wrapper. SVG bases are rendering primitives. Earlier En Reve host-migration candidates remain proposals; moving part=base to a host does not preserve a consumer ::part(base) selector.', dm.id);
  if (config._historicalDOM) {
    const h = config._historicalDOM.filter(r => r.status === 'passed' && r.stage === 'initial' && r.profile === 'desktop' && r.session === 'journey'), seen = new Set(), combined = [];
    for (const r of h) if (!seen.has(r.system)) { seen.add(r.system); combined.push([names[r.system], 'Historical dom-review-v4', r.total.nodes, r.total.elements, r.date.nodes, r.date.elements, r.withoutDate.nodes, r.withoutDate.elements]); }
    const w = representative('web-awesome'); if (w) combined.push([names['web-awesome'], dm.id, w.total.nodes, w.total.elements, w.date.nodes, w.date.elements, w.withoutDate.nodes, w.withoutDate.elements]);
    table('Nine-system connected DOM with acquisition labels', ['Implementation', 'Acquisition', 'Full nodes', 'Full elements', 'Date nodes', 'Date elements', 'Without date nodes', 'Without date elements'], combined, 'Descriptive initial-tree census across retained historical and new acquisitions. Explicit date boundaries improve capability interpretation but do not erase browser/source differences. Same-acquisition controls and lifecycle checks appear above; this table does not replace the original audited evidence.', 'dom-review-v4 plus new DOM acquisition');
  }
}

section('Web Awesome implications and next investigations', config.findings ?? 'Use within-cohort En Reve gaps to prioritize measured user-visible differences; then use transfer, trace, source coverage and connected ownership to choose one-factor experiments. Check startup and first/repeated actions together before treating deferral as a win. Retain the existing deferred-calendar, host-surface and repeated-button investigations; the new native-date reference is not a substitute for En Reve’s custom calendar contract. Every candidate should preserve native semantics, named/default slots, form behavior, theme styling, accessibility and SSR/hydration contracts, and should rerun these same acquisitions against the frozen reference.');
if (config.followUps) table('Web Awesome prioritized En Reve investigations', ['Priority', 'Investigation', 'Evidence', 'Next experiment', 'Acceptance'], config.followUps, 'Proposed implementation work for later. Keep the frozen source and capability differences explicit; structural or timing correlations are hypotheses until a controlled change improves the intended end-user metric.', 'new acquisition and retained En Reve source audit');
section('Web Awesome coverage boundaries', 'No production field/RUM evidence, SSR/hydration performance, physical-device validation, assistive-technology benchmark, routed soft-navigation metric, or realistic image/video workload is established by these fixtures. Native calendar UI internals are outside the connected census. Memory sessions remain exploratory. The inspired En Reve theme is functionally/visually qualified separately; its presence is not included in the frozen En Reve performance control. Missing measurements remain explicit rather than inferred from another suite or historical campaign.');

if (coverageIssues.length) section('Web Awesome pending evidence qualification', coverageIssues.map(issue => `- ${issue}`).join('\n'));
const body = sections.join('\n'), out = resolve(root, 'reports/web-awesome');
await mkdir(out, { recursive: true });
const standalone = resolve(root, '../../plans/native-showcase-web-awesome-results.md');
await writeFile(standalone, body.replace(/^## Web Awesome comparison/, '# Web Awesome comparison'));
await writeFile(resolve(out, 'tables.json'), json({ schema: 1, generatedAt: new Date().toISOString(), status: complete && !coverageIssues.length ? 'complete' : 'collecting', coverageIssues, systems: ids, campaigns: Object.fromEntries(Object.entries(campaigns).map(([suite, c]) => [suite, { id: c.id, expected: c.manifest?.jobs.length ?? null, observed: c.samples.length, successful: c.samples.filter(s => s.status === 'ok').length, failed: c.samples.filter(s => s.status !== 'ok').length, completed: c.completed, rawHash: c.rawHash }])), domStatus, tables, distributions, contrasts, deliveryReplays, analysisSources, inputs: inputReceipts, reportSha256: sha(body) }));
if (opts.integrate) {
  assert(complete, 'Refusing to integrate an incomplete acquisition');
  assert.equal(coverageIssues.length, 0, `Refusing to integrate incomplete supporting evidence: ${coverageIssues.join('; ')}`);
  const main = resolve(root, '../../plans/native-showcase-performance-results.md'), old = await readFile(main, 'utf8');
  const without = old.replace(/\n<!-- BEGIN WEB AWESOME -->[\s\S]*?<!-- END WEB AWESOME -->\n?/, '\n');
  const integrated = integrateWebAwesomeMain(without, await read(config.historicalTablesPath ?? 'reports/pass2-tables.json'), { tables });
  await writeFile(resolve(out, 'main-integration.json'), json({schema:1, generatedAt:new Date().toISOString(), sourceMainSha256:sha(old), tables:integrated.receipts}));
  await writeFile(main, integrated.markdown.trimEnd() + '\n\n<!-- BEGIN WEB AWESOME -->\n' + body + '<!-- END WEB AWESOME -->\n');
}
console.log(json({ status: complete && !coverageIssues.length ? 'complete' : 'collecting', coverageIssues, tables: tables.length, rows: tables.reduce((n, t) => n + t.rows.length, 0), domStatus, standalone, integrated: !!opts.integrate }));
