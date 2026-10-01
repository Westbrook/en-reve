import { pipelineOutput } from '../../tooling/test-pipeline/config-output.mjs';
import {defineConfig} from '@playwright/test';
import original from '../context-protocol/playwright.config.js';
export default defineConfig({
  forbidOnly: true,...original,
 testDir:new URL('../context-protocol/',import.meta.url).pathname,
 outputDir:'../../artifacts/scoped-registry-phase-2/context',
 reporter:[['list'],['json',{outputFile:new URL('../../artifacts/scoped-registry-phase-2/context.json',import.meta.url).pathname}]],
}, pipelineOutput(import.meta.url));
