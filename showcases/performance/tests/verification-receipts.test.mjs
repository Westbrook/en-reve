import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { composeVerificationReceipts, receiptPaths } from "../src/verification-receipts.mjs";

const fixture = (path, name, verifiedAt = "2026-09-20T00:00:00Z") => ({
  path,
  sha256: path + "-digest",
  data: { verifiedAt, projects: [{ name, sourceSha256: name + "-source", checks: [{ pass: true }] }] },
});

test("receipt composition preserves inputs and associates selected projects with their original evidence", () => {
  const receipts = [fixture("original.json", "old"), fixture("addition.json", "new", "2026-09-21T00:00:00Z")];
  const before = JSON.stringify(receipts);
  const result = composeVerificationReceipts(receipts, [{ id: "new" }, { id: "old" }]);
  assert.deepEqual(result.projects.map((project) => project.name), ["new", "old"]);
  assert.equal(result.projects[0], receipts[1].data.projects[0]);
  assert.equal(result.checksPassed, 2);
  assert.equal(result.verifiedAt, "2026-09-21T00:00:00Z");
  assert.deepEqual(result.sources.map(({ path, systems }) => ({ path, systems })), [
    { path: "original.json", systems: ["old"] },
    { path: "addition.json", systems: ["new"] },
  ]);
  assert.equal(JSON.stringify(receipts), before);
});

test("receipt preflight reports every missing selected system and rejects ambiguous evidence", () => {
  const original = fixture("original.json", "old");
  assert.throws(() => composeVerificationReceipts([original], [{ id: "old" }, { id: "new" }, { id: "another" }]), /No functional receipt for new, another/);
  const conflicting = fixture("replacement.json", "old");
  conflicting.data.projects[0].sourceSha256 = "changed";
  assert.throws(() => composeVerificationReceipts([original, conflicting], [{ id: "old" }]), /Conflicting functional receipts for old: original.json and replacement.json/);
  assert.throws(() => composeVerificationReceipts([{ path: "bad.json", data: {} }], []), /Invalid functional receipt/);
});

test("selected composition counts and dates only the selected evidence", () => {
  const receipts = [fixture("old.json", "old"), fixture("new.json", "new", "2026-09-21T00:00:00Z")];
  const result = composeVerificationReceipts(receipts, [{ id: "old" }]);
  assert.equal(result.checksPassed, 1);
  assert.equal(result.verifiedAt, receipts[0].data.verifiedAt);
  assert.deepEqual(result.sources.map((source) => source.path), ["old.json"]);
});

test("receipt overrides stay explicit and reject empty, duplicated or ambiguous path arguments", () => {
  const defaults = ["original.json", "new.json"];
  assert.deepEqual(receiptPaths({}, defaults), defaults);
  assert.deepEqual(receiptPaths({ receipt: "new.json" }, defaults), ["new.json"]);
  assert.deepEqual(receiptPaths({ receipts: "original.json,new.json" }, defaults), defaults);
  for (const args of [{ receipt: "one", receipts: "two" }, { receipts: true }, { receipts: "one," }, { receipts: "one,one" }, { receipt: true }])
    assert.throws(() => receiptPaths(args, defaults));
});

test("default catalog covers all nine registered systems while historical receipt remains eight", () => {
  const read = (relative) => JSON.parse(readFileSync(new URL(relative, import.meta.url)));
  const catalog = read("../registry/verification-receipts.json");
  const systems = read("../registry/systems.json");
  const receipts = catalog.map((path) => ({ path, data: read("../../" + path) }));
  const result = composeVerificationReceipts(receipts, systems);
  assert.equal(receipts.find(({ path }) => path === "verification.json").data.projects.length, 8);
  assert.equal(result.projects.length, 9);
  assert.deepEqual(result.projects.map((project) => project.name), systems.map((system) => system.id));
  assert.equal(result.sources.find(({ path }) => path === "verification-web-awesome.json").systems[0], "web-awesome");
});
