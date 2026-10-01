import { pipelineOutput } from '../../tooling/test-pipeline/config-output.mjs';
import config from './playwright.config.js';
import {defineConfig} from '@playwright/test';
export default defineConfig({
  forbidOnly: true,...config,
 outputDir:'../../artifacts/scoped-registry-phase-3-cleanup/browser',
 reporter:[['list'],['json',{outputFile:new URL('../../artifacts/scoped-registry-phase-3-cleanup/browser.json',import.meta.url).pathname}]],
 webServer:{...config.webServer as object,command:'node probes/lazy-registry/server.mjs',env:{EN_LAZY_OUT:process.env.EN_LAZY_OUT ?? 'artifacts/scoped-registry-phase-3-cleanup/packed'},cwd:'../..',url:'http://127.0.0.1:4201/lazy.html',reuseExistingServer:false},
}, pipelineOutput(import.meta.url));
