import {defineConfig} from '@playwright/test';
import {dirname, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const path = resolve(process.env.EN_GATE_CONFIG!);
const {default: original} = await import(pathToFileURL(path).href);
const directory = dirname(path);
const output = process.env.EN_GATE_STAGE_OUTPUT!;
if (!output) throw Error('Use tooling/integration-gates/run.mjs to supply an owned output directory.');
const servers = original.webServer ? [original.webServer].flat().map(server => ({...server,
 cwd: resolve(directory, server.cwd ?? '.'), reuseExistingServer: false,
})) : undefined;
export default defineConfig({...original,
 testDir: resolve(directory, original.testDir ?? '.'),
 outputDir: resolve(output, 'traces'),
 reporter: [['list'], ['json', {outputFile:resolve(output,'playwright.json')}]],
 // Keep each owning limit when lower, within the shared correctness budget.
 workers: Math.min(3, typeof original.workers === 'number' ? original.workers : 3),
 retries: 0,
 use: {...original.use, trace: 'retain-on-failure'},
 webServer: servers,
});
