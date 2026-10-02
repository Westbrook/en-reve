import {defineConfig} from '@playwright/test';
import {pipelineOutput} from '../../../tooling/test-pipeline/config-output.mjs';
const port=Number(process.env.EN_SCROLL_HELPER_PORT??4414),baseURL=`http://127.0.0.1:${port}`;
export default defineConfig({testDir:'.',testMatch:['virtual-scroll-options.spec.ts','virtual-smooth-coverage.spec.ts','tree-data.spec.ts','activity-history.spec.ts'],workers:1,retries:0,forbidOnly:true,timeout:30000,expect:{timeout:8000},reporter:'list',
 use:{baseURL,viewport:{width:1440,height:1000},reducedMotion:'reduce',trace:'retain-on-failure'},
 projects:(['chromium','firefox','webkit'] as const).map(browserName=>({name:browserName,use:{browserName}})),
 webServer:{command:'node apps/docs/tests/static-server.mjs',cwd:'../../..',url:baseURL,env:{EN_WORKFLOW_TEST_PORT:String(port)},reuseExistingServer:false},
},pipelineOutput(import.meta.url));
