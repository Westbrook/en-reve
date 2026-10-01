import { pipelineOutput } from '../../../tooling/test-pipeline/config-output.mjs';
import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';

const baseURL = process.env.EN_WORKFLOW_BASE_URL;
if (!baseURL) throw new Error('Set EN_WORKFLOW_BASE_URL to the documentation preview.');
const output = process.env.EN_SHOWCASE_MOBILE_OUTPUT_DIR ?? resolve('node_modules/.cache/en-showcase-mobile');
const profiles = [
	{ name: 'iphone-12-portrait', device: 'iPhone 12', browserName: 'webkit' },
	{ name: 'iphone-12-landscape', device: 'iPhone 12 landscape', browserName: 'webkit' },
	{ name: 'pixel-7', device: 'Pixel 7', browserName: 'chromium' },
	{ name: 'ipad-portrait', device: 'iPad (gen 7)', browserName: 'webkit' },
	{ name: 'ipad-landscape', device: 'iPad (gen 7) landscape', browserName: 'webkit' },
] as const;

export default defineConfig({
  forbidOnly: true,
	testDir: '.', testMatch: 'showcase.mobile.spec.ts',
	outputDir: resolve(output, 'artifacts'),
	reporter: [['list'], ['json', { outputFile: resolve(output, 'playwright.json') }]],
	fullyParallel: true, workers: 3, retries: 0, timeout: 60_000,
	expect: { timeout: 8_000 },
	use: { baseURL, reducedMotion: 'reduce', trace: 'retain-on-failure' },
	projects: profiles.map(profile => ({
		name: profile.name,
		use: { ...devices[profile.device], browserName: profile.browserName },
		metadata: { scope: 'Installed engine with device viewport and touch. Native iOS keyboard/pickers and physical-device AT still require manual review.' },
	})),
}, pipelineOutput(import.meta.url));
