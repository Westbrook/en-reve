import { createScopedRenderer, renderIslandMarkup } from '@en-reve/ssr/scoped.js';
const renderer = createScopedRenderer({ fields: { module: new URL('./island-fields.mjs', import.meta.url), version: 'reference-fields' } });
try {
  const result = await renderer.render({ key: 'fields', snapshot: { value: 'Server account' } });
  const pages = {};
  for (const delivery of ['shadow', 'global', 'template']) {
    const { html, manifest } = renderIslandMarkup(result, 'island', delivery);
    pages[delivery] = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Field reference island</title>${html}<script type="module">
      import { createHydrationIsland } from '@en-reve/ssr/client.js';
      const host = document.querySelector('#island');
      const root = host.shadowRoot ?? host;
      const template = host.querySelector(':scope > template[data-en-island-template]') ?? undefined;
      window.fieldIsland = createHydrationIsland({ root, template, manifest: ${JSON.stringify(manifest)}, snapshot: {value:'Server account'}, loaders: {fields: () => import('/probes/reference-target/island-fields.mjs')} });
      document.body.dataset.ready = 'true';
    </script></html>`;
  }
  process.stdout.write(JSON.stringify(pages));
} finally { renderer.dispose(); }
