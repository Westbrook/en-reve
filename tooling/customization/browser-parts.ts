/** Run with locator.evaluate after the fixture has rendered. Returns only Parts
 * externally reachable on this host, following each owned exportparts boundary.
 * This inspects a chosen runtime state; it does not infer conditional coverage. */
export function exposedParts(host: Element): string[] {
  function collect(element: Element): Set<string> {
    const names = new Set<string>();
    if (!element.shadowRoot) return names;
    for (const node of element.shadowRoot.querySelectorAll('[part], [exportparts]')) {
      for (const name of (node.getAttribute('part') ?? '').split(/\s+/).filter(Boolean)) names.add(name);
      if (!node.hasAttribute('exportparts')) continue;
      const child = collect(node);
      for (const mapping of node.getAttribute('exportparts')!.split(',')) {
        const tokens = mapping.trim().split(':').map(value => value.trim());
        if (tokens.length > 2 || !tokens[0]) continue;
        const [source, target = source] = tokens;
        if (target && child.has(source)) names.add(target);
      }
    }
    return names;
  }
  return [...collect(host)].sort();
}
