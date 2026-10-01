// Manual-review experiment only: do not import this into the library or benchmarks.
while (!window.study) await new Promise(requestAnimationFrame);
const picker = window.study.picker;
const status = picker.shadowRoot.querySelector('[part="calendar-status"]');
const show = picker.showPicker;
let attempt = 0;
let failedRetries = 0;
const mode = new URLSearchParams(location.search).get('retry-review') === 'distinct' ? 'distinct' : 'settled';
const frame = () => new Promise(requestAnimationFrame);
window.retryReview = {mode, events: []};
const marker = document.createElement('p');
marker.id = 'retry-experiment-ready';
marker.textContent = mode === 'distinct' ? 'Retry experiment B: distinct error text — ready.' : 'Retry experiment A: clear and restore — ready.';
document.querySelector('h1').after(marker);
const record = event => window.retryReview.events.push({event, at: performance.now(), text: status.textContent});
new MutationObserver(() => record('status')).observe(status, {subtree: true, childList: true, characterData: true});
picker.showPicker = function (...args) {
  const id = ++attempt;
  const retry = status.textContent === picker.loadErrorLabel;
  record(retry ? 'retry' : 'open');
  const result = show.apply(this, args);
  // Observe rejection without changing the public promise, focus, or load outcome.
  void result.catch(async () => {
    await picker.updateComplete;
    if (!retry || id !== attempt || !picker.isConnected || status.textContent !== picker.loadErrorLabel) return;
    if (mode === 'distinct') {
      // Set the public reactive label only after this attempt actually failed.
      // Each failure gets distinct text, without timers or changes to focus.
      picker.loadErrorLabel = `Calendar retry ${++failedRetries} failed. Reload the page or enter a date directly.`;
      await picker.updateComplete;
      record('distinct-retry-error');
      return;
    }
    const error = status.textContent;
    status.textContent = '';
    record('clear-retry-error');
    await frame();
    await frame();
    if (id === attempt && picker.isConnected && !status.textContent) {
      status.textContent = error;
      record('restore-retry-error');
    }
  });
  return result;
};
