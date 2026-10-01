import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createScopedRenderer, renderIslandMarkup, serializeHydrationManifest} from '@en-reve/ssr/scoped.js';

if (!process.argv[2]) throw new Error('Usage: node ssr-render.mjs <output-directory>');
const out = resolve(process.argv[2]);
await mkdir(out, {recursive: true});
const moduleURL = new URL('./ssr-module.mjs', import.meta.url);
const identity = {schemaVersion: 1, id: 'fixture/ssr', version: '1'};
const acceptedIdentity = {...identity};
const assertions = [];
const renderer = createScopedRenderer({form: {module: moduleURL, version: 'form', delivery: identity}});
let result;
try {
  // Entry identity belongs to the renderer after construction, not its caller.
  Object.assign(identity, {schemaVersion: 2, id: 'fixture/mutated', version: '2'});
  const snapshot = {message: 'Initial'};
  const pending = renderer.render({key: 'form', snapshot});
  snapshot.message = 'Mutation after submission';
  result = await pending;
  assert.deepEqual(result.delivery, acceptedIdentity);
  assert.match(result.html, /Initial/);
  assert.doesNotMatch(result.html, /Mutation after submission/);
  assertions.push('renderer snapshots delivery identity and request data');
} finally { renderer.dispose(); }

for (const mode of ['global', 'shadow', 'template']) {
  const island = renderIslandMarkup(result, 'ssr-island', mode);
  assert.deepEqual(island.manifest.delivery, acceptedIdentity);
  const serialized = serializeHydrationManifest(island.manifest);
  assert.deepEqual(JSON.parse(serialized).delivery, acceptedIdentity);
  assertions.push(`${mode} markup and serialized manifest carry the exact delivery identity`);
  await writeFile(resolve(out, `ssr-${mode}.html`), `<!doctype html>
<html lang="en"><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Packed SSR delivery agreement</title><body data-delivery-mode="${mode}">
<h1>Packed SSR delivery agreement</h1>
<form id="essential"><label>Essential draft <input name="essential" value="Keep this" required></label><button>Native save</button></form>
${island.html}
<script type="application/json" id="ssr-manifest">${serialized}</script>
<script type="module" src="./ssr-boot.js"></script></body></html>`);
}

function alteredIdentity(kind) {
  if (kind === 'missing') return undefined;
  return {...acceptedIdentity,
    ...(kind === 'id' ? {id: 'fixture/other'} : {}),
    ...(kind === 'version' ? {version: '2'} : {}),
    ...(kind === 'schema' ? {schemaVersion: 2} : {}),
  };
}

for (const side of ['entry', 'module']) for (const kind of ['missing', 'id', 'version', 'schema']) {
  const name = `${side}-${kind}`;
  const moduleIdentity = side === 'module' ? alteredIdentity(kind) : acceptedIdentity;
  const path = resolve(out, `ssr-mismatch-${name}.mjs`);
  // A definition accessor is a tripwire: mismatch validation must run before
  // definition collection, and therefore before registration or rendering.
  await writeFile(path, `export {version, ready} from ${JSON.stringify(moduleURL.href)};
export const definitions = [{get tagName() {throw new Error('SSR_DEFINITIONS_TOUCHED');}}];
export function template() {throw new Error('SSR_TEMPLATE_TOUCHED');}
${moduleIdentity === undefined ? '' : `export const delivery = ${JSON.stringify(moduleIdentity)};`}
`);
  let mismatchRenderer;
  try {
    await assert.rejects(async () => {
      mismatchRenderer = createScopedRenderer({form: {
        module: pathToFileURL(path), version: 'form',
        delivery: side === 'entry' ? alteredIdentity(kind) : acceptedIdentity,
      }});
      await mismatchRenderer.render({key: 'form', snapshot: {message: 'Initial'}});
    }, error => {
      assert.match(String(error), /delivery|schema/i, name);
      assert.doesNotMatch(String(error), /SSR_(DEFINITIONS|TEMPLATE)_TOUCHED/, name);
      return true;
    });
    assertions.push(`${name} rejects before definition collection and rendering`);
  } finally { mismatchRenderer?.dispose(); }
}

await writeFile(resolve(out, 'ssr-contract.json'), JSON.stringify({
  source: 'packed public @en-reve/ssr/scoped.js', identity: acceptedIdentity,
  status: 'passed', assertions,
}, null, 2) + '\n');
console.log(`Packed SSR identity agreement: ${assertions.length} assertions passed.`);
