import { pipelineOutput } from '../../../../../tooling/test-pipeline/config-output.mjs';
import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const port = process.env.EN_TOOLTIP_TEST_PORT ?? '4497';
const outputDir = process.env.EN_TOOLTIP_TEST_OUTPUT_DIR ?? fileURLToPath(new URL('./results', import.meta.url));
export default defineConfig({
  forbidOnly: true,
	testDir: '.', testMatch: '*.spec.ts', outputDir, workers: 3,
	reporter: [['list'], ['json', { outputFile: `${outputDir}/summary.json` }]],
	use: { baseURL: `http://127.0.0.1:${port}`, trace: 'retain-on-failure', reducedMotion: 'reduce', viewport: { width: 1100, height: 800 } },
	projects: ['chromium', 'firefox', 'webkit'].map(browserName => ({
		name: browserName, use: { browserName: browserName as 'chromium' | 'firefox' | 'webkit' },
	})),
	webServer: {
		command: 'node node_modules/vite/bin/vite.js --config packages/elements/src/tooltip/tests/vite.config.ts',
		cwd: fileURLToPath(new URL('../../../../../', import.meta.url)),
		url: `http://127.0.0.1:${port}/packages/elements/src/tooltip/tests/fixture.html`, reuseExistingServer: false,
	},
}, pipelineOutput(import.meta.url));
