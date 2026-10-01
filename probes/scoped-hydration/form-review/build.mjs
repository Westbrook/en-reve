import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createScopedRenderer, renderIslandMarkup} from '@en-reve/ssr/scoped.js';
const {build} = await import(pathToFileURL(process.env.REVIEW_ESBUILD));
const out = process.env.REVIEW_OUT;
await mkdir(out, {recursive:true});
const renderer = createScopedRenderer({form:{module:new URL('./form.mjs', import.meta.url), version:'phase5-form-review-v1'}});
try {
  const result = await renderer.render({key:'form', snapshot:{}});
  const shell = await readFile(new URL('./page.html', import.meta.url), 'utf8');
  for (const delivery of ['shadow','global']) {
    const island = renderIslandMarkup(result, 'managed', delivery);
    const page = shell.replace('<!-- ISLAND -->', island.html)
      .replace('/* MANIFEST */', JSON.stringify(island.manifest))
      .replaceAll('DELIVERY_MODE', delivery);
    await writeFile(resolve(out, `${delivery}.html`), page);
  }
  await build({entryPoints:[resolve('boot.mjs')], outdir:out, bundle:true, splitting:true, platform:'browser', format:'esm', target:'es2022'});
} finally { renderer.dispose(); }
