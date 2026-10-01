/** Duration of each task's >50ms blocking portion intersecting a chosen window.
 * This bounded observer diagnostic is not Lighthouse TBT (which chooses its own
 * measurement endpoint). Missing observer support is not reported as zero.
 */
export function blockingExcess(entries, start, end) {
  if (
    !Array.isArray(entries) ||
    !Number.isFinite(start) ||
    !Number.isFinite(end)
  )
    return null;
  return entries.reduce(
    (sum, entry) =>
      sum +
      Math.max(
        0,
        Math.min(entry.startTime + entry.duration, end) -
          Math.max(entry.startTime + 50, start),
      ),
    0,
  );
}
