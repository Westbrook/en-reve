import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { build } from '../node_modules/esbuild/lib/main.js';

export async function render({ environment, islandHtml }) {
 const require = createRequire(join(environment, 'package.json'));
 const { version } = require('svelte/package.json');
 const legacy = version.startsWith('4.');
 const { compile } = require('svelte/compiler');
 const source = `<script>
 import { onMount } from 'svelte';
 export let islandHtml = '';
 let ready = false;
 let checked = false;
 let revised = false;
 let selected = '';
 function properties(node, values) { Object.assign(node, values); return {update(next) {Object.assign(node, next);}}; }
 function treeEvents(node) { node.addEventListener('en-change', selectItem); return {destroy() {node.removeEventListener('en-change', selectItem);}}; }
 function selectItem(event) { selected = event.detail.proposed.selectedKey; window.fixture.clientEvents.push(selected); }
 onMount(() => { ready = true; });
 function checkedProperty(node, value) { node.checked = value; return { update(value) { node.checked = value; } }; }
 function change(event) {
  const mode = window.fixture.getMode();
  if (mode === 'reject') { event.preventDefault(); return; }
  if (mode === 'supersede') { event.preventDefault(); event.currentTarget.checked = event.detail.previous; return; }
  checked = event.detail.proposed;
 }
 </script>
 <h1>Svelte ${version} consumption</h1>
 <div id="mode-controls">
  <button id="accept-mode" on:click={() => window.fixture.setMode('accept')}>Accept changes</button>
  <button id="reject-mode" on:click={() => window.fixture.setMode('reject')}>Reject changes</button>
  <button id="supersede-mode" on:click={() => window.fixture.setMode('supersede')}>Supersede changes</button>
  <button id="add-option" on:click={() => window.fixture.addOption()}>Add PDF option</button>
  <button id="remove-option" on:click={() => window.fixture.removeOption()}>Remove PDF option</button>
 </div>
 <div id="component-island">{@html islandHtml}</div>
 <section aria-label="Framework-owned client control">
  <button id="client-update" on:click={() => revised = true}>Update properties</button>
  <button id="client-mount" on:click={() => ready = !ready}>Mount or unmount controls</button>
  <output id="client-tree-state">{selected}</output>
  {#if ready}
   <en-text-field id="client-field" use:properties={{label: 'Project title', value: revised ? 'Revised brief' : 'Initial brief'}}><span slot="description">Framework supplied description</span></en-text-field>
   <en-tree id="client-tree" use:properties={{items: [{key: revised ? 'export' : 'project', label: revised ? 'Export artwork' : 'Project artwork'}]}} use:treeEvents></en-tree>
   <en-checkbox id="client-checkbox" use:checkedProperty={checked} on:en-change={change}>Framework owned choice</en-checkbox>
   <button id="client-toggle" on:click={() => checked = !checked}>Toggle from framework</button>
   <output id="client-state">{String(checked)}</output>
  {/if}
 </section>`;
 const ssr = compile(source, { filename:'Consumer.svelte', generate:legacy ? 'ssr' : 'server', ...(legacy ? { hydratable:true } : {}) }).js.code;
 const serverPath = join(environment, 'consumer-server.mjs');
 await build({ stdin:{contents:ssr,resolveDir:environment,sourcefile:'Consumer.svelte.js'}, bundle:true, platform:'node', format:'esm', outfile:serverPath, logLevel:'silent' });
 const { default: Component } = await import(pathToFileURL(serverPath));
 let html;
 if (legacy) html = Component.render({ islandHtml }).html;
 else {
  const { render } = await import(pathToFileURL(require.resolve('svelte/server')));
  html = render(Component, { props:{islandHtml} }).body;
 }
 const client = compile(source,{filename:'Consumer.svelte', generate:legacy ? 'dom' : 'client', ...(legacy ? {hydratable:true}: {})}).js.code;
 const clientPath = join(environment,'consumer-client.mjs');
 await writeFile(clientPath,client);
 const clientSource = `import Component from './consumer-client.mjs';
 ${legacy ? '' : "import { hydrate } from 'svelte';"}
 export function start() {
  const target = document.querySelector('#framework-root');
  const islandHtml = document.querySelector('#component-island').innerHTML;
  ${legacy ? 'new Component({target,hydrate:true,props:{islandHtml}});' : 'hydrate(Component,{target,props:{islandHtml}});'}
 }`;
 return {html,clientSource};
}
