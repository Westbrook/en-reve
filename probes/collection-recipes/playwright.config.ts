import {defineConfig} from '@playwright/test';
import {pipelineOutput} from '../../tooling/test-pipeline/config-output.mjs';
const port=Number(process.env.EN_COLLECTION_RECIPES_PORT??4398),origin=`http://127.0.0.1:${port}`;
export default defineConfig({workers:1,retries:0,forbidOnly:true,timeout:30000,reporter:'list',
 use:{baseURL:origin,trace:'retain-on-failure'},
 projects:(['chromium','firefox','webkit'] as const).flatMap(browserName=>[
  {name:`${browserName}-table`,testDir:'../../apps/docs/tests',testMatch:'virtual-collection.spec.ts',use:{browserName,viewport:{width:1280,height:800}}},
  ...[1280,390].map(width=>({name:`${browserName}-document-${width}`,testDir:'../document-scroll',testMatch:'scroll.spec.ts',use:{browserName,viewport:{width,height:width===390?844:800}}})),
 ]),
 webServer:{command:'node probes/collection-recipes/server.mjs',cwd:'../..',url:origin,reuseExistingServer:false},
},pipelineOutput(import.meta.url));
