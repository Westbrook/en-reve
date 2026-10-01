import { pipelineOutput } from '../../../../../tooling/test-pipeline/config-output.mjs';
import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..');
export default defineConfig({
  forbidOnly: true,
  testDir: '.',
  testMatch: ['structures.spec.ts', 'tab-focus.spec.ts'],
  outputDir: '/tmp/en-reve-structure-results',
  use: { baseURL: 'http://127.0.0.1:4386' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'node node_modules/vite/bin/vite.js --config packages/elements/src/accordion/tests/vite.config.ts',
    url: 'http://127.0.0.1:4386/packages/elements/src/accordion/tests/fixture.html',
    cwd: root,
    reuseExistingServer: process.env.EN_EXECUTION_OWN_SERVERS !== '1',
  },
}, pipelineOutput(import.meta.url));
