// A fresh process per sample includes module loading on both paths. Timings are
// observations for this tiny fixture, not a prediction for the package build.
import { performance } from 'node:perf_hooks';
const start = performance.now();
const { canonicalCSS, loadEngine } = await import('./compiler.mjs');
const { baselineStyles } = await import('./fixtures/baseline.ts');
let css;
if(process.argv[2]==='baseline') css=canonicalCSS(baselineStyles().cssText);
else {
 const {compilePilot,definitionInputs}=await import('./fixture.mjs');
 css=compilePilot(await definitionInputs(),await loadEngine()).after;
}
console.log(JSON.stringify({elapsedMs:performance.now()-start,bytes:Buffer.byteLength(css)}));
