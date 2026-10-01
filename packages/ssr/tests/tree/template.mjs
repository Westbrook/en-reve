import { html } from 'lit';

export const dataItems = [{ value: 'assets', label: 'Assets', children:
  Array.from({ length: 80 }, (_, index) => ({ value: `asset-${index}`, label: `Asset ${index}` })),
}];

export function treeTemplate() {
  return html`<en-tree id="tree" label="Project files" value="readme" .expanded=${['source']}>
    <en-tree-item id="source" value="source" label="Source">
      <strong id="rich-label" slot="label">Project source</strong>
      <en-tree-item id="readme" slot="children" value="readme" label="Readme"></en-tree-item>
      <en-tree-item id="tests" slot="children" value="tests" label="Tests"></en-tree-item>
    </en-tree-item>
    <en-tree-item id="archive" value="archive" label="Archive">
      <en-tree-item id="old" slot="children" value="old" label="Old notes"></en-tree-item>
    </en-tree-item>
  </en-tree>
  <en-tree id="canonical-tree" label="Canonical files" selected-key="canonical-child" value="ignored" .expandedKeys=${['canonical-folder']}>
    <en-tree-item key="canonical-folder" value="ignored-folder" label="Canonical folder">
      <en-tree-item id="canonical-child" slot="children" key="canonical-child" value="ignored-child" label="Canonical child"></en-tree-item>
    </en-tree-item>
  </en-tree>
  <en-tree id="data-tree" label="Virtual data files" virtualize .items=${dataItems} .expanded=${['assets']} value="asset-0"></en-tree>`;
}
