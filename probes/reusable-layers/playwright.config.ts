import {defineConfig} from '@playwright/test';
import {pipelineOutput} from '../../tooling/test-pipeline/config-output.mjs';
const port=Number(process.env.EN_REUSABLE_LAYERS_PORT??4398);
export default defineConfig({workers:1,retries:0,forbidOnly:true,testMatch:'*.spec.ts',reporter:'list',
 use:{baseURL:`http://127.0.0.1:${port}`,trace:'retain-on-failure'},
 projects:(['chromium','firefox','webkit'] as const).flatMap(browserName=>[
  {name:browserName+'-core',testDir:'../../packages/primitives/tests/browser',use:{browserName}},
  {name:browserName+'-recipes',testDir:'.',testMatch:'recipes.spec.ts',use:{browserName}},
 ]),
 webServer:{command:'node probes/reusable-layers/server.mjs',cwd:'../..',url:`http://127.0.0.1:${port}`,reuseExistingServer:false},
},pipelineOutput(import.meta.url));
