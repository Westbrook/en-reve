import '@lit-labs/ssr/lib/install-global-dom-shim.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'vite';
import { minifyLitTemplates } from '../../../../tooling/minify/literals.mjs';
import { createDocumentMinifier } from '../../../../tooling/minify/document.mjs';
import { prepareMinificationSource } from './source.mjs';

const fixtureRoot = fileURLToPath(new URL('.', import.meta.url));
await prepareMinificationSource(fixtureRoot);
const root = resolve(fixtureRoot, '../../../..');
const outputRoot = resolve(process.env.EN_SSR_MINIFIER_FIXTURE_DIR ?? resolve(root, 'node_modules/.cache/en-reve-minifier-fixture'));
const include = [fixtureRoot, resolve(root, 'packages')];
const shared = {
  root, configFile: false, logLevel: 'warn',
  plugins: [minifyLitTemplates({ include })],
};
await build({
  ...shared,
  base: '/minification-assets/',
  build: {
    target: 'es2022', cssTarget: ['chrome123', 'firefox120', 'safari17.5'],
    outDir: resolve(outputRoot, 'client'), emptyOutDir: true, sourcemap: true,
    rolldownOptions: { input: resolve(fixtureRoot, 'client.mjs'), output: { entryFileNames: 'entry.js' } },
    dynamicImportVarsOptions: { exclude: [], include: ['**/node_modules/microlighter/**'] },
  },
});
await build({
  ...shared,
  plugins: [minifyLitTemplates({ include })],
  ssr: { external: ['lit', '@lit-labs/ssr', '@lit-labs/ssr-client', 'signal-polyfill', 'signal-utils'], noExternal: [/^@en-reve\//] },
  build: {
    target: 'node24', ssr: resolve(fixtureRoot, 'server-entry.mjs'),
    outDir: resolve(outputRoot, 'server'), emptyOutDir: true, minify: false,
    rolldownOptions: { output: { entryFileNames: 'entry.mjs' } },
  },
});
const { renderFixture } = await import(pathToFileURL(resolve(outputRoot, 'server/entry.mjs')).href);
const { markup, css } = await renderFixture();
const source = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Production minifier behavior</title><style>${css}</style></head><body><main id="minification-fixture">${markup}</main><script type="module" src="/minification-assets/entry.js"></script></body></html>`;
const { html, report } = createDocumentMinifier()(source, { filename: 'minification-fixture.html' });
await mkdir(outputRoot, { recursive: true });
await writeFile(resolve(outputRoot, 'document.html'), html);
await writeFile(resolve(outputRoot, 'report.json'), JSON.stringify(report, null, 2) + '\n');
