import { pipelineOutput } from '../../tooling/test-pipeline/config-output.mjs';
import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';

const port = Number(process.env.EN_SSR_TEST_PORT ?? 4192);
const outputRoot = process.env.EN_SSR_TEST_OUTPUT_DIR
  ?? new URL('./results/', import.meta.url).pathname;

export default defineConfig({
  forbidOnly: true,
  testDir: './tests/browser',
  outputDir: resolve(outputRoot, 'artifacts'),
  fullyParallel: true,
  reporter: [['list'], ['json', { outputFile: resolve(outputRoot, 'playwright.json') }]],
  use: { baseURL: `http://127.0.0.1:${port}`, trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
  webServer: {
    command: 'node packages/ssr/tests/server.mjs',
    cwd: new URL('../..', import.meta.url).pathname,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
  },
}, pipelineOutput(import.meta.url));
