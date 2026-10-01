import { pipelineOutput } from '../../../../tooling/test-pipeline/config-output.mjs';
import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';

const evidence = process.env.TOKEN_TEST_OUTPUT_DIR ? resolve(process.env.TOKEN_TEST_OUTPUT_DIR) : new URL('./evidence/', import.meta.url).pathname;

export default defineConfig({
  forbidOnly: true,
  testDir: '.',
  testMatch: '*.spec.mjs',
  outputDir: resolve(evidence, 'artifacts'),
  fullyParallel: true,
  workers: 3,
  reporter: [['list'], ['json', { outputFile: resolve(evidence, 'playwright.json') }]],
  use: {
    baseURL: process.env.TOKEN_DOCS_URL ?? 'http://127.0.0.1:4180',
    viewport: { width: 1280, height: 900 },
    trace: 'retain-on-failure',
  },
  projects: ['chromium', 'firefox', 'webkit'].map(browserName => ({ name: browserName, use: { browserName } })),
}, pipelineOutput(import.meta.url));
