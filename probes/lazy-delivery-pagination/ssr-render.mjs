import assert from 'node:assert/strict';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createScopedRenderer, renderIslandMarkup, serializeHydrationManifest} from '@en-reve/ssr/scoped.js';

if (!process.argv[2]) throw new Error('Usage: node ssr-render.mjs <output-directory>');
const out = resolve(process.argv[2]);
await mkdir(out, {recursive: true});
const theme = await readFile(new URL(import.meta.resolve('@en-reve/tokens/default.css')), 'utf8');
const renderer = createScopedRenderer({
  pagination: {module: new URL('./ssr-module.mjs', import.meta.url), version: 'pagination-1'},
});
const assertions = [];
try {
  const snapshot = {page: 3, pageCount: 12};
  const result = await renderer.render({key: 'pagination', snapshot});
  assert.deepEqual(result.tags, ['en-pagination']);
  assert.match(result.html, /<nav\b[^>]*aria-label="Asset pages"/);
  assert.match(result.html, /aria-current="page"/);
  assert.match(result.html, /Page 3 of 12/);
  assert.match(result.html, /<slot\b[^>]*name="previous"/);
  assert.match(result.html, /<slot\b[^>]*name="next"/);
  assert.equal((result.html.match(/<input(?:\s|>)/g) ?? []).length, 1);
  assert.equal((result.html.match(/part="jump"/g) ?? []).length, 1);
  assert.equal((result.html.match(/popover="auto"/g) ?? []).length, 1);
  assertions.push(`Eager: public packed definition renders navigation, current-page status, authored slots and one native shell; generated chooser count 1`);
  for (const mode of ['global', 'shadow']) {
    const island = renderIslandMarkup(result, 'pagination-island', mode);
    await writeFile(resolve(out, `ssr-${mode}-eager.html`), `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Packed pagination SSR</title><style>${theme}</style>
<style>body{font:16px/1.5 system-ui;margin:32px;max-width:64rem}#pagination-island{display:block;inline-size:44rem;max-inline-size:100%;margin-block:32px}</style></head>
<body data-delivery-mode="${mode}"><h1>Packed pagination SSR</h1>
<p>The application owns this plain link: <a id="plain-fallback" href="./fallback-page-4.html">Continue to page 4</a></p>
${island.html}
<script type="application/json" id="ssr-manifest">${serializeHydrationManifest(island.manifest)}</script>
<script type="module" src="./ssr-boot.js"></script></body></html>`);
  }
} finally { renderer.dispose(); }

await writeFile(resolve(out, 'fallback-page-4.html'), '<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>Asset page 4</title></head><body><h1>Asset page 4</h1><p>Application-owned page navigation works without JavaScript.</p></body></html>');
await writeFile(resolve(out, 'ssr-pagination-contract.json'), JSON.stringify({
  source: 'packed public @en-reve/elements/definitions/pagination.js and @en-reve/ssr/scoped.js',
  status: 'passed', assertions,
  limits: ['Pagination actions and chooser positioning require JavaScript. The consumer owns the plain fallback link.', 'The native number input has no text-selection API contract.'],
}, null, 2) + '\n');
console.log(`Packed pagination SSR: ${assertions.length} eager contracts passed.`);

