import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { execute } from "../ci/execute.mjs";
import { laneCommands } from "../ci/lane-plan.mjs";

test("CI resolves the script path and waits for the child exit without launching a process", async () => {
  const child = new EventEmitter();
  let completed = false;
  const result = execute("/laboratory", "src/cli.mjs", ["functional"], (command, args, options) => {
    assert.equal(command, process.execPath);
    assert.deepEqual(args, ["/laboratory/src/cli.mjs", "functional"]);
    assert.equal(options.stdio, "inherit");
    return child;
  }).then(() => { completed = true; });
  await Promise.resolve();
  assert.equal(completed, false);
  child.emit("exit", 0);
  await result;
  assert.equal(completed, true);
});

test("CI propagates child failures and launch errors", async () => {
  for (const code of [1, null])
    await assert.rejects(execute("/laboratory", "src/cli.mjs", [], () => {
      const child = new EventEmitter();
      queueMicrotask(() => child.emit("exit", code));
      return child;
    }), /failed.*evidence retained/);
  await assert.rejects(execute("/laboratory", "src/cli.mjs", [], () => {
    const child = new EventEmitter();
    queueMicrotask(() => child.emit("error", new Error("launch failed")));
    return child;
  }), /launch failed/);
});

test("full CI discovers the registry for all eight distinct suites, including startup and observer overhead", () => {
  const commands = laneCommands("full");
  assert.deepEqual(commands[0], ["functional"]);
  const runs = commands.filter(([command]) => command === "run");
  assert.deepEqual(runs.map((args) => args[args.indexOf("--suite") + 1]), ["load", "startup", "interactions", "diagnostic", "memory", "lighthouse", "bfcache", "overhead"]);
  assert.ok(runs.every((args) => !args.includes("--systems")));
  assert.deepEqual(runs.find((args) => args.includes("startup")), ["run", "--suite", "startup", "--samples", "30"]);
  assert.deepEqual(runs.find((args) => args.includes("overhead")), ["run", "--suite", "overhead", "--samples", "5"]);
  assert.ok(commands.every(([command]) => !["check", "promote"].includes(command)));
});

test("qualification and fixed sentinel dispatch retain their prior scope", () => {
  assert.deepEqual(laneCommands("qualification"), [["functional"], ["qualify"], ["bundles"]]);
  assert.deepEqual(laneCommands("sentinel"), [["functional"], ["run", "--suite", "load", "--systems", "en-reve,fluent-web-components,radix-react", "--profiles", "mobile", "--caches", "cold", "--samples", "30"]]);
  assert.throws(() => laneCommands("typo"), /Choose qualification/);
});
