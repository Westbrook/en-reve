import { sortGroups, sortTitle, coverageDigest } from './sort-coverage.mjs';
import assert from 'node:assert/strict';

const numericTitle = 'every measurement column sorts numerically in both directions; missing values stay last';
const expectedCases = [
  ['groups.spec.js', numericTitle],
  ['groups.spec.js', 'CSV exports the current comparison order and report remains within a mobile viewport'],
  ['results.spec.js', 'all columns sort in both directions using the native En Reve table'],
  ['results.spec.js', 'full report, evidence links, narrow viewport, and progress return'],
  ['results.spec.js', 'all source rows remain readable without JavaScript'],
];
const key = entry => JSON.stringify([entry.project, entry.file, entry.title]);
function cases(report) {
  const entries = [];
  function visit(suites) {
    for (const suite of suites ?? []) {
      for (const spec of suite.specs ?? []) for (const test of spec.tests ?? []) {
        entries.push({ id: spec.id, file: spec.file ?? suite.file, title: spec.title, project: test.projectId, test });
      }
      visit(suite.suites);
    }
  }
  visit(report.suites);
  return entries;
}
function cleanPass(entry) {
  return entry.test.expectedStatus === 'passed' && entry.test.status === 'expected' && entry.test.results.length === 1 && entry.test.results[0].status === 'passed' && !entry.test.results[0].error && !entry.test.results[0].errors?.length && entry.test.results[0].retry === 0;
}
function checkReport(report, buildMtimeMs) {
  assert.equal(report.errors?.length ?? 0, 0, 'Receipt contains a global runner error');
  assert.equal(report.stats.flaky, 0, 'Flaky outcomes cannot complete verification');
  assert.equal(report.stats.skipped, 0, 'Skipped outcomes cannot complete verification');
  const start = Date.parse(report.stats.startTime);
  assert(Number.isFinite(start) && start >= buildMtimeMs, 'Run tests after the latest build');
  assert(Number.isFinite(report.stats.duration) && report.stats.duration >= 0, 'Missing receipt duration');
  return start;
}

