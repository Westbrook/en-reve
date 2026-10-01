import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createScopedRenderer, renderIslandMarkup, serializeHydrationManifest} from '@en-reve/ssr/scoped.js';

if (!process.argv[2]) throw new Error('Usage: node ssr-render.mjs <output-directory>');
const out = resolve(process.argv[2]);
await mkdir(out, {recursive: true});
const renderer = createScopedRenderer({
  editor: {module: new URL('./ssr-editor-module.mjs', import.meta.url), version: 'editor-1'},
  toolbar: {module: new URL('./ssr-toolbar-module.mjs', import.meta.url), version: 'toolbar-1'},
});
const assertions = [];
try {
  const editor = await renderer.render({key: 'editor', snapshot: {text: 'Alpha beta gamma'}});
  assert.match(editor.html, /Alpha beta gamma/);
  assert.match(editor.html, /aria-readonly="true"/);
  assert.doesNotMatch(editor.html, /contenteditable="true"/);
  assertions.push('SSR rich editor exposes readonly text before its essential backend mounts');
  const toolbar = await renderer.render({key: 'toolbar', snapshot: {}});
  const controls = toolbar.html.match(/<en-toolbar(?:\s|>)/g) ?? [];
  const commands = toolbar.html.match(/<en-button(?:\s|>)/g) ?? [];
  assert.equal(controls.length, 1);
  assert.equal(commands.length, 4);
  assertions.push(`SSR constructs ${controls.length} generated toolbar and ${commands.length} command hosts`);
  for (const mode of ['global', 'shadow']) for (const presence of ['present', 'absent']) {
    const islands = [renderIslandMarkup(editor, 'editor-island', mode)];
    if (presence !== 'absent') islands.push(renderIslandMarkup(toolbar, 'toolbar-island', mode));
    const manifests = `[${islands.map(island => serializeHydrationManifest(island.manifest)).join(',')}]`;
    await writeFile(resolve(out, `ssr-${mode}-${presence}.html`), `<!doctype html>
<html lang="en"><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Packed contextual toolbar SSR</title><style>body{font:16px system-ui;margin:32px;max-width:64rem}en-rich-text-editor{display:block;min-height:10rem}#editor-island{display:block;margin-top:64px}</style>
<body data-delivery-mode="${mode}" data-toolbar-presence="${presence}"><h1>Packed contextual toolbar SSR</h1>
<label>Essential draft <input value="Keep this"></label>
${islands.map(island => island.html).join('\n')}
<script type="application/json" id="ssr-manifests">${manifests}</script>
<script type="module" src="./ssr-boot.js"></script></body></html>`);
  }
} finally { renderer.dispose(); }

await writeFile(resolve(out, 'ssr-editor-contract.json'), JSON.stringify({
  source: 'packed public @en-reve/ssr/scoped.js', status: 'passed', assertions,
  baseline: 'The essential rich editor backend replaces its readonly SSR control during mount. Preservation assertions begin at the live backend node before independently hydrating or constructing toolbar controls.',
}, null, 2) + '\n');
console.log(`Packed contextual toolbar SSR: ${assertions.length} server assertions passed.`);
