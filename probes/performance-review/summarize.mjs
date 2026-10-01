import { readFile } from 'node:fs/promises';

for (const path of process.argv.slice(2)) {
  const report = JSON.parse(await readFile(path, 'utf8'));
  const compact = asset => ({ path: asset.path, raw: asset.raw, gzip9: asset.gzip9, brotli11: asset.brotli11 });
  const names = resources => new Set((resources ?? []).map(resource => new URL(resource.name).pathname.replace(/^\//, '')));
  const initialPaths = names(report.runs[0]?.clientReady?.resources);
  const endPaths = names(report.runs[0]?.end?.resources);
  const initialAssets = report.assets.filter(asset => asset.path === 'index.html' || initialPaths.has(asset.path));
  console.log(JSON.stringify({
    path,
    sha256: report.assets[0].sha256,
    buildChanged: report.buildChangedDuringProbe,
    scenario: report.scenario,
    environment: report.environment,
    browser: report.browser,
    html: compact(report.assets[0]),
    initialAssets: initialAssets.map(compact),
    initialTotals: Object.fromEntries(['raw', 'gzip9', 'brotli11'].map(key => [key, initialAssets.reduce((sum, asset) => sum + asset[key], 0)])),
    lazyAssets: report.assets.filter(asset => endPaths.has(asset.path) && !initialPaths.has(asset.path)).map(compact),
    styles: { roots: report.styles.dsdRoots, count: report.styles.count, raw: report.styles.rawBytes, unique: report.styles.uniqueBytes },
    runs: report.runs.map(run => ({
      sample: run.sample, failure: run.failure, errors: run.errors, sha256: run.htmlSha256,
      serverRenderedPaint: run.serverRendered?.paints,
      clientPaint: run.clientReady?.paints,
      lcp: run.clientReady?.observations?.lcp?.at(-1),
      clientReleaseToAppUpdatedMs: run.clientReleaseToAppUpdatedMs,
      navigationToObservedAppUpdatedMs: run.navigationToObservedAppUpdatedMs,
      initialLongtasks: run.clientReady?.observations?.longtasks,
      initialHighlights: run.initialHighlights,
      themeClickToTwoFramesMs: run.themes?.map(theme => ({ mode: theme.mode, ms: theme.observations.clicks.at(-1)?.toTwoFramesMs })),
      disclosureHighlightReadyMs: run.disclosures?.map(disclosure => ({ id: disclosure.id, ms: disclosure.observations.highlightReady?.filter(item => item.id === disclosure.id).at(-1)?.afterClickMs, actualCodeHasRanges: disclosure.actualCodeHasRanges })),
      idle: run.idleHalfSecond,
      finalLongtasks: run.end?.observations?.longtasks,
    })),
  }, null, 2));
}
