import { test } from "node:test";
import assert from "node:assert/strict";
import { numericValue, compareValues, csvCell } from "../src/table-data.js";
const collator = new Intl.Collator("en");
test("numeric measurements retain signs, thousands and missing values", () => {
  assert.equal(numericValue("1,380"), 1380);
  assert.equal(numericValue("-16.5"), -16.5);
  assert.equal(numericValue("—"), null);
  for (const direction of ["ascending", "descending"]) {
    const values = ["0", "—", "1,380", "-16.5", "604"];
    values.sort(
      (a, b) =>
        compareValues(a, b, true, direction, collator) *
        (direction === "ascending" ? 1 : -1),
    );
    assert.deepEqual(
      values,
      direction === "ascending"
        ? ["-16.5", "0", "604", "1,380", "—"]
        : ["1,380", "604", "0", "-16.5", "—"],
    );
  }
});
test("CSV preserves negative numeric gaps and escapes formulas, commas and quotes", () => {
  assert.equal(csvCell("-16.5"), '"-16.5"');
  assert.equal(csvCell("-1+2"), '"\'-1+2"');
  assert.equal(csvCell("=1+1"), '"\'=1+1"');
  assert.equal(csvCell("1,380"), '"1,380"');
  assert.equal(csvCell('a"b'), '"a""b"');
});

test("ISO measurement dates sort chronologically with unavailable dates last", () => {
  for (const direction of ["ascending", "descending"]) {
    const rows = ["2026-09-24", "—", "2026-09-20", "2026-09-23 – 2026-09-24"];
    rows.sort((a,b) => compareValues(a,b,false,direction,collator) * (direction === "ascending" ? 1 : -1));
    assert.deepEqual(rows,direction === "ascending" ? ["2026-09-20","2026-09-23 – 2026-09-24","2026-09-24","—"] : ["2026-09-24","2026-09-23 – 2026-09-24","2026-09-20","—"]);
  }
});
