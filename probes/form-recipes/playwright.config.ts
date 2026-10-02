import {defineConfig} from '@playwright/test';
import {pipelineOutput} from '../../tooling/test-pipeline/config-output.mjs';
const port=Number(process.env.EN_FORM_RECIPES_PORT??4401);
export default defineConfig({testDir:'.',testMatch:'recipes.spec.ts',workers:1,retries:0,forbidOnly:true,reporter:'list',
 use:{baseURL:`http://127.0.0.1:${port}`,trace:'retain-on-failure'},
 projects:(['chromium','firefox','webkit'] as const).map(browserName=>({name:browserName,use:{browserName}})),
 webServer:{command:'node probes/form-recipes/server.mjs',cwd:'../..',url:`http://127.0.0.1:${port}`,reuseExistingServer:false},
},pipelineOutput(import.meta.url));
