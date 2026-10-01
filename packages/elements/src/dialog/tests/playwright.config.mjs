import { pipelineOutput } from '../../../../../tooling/test-pipeline/config-output.mjs';
import { defineConfig } from '@playwright/test';

const port = Number(process.env.EN_OVERLAY_TEST_PORT ?? 42786);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  forbidOnly: true,
  testDir: '.',
  testMatch: '**/*.spec.ts',
  outputDir: './results',
  reporter: [['list'], ['json', { outputFile: new URL('./results/browser.json', import.meta.url).pathname }]],
  use: { baseURL, headless: true },
  webServer: { command: 'node server.mjs', url: baseURL, reuseExistingServer: false },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
}, pipelineOutput(import.meta.url));
