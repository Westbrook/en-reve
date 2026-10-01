import { pipelineOutput } from '../../../../tooling/test-pipeline/config-output.mjs';
import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';
const root = new URL('../../../../', import.meta.url).pathname;
const port = Number(process.env.EN_FOCUS_SCROLL_PORT ?? 4482);
const output = process.env.EN_FOCUS_SCROLL_OUTPUT_DIR ?? '/private/tmp/en-focus-scroll-tests';
export default defineConfig({
  forbidOnly: true,
  testDir: '.', testMatch: 'focus-scroll.spec.ts', fullyParallel: true, workers: 3,
  outputDir: resolve(output, 'traces'),
  reporter: [['list'], ['json', { outputFile: resolve(output, 'playwright.json') }]],
  use: { baseURL: `http://127.0.0.1:${port}`, trace: 'retain-on-failure', reducedMotion: 'reduce' },
  projects: ['chromium', 'firefox', 'webkit'].flatMap((browserName) => [
    { name: `${browserName}-desktop`, use: { browserName: browserName as 'chromium' | 'firefox' | 'webkit', viewport: { width: 1280, height: 800 } } },
    { name: `${browserName}-narrow`, use: { browserName: browserName as 'chromium' | 'firefox' | 'webkit', viewport: { width: 390, height: 664 } } },
  ]),
  webServer: {
    command: 'node packages/styles/tests/focus-scroll/server.mjs', cwd: root,
    url: `http://127.0.0.1:${port}/packages/styles/tests/focus-scroll/fixture.html`, reuseExistingServer: false,
  },
}, pipelineOutput(import.meta.url));
