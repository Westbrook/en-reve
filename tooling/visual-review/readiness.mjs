/** Runs inside the captured document; no module closures or implicit registration. */
export async function waitForRenderedElements(root, timeout = 20000) {
 const ready = new Set(), deferred = new Set();
 let pending = 'capture root', timer, stopped = false;
 const identify = element => element.localName + (element.id ? '#' + element.id : '');
 const visit = async element => {
  if (element.localName.includes('-')) {
   pending = identify(element);
   const needsHydration = () => !element.matches(':defined') || element.hasAttribute('defer-hydration');
   if (needsHydration()) {
    // Empty, closed lazy surfaces may deliberately remain unregistered. They
    // cannot paint pixels, but must be rechecked after authored state actions.
    const paints = element.checkVisibility() && [...element.getClientRects()].some(rect => rect.width > 0 && rect.height > 0);
    if (paints) {
     while (needsHydration() && !stopped) await new Promise(resolve => requestAnimationFrame(resolve));
     if (stopped) return;
    } else deferred.add(pending);
   }
   if (!needsHydration()) {
    if (element.updateComplete) await element.updateComplete;
    ready.add(identify(element));
   }
  }
  for (const child of element.children) await visit(child);
  if (element.shadowRoot) for (const child of element.shadowRoot.children) await visit(child);
 };
 try {
  await Promise.race([visit(root), new Promise((_, reject) => {
   timer = setTimeout(() => reject(new Error('Custom-element readiness timed out at ' + pending)), timeout);
  })]);
  return { ready: [...ready].sort(), deferredNonpainting: [...deferred].sort() };
 } finally { stopped = true; clearTimeout(timer); }
}
