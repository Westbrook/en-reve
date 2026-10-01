import { pipelineOutput } from '../../tooling/test-pipeline/config-output.mjs';
import { defineConfig } from '@playwright/test';
export default defineConfig({
  forbidOnly: true, testDir: '.', testMatch: '*.spec.ts', fullyParallel: true, workers: 3, timeout: 20000, outputDir: '../../artifacts/api-03/browser', reporter: [['list']], use: { baseURL: 'http://127.0.0.1:45943', reducedMotion: 'reduce' }, projects: ['chromium', 'firefox', 'webkit'].map(browserName => ({ name: browserName, use: { browserName: browserName as 'chromium' | 'firefox' | 'webkit' } })), webServer: { command: 'node probes/api-forms/server.mjs', cwd: new URL('../..', import.meta.url).pathname, url: 'http://127.0.0.1:45943/probes/api-forms/fixture.html', reuseExistingServer: false } }, pipelineOutput(import.meta.url));
