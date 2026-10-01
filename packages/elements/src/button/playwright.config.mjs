import { pipelineOutput } from '../../../../tooling/test-pipeline/config-output.mjs';
import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../../../', import.meta.url));
const port = Number(process.env.EN_BUTTON_TEST_PORT ?? 4393);
export default defineConfig({
  forbidOnly: true,
  testDir: '.',
  testMatch: 'content.browser.spec.ts',
  outputDir: process.env.EN_BUTTON_TEST_OUTPUT ?? `${root}/node_modules/.cache/button-content`,
  reporter: 'list',
  use: { baseURL: `http://127.0.0.1:${port}`, trace: 'retain-on-failure' },
  projects: ['chromium', 'firefox', 'webkit'].map(name => ({ name, use: { browserName: name } })),
  webServer: { command: 'node packages/elements/src/button/server.mjs', cwd: root, url: `http://127.0.0.1:${port}/packages/elements/src/button/content-fixture.html`, reuseExistingServer: false },
}, pipelineOutput(import.meta.url));
