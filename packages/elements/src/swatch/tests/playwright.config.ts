import { pipelineOutput } from '../../../../../tooling/test-pipeline/config-output.mjs';
import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  forbidOnly: true,
  testDir: '.', testMatch: '*.spec.ts', outputDir: './results', workers: 1,
  reporter: [['list'], ['json', { outputFile: fileURLToPath(new URL('./results/summary.json', import.meta.url)) }]],
  use: { baseURL: 'http://127.0.0.1:4297', trace: 'retain-on-failure' },
  projects: ['chromium', 'firefox', 'webkit'].map(browserName => ({ name: browserName, use: { browserName: browserName as 'chromium' | 'firefox' | 'webkit' } })),
  webServer: {
    command: 'node node_modules/vite/bin/vite.js --config packages/elements/src/swatch/tests/vite.config.ts',
    cwd: fileURLToPath(new URL('../../../../../', import.meta.url)),
    url: 'http://127.0.0.1:4297/packages/elements/src/swatch/tests/index.html',
    reuseExistingServer: false,
  },
}, pipelineOutput(import.meta.url));
