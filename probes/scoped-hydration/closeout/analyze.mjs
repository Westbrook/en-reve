// Reuse the established analysis on the separate final capture, without rewriting history.
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const base=resolve('artifacts/scoped-registry-phase-5-closeout/production');
let source=await readFile('probes/scoped-hydration/production/analyze.mjs','utf8');
source=source.replace("resolve('artifacts/scoped-registry-phase-5/production')",JSON.stringify(base)).replace("process.argv[2]??'campaign-v1'","'campaign'");
// Server generation did not change. Preserve its prior measured cohort and label it.
source=source.replace("resolve(base,phase+'-server-cost.json')","resolve('showcases/performance/baselines/scoped-registry-phase-5-v1',phase+'-server-cost.json')");
await writeFile(resolve(base,'analyze-capture.mjs'),source);await import(resolve(base,'analyze-capture.mjs'));
const p=resolve(base,'comparison.json'),d=JSON.parse(await readFile(p));d.server.provenance='Historical Phase5-v1 server cohort; no new server timings in closeout. Library renderer unchanged; the application now imports a browser-readiness helper whose import overhead is not retimed.';d.methodology+=' Final Phase5 application readiness includes two animation frames once after first hydration. Phase4 eager assets are the exact frozen reference. Previous Phase5 browser results are historical, not paired with this capture.';await writeFile(p,JSON.stringify(d,null,2)+'\n');
