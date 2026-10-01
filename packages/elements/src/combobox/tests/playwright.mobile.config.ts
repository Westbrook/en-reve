import { pipelineOutput } from '../../../../../tooling/test-pipeline/config-output.mjs';
import { mobileProfiles } from '../../../../../tooling/testing/mobile-profiles.js';
import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../../../', import.meta.url));
const output = process.env.EN_COMBOBOX_MOBILE_OUTPUT_DIR ?? resolve(root, 'node_modules/.cache/en-combobox-mobile');
const port = Number(process.env.EN_COMBOBOX_MOBILE_PORT ?? 4407);
const external = process.env.EN_COMBOBOX_MOBILE_BASE_URL;


export default defineConfig({
  forbidOnly: true,
	testDir: '.', outputDir: resolve(output, 'artifacts'),
	fullyParallel: false, workers: 1, timeout: 25_000, expect: { timeout: 8_000 },
	reporter: [['list'], ['json', { outputFile: resolve(output, 'playwright.json') }]],
	use: { baseURL: external ?? `http://127.0.0.1:${port}`, reducedMotion: 'reduce', trace: 'retain-on-failure' },
	projects: mobileProfiles.map(profile => ({
		name: profile.name,
		testMatch: profile.browserName === 'chromium' ? ['combobox.feedback-mobile.spec.ts', 'combobox.mobile.spec.ts', 'combobox.mobile-viewport.spec.ts', 'combobox.touch-scroll.spec.ts'] : ['combobox.feedback-mobile.spec.ts', 'combobox.mobile.spec.ts', 'combobox.mobile-viewport.spec.ts'],
		use: { ...devices[profile.device], browserName: profile.browserName },
		metadata: { deviceProfile: profile.device, scope: 'Desktop browser engine with mobile viewport and touch emulation; no physical device or software keyboard.' },
	})),
	webServer: external ? undefined : {
		command: 'node server.mjs', cwd: fileURLToPath(new URL('.', import.meta.url)),
		env: { EN_COMBOBOX_TEST_PORT: String(port) },
		url: `http://127.0.0.1:${port}/fixture`, reuseExistingServer: false,
	},
}, pipelineOutput(import.meta.url));
