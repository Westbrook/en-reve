import { pipelineOutput } from '../../../tooling/test-pipeline/config-output.mjs';
import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const baseURL = process.env.EN_WORKFLOW_BASE_URL;
if (!baseURL) throw new Error('Set EN_WORKFLOW_BASE_URL to the existing documentation test server.');
const output = process.env.EN_ASSETS_MOBILE_OUTPUT_DIR ?? resolve(root, 'node_modules/.cache/en-reve-assets-mobile');
const profiles = [
	{ name: 'iphone-12', device: 'iPhone 12', browserName: 'webkit' },
	{ name: 'pixel-7', device: 'Pixel 7', browserName: 'chromium' },
	{ name: 'ipad-portrait', device: 'iPad (gen 7)', browserName: 'webkit' },
	{ name: 'ipad-landscape', device: 'iPad (gen 7) landscape', browserName: 'webkit' },
] as const;

export default defineConfig({
  forbidOnly: true,
	testDir: '.', testMatch: 'assets.mobile.spec.ts',
	outputDir: resolve(output, 'artifacts'),
	reporter: [['list'], ['json', { outputFile: resolve(output, 'playwright.json') }]],
	fullyParallel: true, workers: 3, retries: 0, timeout: 30_000,
	expect: { timeout: 8_000 },
	use: { baseURL, reducedMotion: 'reduce', trace: 'retain-on-failure' },
	projects: profiles.map(profile => ({
		name: profile.name,
		use: { ...devices[profile.device], browserName: profile.browserName },
		metadata: {
			deviceProfile: profile.device,
			scope: 'Installed engine, device viewport and trusted touch taps. Text insertion uses Playwright; no physical device, OS keyboard, IME or screen-reader claim.',
		},
	})),
}, pipelineOutput(import.meta.url));
