import {defineConfig} from '@playwright/test';
import {pipelineOutput} from '../../tooling/test-pipeline/config-output.mjs';
const port = Number(process.env.EN_LAZY_DELIVERY_PORT ?? 4261);
export default defineConfig({
  forbidOnly: true, testDir: '.', testMatch: '*.spec.ts', fullyParallel: false, workers: 1,
  outputDir: '../../artifacts/lazy-delivery/browser', reporter: [['list'], ['json', {outputFile: '../../artifacts/lazy-delivery/browser.json'}]],
  use: {baseURL: `http://127.0.0.1:${port}`, trace: 'retain-on-failure'},
  projects: ['chromium', 'firefox', 'webkit'].map(browserName => ({name: browserName, use: {browserName: browserName as 'chromium' | 'firefox' | 'webkit'}})),
  webServer: {command: 'node probes/lazy-delivery/server.mjs', cwd: '../..', url: `http://127.0.0.1:${port}/index.html`, reuseExistingServer: false},
}, pipelineOutput(import.meta.url));
