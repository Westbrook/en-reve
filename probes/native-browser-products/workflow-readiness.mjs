// Probe-only mirror of the original workflows.spec.ts authored-child contract.
// Serialized into the browser. No imports, production changes or global registration.
export function workflowReadiness() {
  const root = document.querySelector('en-workflows-app');
  const dormant = root?.querySelector('#settings en-command-palette#settings-command-palette');
  const children = [...(root?.querySelectorAll('*') ?? [])]
    .filter(element => element.localName.includes('-'))
    .map(element => {
      const registry = 'customElementRegistry' in element
        ? element.customElementRegistry : element.ownerDocument.defaultView.customElements;
      const definition = registry?.get(element.localName);
      const lazy = element === dormant;
      return {tag: element.localName, id: element.id, dormant: lazy,
        ready: lazy ? !definition && !('updateComplete' in element)
          : Boolean(definition && element instanceof definition && element.hasUpdated)};
    });
  return {ready: Boolean(root?.hasUpdated && !root.hasAttribute('data-ssr')
      && children.length && children.every(child => child.ready)),
    children, dormantCount: root?.querySelectorAll('#settings-command-palette').length ?? 0};
}
