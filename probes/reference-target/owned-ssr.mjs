import '@en-reve/ssr/install.js';
const { html } = await import('lit');
const { renderToString } = await import('@en-reve/ssr');
const { ProbeOwnedField } = await import('./owned-field.js');
customElements.define('probe-owned-field', ProbeOwnedField);
const markup = await renderToString(html`<label id="external" for="owned">Server account</label><form id="form"><probe-owned-field id="owned" name="account" value="server value" label="Internal account"></probe-owned-field></form>`);
// Pinned Lit SSR serializes mode/delegatesFocus, but drops referenceTarget.
// Prototype an explicit serializer adapter without rewriting any Lit markers.
// This fixture contains exactly one component/root. Production must determine
// targets per renderer, not substitute this single-fixture string edit globally.
const marker = /<template\b[^>]*shadowrootmode="open"[^>]*>/g;
const roots = [...markup.matchAll(marker)];
if (roots.length !== 1 || roots[0][0].includes('shadowrootreferencetarget')) throw new Error('Review SSR serializer assumptions');
const declared = markup.replace(marker, tag => tag.slice(0, -1) + ' shadowrootreferencetarget="control">');
process.stdout.write(`<!doctype html><html lang="en"><meta charset="utf-8"><title>Owned labels SSR</title>${declared}<button id="hydrate">Hydrate</button><script type="module">
document.querySelector('#hydrate').addEventListener('click', async () => {
  await import('@lit-labs/ssr-client/lit-element-hydrate-support.js');
  const { ProbeOwnedField } = await import('/probes/reference-target/owned-field.js');
  customElements.define('probe-owned-field', ProbeOwnedField);
  await document.querySelector('#owned').updateComplete;
  document.body.dataset.hydrated = 'true';
});
</script></html>`);
