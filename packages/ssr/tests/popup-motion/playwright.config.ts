import { pipelineOutput } from '../../../../tooling/test-pipeline/config-output.mjs';
import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../../../', import.meta.url));
const output = process.env.EN_POPUP_MOTION_OUTPUT_DIR ?? resolve(root, 'node_modules/.cache/en-popup-motion-tests');
const port = Number(process.env.EN_POPUP_MOTION_PORT ?? 4467);
const external = process.env.EN_POPUP_MOTION_BASE_URL;
export default defineConfig({
  forbidOnly: true,
  testDir: '.', testMatch: ['motion.spec.ts', 'drawer-motion.spec.ts', 'tooltip-motion.spec.ts', 'entry-fade.spec.ts'], outputDir: resolve(output, 'artifacts'),
  fullyParallel: true, workers: 3, timeout: 30_000, expect: { timeout: 8_000 },
  reporter: [['list'], ['json', { outputFile: resolve(output, 'playwright.json') }]],
  use: { baseURL: external ?? `http://127.0.0.1:${port}`, viewport: { width: 1100, height: 800 }, reducedMotion: 'no-preference', trace: 'retain-on-failure' },
  projects: ['chromium', 'firefox', 'webkit'].map(browserName => ({ name: browserName, use: { browserName: browserName as 'chromium' | 'firefox' | 'webkit' } })),
  webServer: external ? undefined : {
    command: 'node server.mjs', cwd: fileURLToPath(new URL('.', import.meta.url)),
    env: { EN_POPUP_MOTION_PORT: String(port) }, url: `http://127.0.0.1:${port}/fixture`, reuseExistingServer: false,
  },
}, pipelineOutput(import.meta.url));
