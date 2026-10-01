import { pipelineOutput } from '../../../../../tooling/test-pipeline/config-output.mjs';
import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const outputDir = process.env.EN_FORMS_TEST_OUTPUT_DIR
  ? resolve(process.env.EN_FORMS_TEST_OUTPUT_DIR)
  : fileURLToPath(new URL('./results/', import.meta.url));

export default defineConfig({
  forbidOnly: true,
  testDir: '.',
  testMatch: '*.spec.ts',
  outputDir,
  reporter: [['list'], ['json', { outputFile: resolve(outputDir, 'playwright.json') }]],
  use: { baseURL: 'http://127.0.0.1:4296', trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
  webServer: {
    cwd: fileURLToPath(new URL('../../../../../', import.meta.url)),
    command: 'node node_modules/vite/bin/vite.js --config packages/elements/src/forms-private/tests/vite.config.ts',
    url: 'http://127.0.0.1:4296',
    reuseExistingServer: false,
    stdout: 'pipe',
  },
}, pipelineOutput(import.meta.url));
