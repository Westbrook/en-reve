import { pipelineOutput } from '../../tooling/test-pipeline/config-output.mjs';
import {defineConfig} from '@playwright/test';
export default defineConfig({
  forbidOnly: true,testDir:'.',testMatch:'activation.spec.ts',fullyParallel:false,workers:1,reporter:[['list'],['json',{outputFile:'../../artifacts/scoped-registry-phase-4/activation-tests.json'}]],outputDir:'../../artifacts/scoped-registry-phase-4/test-results',use:{baseURL:'http://127.0.0.1:4210'},projects:[{name:'chromium',use:{browserName:'chromium'}},{name:'firefox',use:{browserName:'firefox'}},{name:'webkit',use:{browserName:'webkit'}}],webServer:{command:'node probes/activation-registry/server.mjs',cwd:'../..',url:'http://127.0.0.1:4210',reuseExistingServer:false}}, pipelineOutput(import.meta.url));
