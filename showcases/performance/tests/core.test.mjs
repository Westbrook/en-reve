import test from "node:test";
import assert from "node:assert/strict";
import {
  describe,
  pairedDifference,
  independentDifference,
  clsSessionValue,
  metrics,
} from "../src/analysis.mjs";
import { chooseEncoding } from "../src/server.mjs";
import { rng, shuffle } from "../src/config.mjs";
import { sizeCheck } from "../src/regression.mjs";
import { init, parse } from "es-module-lexer";
import { unionLength, v8CoveredLength } from "../src/diagnostics.mjs";
test("distribution omits unsupported high percentiles and missing values", () => {
  assert.deepEqual(describe([1, 2, 3, 4, NaN, null]), {
    n: 4,
    min: 1,
    median: 2.5,
    p75: 3.25,
    max: 4,
  });
  assert.equal(describe([]).median, null);
  assert.ok("p95" in describe(Array(100).fill(1)));
});
test("paired bootstrap retains pairing and known constant shift", () => {
  const a = Array.from({ length: 30 }, (_, block) => ({
    block,
    value: block * 5,
  }));
  const result = pairedDifference(
    a,
    a.map((e) => ({ ...e, value: e.value - 7 })),
  );
  assert.deepEqual(result.ci95, [7, 7]);
  assert.equal(result.difference, 7);
  assert.equal(pairedDifference(a.slice(0, 4), a).ci95, null);
});
test("historical comparisons resample independently and preserve known constant effects", () => {
  assert.deepEqual(
    independentDifference(Array(30).fill(12), Array(40).fill(5)).ci95,
    [7, 7],
  );
  assert.equal(independentDifference([1, 2], [3, 4]).ci95, null);
});
test("CLS session windows exclude recent input and split at one-second gaps", () => {
  assert.equal(
    clsSessionValue([
      { startTime: 0, value: 0.1 },
      { startTime: 900, value: 0.2 },
      { startTime: 1000, value: 1, hadRecentInput: true },
      { startTime: 1900, value: 0.5 },
    ]),
    0.5,
  );
});
test("compression negotiates supported nonzero preference", () => {
  assert.equal(chooseEncoding("gzip, br"), "br");
  assert.equal(chooseEncoding("br;q=0,gzip;q=1"), "gzip");
  assert.equal(chooseEncoding("identity"), "identity");
});
test("randomization is repeatable and does not mutate its source", () => {
  const values = [1, 2, 3, 4, 5];
  assert.deepEqual(shuffle(values, rng(2)), shuffle(values, rng(2)));
  assert.deepEqual(values, [1, 2, 3, 4, 5]);
});
test("absent Event Timing is null, not a zero-duration interaction", () => {
  const result = metrics({
    collector: {
      entries: {},
      vitals: {},
      milestones: {},
      actions: [
        { name: "x", eventStart: 10, semanticReady: 12, frameOpportunity: 30 },
      ],
    },
  });
  assert.equal(result.actions[0].eventTiming.duration, null);
  assert.equal(result.scriptedINP, null);
  assert.equal(result.cls, null);
  assert.equal(result.longTaskMs, null);
  assert.equal(result.loafMs, null);
});
test("an action cannot borrow the next action’s slower Event Timing entry", () => {
  const event = (startTime, duration, interactionId) => ({
    startTime,
    duration,
    interactionId,
    processingStart: startTime + 1,
    processingEnd: startTime + 5,
  });
  const result = metrics({
    collector: {
      entries: { event: [event(10, 16, 1), event(50, 80, 2)] },
      vitals: {},
      milestones: {},
      actions: [
        {
          name: "first",
          inputSequenceStart: 10,
          eventStart: 10,
          semanticReady: 12,
          frameOpportunity: 30,
        },
        {
          name: "second",
          eventStart: 50,
          semanticReady: 60,
          frameOpportunity: 140,
        },
      ],
    },
  });
  assert.equal(result.actions[0].eventTiming.duration, 16);
  assert.equal(result.actions[1].eventTiming.duration, 80);
});
test("budgets expose growth, missing systems and challenger additions", () => {
  const results = sizeCheck(
    { a: { raw: 20000, gzip: 20000, brotli: 20000 }, c: {} },
    { a: { raw: 10000, gzip: 10000, brotli: 10000 }, b: {} },
  );
  assert.equal(results.filter((x) => x.status === "regression").length, 3);
  assert.ok(results.some((x) => x.status === "missing-system"));
  assert.ok(results.some((x) => x.status === "new-system"));
});
test("pinned lexer distinguishes real static and dynamic import edges", async () => {
  await init;
  const [imports] = parse('import x from "./a.js"; import("./b.js")');
  assert.deepEqual(
    imports.map((x) => [x.specifier, x.type]),
    [
      ["./a.js", "static"],
      ["./b.js", "dynamic"],
    ],
  );
});
test("coverage ranges are unioned without counting overlap twice", () => {
  assert.equal(
    unionLength([
      { start: 0, end: 10 },
      { start: 5, end: 20 },
      { start: 30, end: 40 },
    ]),
    30,
  );
});
test("V8 coverage excludes unexecuted nested ranges inside an executed script", () => {
  assert.equal(
    v8CoveredLength([
      {
        ranges: [
          { startOffset: 0, endOffset: 100, count: 1 },
          { startOffset: 20, endOffset: 80, count: 0 },
          { startOffset: 40, endOffset: 50, count: 1 },
        ],
      },
    ]),
    50,
  );
});
