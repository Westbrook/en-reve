import { pipelineOutput } from '../../tooling/test-pipeline/config-output.mjs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig } from '@playwright/test';
const root = fileURLToPath(new URL('../../', import.meta.url));
export default defineConfig({
  forbidOnly: true,
 testDir: '.', testMatch: 'events.spec.ts', fullyParallel: true, workers: 3,
 timeout: 25000, outputDir: resolve(root, 'artifacts/api-01/browser'),
 reporter: [['list'], ['json', {outputFile: resolve(root, 'artifacts/api-01/playwright.json')}]],
 use: {baseURL: 'http://127.0.0.1:4491', reducedMotion: 'reduce'},
 projects: ['chromium','firefox','webkit'].map(browserName => ({name: browserName, use: {browserName: browserName as 'chromium'|'firefox'|'webkit'}})),
 webServer: {command: 'node probes/api-events/server.mjs', cwd: root, url: 'http://127.0.0.1:4491/probes/api-events/fixture.html', reuseExistingServer: false},
}, pipelineOutput(import.meta.url));
