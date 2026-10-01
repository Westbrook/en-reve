import {retentionAcceptance, OBSERVED_DOCUMENT_MOTION, retentionReceiptIssues} from './reveal-retention-acceptance.mjs';
import {median, quantile} from 'simple-statistics';
import {describe} from './analysis.mjs';
import {rng} from './config.mjs';

const ITERATIONS = 10000;
const ARMS = ['reference', 'candidate'];
const WORKLOADS = ['activity', 'document'];
const CONFIGURATIONS = [
  {browser: 'chromium', profile: 'desktop'},
  {browser: 'firefox', profile: 'desktop'},
  {browser: 'webkit', profile: 'desktop'},
  {browser: 'chromium', profile: 'mobile'},
];
const ENDPOINTS = ['initial', 'repeat'].flatMap(endpoint =>
  ['firstAlignedMs', 'stableSixFramesMs'].map(metric => ({endpoint, metric, key: `${endpoint}.${metric}`})));
const CHECKPOINTS = [0, 10, 50, 100];
const RETENTION_CASES = ['completion', 'supersession', 'trusted-interruption', 'active-removal'];
const RETENTION_METRICS = ['jsHeapUsedBytes', 'documents', 'nodes', 'jsEventListeners'];
const ARM_METHOD = 'Independent-arm percentile bootstrap of medians; whole vectors are resampled, never endpoints, checkpoints or shared block pairs.';
const DIRECTION = 'Changes are candidate minus reference. Positive latency, bytes, resource growth and slope mean greater cost; negative changes mean less cost. Heap relative-growth changes are percentage points.';

const QUALIFICATION_FIELDS = ['offset','scrollHeight','clientHeight','targetTop','targetBottom','targetLeft','targetRight','targetHeight','viewportTop','viewportBottom','viewportLeft','viewportRight','viewportWidth','itemCount','targetKey','modelRevision','modelAnchorOffset','modelTotalSize','mountedKeys','interaction'];
const ATTEMPTED_STATUSES = ['ok', 'failed', 'unsupported', 'aborted', 'running'];

/** Pure off/on qualification accounting. Planned not-run rows are not attempts.
 * Missing/failed sides cannot produce an observed geometry mismatch. Their raw
 * job status, reason and errors remain attached; contention is not reclassified.
 */
