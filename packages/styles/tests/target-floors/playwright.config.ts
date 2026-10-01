import { pipelineOutput } from '../../../../tooling/test-pipeline/config-output.mjs';
import { defineConfig } from '@playwright/test';
export default defineConfig({
  forbidOnly: true,
  testDir: '.', testMatch: '*.spec.ts', fullyParallel: true, workers: 3,
  outputDir: '/private/tmp/en-api07-target-floors/traces',
  reporter: [['list'], ['json', {outputFile:'/private/tmp/en-api07-target-floors/results.json'}]],
  use: {baseURL:'http://127.0.0.1:47827', trace:'retain-on-failure'},
  projects: [
    ...(['chromium','firefox','webkit'] as const).flatMap(browserName => [false,true].map(hasTouch => ({
      name:`${browserName}-${hasTouch?'touch':'mouse'}`,use:{browserName,hasTouch},
    }))),
    {name:'chromium-mixed',use:{browserName:'chromium',launchOptions:{args:[
      '--blink-settings=primaryHoverType=2,availableHoverTypes=3,primaryPointerType=4,availablePointerTypes=6',
    ]}}},
  ],
  webServer: {cwd:new URL('../../../../',import.meta.url).pathname,command:'node packages/styles/tests/target-floors/server.mjs',url:'http://127.0.0.1:47827/packages/styles/tests/target-floors/fixture.html',reuseExistingServer:false},
}, pipelineOutput(import.meta.url));
