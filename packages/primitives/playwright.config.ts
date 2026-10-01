import { pipelineOutput } from '../../tooling/test-pipeline/config-output.mjs';
import { defineConfig } from '@playwright/test';

export default defineConfig({
  forbidOnly: true,
  testDir: './tests/browser',
  testMatch: '*.spec.ts',
  outputDir: './test-results/browser',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4182', trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
  webServer: {
    command: 'node tests/browser/server.mjs',
    cwd: new URL('.', import.meta.url).pathname,
    url: 'http://127.0.0.1:4182',
    reuseExistingServer: false,
  },
}, pipelineOutput(import.meta.url));
