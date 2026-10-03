import {test} from 'node:test';
import assert from 'node:assert/strict';
import {deploymentBase,deploymentSource,deploymentMarkup,deploymentDocument} from './deployment-paths.mjs';
const base='/en-reve/';
test('deployment paths are explicit and root delivery remains unchanged',()=>{
  for(const bad of ['en-reve','/en-reve','//','/../','https://example.com/']) assert.throws(()=>deploymentBase(bad));
  assert.equal(deploymentBase(),'/');assert.equal(deploymentBase(base),base);
  assert.equal(deploymentSource("fetch('/review-build.json')",'app.ts','/'),null);
  assert.equal(deploymentDocument('<head></head>','guides.html','/'),'<head></head>');
});
test('runtime fetch, route templates and native markup use the same subpath without changing editor triggers',()=>{
 const source="const trigger='/'; const chip=`/${tool}`; fetch('/review-build.json'); const path=`/api-examples/${id}`; href('/'); const page={path:'/'}; html`<a href=\"/guides\">Guide</a>`;";
 const result=deploymentSource(source,'app.ts',base).code;
 assert.match(result,/trigger='\/'/);assert.match(result,/chip=`\/\$\{tool\}`/);
 assert.match(result,/fetch\("\/en-reve\/review-build.json"\)/);assert.match(result,/`\/en-reve\/api-examples\/\$\{id\}`/);
 assert.match(result,/href\("\/en-reve\/"\)/);assert.match(result,/path:"\/en-reve\/"/);
 assert.match(result,/href="\/en-reve\/guides"/);
 assert.equal(deploymentSource(result,'app.ts',base),null);
});
test('HTML binding preserves templates and text, localizes fragments and places exactly one base first',()=>{
 const input='<html><head><title>Example</title></head><body><a href="#details">Details</a><template shadowrootmode="open"><a href="/guides">Guide</a></template><pre>&lt;a href="/guides"&gt;</pre></body></html>';
 const result=deploymentDocument(input,'api-examples/calendar.html',base);
 assert.match(result,/<head><base href="https:\/\/westbrook.github.io\/en-reve\/">/);
 assert.match(result,/href="\/en-reve\/api-examples\/calendar.html#details"/);
 assert.match(result,/<a href="\/en-reve\/guides">/);
 assert.match(result,/&lt;a href="\/guides"&gt;/);
 assert.throws(()=>deploymentDocument(result,'test.html',base),/Base is owned/);
 assert.equal(deploymentMarkup('<a href="https://example.com/">x</a>',base),'<a href="https://example.com/">x</a>');
});
