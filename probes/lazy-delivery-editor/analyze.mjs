import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

export const arms = ['reference', 'candidate', 'rollback'];
export const configurations = [
  ...['chromium', 'firefox', 'webkit'].flatMap(browser => ['desktop', 'phone'].map(profile => ({browser, profile}))),
  {browser: 'chromium', profile: 'constrained'},
];
export const timingMetrics = ['startupMs', 'firstSelectionMs', 'focusMs', 'repeatSelectionMs'];
export const countMetrics = ['startupToolbarNodes', 'startupRouteNodes', 'entryGzipBytes', 'settledGzipBytes', 'entryRequests', 'settledRequests'];
export const metrics = [...timingMetrics, ...countMetrics];
export const bootstrap = {seed: 20260928, draws: 5000, confidence: 0.95};
const minimumSamples = 100;
const route = '/api-examples/rich-text.html';
const cellKey = value => typeof value?.browser === 'string' && typeof value?.profile === 'string' ? `${value.browser}/${value.profile}` : undefined;
const jobKey = value => JSON.stringify([value.arm, value.browser, value.profile, value.block]);
const finite = value => typeof value === 'number' && Number.isFinite(value);
const validMetric = (name, value) => finite(value) && value >= 0 && (!countMetrics.includes(name) || Number.isSafeInteger(value))
  && (!['startupToolbarNodes', 'startupRouteNodes'].includes(name) || value > 0);
const cleanSuccess = row => row.status === 'ok' && row.error == null && Array.isArray(row.errors) && !row.errors.length
  && Array.isArray(row.failures) && !row.failures.length && metrics.every(name => validMetric(name, row.metrics?.[name]))
  && typeof row.id === 'string' && row.id.length > 0 && arms.includes(row.arm) && configurations.some(configuration => cellKey(configuration) === cellKey(row))
  && Number.isSafeInteger(row.block) && row.block >= 0
  && row.actualRegistry === 'global' && row.requestedRegistry === 'production-global'
  && row.metrics.startupToolbarNodes <= row.metrics.startupRouteNodes;

// Empirical percentiles use the observation at ceil(p * n), with one-based rank.
export function nearestRank(sorted, probability) {
  if (!sorted.length) return null;
  return sorted[Math.max(0, Math.min(sorted.length - 1, Math.ceil(probability * sorted.length) - 1))];
}

export function describe(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const n = sorted.length;
  return {
    n,
    median: n ? (sorted[Math.floor((n - 1) / 2)] + sorted[Math.floor(n / 2)]) / 2 : null,
    p75: nearestRank(sorted, 0.75),
    p95: n >= minimumSamples ? nearestRank(sorted, 0.95) : null,
    min: n ? sorted[0] : null,
    max: n ? sorted[n - 1] : null,
  };
}

function binomialCdf(n, probability) {
  // Start at a mode: outward probability ratios are <= 1, avoiding p^n
  // underflow for large campaigns. Normalize relative weights before summing.
  const weights = new Float64Array(n + 1), mode = Math.floor((n + 1) * probability);
  weights[mode] = 1;
  for (let index = mode; index > 0; index--) weights[index - 1] = weights[index] * index / (n - index + 1) * (1 - probability) / probability;
  for (let index = mode; index < n; index++) weights[index + 1] = weights[index] * (n - index) / (index + 1) * probability / (1 - probability);
  let total = 0, correction = 0;
  for (const weight of weights) {
    const adjusted = weight - correction, next = total + adjusted;
    correction = (next - total) - adjusted;total = next;
  }
  const cdf = new Float64Array(n + 1);
  let cumulative = 0;correction = 0;
  for (let index = 0; index <= n; index++) {
    const adjusted = weights[index] - correction, next = cumulative + adjusted;
    correction = (next - cumulative) - adjusted;cumulative = next;
    cdf[index] = Math.min(1, cumulative / total);
  }
  cdf[n] = 1;
  return cdf;
}

