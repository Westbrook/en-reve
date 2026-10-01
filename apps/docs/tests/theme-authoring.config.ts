import { pipelineOutput } from '../../../tooling/test-pipeline/config-output.mjs';
import { defineConfig } from '@playwright/test';
import base from './playwright.config.js';
export default defineConfig(base, {testMatch:'theme-authoring.spec.ts'}, pipelineOutput(import.meta.url));