export function qualificationAgreement(samples) {
  if (!Array.isArray(samples)) throw Error('Qualification samples must be an array');
  const comparisons = [];
  for (const workload of WORKLOADS) for (const arm of ARMS) for (const configuration of CONFIGURATIONS) {
    const rows = samples.filter(row => row?.workload === workload && row.arm === arm
      && row.browser === configuration.browser && row.profile === configuration.profile && row.lane === 'timing');
    const sides = Object.fromEntries(['off','on'].map(observer => {
      const matches = rows.filter(row => row.observer === observer);
      return [observer, {records: matches.length, jobs: matches.map(row => ({id: row.id, status: row.status ?? 'missing-status',
        reason: row.reason ?? null, errors: row.errors ?? []}))}];
    }));
    const issues = [];
    for (const observer of ['off','on']) if (sides[observer].records > 1) issues.push(`Duplicate ${observer} jobs`);
    if (rows.some(row => !['off','on'].includes(row.observer))) issues.push('Unexpected observer variant');
    if (rows.some(row => ![...ATTEMPTED_STATUSES, 'not-run'].includes(row.status))) issues.push('Missing or unexpected job status');
    const endpoints = ['initial','repeat'].map(endpoint => {
      const finals = {}, unavailable = [];
      for (const observer of ['off','on']) {
        const matches = rows.filter(row => row.observer === observer);
        if (matches.length !== 1) { unavailable.push({observer, reason: matches.length ? 'duplicate jobs' : 'missing job'}); continue; }
        const job = matches[0];
        if (job.status !== 'ok' || (job.errors?.length ?? 0) > 0) { unavailable.push({observer, reason: 'job is not successful', status: job.status, errors: job.errors ?? []}); continue; }
        const actions = Array.isArray(job.actions) ? job.actions.filter(action => action?.endpoint === endpoint) : [];
        if (actions.length !== 1 || actions[0].status !== 'ok') { unavailable.push({observer, reason: 'missing, duplicate or unsuccessful action'}); continue; }
        const final = actions[0].final;
        const missingFields = QUALIFICATION_FIELDS.filter(field => !final || !Object.hasOwn(final, field) || final[field] === undefined);
        if (missingFields.length) { unavailable.push({observer, reason: 'missing final observation', missingFields}); continue; }
        finals[observer] = final;
      }
      const compared = unavailable.length === 0;
      const differences = compared ? QUALIFICATION_FIELDS.filter(field => JSON.stringify(finals.off[field]) !== JSON.stringify(finals.on[field])) : [];
      return {endpoint, status: !compared ? 'unavailable' : differences.length ? 'mismatch' : 'ok', compared, differences, unavailable};
    });
    // The runner can reject a successful observation job because its completed
    // pair mismatched. Keep that explicit pre-invalidation witness separate from
    // the failed job's current eligibility; final geometry alone is not evidence.
    const witness = rows.find(row => row.status === 'failed' && row.errors?.length
      && row.errors.every(error => error.type === 'observer-agreement')
      && row.observerAgreementFailure?.jobStatusAtObservation === 'ok'
      && row.observerAgreementFailure.comparisons?.some(comparison => comparison.workload === workload
        && comparison.arm === arm && comparison.browser === configuration.browser && comparison.profile === configuration.profile
        && comparison.status === 'mismatch' && comparison.complete === true));
    const observedMismatch = witness ? {sourceJobId: witness.id, jobStatusAtObservation: 'ok',
      comparison: witness.observerAgreementFailure.comparisons.find(comparison => comparison.workload === workload
        && comparison.arm === arm && comparison.browser === configuration.browser && comparison.profile === configuration.profile
        && comparison.status === 'mismatch' && comparison.complete === true)} : null;
    const executed = rows.filter(row => ATTEMPTED_STATUSES.includes(row.status)).length;
    const complete = issues.length === 0 && sides.off.records === 1 && sides.on.records === 1 && endpoints.every(row => row.compared);
    comparisons.push({workload, arm, ...configuration, expected: 2, recorded: rows.length, executed,
      successful: rows.filter(row => row.status === 'ok' && !(row.errors?.length)).length,
      complete, status: issues.length ? 'invalid' : observedMismatch ? 'mismatch' : !complete ? 'incomplete' : endpoints.some(row => row.status === 'mismatch') ? 'mismatch' : 'ok',
      sides, endpoints, issues, observedMismatch});
  }
  const counts = Object.fromEntries(['ok','mismatch','incomplete','invalid'].map(status => [status, comparisons.filter(row => row.status === status).length]));
  return {status: counts.invalid ? 'invalid' : counts.mismatch ? 'mismatch' : counts.incomplete ? 'incomplete' : 'ok', counts, comparisons,
    influence: 'Off/on public-result agreement is necessary, not proof of zero observer timing influence.'};
}

function settings({seed, evidenceQualified = false} = {}) {
  if (!Number.isSafeInteger(seed)) throw Error('A recorded safe-integer bootstrap seed is required');
  if (typeof evidenceQualified !== 'boolean') throw Error('evidenceQualified must be an explicit Boolean');
  return {seed, evidenceQualified};
}

// A recorded per-cell seed avoids restarting the same stream for every endpoint.
function cellSeed(seed, label) {
  let value = seed >>> 0;
  for (let index = 0; index < label.length; index++) value = Math.imul(value ^ label.charCodeAt(index), 16777619) >>> 0;
  return value;
}

function distribution(values) {
  // Every scalar is validated first: describe() must not hide invalid values.
  return {n: values.length, min: null, median: null, p75: null, max: null, ...describe(values)};
}

function interval(values) {
  return [quantile(values, 0.025), quantile(values, 0.975)];
}

