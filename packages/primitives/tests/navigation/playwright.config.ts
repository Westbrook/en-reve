import { pipelineOutput } from '../../../../tooling/test-pipeline/config-output.mjs';
import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';

const output = process.env.EN_NAVIGATION_TEST_OUTPUT_DIR ?? new URL('./results/', import.meta.url).pathname;
const port = Number(process.env.EN_NAVIGATION_TEST_PORT ?? 4394);
export default defineConfig({
  forbidOnly: true,
  testDir: '.',
  testMatch: 'navigation.spec.ts',
  outputDir: resolve(output, 'artifacts'),
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: resolve(output, 'playwright.json') }]],
  use: { baseURL: `http://127.0.0.1:${port}`, reducedMotion: 'reduce', trace: 'retain-on-failure' },
  projects: ['chromium', 'firefox', 'webkit'].map(browserName => ({
    name: browserName, use: { browserName: browserName as 'chromium' | 'firefox' | 'webkit' },
  })),
  webServer: {
    command: 'node server.mjs',
    cwd: new URL('.', import.meta.url).pathname,
    url: `http://127.0.0.1:${port}/fixture`,
    reuseExistingServer: false,
  },
}, pipelineOutput(import.meta.url));
