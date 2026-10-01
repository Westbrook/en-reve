/** A null scoped registry is intentionally uninitialized, never the document registry. */
export function elementRegistry(element: Element): CustomElementRegistry | null | undefined {
  const scoped = element as Element & { customElementRegistry?: CustomElementRegistry | null };
  const root = element.getRootNode() as Node & { customElementRegistry?: CustomElementRegistry | null };
  return 'customElementRegistry' in scoped ? scoped.customElementRegistry
    : 'customElementRegistry' in root ? root.customElementRegistry
    : element.ownerDocument.defaultView?.customElements;
}

const connectedDocuments = new WeakMap<Element, Document>();
/** The document where connection-owned listeners were installed, including during adoption callbacks. */
export const connectionDocument = (element: Element): Document => connectedDocuments.get(element) ?? element.ownerDocument;
export const recordConnectionDocument = (element: Element): void => { connectedDocuments.set(element, element.ownerDocument); };
export const releaseConnectionDocument = (element: Element): void => { connectedDocuments.delete(element); };
