import { pipelineOutput } from '../tooling/test-pipeline/config-output.mjs';
import { defineConfig } from '@playwright/test';
export default defineConfig({
  forbidOnly: true,
  testDir: './tests',
  outputDir: './results/artifacts',
  fullyParallel: true,
  reporter: [['list'], ['json', { outputFile: new URL('./results/playwright.json', import.meta.url).pathname }]],
  use: { baseURL: 'http://127.0.0.1:4179', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }, { name: 'firefox', use: { browserName: 'firefox' } }, { name: 'webkit', use: { browserName: 'webkit' } }],
  webServer: { command: 'node probes/server.mjs', cwd: new URL('..', import.meta.url).pathname, url: 'http://127.0.0.1:4179', reuseExistingServer: false },
}, pipelineOutput(import.meta.url));
