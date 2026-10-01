import { pipelineOutput } from '../../../tooling/test-pipeline/config-output.mjs';
import {defineConfig} from '@playwright/test';
import base from './playwright.config.js';
export default defineConfig(base, {
  testMatch: 'theme-proof.spec.ts', workers: 3, timeout: 45000,
  use: {...base.use, viewport: {width:1440,height:1100}},
}, pipelineOutput(import.meta.url));
