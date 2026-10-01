import { pipelineOutput } from '../../../tooling/test-pipeline/config-output.mjs';
import { mobileProfiles } from '../../../tooling/testing/mobile-profiles.js';
import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const output = process.env.EN_IPHONE_COMBOBOX_OUTPUT_DIR ?? resolve(root, 'node_modules/.cache/en-reve-iphone-combobox');
const externalURL = process.env.EN_WORKFLOW_BASE_URL;
const port = Number(process.env.EN_WORKFLOW_TEST_PORT ?? 4394);
const baseURL = externalURL ?? `http://127.0.0.1:${port}`;


/** Installed engine emulation profiles; these do not run the physical device's operating system. */
export default defineConfig({
  forbidOnly: true,
	testDir: '.',
	testMatch: 'combobox-scroll-edit.spec.ts',
	outputDir: resolve(output, 'artifacts'),
	reporter: [['list'], ['json', { outputFile: resolve(output, 'playwright.json') }]],
	fullyParallel: true,
	workers: 3,
	retries: 0,
	timeout: 30_000,
	expect: { timeout: 8_000 },
	use: {
		baseURL,
		reducedMotion: 'reduce',
		trace: 'retain-on-failure',
	},
	projects: mobileProfiles.map(profile => ({
		name: profile.name,
		use: { ...devices[profile.device], browserName: profile.browserName },
		metadata: { deviceProfile: profile.device, scope: 'Installed browser engine with mobile viewport and touch emulation; no physical device or software keyboard.' },
	})),
	webServer: externalURL ? undefined : {
		command: 'node apps/docs/tests/static-server.mjs', cwd: root,
		env: { EN_WORKFLOW_TEST_PORT: String(port) },
		url: `${baseURL}/workflows/selection`, reuseExistingServer: false,
	},
}, pipelineOutput(import.meta.url));
