import { pipelineOutput } from '../../tooling/test-pipeline/config-output.mjs';
import { defineConfig } from '@playwright/test';
export default defineConfig({
  forbidOnly: true,
 testDir: '.',testMatch:'consumption.spec.ts',fullyParallel:true,workers:3,
 outputDir:'results/artifacts',
 reporter:[['list'],['json',{outputFile:'results/playwright.json'}]],
 use:{baseURL:'http://127.0.0.1:4467',trace:'retain-on-failure'},
 webServer:{command:'node server.mjs',url:'http://127.0.0.1:4467/html.html',reuseExistingServer: process.env.EN_EXECUTION_OWN_SERVERS !== '1'},
 projects:[{name:'chromium',use:{browserName:'chromium'}},{name:'firefox',use:{browserName:'firefox'}},{name:'webkit',use:{browserName:'webkit'}}],
}, pipelineOutput(import.meta.url));
