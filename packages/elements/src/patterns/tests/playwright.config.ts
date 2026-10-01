import { pipelineOutput } from '../../../../../tooling/test-pipeline/config-output.mjs';
import {defineConfig} from '@playwright/test';
import {fileURLToPath} from 'node:url';
export default defineConfig({
  forbidOnly: true,testDir:'.',testMatch:'*.spec.ts',workers:3,timeout:30000,
 outputDir:fileURLToPath(new URL('../../../../../artifacts/component-gap-closure/browser',import.meta.url)),
 reporter:[['list'],['json',{outputFile:fileURLToPath(new URL('../../../../../artifacts/component-gap-closure/browser.json',import.meta.url))}]],
 use:{baseURL:'http://127.0.0.1:4495',trace:'retain-on-failure'},
 projects:['chromium','firefox','webkit'].map(browserName=>({name:browserName,use:{browserName:browserName as 'chromium'|'firefox'|'webkit'}})),
 webServer:{command:'node node_modules/vite/bin/vite.js --config packages/elements/src/patterns/tests/vite.config.ts',cwd:fileURLToPath(new URL('../../../../../',import.meta.url)),url:'http://127.0.0.1:4495/packages/elements/src/patterns/tests/fixture.html',reuseExistingServer:false},
}, pipelineOutput(import.meta.url));
