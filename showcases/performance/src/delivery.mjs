/** Browser-reported response bytes, not TCP/TLS packet accounting.
 * Freeze networkObservation before leaving the measured page. Legacy samples
 * retain lifecycle requests; explicitly exclude those harness-only URLs.
 * CDP also reports local data/blob responses. Their payload bytes are already
 * embedded in another resource or generated locally, so they are not transfer.
 */
export function deliveryMetrics(sample) {
  const isHTTP = (url) => url.protocol === "http:" || url.protocol === "https:";
  const isDeliveredURL = (value) => {
    try {
      const url = new URL(value);
      return isHTTP(url) && !url.pathname.startsWith("/__perf/");
    } catch {
      return false;
    }
  };
  const observed = sample.networkObservation ?? sample.network ?? [];
  const requests = observed.filter((r) => isDeliveredURL(r.url));
  const nonHTTP = observed.filter((r) => {
    try { return !isHTTP(new URL(r.url)); }
    catch { return false; }
  });
  const complete = requests.filter((r) =>
    Number.isFinite(r.finishedEncodedDataLength),
  );
  const sum = (xs) => xs.reduce((n, r) => n + r.finishedEncodedDataLength, 0);
  const allComplete =
    requests.length > 0 && requests.length === complete.length;
  const category = (match) =>
    allComplete ? sum(complete.filter(match)) : null;
  const nav = sample.collector?.navigation;
  const resources = sample.collector?.entries?.resource ?? [];
  const timing = [
    ...(nav ? [nav] : []),
    ...resources.filter((r) => isDeliveredURL(r.name)),
  ];
  return {
    responseTransferBytes: allComplete ? sum(complete) : null,
    partialResponseBytes: sum(complete),
    incompleteResponses: requests.length - complete.length,
    responseCount: requests.length,
    // Local-scheme response accounting remains available separately. The byte
    // total covers completed responses only and must never be added to transfer.
    nonHTTPResponseCount: nonHTTP.length,
    nonHTTPCompletedResponseBytes: sum(nonHTTP.filter((r) =>
      Number.isFinite(r.finishedEncodedDataLength),
    )),
    nonHTTPIncompleteResponses: nonHTTP.filter((r) =>
      !Number.isFinite(r.finishedEncodedDataLength),
    ).length,
    cachedResponses: requests.filter(
      (r) => r.fromDiskCache || r.fromServiceWorker || r.servedFromCache,
    ).length,
    htmlTransferBytes: category((r) => r.type === "Document"),
    jsTransferBytes: category((r) => r.type === "Script"),
    cssTransferBytes: category((r) => r.type === "Stylesheet"),
    fontTransferBytes: category((r) => r.type === "Font"),
    otherTransferBytes: category(
      (r) => !["Document", "Script", "Stylesheet", "Font"].includes(r.type),
    ),
    timingTransferBytes: nav
      ? timing.reduce((n, r) => n + (r.transferSize ?? 0), 0)
      : null,
    htmlEncodedBodyBytes: nav?.encodedBodySize ?? null,
    htmlDecodedBodyBytes: nav?.decodedBodySize ?? null,
    decodedPageBodyBytes:
      nav && timing.every((r) => r.decodedBodySize > 0)
        ? timing.reduce((n, r) => n + r.decodedBodySize, 0)
        : null,
    timingZeroSizeEntries: timing.filter((r) => !r.transferSize).length,
  };
}
