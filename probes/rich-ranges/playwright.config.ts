import { pipelineOutput } from '../../tooling/test-pipeline/config-output.mjs';
import {defineConfig} from '@playwright/test';
const port=Number(process.env.EN_CAPABILITY_PORT??4498);
export default defineConfig({forbidOnly:true,testDir:'.',testMatch:'*.spec.ts',workers:1,timeout:20000,outputDir:'../../artifacts/rich-ranges',reporter:'list',use:{baseURL:`http://127.0.0.1:${port}`},projects:['chromium','firefox','webkit'].map(browserName=>({name:browserName,use:{browserName:browserName as 'chromium'|'firefox'|'webkit'}})),webServer:{command:'node probes/rich-ranges/server.mjs',cwd:new URL('../..',import.meta.url).pathname,url:`http://127.0.0.1:${port}/probes/rich-ranges/fixture.html`,reuseExistingServer:false}}, pipelineOutput(import.meta.url));
