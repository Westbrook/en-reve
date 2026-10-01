import { pipelineOutput } from '../../tooling/test-pipeline/config-output.mjs';
import {defineConfig} from '@playwright/test';
export default defineConfig({
  forbidOnly: true,testDir:'.',testMatch:'hydration.spec.ts',workers:1,timeout:20000,use:{baseURL:'http://127.0.0.1:4225',trace:'retain-on-failure'},projects:['chromium','firefox','webkit'].map(browserName=>({name:browserName,use:{browserName:browserName as 'chromium'|'firefox'|'webkit'}})),reporter:[['list'],['json',{outputFile:'../../artifacts/scoped-registry-phase-5/browser.json'}]],outputDir:'../../artifacts/scoped-registry-phase-5/browser',webServer:{command:'node probes/scoped-hydration/server.mjs',cwd:'../..',url:'http://127.0.0.1:4225/shadow.html',reuseExistingServer:false}}, pipelineOutput(import.meta.url));
