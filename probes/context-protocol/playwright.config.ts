import { pipelineOutput } from '../../tooling/test-pipeline/config-output.mjs';
import { defineConfig } from '@playwright/test';
export default defineConfig({
  forbidOnly: true,
  testDir: '.', testMatch: '*.spec.ts', fullyParallel: true, workers: 3, timeout: 20000,
  outputDir: '../../artifacts/api-09/browser',
  reporter: [['list'], ['json', { outputFile: '../../artifacts/api-09/playwright.json' }]],
  use: { baseURL: 'http://127.0.0.1:47849', reducedMotion: 'reduce' },
  projects: ['chromium', 'firefox', 'webkit'].map(browserName => ({ name: browserName, use: { browserName: browserName as 'chromium' | 'firefox' | 'webkit' } })),
  webServer: { command: 'node probes/context-protocol/server.mjs', cwd: new URL('../..', import.meta.url).pathname, url: 'http://127.0.0.1:47849/probes/context-protocol/fixture.html', reuseExistingServer: false },
}, pipelineOutput(import.meta.url));
