import {pipelineOutput} from '../../tooling/test-pipeline/config-output.mjs';
import {defineConfig} from '@playwright/test';
import {resolve} from 'node:path';
const out=resolve(process.env.EN_CONSUMER_CONTRACTS_OUT ?? new URL('../../artifacts/scoped-followup-consumer-contracts',import.meta.url).pathname);
export default defineConfig({testDir:'.',testMatch:'contracts.spec.ts',workers:1,retries:0,
 outputDir:resolve(out,'browser'),
 reporter:[['list'],['json',{outputFile:resolve(out,'browser.json')}]],
 use:{baseURL:'http://127.0.0.1:4257',trace:'retain-on-failure'},
 projects:['chromium','firefox','webkit'].map(browserName=>({name:browserName,use:{browserName:browserName as 'chromium'|'firefox'|'webkit'}})),
 webServer:{command:'node probes/consumer-contracts/server.mjs',cwd:'../..',url:'http://127.0.0.1:4257',reuseExistingServer:false},
}, pipelineOutput(import.meta.url));
