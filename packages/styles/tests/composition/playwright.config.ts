import { pipelineOutput } from '../../../../tooling/test-pipeline/config-output.mjs';
import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';
const root = new URL('../../../../', import.meta.url).pathname;
const port = Number(process.env.EN_COMPOSITION_PORT ?? 4486);
const output = process.env.EN_COMPOSITION_OUTPUT_DIR ?? '/private/tmp/en-composition-tests';
export default defineConfig({
  forbidOnly: true,
  testDir: '.', testMatch: '*.spec.ts', fullyParallel: true, workers: 3,
  outputDir: resolve(output, 'traces'), reporter: [['list'], ['json', { outputFile: resolve(output, 'playwright.json') }]],
  use: { baseURL: `http://127.0.0.1:${port}`, trace: 'retain-on-failure' },
  projects: ['chromium', 'firefox', 'webkit'].map(browserName => ({ name: browserName, use: { browserName: browserName as 'chromium' | 'firefox' | 'webkit' } })),
  webServer: { command: 'node packages/styles/tests/composition/server.mjs', cwd: root, url: `http://127.0.0.1:${port}/packages/styles/tests/composition/fixture.html`, reuseExistingServer: false },
}, pipelineOutput(import.meta.url));
