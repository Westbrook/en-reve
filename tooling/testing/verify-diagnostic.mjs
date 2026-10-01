import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const file=process.argv[2];if(!file)throw new Error('Supply the fresh docs diagnostic receipt');
const report=JSON.parse(await readFile(file,'utf8'));
assert.equal(report.runs?.length,3,'Original three diagnostic samples are required');
assert.equal(report.buildChangedDuringProbe,false,'The served build changed during diagnostic acquisition');
const html = report.assets?.find(asset => asset.path === 'index.html');
assert(html && /^[a-f0-9]{64}$/.test(html.sha256),'The measured HTML identity is required');
assert.equal(report.finalHtmlSha256,html.sha256,'The final HTML identity differs from the measured build');
for(const [index,run] of report.runs.entries()){
 assert.equal(run.sample,index,'Diagnostic sample sequence is incomplete');
 assert(!run.failure,run.failure);assert.deepEqual(run.errors,[]);
 assert.equal(run.htmlSha256,html.sha256,'The browser received a different document');
}
console.log('Three complete diagnostic samples; no recorded browser failures or changed build. No performance-budget acceptance is inferred.');
