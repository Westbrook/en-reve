import test from 'node:test';import assert from 'node:assert/strict';import {withNodeFacetReporter} from './node-command.mjs';
const options={reporter:'/receipt/reporter.mjs',destination:'/fresh/events.jsonl'};
test('caller reporter destinations, test filters and worker budgets survive facet instrumentation',()=>{
 const command=['node','--test','--test-concurrency=3','--test-reporter','spec','--test-reporter-destination=stderr','a.test.mjs','--test-name-pattern=exact case'];
 const result=withNodeFacetReporter(command,options);
 assert(result.includes('--test-reporter=spec'));assert(result.includes('--test-reporter-destination=stderr'));
 assert.deepEqual(result.slice(-3),['--test-concurrency=3','a.test.mjs','--test-name-pattern=exact case']);
 assert(result.includes('--test-reporter-destination=/fresh/events.jsonl'));
 assert.throws(()=>withNodeFacetReporter(['node','--test','--test-reporter=tap','--test-reporter=spec'],options),/counts/);
});
