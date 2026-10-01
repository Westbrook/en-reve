import { pipelineOutput } from '../../tooling/test-pipeline/config-output.mjs';
import {defineConfig} from '@playwright/test';
export default defineConfig({
  forbidOnly: true,testDir:'../api-transactions',testMatch:'*.spec.ts',workers:3,timeout:20000,outputDir:'../../artifacts/component-gap-closure/transactions',reporter:[['list']],use:{baseURL:'http://127.0.0.1:4498',reducedMotion:'reduce'},projects:['chromium','firefox','webkit'].map(browserName=>({name:browserName,use:{browserName:browserName as 'chromium'|'firefox'|'webkit'}})),webServer:{command:'node probes/component-patterns/transactions-server.mjs',cwd:new URL('../../',import.meta.url).pathname,url:'http://127.0.0.1:4498/probes/api-transactions/fixture.html',reuseExistingServer:false}}, pipelineOutput(import.meta.url));
