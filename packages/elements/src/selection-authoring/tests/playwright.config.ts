import { pipelineOutput } from '../../../../../tooling/test-pipeline/config-output.mjs';
import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../../../../../', import.meta.url));
const output = process.env.EN_SELECTION_AUTHORING_OUTPUT ?? resolve(root, 'node_modules/.cache/en-selection-authoring-results');
const port = Number(process.env.EN_SELECTION_AUTHORING_PORT ?? 4457);
const baseURL = process.env.EN_SELECTION_AUTHORING_URL ?? `http://127.0.0.1:${port}`;
export default defineConfig({
  forbidOnly: true,
  testDir: '.', testMatch: 'children.spec.ts',
  outputDir: resolve(output, 'artifacts'),
  reporter: [['list'], ['json', { outputFile: resolve(output, 'playwright.json') }]],
  timeout: 25_000, expect: { timeout: 8_000 }, fullyParallel: true, workers: 4, retries: 0,
  use: { baseURL, viewport: { width: 1100, height: 900 }, reducedMotion: 'reduce', trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
  webServer: process.env.EN_SELECTION_AUTHORING_URL ? undefined : {
    command: 'node packages/elements/src/selection-authoring/tests/server.mjs', cwd: root,
    url: `${baseURL}/fixture`, reuseExistingServer: false, timeout: 30_000,
  },
}, pipelineOutput(import.meta.url));
