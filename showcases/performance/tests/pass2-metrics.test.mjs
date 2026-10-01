import { test } from "node:test";
import assert from "node:assert/strict";
import { blockingExcess } from "../experiments/pass2-metrics.mjs";
test("blocking excess clips the blocking portion across the FCP boundary", () => {
  const tasks = [
    { startTime: 0, duration: 100 },
    { startTime: 200, duration: 80 },
    { startTime: 400, duration: 40 },
  ];
  assert.equal(blockingExcess(tasks, 0, 75), 25);
  assert.equal(blockingExcess(tasks, 75, 500), 55);
  assert.equal(blockingExcess(tasks, 0, 500), 80);
  assert.equal(blockingExcess(tasks, 300, 350), 0);
  assert.equal(blockingExcess(undefined, 0, 500), null);
  assert.equal(blockingExcess(tasks, undefined, 500), null);
});
