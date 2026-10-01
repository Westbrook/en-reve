import { pipelineOutput } from '../../tooling/test-pipeline/config-output.mjs';
import {defineConfig} from '@playwright/test';
export default defineConfig({
  forbidOnly: true,testDir:'.',testMatch:'*.spec.ts',workers:1,
 outputDir:'../../artifacts/scoped-registry-phase-3/browser',
 reporter:[['list'],['json',{outputFile:new URL('../../artifacts/scoped-registry-phase-3/browser.json',import.meta.url).pathname}]],
 use:{baseURL:'http://127.0.0.1:4201',trace:'retain-on-failure'},
 projects:['chromium','firefox','webkit'].map(browserName=>({name:browserName,use:{browserName:browserName as 'chromium'|'firefox'|'webkit',hasTouch:true}})),
 webServer:{command:'node probes/lazy-registry/server.mjs',cwd:'../..',url:'http://127.0.0.1:4201/lazy.html',reuseExistingServer:false},
}, pipelineOutput(import.meta.url));
