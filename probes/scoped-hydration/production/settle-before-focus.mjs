/** Application readiness for newly hydrated modal content; not a generic hydration delay. */
export function settleBeforeFocus(root, signal) {
  const document = root.ownerDocument, view = document.defaultView;
  return new Promise((resolve, reject) => {
    let frame = 0, finished = false;
    const unavailable = () => signal?.aborted || !root.isConnected || root.ownerDocument !== document;
    const finish = error => {
      if (finished) return;
      finished = true;
      view?.cancelAnimationFrame(frame);
      signal?.removeEventListener('abort', cancel);
      if (error) reject(error); else resolve();
    };
    const cancel = () => finish(new DOMException('Modal readiness canceled', 'AbortError'));
    signal?.addEventListener('abort', cancel, {once:true});
    if (!view || unavailable()) { cancel(); return; }
    frame = view.requestAnimationFrame(() => {
      if (unavailable()) { cancel(); return; }
      frame = view.requestAnimationFrame(() => unavailable() ? cancel() : finish());
    });
  });
}
