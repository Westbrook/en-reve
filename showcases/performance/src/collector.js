import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals/attribution";
// Injected before application scripts. This module never changes the showcase DOM.
const state = {
  schema: 1,
  documentId: crypto.randomUUID(),
  supported: PerformanceObserver.supportedEntryTypes,
  entries: {},
  vitals: {},
  milestones: {},
  actions: [],
  resourceBufferFull: 0,
};
function nodeLabel(node) {
  const parts = [];
  let current = node;
  while (current && parts.length < 4) {
    if (current.id) {
      parts.unshift("#" + current.id);
      break;
    }
    parts.unshift(current.nodeName?.toLowerCase() || "node");
    const card = current.closest?.(".showcase-card");
    if (card?.id) {
      parts.unshift("#" + card.id);
      break;
    }
    current = current.getRootNode?.().host;
  }
  return parts.join(" >>> ");
}
const clean = (value, depth = 0) => {
  if (depth > 5) return undefined;
  if (value instanceof Node) return nodeLabel(value);
  if (value === null || ["string", "number", "boolean"].includes(typeof value))
    return value;
  if (Array.isArray(value)) return value.map((x) => clean(x, depth + 1));
  if (value && typeof value === "object") {
    if (value.toJSON)
      return clean(
        {
          ...value.toJSON(),
          ...(value.element instanceof Node ? { element: value.element } : {}),
          ...(value.target instanceof Node ? { target: value.target } : {}),
        },
        depth + 1,
      );
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, clean(val, depth + 1)]),
    );
  }
};
performance.setResourceTimingBufferSize(5000);
performance.addEventListener(
  "resourcetimingbufferfull",
  () => state.resourceBufferFull++,
);
const observers = [];
for (const type of [
  "navigation",
  "resource",
  "paint",
  "largest-contentful-paint",
  "layout-shift",
  "longtask",
  "long-animation-frame",
  "first-input",
  "event",
]) {
  if (!state.supported.includes(type)) continue;
  state.entries[type] = [];
  const observer = new PerformanceObserver((list) => {
    state.entries[type].push(...list.getEntries().map(cleanEntry));
  });
  function cleanEntry(entry) {
    return clean(entry);
  }
  observer.observe({
    type,
    buffered: true,
    ...(type === "event" ? { durationThreshold: 16 } : {}),
  });
  observers.push([type, observer]);
}
for (const observe of [onCLS, onFCP, onINP, onLCP, onTTFB])
  observe(
    (metric) => {
      state.vitals[metric.name] = clean(metric);
    },
    { reportAllChanges: true },
  );
