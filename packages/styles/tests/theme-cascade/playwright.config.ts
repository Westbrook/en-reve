import { pipelineOutput } from '../../../../tooling/test-pipeline/config-output.mjs';
import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';
const root = new URL('../../../../', import.meta.url).pathname;
const output = process.env.EN_THEME_CASCADE_OUTPUT_DIR ?? '/private/tmp/en-theme-cascade-tests';
export default defineConfig({
  forbidOnly: true,
  testDir: '.', testMatch: 'theme-cascade.spec.ts', fullyParallel: true, workers: 3,
  outputDir: resolve(output, 'traces'), reporter: [['list'], ['json', { outputFile: resolve(output, 'playwright.json') }]],
  use: { baseURL: 'http://127.0.0.1:4479', trace: 'retain-on-failure' },
  projects: ['chromium', 'firefox', 'webkit'].map(browserName => ({ name: browserName, use: { browserName: browserName as 'chromium' | 'firefox' | 'webkit' } })),
  webServer: { command: 'node packages/styles/tests/theme-cascade/server.mjs', cwd: root, url: 'http://127.0.0.1:4479/packages/styles/tests/theme-cascade/fixture.html', reuseExistingServer: false },
}, pipelineOutput(import.meta.url));
