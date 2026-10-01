/** Availability of a rendered interaction target through slots and shadow hosts. */
export function interactionAvailable(element: HTMLElement): boolean {
  if (!element.isConnected || !element.getClientRects().length) return false;
  for (let current: Element | null = element; current;) {
    if (current.hasAttribute('hidden') || current.hasAttribute('inert')) return false;
    const style = current.ownerDocument.defaultView?.getComputedStyle(current);
    if (style?.visibility === 'hidden' || style?.visibility === 'collapse' || style?.display === 'none') return false;
    current = current.assignedSlot || current.parentElement || (current.getRootNode() as ShadowRoot).host || null;
  }
  return true;
}
