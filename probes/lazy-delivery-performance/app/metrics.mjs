export const errors = [];
export function census(root = document) {
  let nodes = 0, elements = 0, shadowRoots = 0, templateElements = 0;
  function visit(node) {
    nodes++;
    if (node.nodeType === 1) {
      elements++;
      if (node.shadowRoot) { shadowRoots++; visit(node.shadowRoot); }
      if (node instanceof HTMLTemplateElement) templateElements += node.content.querySelectorAll('*').length;
    }
    for (const child of node.childNodes) visit(child);
  }
  visit(root);
  return {nodes, elements, shadowRoots, templateElements};
}
const observations = {longTasks: null, layoutShifts: null};
for (const [type, key] of [['longtask', 'longTasks'], ['layout-shift', 'layoutShifts']]) {
  if (PerformanceObserver.supportedEntryTypes.includes(type)) {
    observations[key] = [];
    new PerformanceObserver(list => {
      for (const e of list.getEntries()) observations[key].push({start: e.startTime, duration: e.duration, value: e.value ?? null, hadRecentInput: e.hadRecentInput ?? null});
    }).observe({type, buffered: true});
  }
}
export function snapshot(component) {
  const resources = performance.getEntriesByType('resource').filter(r => r.initiatorType === 'script' || /\.m?js(?:\?|$)/.test(r.name));
  return {at: performance.now(), ...census(), componentNodes: component ? census(component).nodes : 0,
    jsBytes: resources.reduce((n, r) => n + r.encodedBodySize, 0), jsRequests: resources.length,
    resources: resources.map(r => ({name: new URL(r.name).pathname, encodedBodySize: r.encodedBodySize, transferSize: r.transferSize, startTime: r.startTime, responseEnd: r.responseEnd, protocol: r.nextHopProtocol})),
    observations: structuredClone(observations)};
}
export async function settle(element) {
  for (let pass = 0; pass < 3; pass++) {
    const updates = [];
    function visit(root) {
      if (root.updateComplete) updates.push(root.updateComplete);
      for (const child of root.children ?? []) { visit(child); if (child.shadowRoot) visit(child.shadowRoot); }
    }
    visit(element); if (element.shadowRoot) visit(element.shadowRoot);
    await Promise.all(updates);
  }
}
export function install(study) {
  window.deliveryStudy = study;
  document.querySelector('#form').addEventListener('submit', e => {
    e.preventDefault(); document.querySelector('#result').textContent = JSON.stringify(Object.fromEntries(new FormData(e.currentTarget)));
  });
  if (new URLSearchParams(location.search).has('progress-report')) document.querySelector('#report-return').hidden = false;
}
