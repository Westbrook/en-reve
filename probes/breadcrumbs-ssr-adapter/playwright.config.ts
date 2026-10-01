import { pipelineOutput } from '../../tooling/test-pipeline/config-output.mjs';
import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const output = resolve(process.env.EN_BREADCRUMBS_ADAPTER_TEST_OUTPUT_DIR ?? resolve(root, 'node_modules/.cache/en-breadcrumbs-ssr-adapter-tests'));
const port = Number(process.env.EN_BREADCRUMBS_ADAPTER_TEST_PORT ?? 4396);
export default defineConfig({
  forbidOnly: true,
	testDir: '.', testMatch: 'adapter.spec.ts', outputDir: resolve(output, 'artifacts'),
	// Each navigation owns its stream gate; independent journeys share a bounded budget.
	fullyParallel: true, workers: 3, timeout: 25_000, expect: { timeout: 8_000 },
	reporter: [['list'], ['json', { outputFile: resolve(output, 'playwright.json') }]],
	use: { baseURL: `http://127.0.0.1:${port}`, viewport: { width: 1100, height: 900 }, reducedMotion: 'reduce', trace: 'retain-on-failure' },
	projects: ['chromium', 'firefox', 'webkit'].map(browserName => ({
		name: browserName, use: { browserName: browserName as 'chromium' | 'firefox' | 'webkit' },
	})),
	webServer: {
		command: 'npm run build -w @en-reve/ssr && node probes/breadcrumbs-ssr-adapter/server.mjs', cwd: root,
		url: `http://127.0.0.1:${port}/fixture`, reuseExistingServer: false, timeout: 120_000,
	},
}, pipelineOutput(import.meta.url));