/** Binomial-inverted bound on a population quantile; ranks are one-based. */
export function quantileBound(values, {side = 'upper', probability = 0.95, confidence = 0.95} = {}) {
  if (!['upper', 'lower'].includes(side) || !finite(probability) || !finite(confidence) || !(probability > 0 && probability < 1) || !(confidence > 0 && confidence < 1)
    || !values.every(finite)) throw new TypeError('Quantile bounds require finite observations, an upper/lower side, and probabilities between zero and one.');
  const sorted = [...values].sort((left, right) => left - right), n = sorted.length;
  const metadata = {method: 'binomial-inverted-order-statistic', side, probability, confidence, n};
  if (!n) return {...metadata, value: null, rank: null, achievedCoverage: null, maximumFiniteCoverage: 0, neighborRank: null, neighborCoverage: null, reason: 'No observations.'};
  const cdf = binomialCdf(n, probability);
  // For B~Bin(n,p), P(q_p <= X_(r)) >= P(B <= r-1), and
  // P(X_(r) <= q_p) >= P(B >= r). Ties make these bounds conservative.
  const coverage = rank => side === 'upper' ? cdf[rank - 1] : 1 - cdf[rank - 1];
  const maximumFiniteCoverage = side === 'upper' ? coverage(n) : coverage(1);
  for (let rank = side === 'upper' ? 1 : n; rank >= 1 && rank <= n; rank += side === 'upper' ? 1 : -1) {
    const achievedCoverage = coverage(rank);
    if (achievedCoverage < confidence) continue;
    const neighbor = rank + (side === 'upper' ? -1 : 1), hasNeighbor = neighbor >= 1 && neighbor <= n;
    return {...metadata, value: sorted[rank - 1], rank, achievedCoverage, maximumFiniteCoverage,
      neighborRank: hasNeighbor ? neighbor : null, neighborCoverage: hasNeighbor ? coverage(neighbor) : null};
  }
  return {...metadata, value: null, rank: null, achievedCoverage: null, maximumFiniteCoverage,
    neighborRank: null, neighborCoverage: null, reason: 'No finite sample order statistic attains the requested confidence.'};
}

/** Bonferroni coverage does not assume independence between paired arms. */
export function p95DifferenceUpper(blocks, left, right) {
  const leftUpper = quantileBound(blocks.map(block => block[left]), {side: 'upper', confidence: 0.975});
  const rightLower = quantileBound(blocks.map(block => block[right]), {side: 'lower', confidence: 0.975});
  const available = finite(leftUpper.value) && finite(rightLower.value);
  return {
    method: 'bonferroni-binomial-order-statistic-difference', confidence: 0.95, n: blocks.length,
    left, right, leftUpper, rightLower,
    value: available ? leftUpper.value - rightLower.value : null,
    achievedCoverageLowerBound: available ? Math.max(0, leftUpper.achievedCoverage + rightLower.achievedCoverage - 1) : null,
    ...(available ? {} : {reason: 'Both finite one-sided 97.5% component bounds are required.'}),
  };
}

/** Preserve torn/invalid append-only records as explicit diagnostic events. */
export function parseSampleJournal(text) {
  return text.split('\n').flatMap((line, index) => {
    if (!line.trim()) return [];
    try {return [JSON.parse(line)];}
    catch (error) {return [{status: 'malformed-json', line: index + 1, rawLine: line, parseError: error.message}];}
  });
}

