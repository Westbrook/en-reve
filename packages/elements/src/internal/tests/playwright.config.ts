import { pipelineOutput } from '../../../../../tooling/test-pipeline/config-output.mjs';
import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const root = fileURLToPath(new URL('../../../../../', import.meta.url));
const port = Number(process.env.EN_SIZE_TEST_PORT ?? 4391);
const output = process.env.EN_SIZE_TEST_OUTPUT ?? '/private/tmp/en-reve-size-results';
export default defineConfig({
  forbidOnly: true,
  testDir: '.', testMatch: ['size.spec.ts', 'control-rhythm.spec.ts', 'family-geometry.spec.ts', 'icon-only.spec.ts'], outputDir: output,
  reporter: [['list'], ['json', { outputFile: resolve(output, 'playwright.json') }]],
  use: { baseURL: `http://127.0.0.1:${port}` },
  projects: ['chromium', 'firefox', 'webkit'].map(name => ({ name, use: { browserName: name as 'chromium' | 'firefox' | 'webkit' } })),
  webServer: { command: `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port ${port} --strictPort`, cwd: root, url: `http://127.0.0.1:${port}/packages/elements/src/internal/tests/size-fixture.html`, reuseExistingServer: false },
}, pipelineOutput(import.meta.url));
