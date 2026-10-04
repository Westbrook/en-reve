import { pipelineOutput } from '../../../tooling/test-pipeline/config-output.mjs';
import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import base from './playwright.config.js';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const output = process.env.EN_THEME_REFRESH_OUTPUT_DIR ?? resolve(root, 'artifacts/theme-refresh/browser');
const externalURL = process.env.EN_DOCS_ORIGIN ?? process.env.EN_WORKFLOW_BASE_URL;

export default defineConfig({
  forbidOnly: true,
	...base,
	testMatch: ['theme-refresh.spec.ts', 'inspired-component-fidelity.spec.ts', 'chakra-component-fidelity.spec.ts'],
	workers: 3,
	timeout: 120_000,
	outputDir: resolve(output, 'artifacts'),
	reporter: [['list'], ['json', { outputFile: resolve(output, 'playwright.json') }]],
	use: { ...base.use, ...(externalURL ? { baseURL: externalURL } : {}), viewport: { width: 1440, height: 1100 } },
	webServer: externalURL ? undefined : base.webServer,
}, pipelineOutput(import.meta.url));
