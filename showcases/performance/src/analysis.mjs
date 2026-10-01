import { deliveryMetrics } from "./delivery.mjs";
import { quantile, median } from "simple-statistics";
import { rng } from "./config.mjs";
export function describe(values) {
  const xs = values.filter(Number.isFinite);
  return xs.length
    ? {
        n: xs.length,
        min: Math.min(...xs),
        median: median(xs),
        p75: quantile(xs, 0.75),
        ...(xs.length >= 100 ? { p95: quantile(xs, 0.95) } : {}),
        max: Math.max(...xs),
      }
    : { n: 0, median: null, p75: null };
}
export function pairedDifference(
  left,
  right,
  { seed = 42, iterations = 2000 } = {},
) {
  const pairs = left
    .filter((a) => Number.isFinite(a.value))
    .flatMap((a) => {
      const b = right.find(
        (b) => b.block === a.block && Number.isFinite(b.value),
      );
      return b ? [[a.value, b.value]] : [];
    });
  if (pairs.length < 5)
    return {
      n: pairs.length,
      difference: null,
      ci95: null,
      reason: "At least five complete paired blocks required",
    };
  const random = rng(seed),
    estimates = [];
  for (let i = 0; i < iterations; i++) {
    const draw = Array.from(
      { length: pairs.length },
      () => pairs[Math.floor(random() * pairs.length)],
    );
    estimates.push(
      median(draw.map((p) => p[0])) - median(draw.map((p) => p[1])),
    );
  }
  return {
    n: pairs.length,
    difference: median(pairs.map((p) => p[0])) - median(pairs.map((p) => p[1])),
    ci95: [quantile(estimates, 0.025), quantile(estimates, 0.975)],
    method:
      "Paired-block percentile bootstrap of difference in medians; exploratory, no multiple-comparison correction",
  };
}
export function independentDifference(
  left,
  right,
  { seed = 42, iterations = 2000 } = {},
) {
  const a = left.filter(Number.isFinite),
    b = right.filter(Number.isFinite);
  if (Math.min(a.length, b.length) < 5)
    return { n: [a.length, b.length], difference: null, ci95: null };
  const random = rng(seed),
    estimates = [];
  for (let i = 0; i < iterations; i++)
    estimates.push(
      median(
        Array.from(
          { length: a.length },
          () => a[Math.floor(random() * a.length)],
        ),
      ) -
        median(
          Array.from(
            { length: b.length },
            () => b[Math.floor(random() * b.length)],
          ),
        ),
    );
  return {
    n: [a.length, b.length],
    difference: median(a) - median(b),
    ci95: [quantile(estimates, 0.025), quantile(estimates, 0.975)],
    method:
      "Independent-session percentile bootstrap; historical runs are not paired by arbitrary block numbers",
  };
}
export function clsSessionValue(entries) {
  let maximum = 0,
    start = -Infinity,
    previous = -Infinity,
    value = 0;
  for (const e of entries
    .filter((e) => !e.hadRecentInput)
    .sort((a, b) => a.startTime - b.startTime)) {
    if (e.startTime - previous < 1000 && e.startTime - start < 5000)
      value += e.value;
    else {
      start = e.startTime;
      value = e.value;
    }
    previous = e.startTime;
    maximum = Math.max(maximum, value);
  }
  return maximum;
}
export function metrics(sample) {
  const c = sample.collector,
    nav = c?.navigation,
    resources = c?.entries.resource || [];
  if (!c) return sample.lighthouse || {};
  const events = c.entries.event || [],
    groups = new Map();
  for (const event of events)
    if (event.interactionId) {
      const previous = groups.get(event.interactionId);
      if (!previous || previous.duration < event.duration)
        groups.set(event.interactionId, event);
    }
  const actions = (c.actions || []).map((action) => {
    const ids = new Set(
      events
        .filter(
          (e) =>
            e.interactionId &&
            e.startTime >=
              (action.inputSequenceStart ?? action.eventStart) - 1 &&
            e.startTime <= action.eventStart + 1,
        )
        .map((e) => e.interactionId),
    );
    const eligible = [...ids].map((id) => groups.get(id));
    const event = eligible.sort((a, b) => b.duration - a.duration)[0];
    return {
      name: action.name,
      semanticMs: action.semanticReady - action.eventStart,
      frameOpportunityMs: action.frameOpportunity - action.eventStart,
      eventTiming: event
        ? {
            duration: event.duration,
            inputDelay: event.processingStart - event.startTime,
            processing: event.processingEnd - event.processingStart,
            presentation: Math.max(
              0,
              event.startTime + event.duration - event.processingEnd,
            ),
            interactionId: event.interactionId,
          }
        : {
            duration: null,
            status:
              "No qualifying Event Timing entry; below threshold, ineligible, or unavailable. Never interpreted as zero.",
          },
    };
  });
  return {
    ...deliveryMetrics(sample),
    startupVisible: sample.startup?.visibleObserved ?? null,
    startupInput: sample.startup?.inputAt ?? null,
    startupResult: sample.startup?.resultAt ?? null,
    startupFrame: sample.startup?.frameAt ?? null,
    startupDispatchLag: sample.startup?.dispatchLag ?? null,
    startupSemantic: sample.startup?.semanticMs ?? null,
    startupFeedback: sample.startup?.frameMs ?? null,
    firstInputDelay: c.entries["first-input"]?.length
      ? c.entries["first-input"][0].processingStart -
        c.entries["first-input"][0].startTime
      : null,
    ttfb: c.vitals.TTFB?.value ?? (nav ? nav.responseStart : null),
    fcp:
      c.vitals.FCP?.value ??
      c.entries.paint?.find((p) => p.name === "first-contentful-paint")
        ?.startTime ??
      null,
    lcp:
      sample.suite === "startup"
        ? null
        : (c.vitals.LCP?.value ??
          c.entries["largest-contentful-paint"]?.at(-1)?.startTime ??
          null),
    cls:
      c.vitals.CLS?.value ??
      (c.entries["layout-shift"]
        ? clsSessionValue(c.entries["layout-shift"])
        : null),
    scriptedINP: c.vitals.INP?.value ?? null,
    cardsDOM: c.milestones.cardsDOM ?? null,
    cardsFrameOpportunity: c.milestones.cardsFrameOpportunity ?? null,
    fontsReady: c.milestones.fontsReady ?? null,
    longTaskMs:
      c.entries.longtask?.reduce((sum, e) => sum + e.duration, 0) ?? null,
    loafMs:
      c.entries["long-animation-frame"]?.reduce(
        (sum, e) => sum + e.duration,
        0,
      ) ?? null,
    resourceCount: resources.length,
    resourceTransferBytes: resources.reduce(
      (sum, e) => sum + e.transferSize,
      0,
    ),
    resourcesWithRestrictedOrCachedSize: resources.filter(
      (e) => e.transferSize === 0,
    ).length,
    scriptMs: sample.browserMetrics?.ScriptDuration * 1000,
    layoutMs: sample.browserMetrics?.LayoutDuration * 1000,
    styleMs: sample.browserMetrics?.RecalcStyleDuration * 1000,
    taskMs: sample.browserMetrics?.TaskDuration * 1000,
    actions,
  };
}
