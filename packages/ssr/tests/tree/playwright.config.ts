import { pipelineOutput } from '../../../../tooling/test-pipeline/config-output.mjs';
import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';
const output = process.env.EN_TREE_SSR_TEST_OUTPUT_DIR ?? '/private/tmp/en-reve-tree-ssr-results';
export default defineConfig({
  forbidOnly: true,
  testDir: '.', testMatch: '*.spec.ts', fullyParallel: true,
  outputDir: resolve(output, 'artifacts'),
  reporter: [['list'], ['json', { outputFile: resolve(output, 'playwright.json') }]],
  use: { baseURL: 'http://127.0.0.1:4197', trace: 'retain-on-failure' },
  projects: ['chromium', 'firefox', 'webkit'].map(browserName => ({ name: browserName, use: { browserName: browserName as 'chromium' | 'firefox' | 'webkit' } })),
  webServer: { command: 'node packages/ssr/tests/tree/server.mjs', cwd: new URL('../../../..', import.meta.url).pathname,
    url: 'http://127.0.0.1:4197/tree', reuseExistingServer: false },
}, pipelineOutput(import.meta.url));
