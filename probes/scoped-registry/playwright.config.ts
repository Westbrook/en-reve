import {scopeEndpoint} from './port.mjs';
import { pipelineOutput } from '../../tooling/test-pipeline/config-output.mjs';
import {defineConfig} from '@playwright/test';
const endpoint=scopeEndpoint(process.env);
export default defineConfig({
  metadata:{scopeServer:endpoint},
  forbidOnly: true,
  testDir: '.', testMatch: '*.spec.ts', workers: 1,
  outputDir: '../../artifacts/scoped-registry-phase-2/browser',
  reporter: [['list'], ['json', {outputFile: new URL('../../artifacts/scoped-registry-phase-2/browser.json', import.meta.url).pathname}]],
  use: {baseURL: endpoint.origin, trace: 'retain-on-failure'},
  projects: ['chromium', 'firefox', 'webkit'].map(browserName => ({name: browserName, use: {browserName: browserName as 'chromium'|'firefox'|'webkit'}})),
  webServer: {command: 'node probes/scoped-registry/server.mjs', cwd: '../..', url: `${endpoint.origin}/probes/scoped-registry/`, reuseExistingServer: false},
}, pipelineOutput(import.meta.url));
