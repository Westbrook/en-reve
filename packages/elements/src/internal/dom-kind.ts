/** DOM kind checks must survive same-origin adoption and mixed-realm event paths. */
export function isDOMNode(value: unknown): value is Node {
  return !!value && typeof value === 'object' && typeof (value as Node).nodeType === 'number' && typeof (value as Node).getRootNode === 'function';
}
export function isDOMElement(value: unknown): value is Element { return isDOMNode(value) && value.nodeType === 1; }
export function isHTMLElement(value: unknown): value is HTMLElement { return isDOMElement(value) && value.namespaceURI === 'http://www.w3.org/1999/xhtml'; }
export function isHTMLButton(value: unknown): value is HTMLButtonElement { return isHTMLElement(value) && value.localName === 'button'; }
export function isDOMShadowRoot(value: unknown): value is ShadowRoot { return isDOMNode(value) && value.nodeType === 11 && isDOMElement((value as ShadowRoot).host); }
