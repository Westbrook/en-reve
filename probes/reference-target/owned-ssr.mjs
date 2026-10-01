import '@en-reve/ssr/install.js';
const { html } = await import('lit');
const { renderToString } = await import('@en-reve/ssr');
const { ProbeOwnedField } = await import('./owned-field.js');
customElements.define('probe-owned-field', ProbeOwnedField);
const markup = await renderToString(html`<label id="external" for="owned">Server account</label><form id="form"><probe-owned-field id="owned" name="account" value="server value" label="Internal account"></probe-owned-field></form>`);
// The production renderer must serialize this target; the fixture adds no
// replacement markup and therefore exercises the same path as consuming apps.
const marker = /<template\b[^>]*shadowrootmode="open"[^>]*>/g;
const roots = [...markup.matchAll(marker)];
if (roots.length !== 1 || !roots[0][0].includes('shadowrootreferencetarget="control"')) throw new Error('Missing production Reference Target serialization');
const declared = markup;
process.stdout.write(`<!doctype html><html lang="en"><meta charset="utf-8"><title>Owned labels SSR</title>${declared}<button id="hydrate">Hydrate</button><script type="module">
document.querySelector('#hydrate').addEventListener('click', async () => {
  await import('@lit-labs/ssr-client/lit-element-hydrate-support.js');
  const { ProbeOwnedField } = await import('/probes/reference-target/owned-field.js');
  customElements.define('probe-owned-field', ProbeOwnedField);
  await document.querySelector('#owned').updateComplete;
  document.body.dataset.hydrated = 'true';
});
</script></html>`);
