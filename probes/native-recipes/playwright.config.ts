import {defineConfig} from '@playwright/test';
import {pipelineOutput} from '../../tooling/test-pipeline/config-output.mjs';
const port=Number(process.env.EN_NATIVE_RECIPES_PORT??4399),origin=`http://127.0.0.1:${port}`;
export default defineConfig({workers:1,retries:0,forbidOnly:true,testMatch:'*.spec.ts',reporter:'list',
 use:{reducedMotion:'reduce',trace:'retain-on-failure'},
 projects:(['chromium','firefox','webkit'] as const).flatMap(browserName=>[
  ...(['lit','css'] as const).map(delivery=>({name:`${browserName}-content-${delivery}`,testDir:'../../packages/primitives/tests/content',testMatch:'content.spec.ts',use:{browserName,baseURL:`${origin}/content-${delivery}/`}})),
  ...(['lit','css'] as const).map(delivery=>({name:`${browserName}-navigation-${delivery}`,testDir:'../../packages/primitives/tests/navigation',testMatch:'navigation.spec.ts',use:{browserName,baseURL:`${origin}/navigation-${delivery}/`}})),
 ]),
 webServer:{command:'node probes/native-recipes/server.mjs',cwd:'../..',url:origin,reuseExistingServer:false},
},pipelineOutput(import.meta.url));
