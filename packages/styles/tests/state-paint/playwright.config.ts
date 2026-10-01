import { pipelineOutput } from '../../../../tooling/test-pipeline/config-output.mjs';
import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';
const root = new URL('../../../../', import.meta.url).pathname;
const output = process.env.EN_STATE_PAINT_OUTPUT_DIR ?? '/private/tmp/en-state-paint-tests';
export default defineConfig({
  forbidOnly: true,
  testDir: '.', testMatch: 'state-paint.spec.ts', fullyParallel: true, workers: 3,
  outputDir: resolve(output, 'traces'), reporter: [['list'], ['json', { outputFile: resolve(output, 'playwright.json') }]],
  use: { baseURL: 'http://127.0.0.1:4483', trace: 'retain-on-failure' },
  projects: ['chromium', 'firefox', 'webkit'].map(browserName => ({ name: browserName, use: { browserName: browserName as 'chromium' | 'firefox' | 'webkit' } })),
  webServer: { command: 'node packages/styles/tests/state-paint/server.mjs', cwd: root, url: 'http://127.0.0.1:4483/packages/styles/tests/state-paint/fixture.html', reuseExistingServer: false },
}, pipelineOutput(import.meta.url));
