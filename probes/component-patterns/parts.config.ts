import { pipelineOutput } from '../../tooling/test-pipeline/config-output.mjs';
import {defineConfig} from '@playwright/test';
export default defineConfig({
  forbidOnly: true,testDir:'../api-contracts',testMatch:'parts.spec.ts',workers:3,outputDir:'../../artifacts/component-gap-closure/parts',reporter:[['list']],use:{baseURL:'http://127.0.0.1:4499',trace:'retain-on-failure'},projects:['chromium','firefox','webkit'].map(browserName=>({name:browserName,use:{browserName:browserName as 'chromium'|'firefox'|'webkit'}})),webServer:{command:'node probes/component-patterns/parts-server.mjs',cwd:new URL('../../',import.meta.url).pathname,url:'http://127.0.0.1:4499/probes/api-contracts/fixture.html',reuseExistingServer:false}}, pipelineOutput(import.meta.url));
