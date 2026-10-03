import '@lit-labs/ssr/lib/install-global-dom-shim.js';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { build } from 'vite';
import { deploymentBase, deploymentPaths, deploymentDocument, deploymentURL } from './deployment-paths.mjs';
import { injectStickerSheet, injectWorkflows, injectThemeReview, injectShowcase, injectConversation, injectAPIReference, injectAPIExample, injectReviewBuild } from './document.mjs';
import { createDocumentStylesInliner } from './document-styles.mjs';
import { createDocumentMinifier } from '../../../tooling/minify/document.mjs';
import { minifyLitTemplates } from '../../../tooling/minify/literals.mjs';
import { prepareDocs } from './prepare-docs.mjs';
import { generateImpact } from '../../../tooling/evidence/impact.mjs';

const docsRoot = fileURLToPath(new URL('..', import.meta.url));
const workspaceRoot = fileURLToPath(new URL('../../..', import.meta.url));
const base = deploymentBase(process.env.EN_DOCS_BASE_PATH);
const outputRoot = resolve(docsRoot, process.env.EN_DOCS_OUTPUT ?? '../../dist');
const minifyDocument = createDocumentMinifier();
const inlineDocumentStyles = createDocumentStylesInliner({ outputRoot, base });
const serverOutput = resolve(workspaceRoot, 'node_modules/.cache/en-reve-docs-ssr');

async function finalizeDocument(source, options) {
  const inlined = await inlineDocumentStyles(source, options);
  return minifyDocument(inlined, options);
}