function drawIndices(length, random) {
  return Array.from({length}, () => Math.floor(random() * length));
}

function sampledMedian(rows, indices, key) {
  return median(indices.map(index => rows[index].values[key]));
}

function statusCounts(samples) {
  const result = {};
  for (const sample of samples) {
    const status = typeof sample?.status === 'string' ? sample.status : 'missing-status';
    result[status] = (result[status] ?? 0) + 1;
  }
  return result;
}

function inventoryIssues(samples, retention) {
  if (!Array.isArray(samples)) throw Error('Samples must include every raw job, including failed and unattempted jobs');
  const issues = [], ids = new Set();
  for (const sample of samples) {
    if (!sample || typeof sample !== 'object') { issues.push('Non-object sample'); continue; }
    if (typeof sample.id !== 'string' || !sample.id) issues.push('Missing job id');
    else if (ids.has(sample.id)) issues.push(`Duplicate job id: ${sample.id}`);
    else ids.add(sample.id);
    if (!WORKLOADS.includes(sample.workload) || !ARMS.includes(sample.arm)) issues.push(`Unknown workload/arm in ${sample.id}`);
    const configuration = CONFIGURATIONS.some(config => config.browser === sample.browser && config.profile === sample.profile);
    if (!configuration || (retention && (sample.browser !== 'chromium' || sample.profile !== 'desktop'))) issues.push(`Unexpected configuration in ${sample.id}`);
    if (sample.status !== 'ok') issues.push(`Job ${sample.id} is ${sample.status ?? 'missing-status'}`);
    if (Array.isArray(sample.errors) && sample.errors.length) issues.push(`Job ${sample.id} retains errors`);
  }
  return issues;
}

