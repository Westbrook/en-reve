import { pipelineOutput } from '../../../../tooling/test-pipeline/config-output.mjs';
import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';
const root = new URL('../../../../', import.meta.url).pathname;
const output = process.env.EN_ACTION_LEAVES_OUTPUT_DIR ?? '/private/tmp/en-action-leaves-tests';
export default defineConfig({
  forbidOnly: true,
  testDir:'.', testMatch:'action-leaves.spec.ts', fullyParallel:true,
  outputDir:resolve(output,'traces'), reporter:[['list'],['json',{outputFile:resolve(output,'playwright.json')}]],
  use:{baseURL:'http://127.0.0.1:4471',trace:'retain-on-failure'},
  projects:[{name:'chromium',use:{browserName:'chromium'}},{name:'firefox',use:{browserName:'firefox'}},{name:'webkit',use:{browserName:'webkit'}}],
  webServer:{command:'node packages/styles/tests/action-leaves/server.mjs',cwd:root,url:'http://127.0.0.1:4471/packages/styles/tests/action-leaves/fixture.html',reuseExistingServer:false},
}, pipelineOutput(import.meta.url));
