export function numericValue(value) {
  if (value === "—" || value === "") return null;
  const result = Number(value.replaceAll(",", ""));
  return Number.isFinite(result) ? result : null;
}
/** En Reve applies direction after comparing; counteract that only for missing cells. */
export function compareValues(a, b, numeric, direction, collator) {
  // ISO measurement dates sort chronologically as text. Missing dates, like
  // missing numeric measurements, remain last in either direction.
  if (!numeric) {
    const missingA = a === "—" || a === "", missingB = b === "—" || b === "";
    if (missingA || missingB) return missingA === missingB ? 0 : (missingA ? 1 : -1) * (direction === "descending" ? -1 : 1);
    return collator.compare(a, b);
  }
  const x = numericValue(a),
    y = numericValue(b);
  if (x === null || y === null) {
    if (x === null && y === null) return 0;
    return (x === null ? 1 : -1) * (direction === "descending" ? -1 : 1);
  }
  return x - y;
}
export function csvCell(value) {
  // Prevent descriptive text being interpreted as a spreadsheet formula.
  const text =
    /^[=+@\t\r-]/.test(value) && !/^[-+]?\d[\d,]*(?:\.\d+)?$/.test(value)
      ? "'" + value
      : value;
  return '"' + text.replaceAll('"', '""') + '"';
}