const { apiExamplePages, settingsScenarioPages } = await prepareDocs();
await build({ root: docsRoot, configFile: resolve(docsRoot, 'vite.config.ts') });
await build({
  root: docsRoot,
  configFile: false,
  plugins: [deploymentPaths(base), minifyLitTemplates({
    include: [resolve(docsRoot, 'src'), resolve(workspaceRoot, 'packages')],
  })],
  // Lit hydration hashes template strings. Local package templates must pass
  // through the identical client/SSR transform, with one shared class identity.
  ssr: {
    noExternal: [/^@en-reve\//],
    external: ['lit', '@lit-labs/ssr', '@lit-labs/ssr-client', 'signal-polyfill', 'signal-utils'],
  },
  build: {
    target: 'node24',
    ssr: resolve(docsRoot, 'scripts/render-entry.ts'),
    outDir: serverOutput,
    emptyOutDir: true,
    minify: false,
    rolldownOptions: { output: { entryFileNames: 'render-entry.mjs' } },
  },
});
// The shim must be installed before evaluating component classes. A static
// import in this bootstrap would allow dependency evaluation to run too early.
const { renderStickerSheet, renderWorkflows, workflowPages, renderThemeReview, renderShowcase, renderConversation, renderAPIReference, renderAPIExample, reviewCaseIds } = await import(pathToFileURL(resolve(serverOutput, 'render-entry.mjs')).href);
const rendered = await renderStickerSheet();
const indexPath = resolve(outputRoot, 'index.html');
const shell = await readFile(indexPath, 'utf8');
const { html: document, report: minification } = await finalizeDocument(injectStickerSheet(shell, rendered), { filename: 'index.html' });
await writeFile(indexPath, document);
await mkdir(resolve(outputRoot, 'evidence'), { recursive: true });
await writeFile(resolve(outputRoot, 'evidence/ssr.json'), JSON.stringify({ mode: 'build-time', bytes: Buffer.byteLength(document), minification, customElementTags: rendered.tags }, null, 2) + '\n');
console.log(`Rendered the sticker sheet at build time: ${rendered.tags.length} custom element types, ${Buffer.byteLength(document)} HTML bytes.`);

const workflowDocuments = [
  ...workflowPages.map(page => ({ ...page, workflowId: page.id })),
  ...settingsScenarioPages.map(page => ({ ...page, id: `settings-${page.id}`, workflowId: 'settings', scenario: page.id })),
];
for (const page of workflowDocuments) {
  const workflow = await renderWorkflows(page.workflowId, page.scenario);
  const workflowPath = resolve(outputRoot, page.file);
  const workflowShell = await readFile(workflowPath, 'utf8');
  const { html: workflowDocument, report: workflowMinification } = await finalizeDocument(injectWorkflows(workflowShell, workflow), { filename: page.file });
  await writeFile(workflowPath, workflowDocument);
  const receipt = page.id === 'sso' ? 'workflows-ssr.json' : `workflows-${page.id}-ssr.json`;
  await writeFile(resolve(outputRoot, 'evidence', receipt), JSON.stringify({ mode: 'build-time', page: page.id, bytes: Buffer.byteLength(workflowDocument), minification: workflowMinification, customElementTags: workflow.tags }, null, 2) + '\n');
  console.log(`Rendered ${page.label} at build time: ${workflow.tags.length} custom element types, ${Buffer.byteLength(workflowDocument)} HTML bytes.`);
}

const themeReview = await renderThemeReview();
const themeReviewPath = resolve(outputRoot, 'theme-review.html');
const { html: themeReviewDocument } = await finalizeDocument(injectThemeReview(await readFile(themeReviewPath, 'utf8'), themeReview), { filename: 'theme-review.html' });
await writeFile(themeReviewPath, themeReviewDocument);
console.log(`Rendered Theme Review at build time: ${Buffer.byteLength(themeReviewDocument)} HTML bytes.`);
await writeFile(resolve(outputRoot, 'evidence/theme-review-ssr.json'), JSON.stringify({mode:'build-time',bytes:Buffer.byteLength(themeReviewDocument),customElementTags:themeReview.tags},null,2)+'\n');

const showcase = await renderShowcase();
const showcasePath = resolve(outputRoot, 'showcase.html');
const { html: showcaseDocument, report: showcaseMinification } = await finalizeDocument(injectShowcase(await readFile(showcasePath, 'utf8'), showcase), { filename: 'showcase.html' });
await writeFile(showcasePath, showcaseDocument);
await writeFile(resolve(outputRoot, 'evidence/showcase-ssr.json'), JSON.stringify({mode:'build-time',bytes:Buffer.byteLength(showcaseDocument),minification:showcaseMinification,customElementTags:showcase.tags},null,2)+'\n');

const conversation = await renderConversation();
const conversationPath = resolve(outputRoot, 'conversation.html');
const { html: conversationDocument, report: conversationMinification } = await finalizeDocument(injectConversation(await readFile(conversationPath, 'utf8'), conversation), { filename: 'conversation.html' });
await writeFile(conversationPath, conversationDocument);
await writeFile(resolve(outputRoot, 'evidence/conversation-ssr.json'), JSON.stringify({mode:'build-time',bytes:Buffer.byteLength(conversationDocument),minification:conversationMinification,customElementTags:conversation.tags},null,2)+'\n');

const apiReference = await renderAPIReference();
const apiReferencePath = resolve(outputRoot, 'api-reference.html');
const { html: apiReferenceDocument } = await finalizeDocument(injectAPIReference(await readFile(apiReferencePath, 'utf8'), apiReference), { filename: 'api-reference.html' });
await writeFile(apiReferencePath, apiReferenceDocument);
await writeFile(resolve(outputRoot, 'evidence/api-reference-ssr.json'), JSON.stringify({mode:'build-time',bytes:Buffer.byteLength(apiReferenceDocument),customElementTags:apiReference.tags},null,2)+'\n');

const apiExampleReceipts = {};
for (const page of apiExamplePages) {
  const example = await renderAPIExample(page.id);
  const path = resolve(outputRoot, page.file);
  const { html, report } = await finalizeDocument(injectAPIExample(await readFile(path, 'utf8'), example), { filename: page.file });
  await writeFile(path, html);
  const receipt = `api-example-${page.id}-ssr.json`;
  apiExampleReceipts[page.file] = receipt;
  await writeFile(resolve(outputRoot, 'evidence', receipt), JSON.stringify({mode:'build-time',caseId:page.id,bytes:Buffer.byteLength(html),minification:report,customElementTags:example.tags},null,2)+'\n');
}
console.log(`Rendered ${apiExamplePages.length} isolated API examples at build time.`);

// Bind generated dependency evidence to the same original documentation build.
await writeFile(resolve(outputRoot, 'impact.json'), JSON.stringify(await generateImpact({root:workspaceRoot}), null, 2) + '\n');

// Apply deployment semantics to static and SSR pages alike, before sealing hashes.
if (base !== '/') {
  async function bind(directory, prefix = '') {
    for (const entry of await readdir(directory, {withFileTypes:true})) {
      const name = prefix + entry.name, path = resolve(directory, entry.name);
      if (entry.isDirectory()) await bind(path, name + '/');
      else if (entry.name.endsWith('.html')) await writeFile(path, deploymentDocument(await readFile(path, 'utf8'), name, base));
    }
  }
  await bind(outputRoot);
  const path = resolve(outputRoot, 'guides/contract-index.json');
  const index = JSON.parse(await readFile(path, 'utf8'));
  for (const artifact of [...index.artifacts, ...index.skills]) artifact.href = deploymentURL(artifact.href, base);
  await writeFile(path, JSON.stringify(index, null, 2) + '\n');
}

// The manifest binds local review files to the actual pages and executable assets.
// It excludes itself to avoid a circular hash; package version strings are not identity.
const assets = [];
async function collectAssets(directory, prefix = '') {
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a,b) => a.name.localeCompare(b.name))) {
    const name = prefix + entry.name;
    if (entry.isDirectory()) await collectAssets(resolve(directory, entry.name), name + '/');
    else if (entry.isFile() && name !== 'review-build.json') assets.push({path:name,sha256:'sha256:' + createHash('sha256').update(await readFile(resolve(directory, entry.name))).digest('hex')});
  }
}
await collectAssets(outputRoot);
const fingerprint = 'sha256:' + createHash('sha256').update(JSON.stringify(assets)).digest('hex');
// Compute identity before its own HTML metadata, then record final transport hashes.
for (const asset of assets.filter(asset => asset.path.endsWith('.html'))) {
  const path = resolve(outputRoot, asset.path);
  const bound = injectReviewBuild(await readFile(path, 'utf8'), fingerprint);
  await writeFile(path, bound);
  asset.sha256 = 'sha256:' + createHash('sha256').update(bound).digest('hex');
}
const renderedReceipts = {...apiExampleReceipts,'showcase.html':'showcase-ssr.json','conversation.html':'conversation-ssr.json','index.html':'ssr.json','theme-review.html':'theme-review-ssr.json','api-reference.html':'api-reference-ssr.json', ...Object.fromEntries(workflowDocuments.map(page=>[page.file,page.id==='sso'?'workflows-ssr.json':`workflows-${page.id}-ssr.json`]))};
for (const [page, receiptName] of Object.entries(renderedReceipts)) {
  const receiptPath = resolve(outputRoot, 'evidence', receiptName);
  const receipt = JSON.parse(await readFile(receiptPath, 'utf8'));
  receipt.bytes = (await readFile(resolve(outputRoot, page))).byteLength;
  receipt.buildFingerprint = fingerprint;
  await writeFile(receiptPath, JSON.stringify(receipt, null, 2) + '\n');
}
for (const asset of assets) asset.sha256 = 'sha256:' + createHash('sha256').update(await readFile(resolve(outputRoot, asset.path))).digest('hex');
await writeFile(resolve(outputRoot, 'review-build.json'), JSON.stringify({schemaVersion:1, deployment:{basePath:base,baseURL:base === '/' ? null : 'https://westbrook.github.io' + base}, fingerprint, assets, caseIds:reviewCaseIds, pages:[{id:'sheet',path:base,caseIds:reviewCaseIds}, ...workflowDocuments.map(page=>({id:page.id,path:deploymentURL(page.path, base),caseIds:[page.workflowId], ...(page.scenario ? {scenario:page.scenario} : {})}))]}, null, 2) + '\n');
