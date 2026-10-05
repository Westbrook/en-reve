import { defineConfig } from 'vite';
import { webAppPlugin } from './scripts/web-app.mjs';
import { deploymentBase, deploymentPaths } from './scripts/deployment-paths.mjs';
import { fileURLToPath } from 'node:url';
import { litHighlighting } from './src/highlighting/vite.js';
import { minifyLitTemplates } from '../../tooling/minify/literals.mjs';
import { prepareDocs, prepareDocsPlugin } from './scripts/prepare-docs.mjs';

export default defineConfig(async () => {
  const { apiExamplePages, settingsScenarioPages } = await prepareDocs();
  return {
  base: deploymentBase(process.env.EN_DOCS_BASE_PATH),
  plugins: [deploymentPaths(), webAppPlugin(), prepareDocsPlugin(), litHighlighting(), minifyLitTemplates({
    include: [new URL('./src/', import.meta.url), new URL('../../packages/', import.meta.url)],
  })],
  server: { host: '127.0.0.1', port: 4180, strictPort: true, fs: { allow: ['../..'] } },
  // Keep the highlighter's relative grammar imports adjacent in development.
  optimizeDeps: { exclude: ['microlighter'] },
  build: {
    target: 'es2022',
    rolldownOptions: {
      // Lit installs its hydration hook before evaluating LitElement. Keep that
      // native module order when selective example definitions split the graph.
      output: { strictExecutionOrder: true },
      input: {
        ...Object.fromEntries(settingsScenarioPages.map(page => [`settings-${page.id}`, fileURLToPath(new URL(page.file, import.meta.url))])),
        ...Object.fromEntries(apiExamplePages.map(page => [`api-example-${page.id}`, fileURLToPath(new URL(page.file, import.meta.url))])),
        richCapabilities: fileURLToPath(new URL('./rich-capabilities.html', import.meta.url)),
        documentScroll: fileURLToPath(new URL('./document-scroll.html', import.meta.url)),
        guides: fileURLToPath(new URL('./guides.html', import.meta.url)),
        apiReference: fileURLToPath(new URL('./api-reference.html', import.meta.url)),
        apiExamples: fileURLToPath(new URL('./api-examples.html', import.meta.url)),
        themeReview: fileURLToPath(new URL('./theme-review.html', import.meta.url)),
        themeProof: fileURLToPath(new URL('./theme-proof.html', import.meta.url)),
        themeComposition: fileURLToPath(new URL('./theme-composition.html', import.meta.url)),
        themeAuthoring: fileURLToPath(new URL('./theme-authoring.html', import.meta.url)),
        themeStates: fileURLToPath(new URL('./theme-states.html', import.meta.url)),
        themeCustomization: fileURLToPath(new URL('./theme-customization.html', import.meta.url)),
        componentPatterns: fileURLToPath(new URL('./component-patterns.html', import.meta.url)),
        showcase: fileURLToPath(new URL('./showcase.html', import.meta.url)),
        conversation: fileURLToPath(new URL('./conversation.html', import.meta.url)),
        sticker: fileURLToPath(new URL('./index.html', import.meta.url)),
        workflows: fileURLToPath(new URL('./workflows.html', import.meta.url)),
        workflowSettings: fileURLToPath(new URL('./workflows/settings.html', import.meta.url)),
        workflowChat: fileURLToPath(new URL('./workflows/chat.html', import.meta.url)),
        workflowSelection: fileURLToPath(new URL('./workflows/selection.html', import.meta.url)),
        workflowMultiStep: fileURLToPath(new URL('./workflows/multi-step.html', import.meta.url)),
        workflowAssets: fileURLToPath(new URL('./workflows/assets.html', import.meta.url)),
      },
    },
    // Preserve native light-dark() and inherited color-scheme in syntax themes.
    // These CSS feature floors are older than our current-minus-one policy.
    cssTarget: ['chrome123', 'firefox120', 'safari17.5'],
    outDir: process.env.EN_DOCS_OUTPUT ?? '../../dist',
    emptyOutDir: true,
    sourcemap: true,
    // The package loads a finite grammar set using a variable dynamic import.
    // Include that dependency so production emits the corresponding chunks.
    dynamicImportVarsOptions: { exclude: [], include: ['**/node_modules/microlighter/**'] },
  },
  };
});