const snapshot = () => {
  for (const [type, observer] of observers)
    state.entries[type].push(...observer.takeRecords().map((e) => clean(e)));
  return clean({
    ...state,
    visibility: document.visibilityState,
    timestamp: performance.now(),
    navigation: performance.getEntriesByType("navigation")[0],
    fonts: document.fonts
      ? {
          status: document.fonts.status,
          faces: [...document.fonts].map((f) => ({
            family: f.family,
            status: f.status,
          })),
        }
      : null,
  });
};
const readiness = new MutationObserver(checkReady);
function checkReady() {
  if (
    document.querySelectorAll(".showcase-card").length !== 16 ||
    state.milestones.cardsDOM
  )
    return;
  state.milestones.cardsDOM = performance.now();
  readiness.disconnect();
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      state.milestones.cardsFrameOpportunity = performance.now();
    }),
  );
}
readiness.observe(document, { subtree: true, childList: true });
addEventListener("DOMContentLoaded", () => {
  state.milestones.domContentLoaded = performance.now();
  checkReady();
});
addEventListener("load", () => {
  state.milestones.load = performance.now();
  document.fonts?.ready.then(() => {
    state.milestones.fontsReady = performance.now();
  });
});
addEventListener("pageshow", (event) => {
  state.milestones.pageshow = {
    at: performance.now(),
    persisted: event.persisted,
  };
});
const acknowledgementProtocol = globalThis.__perfLifecycleProtocol === "ack-v1";
let pageHidden = false, terminalSent = false;
function flushLifecycle() {
  if (acknowledgementProtocol) {
    if (!pageHidden || document.visibilityState !== "hidden" || terminalSent) return;
    terminalSent = true;
  }
  const data = snapshot();
  // A browser beacon survives destruction of the old execution context; an automation binding does not.
  // Keep the lifecycle beacon below the browser's keepalive quota. Raw entries were drained before navigation.
  navigator.sendBeacon(
    "/__perf/collect",
    new Blob(
      [
        JSON.stringify({
          ...(acknowledgementProtocol ? { protocol: "ack-v1", terminal: true } : {}),
          documentId: data.documentId,
          vitals: data.vitals,
          milestones: data.milestones,
          visibility: data.visibility,
          timestamp: data.timestamp,
        }),
      ],
      { type: "application/json" },
    ),
  );
}
addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") queueMicrotask(flushLifecycle);
});
addEventListener("pagehide", () => {
  pageHidden = true;
  // Run after all lifecycle listeners, including web-vitals finalization.
  if (acknowledgementProtocol) queueMicrotask(flushLifecycle);
  else flushLifecycle();
});
let actionObserver, active;
addEventListener(
  "pointerdown",
  (event) => {
    if (active && active.eventStart === undefined && event.isTrusted)
      active.inputSequenceStart ??= event.timeStamp;
  },
  true,
);
function actionCheck() {
  if (
    !active?.eventStart ||
    active.semanticReady !== undefined ||
    active.completed
  )
    return;
  const { target, attribute, value, text, visible, dialogName } = active.spec;
  let match;
  if (dialogName) {
    const hosts = [
      ...document.querySelectorAll(
        '[role="dialog"],dialog,en-dialog,en-command-palette,fluent-dialog,sp-dialog,swc-popover,wa-dialog,wa-drawer',
      ),
    ];
    match = hosts
      .filter(
        (host) =>
          !host.localName.includes("-") || customElements.get(host.localName),
      )
      .some((host) =>
        [
          host,
          ...(host.shadowRoot?.querySelectorAll('dialog,[role="dialog"]') ||
            []),
        ].some((element) => {
          if (host.matches("wa-dialog,wa-drawer") && (
            !(element instanceof HTMLDialogElement) ||
            !element.open || !element.matches(":modal") ||
            !element.checkVisibility({ visibilityProperty: true })
          )) return false;
          const label =
            element.getAttribute("aria-label") ||
            element.getAttribute("label") ||
            host.getAttribute("aria-label") ||
            host.getAttribute("label") ||
            "";
          const overlay = host.closest("sp-overlay");
          const open =
            element instanceof HTMLDialogElement
              ? element.open
              : overlay
                ? overlay.open
                : "open" in host
                  ? host.open
                  : !element.hidden &&
                    element.getAttribute("aria-hidden") !== "true";
          return (
            (label.includes(dialogName) ||
              element.textContent.includes(dialogName)) &&
            open
          );
        }),
      );
  } else {
    const element = document.querySelector(target);
    match =
      element &&
      (!attribute || element.getAttribute(attribute) === value) &&
      (!text || element.textContent.includes(text)) &&
      (!visible || element.getBoundingClientRect().height > 0);
  }
  if (!match) return;
  active.semanticReady = performance.now();
  const current = active;
  actionObserver.disconnect();
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      current.frameOpportunity = performance.now();
      current.completed = true;
    }),
  );
}
for (const type of ["click", "keydown", "input"])
  addEventListener(
    type,
    (event) => {
      if (
        !active ||
        active.eventStart !== undefined ||
        !event.isTrusted ||
        type !== (active.spec.event || "click")
      )
        return;
      active.eventStart = event.timeStamp;
      active.captureTime = performance.now();
      active.inputTarget = nodeLabel(event.target);
      active.inputPath = event
        .composedPath()
        .filter((node) => node instanceof Element)
        .slice(0, 5)
        .map(nodeLabel);
      queueMicrotask(actionCheck);
    },
    true,
  );
window.__perf = {
  state,
  snapshot,
  arm(name, spec) {
    actionObserver?.disconnect();
    active = { name, spec, armedAt: performance.now() };
    state.actions.push(active);
    actionObserver = new MutationObserver(actionCheck);
    actionObserver.observe(document, {
      subtree: true,
      attributes: true,
      childList: true,
      characterData: true,
    });
    const armedAction = active;
    if (spec.dialogName)
      for (const element of document.querySelectorAll(
        "en-dialog,en-command-palette,fluent-dialog,sp-dialog,swc-popover,wa-dialog,wa-drawer",
      )) {
        const observeRoot = () => {
          if (active !== armedAction || armedAction.completed) return;
          if (element.shadowRoot)
            actionObserver.observe(element.shadowRoot, {
              subtree: true,
              attributes: true,
              childList: true,
            });
          actionCheck();
        };
        if (element.shadowRoot) observeRoot();
        else customElements.whenDefined(element.localName).then(observeRoot);
      }
  },
};