function randomizer(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const percentile95 = values => nearestRank([...values].sort((left, right) => left - right), 0.95);
const interval = values => {
  const sorted = values.sort((left, right) => left - right);
  return [nearestRank(sorted, 0.025), nearestRank(sorted, 0.975)];
};
const comparisons = [
  ['candidateMinusReference', 'candidate', 'reference'],
  ['rollbackMinusReference', 'rollback', 'reference'],
  ['candidateMinusRollback', 'candidate', 'rollback'],
];

/** Each block contains all three numeric arm observations; resample whole blocks. */
export function pairedP95(blocks) {
  if (blocks.length < minimumSamples) return {n: blocks.length, absolute: null, changes: null, reason: 'At least 100 complete successful matched blocks required.'};
  const point = Object.fromEntries(arms.map(arm => [arm, percentile95(blocks.map(block => block[arm]))]));
  const changeDraws = Object.fromEntries(comparisons.map(([name]) => [name, []]));
  // Resetting to this seed uses identical block draws across metrics in each cell.
  const random = randomizer(bootstrap.seed);
  for (let draw = 0; draw < bootstrap.draws; draw++) {
    const selected = Array.from({length: blocks.length}, () => blocks[Math.floor(random() * blocks.length)]);
    const values = Object.fromEntries(arms.map(arm => [arm, percentile95(selected.map(block => block[arm]))]));
    for (const [name, left, right] of comparisons) changeDraws[name].push(values[left] - values[right]);
  }
  return {
    n: blocks.length,
    absolute: Object.fromEntries(arms.map(arm => [arm, {p95: point[arm], upper95: quantileBound(blocks.map(block => block[arm]))}])),
    changes: Object.fromEntries(comparisons.map(([name, left, right]) => [name, {
      difference: point[left] - point[right],
      percent: point[right] > 0 ? (point[left] - point[right]) / point[right] * 100 : null,
      approximateBootstrapCi95: interval(changeDraws[name]),
      upper95: p95DifferenceUpper(blocks, left, right),
    }])),
  };
}

function thresholdGate(name, value, limit, confidenceBound, eligible) {
  const upperBound = confidenceBound?.value ?? null;
  return {
    name, value, operator: '<=', limit, upper95: upperBound, confidenceBound: confidenceBound ?? null,
    empiricalPass: eligible && finite(value) ? value <= limit : null,
    uncertaintyQualified: eligible && finite(value) && finite(upperBound) ? value <= limit && upperBound <= limit : null,
  };
}

function deterministicGate(name, values, operator, limit, eligible) {
  const pass = value => operator === '>=' ? value >= limit : value <= limit;
  const failing = values.filter(({value}) => !pass(value));
  return {
    name, operator, limit, n: values.length,
    min: values.length ? Math.min(...values.map(row => row.value)) : null,
    max: values.length ? Math.max(...values.map(row => row.value)) : null,
    failedBlocks: failing.map(({block, value}) => ({block, value})),
    empiricalPass: eligible && values.length >= minimumSamples ? failing.length === 0 : null,
    uncertaintyQualified: eligible && values.length >= minimumSamples ? failing.length === 0 : null,
    rule: 'Every matched block must satisfy this deterministic bound; no percentile or averaging.',
  };
}

/** Pure analysis; malformed or incomplete input produces a nonqualifying receipt. */
export function analyzeCampaign(manifest, samples, summary) {
  const issues = [];
  const require = (condition, code, detail) => {if (!condition) issues.push({code, detail});};
  require(manifest?.schemaVersion === 1, 'manifest-schema', 'Expected schemaVersion 1.');
  require(manifest?.kind === 'timing', 'manifest-kind', 'Only timing campaigns are accepted.');
  require(manifest?.qualification === false, 'qualification-run', 'Qualification/smoke samples must never become timing evidence.');
  require(manifest?.route === route, 'manifest-route', `Expected unchanged production route ${route}.`);
  require(manifest?.actualRegistry === 'global', 'manifest-registry', 'This actual production route campaign is global only.');
  const jobs = Array.isArray(manifest?.jobs) ? manifest.jobs : [];
  require(Array.isArray(manifest?.jobs), 'manifest-jobs', 'Manifest jobs must be an array.');
  require(Array.isArray(samples), 'samples', 'Samples must be an array.');
  const events = Array.isArray(samples) ? samples : [];
  samples = [];
  const configKeys = new Set(configurations.map(cellKey));
  const jobIds = new Map(), jobKeys = new Set(), rowsById = new Map();
  for (const [index, job] of jobs.entries()) {
    if (!job || typeof job !== 'object') {require(false, 'invalid-job', {index});continue;}
    require(typeof job.id === 'string' && job.id.length > 0, 'job-id', {index});
    require(!jobIds.has(job.id), 'duplicate-job-id', {id: job.id});
    require(!jobKeys.has(jobKey(job)), 'duplicate-job-block', {id: job.id, identity: jobKey(job)});
    require(arms.includes(job.arm) && configKeys.has(cellKey(job)) && Number.isSafeInteger(job.block) && job.block >= 0,
      'job-configuration', {id: job.id, identity: jobKey(job)});
    jobIds.set(job.id, job);jobKeys.add(jobKey(job));
  }
  const failures = [], starts = new Set();
  const counts = {planned: jobs.length, events: events.length, started: 0, terminal: 0, succeeded: 0, cleanSuccessful: 0, failed: 0, aborted: 0, unknownStatus: 0, problemRows: 0};
  let activeJobId;
  for (const [index, event] of events.entries()) {
    if (!event || typeof event !== 'object') {require(false, 'invalid-sample', {index});counts.unknownStatus++;continue;}
    require(event.job && typeof event.job === 'object', 'sample-job', {index});
    const row = {...event, ...Object.fromEntries(['id', 'arm', 'browser', 'profile', 'block'].map(key => [key, event.job?.[key]]))};
    const job = jobIds.get(row.id);
    require(!!job && jobKey(job) === jobKey(row), 'unexpected-sample', {index, id: row.id, identity: jobKey(row)});
    if (row.status === 'started') {
      counts.started++;
      require(!starts.has(row.id), 'duplicate-start', {index, id: row.id});
      require(activeJobId === undefined, 'overlapping-start', {index, id: row.id, activeJobId});
      require(jobs[counts.terminal]?.id === row.id, 'start-order', {index, expected: jobs[counts.terminal]?.id, actual: row.id});
      starts.add(row.id);activeJobId = row.id;
      continue;
    }
    if (!['ok', 'failed', 'aborted'].includes(row.status)) {
      counts.unknownStatus++;require(false, 'sample-status', {index, id: row.id, status: row.status});
      failures.push({eventIndex: index, ...row});continue;
    }
    require(activeJobId === row.id && starts.has(row.id), 'terminal-without-active-start', {index, id: row.id, activeJobId});
    activeJobId = undefined;
    require(jobs[counts.terminal]?.id === row.id, 'sample-order', {index, expected: jobs[counts.terminal]?.id, actual: row.id});
    counts.terminal++;samples.push(row);
    require(!rowsById.has(row.id), 'duplicate-sample-id', {id: row.id});
    rowsById.set(row.id, row);
    if (row.status === 'ok') require(row.actualRegistry === 'global' && row.requestedRegistry === 'production-global', 'sample-registry', {id: row.id, actual: row.actualRegistry, requested: row.requestedRegistry});
    require(Array.isArray(row.errors) && Array.isArray(row.failures), 'sample-error-lists', {id: row.id});
    if (row.status === 'ok') counts.succeeded++;
    else if (row.status === 'failed') counts.failed++;
    else if (row.status === 'aborted') counts.aborted++;
    if (cleanSuccess(row)) counts.cleanSuccessful++;
    const problems = !cleanSuccess(row);
    if (problems) {
      counts.problemRows++;
      failures.push({eventIndex: index, ...row});
    }
    if (row.status === 'ok') {
      for (const name of metrics) require(validMetric(name, row.metrics?.[name]), 'invalid-metric', {id: row.id, metric: name, value: row.metrics?.[name]});
      if (validMetric('startupToolbarNodes', row.metrics?.startupToolbarNodes) && validMetric('startupRouteNodes', row.metrics?.startupRouteNodes)) {
        require(row.metrics.startupToolbarNodes <= row.metrics.startupRouteNodes, 'node-scope', {id: row.id});
      }
    }
  }
  require(activeJobId === undefined, 'unterminated-start', {activeJobId});
  for (const job of jobIds.values()) require(rowsById.has(job.id), 'missing-sample', {id: job.id});
  require(summary?.planned === counts.planned && summary?.terminal === counts.terminal && summary?.succeeded === counts.succeeded,
    'summary-counts', {expected: counts, received: summary});
  require(summary?.status === 'complete', 'incomplete-summary', {status: summary?.status});
  require(summary?.qualification === false, 'qualification-summary', 'Qualification/smoke runs are excluded.');
  for (const name of ['preparationUnchanged', 'harnessUnchanged', 'runtimeUnchanged', 'installationUnchanged', 'installationPreparedMatch']) {
    require(summary?.verification?.[name] === true, 'final-verification', {name, value: summary?.verification?.[name]});
  }
  require(typeof manifest?.runtime?.digest === 'string' && manifest.runtime.digest.length > 0
    && summary?.verification?.runtimeAfter?.digest === manifest.runtime.digest, 'runtime-identity', 'Final runtime digest must match the captured initial runtime digest.');
  require(typeof manifest?.installation?.digest === 'string' && manifest.installation.digest.length > 0
    && summary?.verification?.installationAfter?.digest === manifest.installation.digest, 'installation-identity', 'Final execution installation digest must match the captured initial installation digest.');
  require(counts.terminal === counts.planned, 'incomplete-schedule', {planned: counts.planned, terminal: counts.terminal});
  require(counts.started === counts.planned, 'incomplete-starts', {planned: counts.planned, started: counts.started});

  const preparedCells = configurations.map(configuration => {
    const planned = Object.fromEntries(arms.map(arm => [arm, jobs.filter(job => job && cellKey(job) === cellKey(configuration) && job.arm === arm)]));
    const byArm = Object.fromEntries(arms.map(arm => [arm, samples.filter(row => row && cellKey(row) === cellKey(configuration) && row.arm === arm)]));
    const blocks = Object.fromEntries(arms.map(arm => [arm, planned[arm].map(job => job.block).filter(block => Number.isSafeInteger(block) && block >= 0).sort((a, b) => a - b)]));
    for (const arm of arms) {
      require(planned[arm].length >= minimumSamples, 'insufficient-planned-blocks', {...configuration, arm, n: planned[arm].length});
      require(JSON.stringify(blocks[arm]) === JSON.stringify(blocks.reference), 'unmatched-planned-blocks', {...configuration, arm});
      const good = byArm[arm].filter(cleanSuccess);
      require(good.length >= minimumSamples, 'insufficient-successful-samples', {...configuration, arm, n: good.length});
    }
    const matched = [...new Set(blocks.reference)].map(block => ({block, ...Object.fromEntries(arms.map(arm => [arm,
      byArm[arm].find(row => row.block === block && cleanSuccess(row)),
    ]))})).filter(block => arms.every(arm => block[arm]));
    require(matched.length >= minimumSamples, 'insufficient-matched-blocks', {...configuration, n: matched.length});
    return {configuration, planned, byArm, matched};
  });
  const eligible = issues.length === 0 && counts.problemRows === 0;
  const cells = preparedCells.map(({configuration, planned, byArm, matched}) => {
    const absolute = Object.fromEntries(arms.map(arm => [arm, Object.fromEntries(metrics.map(name => [name,
      describe(byArm[arm].filter(cleanSuccess).map(row => row.metrics[name])),
    ]))]));
    const timing = Object.fromEntries(timingMetrics.map(name => [name, eligible ? pairedP95(matched.map(block =>
      Object.fromEntries(arms.map(arm => [arm, block[arm].metrics[name]])),
    )) : {n: matched.length, absolute: null, changes: null, reason: 'Uncertainty withheld for incomplete, invalid or failed campaigns.'}]));
    const deterministicChanges = Object.fromEntries(countMetrics.map(name => [name, Object.fromEntries(comparisons.map(([comparison, left, right]) => [comparison,
      describe(matched.map(block => block[left].metrics[name] - block[right].metrics[name])),
    ]))]));
    const gates = [];
    for (const name of timingMetrics) {
      const estimate = timing[name];
      if (name !== 'startupMs') {
        const ceiling = name === 'repeatSelectionMs' ? 100 : configuration.profile === 'desktop' ? 50 : 100;
        gates.push(thresholdGate(`${name}:candidate-p95`, estimate.absolute?.candidate.p95 ?? null, ceiling, estimate.absolute?.candidate.upper95, eligible));
      }
      const change = estimate.changes?.candidateMinusReference;
      gates.push(thresholdGate(`${name}:p95-regression`, change?.difference ?? null, name === 'startupMs' ? 16 : 10, change?.upper95, eligible));
    }
    const nodeBenefits = matched.map(block => {
      const reference = block.reference.metrics, candidate = block.candidate.metrics;
      return {block: block.block,
        toolbarRemoved: reference.startupToolbarNodes - candidate.startupToolbarNodes,
        toolbarReductionPercent: (reference.startupToolbarNodes - candidate.startupToolbarNodes) / reference.startupToolbarNodes * 100,
        routeRemoved: reference.startupRouteNodes - candidate.startupRouteNodes,
        routeReductionPercent: (reference.startupRouteNodes - candidate.startupRouteNodes) / reference.startupRouteNodes * 100,
      };
    });
    for (const [name, limit] of [['toolbarRemoved', 100], ['toolbarReductionPercent', 60], ['routeReductionPercent', 5]]) {
      gates.push(deterministicGate(name, nodeBenefits.map(row => ({block: row.block, value: row[name]})), '>=', limit, eligible));
    }
    for (const name of ['entryGzipBytes', 'settledGzipBytes', 'entryRequests', 'settledRequests']) {
      gates.push(deterministicGate(`${name}:candidate-minus-reference`, matched.map(block => ({block: block.block,
        value: block.candidate.metrics[name] - block.reference.metrics[name],
      })), '<=', name.endsWith('GzipBytes') ? 4096 : 0, eligible));
    }
    return {
      ...configuration, requestedRegistry: 'production-global', actualRegistry: 'global',
      counts: Object.fromEntries(arms.map(arm => [arm, {planned: planned[arm].length, terminal: byArm[arm].length,
        succeeded: byArm[arm].filter(row => row.status === 'ok').length, cleanSuccessful: byArm[arm].filter(cleanSuccess).length, failed: byArm[arm].filter(row => row.status === 'failed').length,
        aborted: byArm[arm].filter(row => row.status === 'aborted').length}])),
      matchedSuccessfulBlocks: matched.map(block => block.block), absolute, timing, deterministicChanges, nodeBenefits, gates,
      empiricalPass: eligible ? gates.every(gate => gate.empiricalPass === true) : null,
      uncertaintyQualified: eligible ? gates.every(gate => gate.uncertaintyQualified === true) : null,
    };
  });
  return {
    schemaVersion: 1, subject: 'editor-contextual-toolbar', route,
    scope: 'Matched actual production global route timing, delivery counts and startup connected nodes only.',
    methodology: {
      minimumSuccessfulSamplesPerArmCell: minimumSamples, arms, configurations,
      quantiles: 'Median averages the two middle observations when n is even. p75/p95 and interval endpoints use nearest rank ceil(p*n). p95 is withheld below n=100.',
      absoluteUncertainty: 'One-sided binomial-inverted order-statistic bound: choose the smallest rank r with P(Bin(n,0.95) <= r-1) >= 0.95. At n=100 this is rank 99. Report attained coverage and rank; no finite bound leaves the gate unqualified.',
      differenceUncertainty: 'Authoritative delta upper = left-arm one-sided 97.5% quantile upper minus right-arm one-sided 97.5% quantile lower. Bonferroni gives coverage at least coverage(left upper)+coverage(right lower)-1 >= 95%, without independence between paired arms. Report both ranks and attained joint-coverage lower bound.',
      confidenceAssumptions: 'Binomial coverage is distribution-free for independent observations from the same distribution within an arm/cell; ties are conservative. Drift/dependence across blocks can violate that assumption. These are per-gate bounds, with no campaign-wide multiplicity adjustment.',
      bootstrap: {...bootstrap, authoritative: false, randomizer: '32-bit LCG: state = (1664525 * state + 1013904223) modulo 2^32; uniform = state/2^32. Blocks sorted numerically; same seed reset for every cell/metric.', method: 'Approximate descriptive paired-block percentile bootstrap of differences of arm p95s, retaining within-block covariance. It illustrates empirical sampling sensitivity; finite-sample tail coverage is not guaranteed and its nominal 95% intervals do not authorize acceptance. No multiplicity correction.'},
      gateDecision: 'Empirical p95 gates and binomial-based confidence qualification are reported separately. A point failure fails; a conservative bound crossing its unchanged numeric ceiling remains unqualified. Every deterministic block must pass.',
      deltaSign: 'Candidate minus reference (and named alternative comparisons): positive latency/bytes/requests is added cost. Node removal/reduction: positive is saving.',
      reruns: 'No trimming, zero-filling, substituted failures or pooled campaigns. Input must exactly match one complete manifest schedule.',
    },
    inputs: {manifest, summary}, journal: events.map((event, index) => ({index, status: event?.status, job: event?.job, at: event?.at, signal: event?.signal})), counts, failures,
    validation: {valid: issues.length === 0, issues},
    empiricalPass: eligible ? cells.every(cell => cell.empiricalPass) : null,
    uncertaintyQualified: eligible ? cells.every(cell => cell.uncertaintyQualified) : null,
    qualifiedForMeasuredGates: eligible && cells.every(cell => cell.uncertaintyQualified),
    cells,
    limits: [
      'This analysis does not qualify functional ownership, SSR, physical touch, assistive technology or lifecycle retention; those remain separate gates.',
      'focusMs uses a separate fresh browser/context and measures native focus() requested in the first eligible editor-state event, before deferred controls render. Existing Alt+F10 priority remains a separate functional check.',
      'Entry/settled bytes are emitted JavaScript asset gzip receipt bytes; server-produced HTML/CSS are excluded. Settled observations are cumulative after repeat selection plus 500 ms; the separate never-used snapshot precedes first selection.',
      'Request scalars establish no increase in script request counts. The acquisition harness separately rejects external executable resources; this is not a request-identity comparison.',
      'Phone viewport and Chromium CPU throttling are emulation, not physical-device measurements. No scoped-registry result is inferred.',
    ],
  };
}

async function main() {
  const options = Object.fromEntries(process.argv.slice(2).map(value => {
    const match = /^--(input|output)=(.+)$/.exec(value);
    if (!match) throw new Error(`Unknown argument ${value}; use --input=/campaign --output=/fresh-comparison.json.`);
    return [match[1], match[2]];
  }));
  if (!options.input) throw new Error('Set --input to one frozen campaign directory containing manifest.json, samples.jsonl and summary.json.');
  const input = resolve(options.input), output = resolve(options.output ?? resolve(input, 'comparison.json'));
  const [manifestText, samplesText, summaryText] = await Promise.all([
    readFile(resolve(input, 'manifest.json'), 'utf8'), readFile(resolve(input, 'samples.jsonl'), 'utf8'), readFile(resolve(input, 'summary.json'), 'utf8'),
  ]);
  const samples = parseSampleJournal(samplesText);
  const result = analyzeCampaign(JSON.parse(manifestText), samples, JSON.parse(summaryText));
  result.inputDirectory = input;
  result.inputSha256 = Object.fromEntries([['manifest.json', manifestText], ['samples.jsonl', samplesText], ['summary.json', summaryText]]
    .map(([name, text]) => [name, createHash('sha256').update(text).digest('hex')]));
  await writeFile(output, JSON.stringify(result, null, 2) + '\n', {flag: 'wx'});
  console.log(JSON.stringify({output, counts: result.counts, valid: result.validation.valid,
    empiricalPass: result.empiricalPass, uncertaintyQualified: result.uncertaintyQualified, qualifiedForMeasuredGates: result.qualifiedForMeasuredGates}));
  if (!result.qualifiedForMeasuredGates) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
