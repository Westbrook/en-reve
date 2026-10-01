import { pipelineOutput } from '../../../../tooling/test-pipeline/config-output.mjs';
import { defineConfig } from '@playwright/test';
export default defineConfig({
  forbidOnly: true,
  testDir: '.', testMatch: 'choice.spec.ts', outputDir: './test-results',
  reporter: [['list'], ['json', { outputFile: new URL('./test-results/summary.json', import.meta.url).pathname }]], fullyParallel: true,
  use: { baseURL: 'http://127.0.0.1:4181', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }, { name: 'firefox', use: { browserName: 'firefox' } }, { name: 'webkit', use: { browserName: 'webkit' } }],
  webServer: { command: 'node node_modules/vite/bin/vite.js --config packages/elements/src/checkbox/vite.config.mjs --host 127.0.0.1 --port 4181 --strictPort',
    cwd: new URL('../../../../', import.meta.url).pathname,
    url: 'http://127.0.0.1:4181/packages/elements/src/checkbox/choice-fixture.html', reuseExistingServer: false },
}, pipelineOutput(import.meta.url));
