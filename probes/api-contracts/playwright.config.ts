import { pipelineOutput } from '../../tooling/test-pipeline/config-output.mjs';
import {defineConfig} from '@playwright/test';
import {resolve} from 'node:path';
const output = process.env.EN_API_CONTRACTS_TEST_OUTPUT_DIR ?? new URL('../../artifacts/api-10-completion', import.meta.url).pathname;
export default defineConfig({
  forbidOnly: true,testDir:'.',testMatch:'*.spec.ts',fullyParallel:true,workers:3,
  reporter:[['list'],['json',{outputFile:resolve(output,process.env.EN_API_CONTRACTS_TEST_OUTPUT_DIR ? 'playwright.json' : 'browser.json')}]],
  outputDir:resolve(output,'traces'),use:{baseURL:'http://127.0.0.1:4613',trace:'retain-on-failure'},
  projects:['chromium','firefox','webkit'].map(browserName=>({name:browserName,use:{browserName:browserName as 'chromium'|'firefox'|'webkit'}})),
  webServer:{command:'node probes/api-contracts/server.mjs',cwd:new URL('../../',import.meta.url).pathname,url:'http://127.0.0.1:4613/probes/api-contracts/fixture.html',reuseExistingServer:false}}, pipelineOutput(import.meta.url));
