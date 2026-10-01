import { pipelineOutput } from '../../../tooling/test-pipeline/config-output.mjs';
import {defineConfig} from '@playwright/test';
import base from './theme-proof.config.js';
export default defineConfig(base, {
  testMatch: ['theme-proof.spec.ts', 'theme-authoring.spec.ts', 'theme-composition.spec.ts'],
}, pipelineOutput(import.meta.url));