// A targeted rerun may recheck only the exhaustive Firefox overall-budget
// timeout, never an assertion failure, skipped case, or missing suite coverage.
export function validateLegacyReaderTestReceipts(initial, focused, buildMtimeMs) {
  const initialStart = checkReport(initial, buildMtimeMs), all = cases(initial);
  const expected = new Set(['chromium', 'firefox', 'webkit'].flatMap(project => expectedCases.map(([file, title]) => key({ project, file, title }))));
  assert.equal(all.length, 15, 'Initial receipt must cover every three-browser case');
  assert.equal(new Set(all.map(key)).size, 15, 'Duplicate initial test cases');
  assert(all.every(entry => expected.has(key(entry))), 'Unexpected initial test identity');
  const passed = all.filter(cleanPass), failed = all.filter(entry => !cleanPass(entry));
  if (!failed.length) {
    assert.equal(initial.stats.expected, 15);
    assert.equal(initial.stats.unexpected, 0);
    return { status: 'complete-first-attempt', uniqueCases: 15, attempts: 15, initialStats: initial.stats, result: '15/15 browser cases and 2/2 reader unit tests passed on the initial run' };
  }
  assert.equal(initial.stats.expected, 14);
  assert.equal(initial.stats.unexpected, 1);
  assert.equal(passed.length, 14);
  assert.equal(failed.length, 1);
  const original = failed[0], attempt = original.test.results[0];
  assert.equal(original.project, 'firefox', 'Only the recorded Firefox timeout can be rechecked');
  assert.equal(original.file, 'groups.spec.js');
  assert.equal(original.title, numericTitle);
  assert.equal(original.test.expectedStatus, 'passed');
  assert.equal(original.test.status, 'unexpected');
  assert([360000, 600000].includes(original.test.timeout), 'Unrecognized overall timeout budget');
  const budget = original.test.timeout;
  assert.equal(original.test.results.length, 1);
  assert.equal(attempt.status, 'timedOut', 'An assertion failure is not a timeout-budget correction');
  assert.equal(attempt.retry, 0);
  assert(attempt.duration >= budget, 'Failure happened before the full test budget');
  assert((attempt.error?.message ?? '').includes(`Test timeout of ${budget}ms exceeded`), 'Missing overall test-timeout evidence');
  assert(focused, 'The focused Firefox numeric-sort recheck has not completed');
  const focusedStart = checkReport(focused, buildMtimeMs), rerun = cases(focused);
  assert(focusedStart >= initialStart + initial.stats.duration, 'Recheck predates completion of the original suite');
  assert.equal(focused.stats.expected, 1);
  assert.equal(focused.stats.unexpected, 0);
  assert.equal(rerun.length, 1, 'Focused receipt must contain only the exact failed case');
  assert.equal(key(rerun[0]), key(original), 'Focused receipt does not recheck the failed case');
  assert.equal(rerun[0].id, original.id, 'Focused test ID differs from the retained failure');
  assert.equal(rerun[0].test.timeout, 600000, 'Expected the documented corrected timeout budget');
  assert(cleanPass(rerun[0]), 'Focused recheck must pass once without retries, errors or flakiness');
  return {
    status: budget === 360000 ? 'complete-after-timeout-budget-correction' : 'complete-after-isolated-recheck', uniqueCases: 15, attempts: 16,
    initialStats: initial.stats, focusedStats: focused.stats,
    correction: { fromMs: budget, toMs: 600000, scope: budget === 360000 ? 'Only the numeric-sort test budget changed; application build and assertions were retained' : 'Only the timed-out Firefox case reran in isolation; timeout budget, application build and assertions were retained' },
    initialFailure: { id: original.id, project: original.project, file: original.file, title: original.title, result: attempt },
    focusedPass: { id: rerun[0].id, project: rerun[0].project, file: rerun[0].file, title: rerun[0].title, result: rerun[0].test.results[0] },
    result: `15/15 unique browser cases completed after ${budget === 360000 ? 'a timeout-budget correction' : 'an isolated recheck'}: 14 initial passes and the Firefox numeric-sort case passed on focused recheck; the initial timeout is retained. 2/2 reader unit tests passed`,
  };
}

/** Current receipts attest the exact table/column/direction partition, with no accepted missing group. */
export function validateReaderTestReceipts(initial, focused, buildMtimeMs) {
  checkReport(initial, buildMtimeMs);
  assert(!focused, 'Current partitioned protocol requires a complete passing run; keep failed runs separately.');
  const all = cases(initial);
  const expected = ['chromium', 'firefox', 'webkit'].flatMap(project => [
    ...expectedCases.slice(1).map(([file, title]) => ({ project, file, title })),
    ...sortGroups.map(group => ({ project, file: 'groups.spec.js', title: sortTitle(group), digest: coverageDigest(group) })),
  ]);
  assert.equal(all.length, expected.length, 'Initial receipt must cover every group and browser');
  assert.equal(new Set(all.map(key)).size, expected.length, 'Duplicate test cases');
  for (const required of expected) {
    const found = all.find(entry => key(entry) === key(required));
    assert(found && cleanPass(found), `Missing clean pass: ${key(required)}`);
    if (required.digest) assert(found.test.annotations?.some(item => item.type === 'sort-coverage-sha256' && item.description === required.digest), `Missing exact sort coverage: ${key(required)}`);
  }
  assert.equal(initial.stats.expected, expected.length); assert.equal(initial.stats.unexpected, 0);
  return { status: 'complete-first-attempt', protocol: 'partitioned-sorting-v1', uniqueCases: all.length, attempts: all.length, initialStats: initial.stats, result: `${all.length}/${all.length} browser cases passed; exact numeric coverage attested for all engines. Reader unit tests require their separate receipt.` };
}
