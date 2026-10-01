import { pipelineOutput } from '../../../../../tooling/test-pipeline/config-output.mjs';
import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mobileProfiles } from '../../../../../tooling/testing/mobile-profiles.js';
const root = fileURLToPath(new URL('../../../../../', import.meta.url));
const output = process.env.EN_COMMANDS_MOBILE_OUTPUT_DIR ?? resolve(root, 'node_modules/.cache/en-commands-mobile');
const port = Number(process.env.EN_COMMANDS_MOBILE_PORT ?? 4421);
const external = process.env.EN_COMMANDS_MOBILE_BASE_URL;
export default defineConfig({
  forbidOnly: true,
  testDir: '.', testMatch: 'commands.mobile.spec.ts', outputDir: resolve(output, 'artifacts'),
  fullyParallel: true, workers: 2, timeout: 30_000, expect: { timeout: 8_000 },
  reporter: [['list'], ['json', { outputFile: resolve(output, 'playwright.json') }]],
  use: { baseURL: external ?? `http://127.0.0.1:${port}`, reducedMotion: 'reduce', trace: 'retain-on-failure' },
  projects: mobileProfiles.map(profile => ({ name: profile.name, use: { ...devices[profile.device], browserName: profile.browserName }, metadata: { deviceProfile: profile.device, scope: 'Desktop engine touch/viewport emulation; no physical device, OS keyboard or AT.' } })),
  webServer: external ? undefined : {
    command: 'node server.mjs', cwd: fileURLToPath(new URL('.', import.meta.url)),
    env: { EN_COMMANDS_TEST_PORT: String(port) }, url: `http://127.0.0.1:${port}/fixture`, reuseExistingServer: false,
  },
}, pipelineOutput(import.meta.url));