function rowOrder(a, b) {
  // Sorting affects seeded reproducibility only, never sample selection.
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function timingRows(samples, arm, issues) {
  const selected = samples.filter(sample => sample?.arm === arm);
  if (selected.length !== 30) issues.push(`${arm}: expected exactly 30 jobs, received ${selected.length}`);
  const rows = [];
  for (const sample of selected) {
    const sampleIssues = [], values = {}, actions = Array.isArray(sample.actions) ? sample.actions : [];
    if (sample.status !== 'ok') sampleIssues.push(`status ${sample.status ?? 'missing-status'}`);
    if (actions.length !== 2) sampleIssues.push('Exactly two actions required');
    for (const endpoint of ['initial', 'repeat']) {
      const matches = actions.filter(action => action?.endpoint === endpoint);
      if (matches.length !== 1 || matches[0].status !== 'ok') {
        sampleIssues.push(`One successful ${endpoint} action required`);
        continue;
      }
      const action = matches[0];
      for (const metric of ['firstAlignedMs', 'stableSixFramesMs']) {
        const value = action[metric];
        if (!Number.isFinite(value) || value < 0 || value > 8000) sampleIssues.push(`Invalid ${endpoint}.${metric}`);
        values[`${endpoint}.${metric}`] = value;
      }
      if (action.stableSixFramesMs < action.firstAlignedMs) sampleIssues.push(`${endpoint}: stability precedes alignment`);
    }
    rows.push({id: sample.id, block: sample.block, values, issues: sampleIssues});
    issues.push(...sampleIssues.map(issue => `${arm}/${sample.id}: ${issue}`));
  }
  return rows.sort(rowOrder);
}

/** Final timing matrix only; qualification jobs must not enter this function.
 * Raw jobs carry actions [{endpoint:'initial'|'repeat', status:'ok',
 * firstAlignedMs, stableSixFramesMs}]. evidenceQualified is the runner's external
 * source/assets/observer/functional/contention qualification, never inferred here.
 */
export function summarizeTiming(samples, options) {
  const {seed, evidenceQualified} = settings(options);
  const issues = inventoryIssues(samples, false), cells = [], comparisons = [];
  if (samples.length !== 480) issues.push(`Expected exactly 480 jobs; received ${samples.length}`);
  for (const workload of WORKLOADS) for (const configuration of CONFIGURATIONS) {
    const cellIssues = [];
    const selected = samples.filter(sample => sample?.workload === workload && sample.browser === configuration.browser && sample.profile === configuration.profile);
    const reference = timingRows(selected, 'reference', cellIssues), candidate = timingRows(selected, 'candidate', cellIssues);
    const label = `${workload}/${configuration.browser}/${configuration.profile}`;
    const bootstrapSeed = cellSeed(seed, `timing/${label}`);
    const cell = {workload, ...configuration, requiredJobsPerArm: 30, counts: statusCounts(selected), issues: cellIssues,
      jobs: {reference, candidate}, bootstrap: {seed: bootstrapSeed, iterations: ITERATIONS, unit: 'whole fresh-browser job vector', method: ARM_METHOD}};
    cells.push(cell);
    const valid = cellIssues.length === 0;
    const draws = Object.fromEntries(ENDPOINTS.map(({key}) => [key, {delta: [], excess: []}]));
    if (valid) {
      const random = rng(bootstrapSeed);
      for (let iteration = 0; iteration < ITERATIONS; iteration++) {
        // One independent index vector per arm, reused across all four endpoints.
        const referenceIndices = drawIndices(30, random), candidateIndices = drawIndices(30, random);
        for (const {key} of ENDPOINTS) {
          const r = sampledMedian(reference, referenceIndices, key), c = sampledMedian(candidate, candidateIndices, key);
          draws[key].delta.push(c - r);
          draws[key].excess.push(c - r - Math.max(4, 0.10 * r));
        }
      }
    }
    for (const {endpoint, metric, key} of ENDPOINTS) {
      const comparison = {workload, ...configuration, endpoint, metric,
        label: endpoint === 'initial' ? 'First movement reveal' : 'Already-visible repeat (no-op readiness)',
        counts: cell.counts, n: {reference: reference.length, candidate: candidate.length},
        reference: null, candidate: null, change: null,
        gate: {status: 'unqualified', statisticalStatus: null, marginMs: null, excessMs: null, excessCi95: null},
        bootstrap: cell.bootstrap, issues: cellIssues};
      if (valid) {
        comparison.reference = distribution(reference.map(row => row.values[key]));
        comparison.candidate = distribution(candidate.map(row => row.values[key]));
        const r = comparison.reference.median, c = comparison.candidate.median, delta = c - r;
        const deltaCi95 = interval(draws[key].delta), excessCi95 = interval(draws[key].excess);
        const marginMs = Math.max(4, 0.10 * r);
        comparison.change = {differenceMs: delta, ci95: deltaCi95,
          relativePercent: r > 0 ? 100 * delta / r : null,
          relativeUnavailableReason: r > 0 ? null : 'Reference median is zero; relative change is undefined',
          statisticalImprovementSignal: deltaCi95[1] < 0, measuredImprovement: false};
        comparison.gate = {status: 'unqualified',
          statisticalStatus: excessCi95[1] <= 0 ? 'pass' : excessCi95[0] > 0 ? 'regression' : 'inconclusive',
          marginMs, excessMs: delta - marginMs, excessCi95,
          method: 'The full excess contrast recomputes max(4ms, 10% reference median) in each whole-job-vector draw.'};
      }
      comparisons.push(comparison);
    }
  }
  for (const cell of cells) issues.push(...cell.issues.map(issue => `${cell.workload}/${cell.browser}/${cell.profile}: ${issue}`));
  if (!evidenceQualified) issues.push('External evidence qualification has not passed');
  const complete = issues.length === 0;
  if (complete) for (const comparison of comparisons) {
    comparison.gate.status = comparison.gate.statisticalStatus;
    comparison.change.measuredImprovement = comparison.change.statisticalImprovementSignal;
  }
  const status = !complete ? 'unqualified' : comparisons.some(row => row.gate.status === 'regression') ? 'regression'
    : comparisons.some(row => row.gate.status === 'inconclusive') ? 'inconclusive' : 'pass';
  return {schema: 1, kind: 'reveal-timing-analysis', seed, iterations: ITERATIONS, status, complete,
    expectedJobs: 480, expectedDecisions: 32, counts: statusCounts(samples), issues, cells, comparisons, direction: DIRECTION,
    scope: 'Timing only: a passing timing matrix cannot promote runtime changes without separately qualified functional and retention evidence.',
    limitations: ['Intervals are exploratory per endpoint, not a simultaneous 95% statement across 32 decisions.',
      'Frame readiness is not paint, INP or precise CPU cost. Quantized or degenerate intervals do not exclude sub-frame cost.',
      'Six-frame stability includes five confirmation intervals. The fixed margin applies without retrospective cadence adjustment.',
      'Shared blocks balance order; independent browser sessions are not paired. No pooling across cells or campaigns.']};
}

function slope(points) {
  const cycles = [10, 50, 100], meanCycle = 160 / 3;
  const meanValue = cycles.reduce((sum, cycle) => sum + points[cycle], 0) / cycles.length;
  return cycles.reduce((sum, cycle) => sum + (cycle - meanCycle) * (points[cycle] - meanValue), 0)
    / cycles.reduce((sum, cycle) => sum + (cycle - meanCycle) ** 2, 0);
}

function retentionRows(samples, arm, issues, acceptance) {
  const selected = samples.filter(sample => sample?.arm === arm), rows = [];
  if (selected.length !== 5) issues.push(`${arm}: expected exactly five runs, received ${selected.length}`);
  for (const sample of selected) {
    const retention = sample.retention, sampleIssues = retentionReceiptIssues(retention, acceptance, 100, sample.workload), values = {}, checkpoints = [];
    if (sample.status !== 'ok' || retention?.status !== 'ok' || retention?.kind !== 'retention' || retention?.completedCycles !== 100)
      sampleIssues.push('A successful final 100-lifetime retention run is required');
    if (retention?.workload !== sample.workload) sampleIssues.push('Retention workload identity mismatch');
    if (JSON.stringify(retention?.requestedCheckpoints) !== JSON.stringify(CHECKPOINTS))
      sampleIssues.push('Declared checkpoint schedule must be exactly 0/10/50/100');
    const caseCounts = retention?.caseCounts;
    if (!caseCounts || typeof caseCounts !== 'object' || Object.keys(caseCounts).length !== RETENTION_CASES.length
      || RETENTION_CASES.some(kind => caseCounts[kind] !== 25))
      sampleIssues.push('Exactly 25 successful lifetimes for each of the four fixed cases required');
    const cycles = Array.isArray(retention?.cycles) ? retention.cycles : [];
    if (cycles.length !== 100 || cycles.some((cycle, index) => cycle?.cycle !== index + 1
      || cycle.kind !== RETENTION_CASES[index % RETENTION_CASES.length] || cycle.status !== 'ok'))
      sampleIssues.push('Ordered successful four-case rotation must cover exactly 100 lifetimes');
    const points = Array.isArray(retention?.checkpoints) ? retention.checkpoints : [];
    if (points.length !== CHECKPOINTS.length) sampleIssues.push('Exactly four checkpoints required');
    if (points.some((point, index) => point?.cycle !== CHECKPOINTS[index])) sampleIssues.push('Observed checkpoints are out of order');
    for (const cycle of CHECKPOINTS) {
      const matches = points.filter(point => point?.cycle === cycle);
      if (matches.length !== 1) { sampleIssues.push(`Exactly one cycle ${cycle} checkpoint required`); continue; }
      const point = matches[0];
      const metrics = {jsHeapUsedBytes: point.heap?.usedSize, documents: point.dom?.documents,
        nodes: point.dom?.nodes, jsEventListeners: point.dom?.jsEventListeners};
      for (const [metric, value] of Object.entries(metrics)) {
        if (!Number.isFinite(value) || value < 0) sampleIssues.push(`Invalid ${metric} at cycle ${cycle}`);
        values[`${metric}.checkpoint.${cycle}`] = value;
      }
      checkpoints.push({cycle, ...metrics});
    }
    if (sampleIssues.length === 0) {
      for (const metric of RETENTION_METRICS) {
        const byCycle = Object.fromEntries(checkpoints.map(point => [point.cycle, point[metric]]));
        values[`${metric}.warmup`] = byCycle[10] - byCycle[0];
        values[`${metric}.growth`] = byCycle[100] - byCycle[10];
        values[`${metric}.slope`] = slope(byCycle);
      }
      const heap10 = values['jsHeapUsedBytes.checkpoint.10'];
      if (heap10 <= 0) sampleIssues.push('Heap at cycle 10 must be positive for required relative growth');
      else values['jsHeapUsedBytes.relativeGrowthPercent'] = 100 * values['jsHeapUsedBytes.growth'] / heap10;
      if (Object.values(values).some(value => !Number.isFinite(value))) sampleIssues.push('Non-finite derived retention value');
    }
    rows.push({id: sample.id, block: sample.block, checkpoints, values,
      ...(acceptance.id===OBSERVED_DOCUMENT_MOTION?{documentMotion:cycles.map(cycle=>({cycle:cycle?.cycle??null,kind:cycle?.kind??null,observation:cycle?.documentMotion??null}))}:{}),
      completedCycles: retention?.completedCycles ?? null, caseCounts: retention?.caseCounts ?? null, issues: sampleIssues});
    issues.push(...sampleIssues.map(issue => `${arm}/${sample.id}: ${issue}`));
  }
  return rows.sort(rowOrder);
}

function retentionColumns() {
  return RETENTION_METRICS.flatMap(metric => [
    ...CHECKPOINTS.map(cycle => ({metric, measure: 'checkpoint', cycle, key: `${metric}.checkpoint.${cycle}`})),
    ...['warmup', 'growth', 'slope'].map(measure => ({metric, measure, key: `${metric}.${measure}`})),
    ...(metric === 'jsHeapUsedBytes' ? [{metric, measure: 'relativeGrowthPercent', key: `${metric}.relativeGrowthPercent`}] : []),
  ]);
}

function retentionUnits({metric, measure}) {
  if (measure === 'relativeGrowthPercent') return {arm: 'percent', change: 'percentage points'};
  const unit = metric === 'jsHeapUsedBytes' ? 'bytes' : metric === 'jsEventListeners' ? 'listeners' : metric;
  return {arm: measure === 'slope' ? `${unit}/cycle` : unit, change: measure === 'slope' ? `${unit}/cycle` : unit};
}

/** Final retention only: five whole runs per arm/workload, Chromium desktop.
 * Reports numerical signals without accepting a leak budget or explaining away
 * positives. Attribution belongs in a separately sealed coordinator record.
 * Qualification's 0/1/2/3/4 runs are deliberately rejected.
 */
export function summarizeRetention(samples, options) {
  const {seed, evidenceQualified} = settings(options);
  const acceptance = retentionAcceptance(options?.retentionAcceptance);
  const issues = inventoryIssues(samples, true), workloads = [], signals = [];
  if (samples.length !== 20) issues.push(`Expected exactly 20 retention runs; received ${samples.length}`);
  for (const workload of WORKLOADS) {
    const selected = samples.filter(sample => sample?.workload === workload), cellIssues = [];
    const reference = retentionRows(selected, 'reference', cellIssues, acceptance), candidate = retentionRows(selected, 'candidate', cellIssues, acceptance);
    const columns = retentionColumns(), bootstrapSeed = cellSeed(seed, `retention/${workload}`);
    const result = {workload, acceptance, browser: 'chromium', profile: 'desktop', requiredRunsPerArm: 5, counts: statusCounts(selected), issues: cellIssues,
      runs: {reference, candidate}, comparisons: [], rawPositiveObservations: [],
      bootstrap: {seed: bootstrapSeed, iterations: ITERATIONS, unit: 'whole fresh-browser run vector', method: ARM_METHOD}};
    workloads.push(result);
    // Positives stay visible even in an incomplete matrix; a median cannot erase them.
    for (const arm of ARMS) for (const row of result.runs[arm]) for (const column of columns) {
      if (!['growth', 'slope', 'relativeGrowthPercent'].includes(column.measure)) continue;
      const value = row.values[column.key];
      if (Number.isFinite(value) && value > 0) {
        const signal = {workload, arm, id: row.id, ...column, value, kind: 'positive-raw-observation', disposition: 'unresolved'};
        result.rawPositiveObservations.push(signal); signals.push(signal);
      }
    }
    if (cellIssues.length) continue;
    const draws = Object.fromEntries(columns.map(({key}) => [key, {reference: [], candidate: [], change: []}]));
    const random = rng(bootstrapSeed);
    for (let iteration = 0; iteration < ITERATIONS; iteration++) {
      // A repetition carries every checkpoint, metric and derived slope together.
      const referenceIndices = drawIndices(5, random), candidateIndices = drawIndices(5, random);
      for (const {key} of columns) {
        const r = sampledMedian(reference, referenceIndices, key), c = sampledMedian(candidate, candidateIndices, key);
        draws[key].reference.push(r); draws[key].candidate.push(c); draws[key].change.push(c - r);
      }
    }
    for (const column of columns) {
      const {key, metric, measure} = column;
      const r = reference.map(row => row.values[key]), c = candidate.map(row => row.values[key]);
      const ci95 = interval(draws[key].change);
      const comparison = {...column, units: retentionUnits(column),
        reference: {...distribution(r), values: r, medianCi95: interval(draws[key].reference)},
        candidate: {...distribution(c), values: c, medianCi95: interval(draws[key].candidate)},
        change: {difference: median(c) - median(r), ci95}, interpretation: 'descriptive'};
      result.comparisons.push(comparison);
      if (!['growth', 'slope', 'relativeGrowthPercent'].includes(measure)) continue;
      const hardResource = metric === 'nodes' || metric === 'jsEventListeners';
      if (ci95[1] > 0 || comparison.change.difference > 0) {
        comparison.interpretation = ci95[0] > 0 ? (hardResource ? 'regression-signal' : 'investigation-signal') : 'inconclusive-positive-growth-possible';
        signals.push({workload, ...column, kind: 'positive-between-arm-contrast', difference: comparison.change.difference, ci95,
          interpretation: comparison.interpretation, disposition: 'unresolved'});
      }
      for (const arm of ARMS) if (comparison[arm].medianCi95[1] > 0) signals.push({workload, arm, ...column,
        kind: 'positive-within-arm-interval', ci95: comparison[arm].medianCi95, disposition: 'unresolved'});
    }
  }
  for (const workload of workloads) issues.push(...workload.issues.map(issue => `${workload.workload}: ${issue}`));
  if (!evidenceQualified) issues.push('External evidence qualification has not passed');
  const complete = issues.length === 0;
  return {schema: 1, kind: 'reveal-retention-analysis', seed, iterations: ITERATIONS, complete,
    status: !complete ? 'unqualified' : signals.length ? 'unresolved-positive' : 'no-positive-observed',
    expectedRuns: 20, counts: statusCounts(samples), issues, workloads, signals, direction: DIRECTION,
    promotion: 'Not automated. Archive an evidence-based disposition of every positive signal; unresolved retention blocks promotion.',
    limitations: ['Five independent runs per arm produce exploratory small-sample intervals; do not pool workloads or treat cycles as independent runs.',
      'Growth is cycle 100 minus cycle 10. OLS slope uses actual cycle coordinates 10, 50, 100. Warmup is cycle 10 minus cycle 0.',
      'Heap has no universal leak budget. Relative growth uses positive cycle-10 heap; between-arm relative changes are percentage points, never a growth ratio.',
      'Node/listener raw positive growth or slope in either arm requires concrete archived attribution; medians, GC-noise assertions or a later pass do not explain it.',
      'Positive heap/document observations are investigation signals, not proof of a leak. Exact cleanup and bounded-idle violations remain functional failures regardless of medians.']};
}
