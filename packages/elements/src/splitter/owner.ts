/** @internal A private split view owns actions from its contained splitter. */
export type SplitterOwner = (proposed: number, reason: 'keyboard' | 'pointer') => void;

const owners = new WeakMap<Element, SplitterOwner>();

/** @internal No property or event is added to the public splitter host. */
export function setSplitterOwner(splitter: Element, owner?: SplitterOwner): void {
  if (owner) owners.set(splitter, owner);
  else owners.delete(splitter);
}

/** @internal Resolve ownership before a standalone splitter stages a transaction. */
export function getSplitterOwner(splitter: Element): SplitterOwner | undefined {
  return owners.get(splitter);
}
