import { blockingExcess } from './pass2-metrics.mjs';

// The same definitions and units as the retained second-pass report. These
// descriptors only derive metrics; they never alter a sample or acquisition.
export const number = (label, key, options = {}) => ({ label, key, digits: 1, scale: 1, stat: 'median', ...options });
const n = number;
export const metricGroups = {
  loading: [
    n('FCP ms', 'fcp'), n('LCP ms', 'lcp'), n('LCP p75 ms', 'lcp', { stat: 'p75' }),
    n('CLS', 'cls', { digits: 6 }), n('CLS p75', 'cls', { stat: 'p75', digits: 6 }), n('CLS max', 'cls', { stat: 'max', digits: 6 }),
    n('TTFB ms', 'ttfb'), n('Cards frame opportunity ms', 'cardsFrameOpportunity'),
    n('Last webfont response ms', 'lastFontResponse', { get: s => {
      const urls = new Set((s.networkObservation ?? s.network ?? []).filter(r => r.type === 'Font').map(r => r.url));
      const times = (s.collector?.entries?.resource ?? []).filter(r => urls.has(r.name) && r.responseEnd > 0).map(r => r.responseEnd);
      return times.length ? Math.max(...times) : null;
    } }),
  ],
  lcp: [
    n('TTFB portion ms', 'lcpTTFB', { get: s => s.collector?.vitals?.LCP?.attribution?.timeToFirstByte }),
    n('Resource delay ms', 'lcpDelay', { get: s => s.collector?.vitals?.LCP?.attribution?.resourceLoadDelay }),
    n('Resource duration ms', 'lcpResource', { get: s => s.collector?.vitals?.LCP?.attribution?.resourceLoadDuration }),
    n('Element render delay ms', 'lcpRender', { get: s => s.collector?.vitals?.LCP?.attribution?.elementRenderDelay }),
  ],
  startup: [
    n('Control observed ms', 'startupVisible'), n('Click from navigation ms', 'startupInput'),
    n('Result from navigation ms', 'startupResult'), n('Result p75 ms', 'startupResult', { stat: 'p75' }),
    n('Dispatch overhead ms', 'startupDispatchLag'), n('Discovery probe ms', 'startupProbeDuration', { get: s => s.startup?.probeDurationMs }),
    n('Click to result ms', 'startupSemantic'), n('Click to frame ms', 'startupFeedback'), n('First input delay ms', 'firstInputDelay'),
  ],
  transfer: [
    n('Total response KiB', 'responseTransferBytes', { scale: 1024 }), n('HTML KiB', 'htmlTransferBytes', { scale: 1024, digits: 3 }),
    n('JS KiB', 'jsTransferBytes', { scale: 1024 }), n('CSS KiB', 'cssTransferBytes', { scale: 1024 }),
    n('Fonts KiB', 'fontTransferBytes', { scale: 1024 }), n('Other KiB', 'otherTransferBytes', { scale: 1024 }),
    n('HTTP responses', 'responseCount', { digits: 0, get: s => (s.networkObservation ?? s.network ?? []).filter(r => /^https?:/.test(r.url) && !new URL(r.url).pathname.startsWith('/__perf/')).length }),
    n('Cache reuse entries', 'cacheReuse', { digits: 0, get: s => (s.collector?.entries?.resource ?? []).filter(r => r.transferSize === 0 && r.encodedBodySize > 0).length }),
    n('Incomplete responses', 'incompleteResponses', { digits: 0 }),
  ],
  thread: [
    n('Script ms', 'scriptMs'), n('Style ms', 'styleMs'), n('Layout ms', 'layoutMs'), n('Task ms', 'taskMs'),
    n('Layout passes', 'layoutPasses', { digits: 0, get: s => s.browserMetrics?.LayoutCount }),
    n('Style recalcs', 'styleRecalcs', { digits: 0, get: s => s.browserMetrics?.RecalcStyleCount }), n('Long tasks ms', 'longTaskMs'),
    n('Pre-FCP blocking excess ms', 'preFCPBlocking', { get: s => blockingExcess(s.collector?.entries?.longtask, 0, s.metrics?.fcp) }),
    n('Post-FCP blocking excess ms', 'postFCPBlocking', { get: s => blockingExcess(s.collector?.entries?.longtask, s.metrics?.fcp, s.collector?.timestamp) }),
    n('Long animation frames ms', 'loafMs'),
  ],
  lighthouse: [
    n('FCP ms', 'fcp'), n('LCP ms', 'lcp'), n('LCP p75 ms', 'lcp', { stat: 'p75' }), n('LCP max ms', 'lcp', { stat: 'max' }),
    n('TBT ms', 'tbt'), n('TBT p75 ms', 'tbt', { stat: 'p75' }), n('TBT max ms', 'tbt', { stat: 'max' }),
    n('Speed Index ms', 'speedIndex'), n('CLS', 'cls', { digits: 6 }),
  ],
  interactions: [
    n('Scripted INP ms', 'scriptedINP'), n('Scripted INP p75 ms', 'scriptedINP', { stat: 'p75' }),
    n('First input delay ms', 'firstInputDelay'), n('Journey CLS', 'cls', { digits: 6 }),
    n('Max scroll rAF gap ms', 'scrollGap', { get: s => s.scroll?.intervals?.length ? Math.max(...s.scroll.intervals) : null }),
  ],
};
export const actions = [
  ['canvas-landscape-first', 'First canvas change'], ['canvas-landscape-warm', 'Repeated canvas change'],
  ['asset-add-first', 'First asset addition'], ['dialog-open-first', 'First dialog opening'],
  ['dialog-open-warm', 'Repeated dialog opening'], ['review-submit', 'Review submission'], ['commands-first', 'First command opening'],
];
