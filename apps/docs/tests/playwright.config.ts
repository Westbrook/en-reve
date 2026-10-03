import { pipelineOutput } from '../../../tooling/test-pipeline/config-output.mjs';
import { defineConfig } from '@playwright/test';
import { browserProductProjects } from '../../../tooling/testing/browser-products.mjs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const output = process.env.EN_WORKFLOW_TEST_OUTPUT_DIR ?? resolve(root, 'node_modules/.cache/en-reve-workflows');
const externalURL = process.env.EN_WORKFLOW_BASE_URL;
const port = Number(process.env.EN_WORKFLOW_TEST_PORT ?? 4391);
const baseURL = externalURL ?? `http://127.0.0.1:${port}`;
export default defineConfig({
  forbidOnly: true,
  testDir: '.',
  testMatch: ['candidate-impact.spec.ts', 'github-pages.spec.ts', 'impact.spec.ts', 'version-review.spec.ts', 'offline-review.spec.ts', 'guides.spec.ts', 'external-field-labels.spec.ts', 'rich-capabilities.spec.ts', 'api-04-collections.spec.ts', 'time-field.spec.ts', 'color-wheel.spec.ts', 'color-plane.spec.ts', 'color-plane-editors.spec.ts', 'date-ranges.spec.ts', 'color-spaces.spec.ts', 'color-space-editors.spec.ts', 'calendar-systems.spec.ts', 'activity-history.spec.ts', 'carousel-collection.spec.ts', 'editor-token-deletion.spec.ts', 'editor-geometry.spec.ts', 'editor-clipboard.spec.ts', 'data-table.spec.ts', 'split-collapse.spec.ts', 'navigation-sidebar.spec.ts', 'tree-operations.spec.ts', 'rich-text.spec.ts', 'carousel.spec.ts', 'presence-activity.spec.ts', 'color-picker.spec.ts', 'composable-chat.spec.ts', 'chat-patterns.spec.ts', 'toast.spec.ts', 'form-navigation.spec.ts', 'hover-capabilities.spec.ts', 'calendar.spec.ts', 'tree-data.spec.ts', 'file-upload.spec.ts', 'tree-view.spec.ts', 'mixed-toolbar-integration.spec.ts', 'initial-delivery.spec.ts', 'showcase.spec.ts', 'asset-review-integration.spec.ts', 'assets.spec.ts', 'asset-table-list.spec.ts', 'authored-table.spec.ts', 'virtual-collection.spec.ts', 'virtual-aria-snapshots.spec.ts', 'pagination.spec.ts', 'menu-expansion.spec.ts', 'menu-trigger-docs.spec.ts', 'breadth-docs.spec.ts', 'virtual-source.spec.ts', 'virtual-smooth-coverage.spec.ts', 'asset-collection-pass.spec.ts', 'collection-accessibility.spec.ts', 'table-themes-pass.spec.ts', 'virtual-scroll-options.spec.ts', 'sticky-table.spec.ts', 'content-recipes.spec.ts', 'followup-reviews.spec.ts', 'workflows.spec.ts', 'navigation.spec.ts', 'specimen-sources.spec.ts', 'vertical-slider.spec.ts', 'theme-review.spec.ts', 'theme-review-pair.spec.ts', 'combobox.spec.ts', 'selection.spec.ts', 'api-reference.spec.ts', 'api-sticky-navigation.spec.ts', 'api-inline-examples.spec.ts', 'api-element-controls.spec.ts', 'system-appearance.spec.ts', 'command-family.spec.ts', 'settings-scenarios.spec.ts'],
  outputDir: resolve(output, 'artifacts'),
  reporter: [['list'], ['json', { outputFile: resolve(output, 'playwright.json') }]],
  fullyParallel: true,
  // Bound production-route correctness work to one browser worker.
  workers: 1,
  retries: 0,
  timeout: 25_000,
  expect: { timeout: 8_000 },
  use: { baseURL, viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
    ...browserProductProjects(),
  ],
  webServer: externalURL ? undefined : {
    command: 'node apps/docs/tests/static-server.mjs',
    cwd: root,
    url: `${baseURL}/workflows.html`,
    reuseExistingServer: false,
    timeout: 15_000,
  },
}, pipelineOutput(import.meta.url));
