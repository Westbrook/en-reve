/** Returns the actual focused element from an owned root through open shadow roots. */
export function focusedElement(root: Document | ShadowRoot): Element | null {
  let element = root.activeElement;
  while (element?.shadowRoot?.activeElement) element = element.shadowRoot.activeElement;
  return element;
}

/** A removed, hidden, disabled, or inert opener must not receive restored focus. */
export function restoreFocus(element: HTMLElement | null): void {
  if (!element?.isConnected || element.matches(':disabled, [hidden], [aria-disabled="true"]')) return;
  let ancestor: Node | null = element;
  while (ancestor) {
    if ('inert' in ancestor && ((ancestor as HTMLElement).inert || (ancestor as HTMLElement).hidden)) return;
    ancestor = ancestor.parentNode ?? ('host' in ancestor ? (ancestor as ShadowRoot).host : null);
  }
  if (!element.getClientRects().length) return;
  element.focus({ preventScroll: true });
}

/** Includes slotted content and native controls inside nested shadow roots. */
export function composedContains(container: Node, node: Node | null): boolean {
  while (node) {
    if (node === container) return true;
    node = ('assignedSlot' in node && (node as Element).assignedSlot)
      || node.parentNode || ('host' in node ? (node as ShadowRoot).host : null);
  }
  return false;
}
