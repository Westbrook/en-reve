import { pipelineOutput } from '../../../../tooling/test-pipeline/config-output.mjs';
import { defineConfig } from '@playwright/test';
const root=new URL('../../../../',import.meta.url).pathname;
export default defineConfig({
  forbidOnly: true,testDir:'.',testMatch:'review.spec.ts',workers:2,outputDir:'/private/tmp/theme03-review/traces',reporter:[['list'],['json',{outputFile:'/private/tmp/theme03-review/playwright.json'}]],use:{baseURL:'http://127.0.0.1:47831',trace:'retain-on-failure',reducedMotion:'reduce'},projects:['chromium','firefox','webkit'].map(browserName=>({name:browserName,use:{browserName:browserName as 'chromium'|'firefox'|'webkit'}})),webServer:{command:'python3 -m http.server 47831 --bind 127.0.0.1 --directory dist',cwd:root,url:'http://127.0.0.1:47831/theme-states.html',reuseExistingServer: process.env.EN_EXECUTION_OWN_SERVERS !== '1'}}, pipelineOutput(import.meta.url));
