import { defineConfig } from '@playwright/test';
import { pipelineOutput } from '../../tooling/test-pipeline/config-output.mjs';
export default defineConfig({
  forbidOnly: true, testDir: '.', testMatch: '*.spec.ts', workers: 1,
  timeout: 20000, retries: 0,
  outputDir: '../../artifacts/reference-target/browser',
  reporter: [['list'], ['json', { outputFile: '../../artifacts/reference-target/playwright.json' }]],
  use: { baseURL: 'http://127.0.0.1:47853', trace: 'retain-on-failure' },
  projects: ['chromium', 'firefox', 'webkit'].map(browserName => ({ name: browserName, use: { browserName: browserName as 'chromium' | 'firefox' | 'webkit' } })),
  webServer: { command: 'node probes/reference-target/server.mjs', cwd: new URL('../..', import.meta.url).pathname,
    url: 'http://127.0.0.1:47853/probes/reference-target/fixture.html', reuseExistingServer: false },
}, pipelineOutput(import.meta.url));
