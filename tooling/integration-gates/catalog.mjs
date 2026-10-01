// Orchestration only: each command invokes an existing assertion owner.
import {readdirSync,readFileSync} from 'node:fs';
import workflowConfig from '../../apps/docs/tests/playwright.config.ts';
import { deliveryBrowserOwners, deliveryNodeSources, isDeliveryChange } from '../testing/lazy-delivery-closure.mjs';
const node = (...args) => ['node', ...args];
const npm = (...args) => ['npm', ...args];
const unit = (id, files, deps = ['build']) => ({id, deps, command: node('--test', ...files)});
const pw = (id, config, deps = ['build']) => ({id, deps:['capabilities',...deps], config, command: node('node_modules/@playwright/test/cli.js', 'test', '--config', 'tooling/integration-gates/playwright.config.ts')});
export function catalog(root) {
 // Inventory must not execute a browser config or require an installed browser package.
 const workflowSource=readFileSync(`${root}/apps/docs/tests/playwright.config.ts`,'utf8');
 const match=workflowSource.match(/testMatch:\s*(\[[^\]]*\])/);
 if(!match)throw Error('Workflow ownership must be an explicit file array');
 const workflowConfig={testMatch:JSON.parse(match[1].replaceAll("'",'"'))};
 const ssrTests = readdirSync(`${root}/packages/ssr/tests`).filter(n=>n.endsWith('.test.mjs')).sort().map(n=>`packages/ssr/tests/${n}`);
 const tokenTests = readdirSync(`${root}/packages/tokens/test`).filter(n=>n.endsWith('.test.mjs')).sort().map(n=>`packages/tokens/test/${n}`);
 return [
  {id:'orchestration', deps:[], command:node('--test','tooling/integration-gates/runner.test.mjs')},
  {id:'frozen', deps:[], command:['python3','tooling/integration-gates/frozen.py']},
  {id:'build', deps:[], command:npm('run','build')},
  {id:'capabilities',deps:['build'],command:node('tooling/integration-gates/capabilities.mjs')},
  ...['api','types','lazy','customization'].map(id=>({id:`metadata-${id}`,deps:['build'],command:npm('run',`check:${id}`)})),
  {id:'metadata-cem',deps:['build'],command:node('tooling/metadata/generate-elements.ts','--check')},
  {id:'metadata-delivery',deps:['build'],command:npm('run','check:delivery')},
  {id:'tooling',deps:['build'],command:npm('run','test:tooling')},
  {id:'delivery-closeout',deps:['metadata-delivery','tooling'],command:npm('run','check:delivery:final')},
  unit('transactions-unit',['packages/primitives/tests/events.test.mjs','packages/primitives/tests/token-document.test.ts','probes/api-forms/metadata.test.mjs']),
  unit('virtual-collection-unit',['packages/primitives/tests/virtual-collection.test.mjs','packages/primitives/tests/virtual-rendering.test.mjs','packages/primitives/tests/collection-contract.test.mjs','packages/primitives/tests/table.test.mjs']),
  pw('document-scroll','probes/document-scroll/playwright.config.ts',['virtual-collection-unit']),
  pw('parts','probes/api-contracts/playwright.config.ts'),
  pw('events','probes/api-events/playwright.config.ts'),
  pw('transactions','probes/api-transactions/playwright.config.ts'),
  pw('geometry','packages/elements/src/internal/tests/playwright.config.ts'),
  pw('commands','packages/elements/src/commands/tests/playwright.config.ts'),
  unit('theme-unit',[...tokenTests,'tooling/customization/customization.test.mjs','tooling/metadata/metadata.test.ts','tooling/css-authoring/compiler.test.mjs','tooling/theme-proof/themes.test.mjs','tooling/theme-candidates/catalogue.test.mjs']),
  {id:'theme-contrast',deps:['build'],command:node('tooling/theme-candidates/originals/verify.mjs')},
  {id:'theme-properties',deps:['build'],command:node('packages/tokens/test/property-browser/probe.mjs')},
  {id:'theme-scopes',deps:['build'],command:node('packages/tokens/test/scope-browser/probe.mjs')},
  pw('theme-cascade','packages/styles/tests/theme-cascade/playwright.config.ts'),
  pw('theme-states','packages/styles/tests/state-paint/playwright.config.ts'),
  pw('theme-composition','packages/styles/tests/composition/playwright.config.ts'),
  pw('theme-docs','apps/docs/tests/theme-regression.config.ts'),
  pw('theme-candidates','apps/docs/tests/theme-refresh.config.ts'),
  {id:'scope-prepare',deps:['build'],command:node('probes/scoped-registry/prepare-packed.mjs')},
  pw('scope','probes/scoped-registry/playwright.config.ts',['scope-prepare']),
  pw('context','probes/scoped-registry/context-regressions.config.ts'),
  unit('lazy-unit',['probes/lazy-registry/loader.test.mjs']),
  {id:'lazy-prepare',deps:['build','metadata-lazy'],command:node('probes/lazy-registry/prepare.mjs')},
  pw('lazy','probes/lazy-registry/playwright.config.ts',['lazy-prepare']),
  unit('lazy-delivery-unit',['probes/lazy-delivery/contract.test.mjs']),
  {id:'lazy-delivery-prepare',deps:['build','metadata-lazy'],command:node('probes/lazy-delivery/prepare.mjs')},
  pw('lazy-delivery','probes/lazy-delivery/playwright.config.ts',['lazy-delivery-prepare']),
  {id:'lazy-delivery-editor-prepare',deps:['build','metadata-lazy'],command:node('probes/lazy-delivery-editor/prepare.mjs')},
  pw('lazy-delivery-editor','probes/lazy-delivery-editor/playwright.config.ts',['lazy-delivery-editor-prepare']),
  {id:'lazy-delivery-pagination-prepare',deps:['build','metadata-lazy'],command:node('probes/lazy-delivery-pagination/prepare.mjs')},
  pw('lazy-delivery-pagination','probes/lazy-delivery-pagination/playwright.config.ts',['lazy-delivery-pagination-prepare']),
  {id:'activation-prepare',deps:['build'],command:node('probes/activation-registry/prepare.mjs')},
  pw('activation','probes/activation-registry/playwright.config.ts',['activation-prepare']),
  {id:'activation-library-prepare',deps:['activation-prepare'],command:node('probes/activation-library/prepare.mjs')},
  pw('activation-library','probes/activation-library/playwright.config.ts',['activation-library-prepare']),
  unit('registration-unit',['packages/primitives/tests/registration.test.mjs']),
  unit('ssr-unit',ssrTests),
  {id:'ssr-browser-prepare',deps:['build'],command:node('packages/ssr/tests/minification/build.mjs','--source-only')},
  pw('ssr-browser','packages/ssr/playwright.config.ts',['ssr-browser-prepare']),
  unit('delivery-unit',deliveryNodeSources),
  ...deliveryBrowserOwners.map(([id,config])=>pw(id,config)),
  // Reuse the supported owner of the production docs server. The outer build
  // supplies artifacts; the child receipt must prove every selected assertion.
  {id:'delivery-gallery',deps:['build'],command:node('tooling/testing/invoke.mjs','comprehensive','--pathways=delivery-gallery','--skip-build'),receipts:[{path:'public/execution.json',equals:{status:'passed-existing-build','assertionCoverage.complete':true},commitFields:['candidate.head','candidateAfter.head']}]},
  {id:'registry-types',deps:['build'],command:node('node_modules/typescript/bin/tsc','--ignoreConfig','--strict','--noEmit','--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext','--skipLibCheck','probes/scoped-registry/consumer.types.ts','probes/lazy-registry/consumer.types.ts','probes/activation-registry/consumer.types.ts')},
  {id:'hydration-prepare',deps:['build'],command:node('probes/scoped-hydration/prepare.mjs')},
  pw('hydration','probes/scoped-hydration/playwright.config.ts',['hydration-prepare']),
  {...pw('workflows','apps/docs/tests/playwright.config.ts'),smoke:{baseline:['workflows.spec.ts','settings-scenarios.spec.ts'],owned:workflowConfig.testMatch,existing:readdirSync(`${root}/apps/docs/tests`).filter(n=>n.endsWith('.spec.ts')).sort()}},
  unit('diagnostics-unit',['probes/registry-diagnostics/adapter.test.mjs'],[]),
  {id:'diagnostics',deps:['build','capabilities','diagnostics-unit'],command:node('probes/registry-diagnostics/qualify.mjs'),receipts:[{path:'evidence/receipt.json',equals:{kind:'registry-diagnostics-current-source',status:'passed',exitCode:0,'coverage.completeEngineMatrix':true},commitFields:['source.commit','after.commit'],steps:{field:'steps',name:'name',status:'status',passed:'passed',required:['build','types','server','conformance','interactions']}}]},
  {id:'consumer-prepare',deps:['build'],command:node('probes/consumer-contracts/prepare.mjs'),receipts:[{path:'evidence/packed.json',equals:{types:'passed'}}]},
  pw('consumer-contracts','probes/consumer-contracts/playwright.config.ts',['consumer-prepare']),
  unit('date-fixtures-unit',['artifacts/scoped-followup-date-input-coverage/consolidation/receipt.test.mjs'],[]),
  {id:'date-fixtures-original',deps:[],command:node('artifacts/scoped-followup-date-input-coverage/verify-original.mjs')},
  {id:'date-fixtures',deps:['build','capabilities','date-fixtures-unit','date-fixtures-original'],command:node('artifacts/scoped-followup-date-input-coverage/consolidation/run.mjs'),receipts:[{path:'evidence/run-receipt.json',equals:{schemaVersion:1,status:'passed',success:true,'validation.status':'passed'},commitFields:['sourceCommit','validation.sourceCommit'],positiveFields:['validation.interactionChecks','validation.boundaryChecks'],steps:{field:'stages',status:'code',passed:0,count:8}},{path:'evidence/fixture/build-receipt.json',commitFields:['base']}]},

 ];
}
export const groups = {
 virtualization:['virtual-collection-unit','document-scroll'],
 diagnostics:['diagnostics-unit','diagnostics'],
 consumer:['consumer-contracts'],
 'date-fixtures':['date-fixtures'],
 metadata:['metadata-api','metadata-types','metadata-lazy','metadata-customization','metadata-cem','metadata-delivery'],
 release:['metadata-api','tooling','parts','events','transactions','transactions-unit','geometry','commands','metadata-customization'],
 theme:['metadata-customization','theme-unit','theme-contrast','theme-properties','theme-scopes','theme-cascade','theme-states','parts','theme-composition','theme-docs','theme-candidates'],
 registry:['capabilities','scope','context','lazy-unit','lazy','lazy-delivery-unit','lazy-delivery','lazy-delivery-editor','lazy-delivery-pagination','activation','activation-library','registration-unit','registry-types','ssr-unit','hydration'],
};
groups.delivery=[...groups.metadata,'tooling',...groups.registry,'consumer-contracts','date-fixtures','ssr-browser','delivery-unit',...deliveryBrowserOwners.map(([id])=>id),'delivery-gallery','commands','events','transactions','transactions-unit','parts','geometry','theme-cascade','theme-states','workflows'];
export function selection(stages, {mode='smoke',changed=[],only=[]}={}) {
 const known = new Map(stages.map(s=>[s.id,s]));
 let ids;
 if (only.length) ids=only.flatMap(id=>groups[id] ?? [id]);
 else if (mode==='integration') ids=stages.map(s=>s.id);
 else {
  ids=['orchestration','frozen'];
  // Unknown source paths deliberately widen; docs/evidence alone remain cheap.
  const relevant=changed.filter(p=>! /^(plans\/|artifacts\/|.*\.md$)/.test(p) || /^artifacts\/scoped-followup-date-input-coverage\/(?:consolidation\/)?[^/]+\.(mjs|js)$/.test(p) || ['packages/elements/SCOPED-REGISTRIES.md','packages/ssr/README.md'].includes(p));
  for (const path of relevant) {
   if (path.startsWith('tooling/integration-gates/')) continue;
   if(isDeliveryChange(path))ids.push(...groups.delivery);
   // Keep the existing docs workflow selection as well as the fixture's probe owner.
   if (['apps/docs/document-scroll.html','apps/docs/src/document-scroll-demo.ts'].includes(path)) ids.push(...groups.virtualization);
   if (/^probes\/registry-diagnostics\//.test(path))ids.push(...groups.diagnostics);
   else if (/^probes\/consumer-contracts\//.test(path)||['packages/elements/SCOPED-REGISTRIES.md','packages/ssr/README.md'].includes(path))ids.push(...groups.consumer);
   else if (/^artifacts\/scoped-followup-date-input-coverage\//.test(path))ids.push(...groups['date-fixtures']);
   else if (/^tooling\/(metadata|customization)\//.test(path)) ids.push(...groups.metadata,'tooling','parts');
   else if (/^packages\/(styles|tokens)\//.test(path)) ids.push(...groups.metadata,'theme-unit','parts','geometry','theme-cascade','theme-states');
   else if (['apps/docs/tests/playwright.config.ts','apps/docs/tests/static-server.mjs'].includes(path)) ids.push('workflows','theme-docs','theme-candidates');
   else if (['apps/docs/tests/theme-proof.config.ts','apps/docs/tests/theme-regression.config.ts'].includes(path)) ids.push('theme-docs');
   else if (path==='apps/docs/tests/theme-refresh.config.ts') ids.push('theme-candidates');
   else if (/^apps\/docs\/tests\/theme-(proof|authoring|composition)\.spec\.ts$/.test(path)) ids.push('theme-docs');
   else if (path==='apps/docs/tests/theme-refresh.spec.ts') ids.push('theme-candidates');
   else if (/^apps\/docs\//.test(path)) ids.push('workflows');
   else if (/^probes\/scoped-registry\//.test(path)) ids.push('scope','context');
   else if (/^probes\/lazy-registry\//.test(path)) ids.push('lazy-unit','lazy');
   else if (/^probes\/lazy-delivery\//.test(path)) ids.push('lazy-delivery-unit','lazy-delivery');
   else if (/^probes\/lazy-delivery-editor\//.test(path)) ids.push('lazy-delivery-editor');
   else if (/^probes\/lazy-delivery-pagination\//.test(path)) ids.push('lazy-delivery-pagination');
   else if (/^probes\/activation-(registry|library)\//.test(path)) ids.push('activation','activation-library');
   else if (/^(packages\/ssr|probes\/scoped-hydration)\//.test(path)) ids.push('ssr-unit','hydration','workflows');
   else ids.push(...groups.metadata,'tooling',...groups.registry,...groups.virtualization,'parts','geometry','theme-cascade','theme-states','workflows');
  }
 }
 const selected=new Set();
 const add=id=>{if(selected.has(id))return; const stage=known.get(id);if(!stage)throw Error(`Unknown stage/group: ${id}`);selected.add(id);stage.deps.forEach(add);};ids.forEach(add);
 const result=stages.map(s=>({...s,required:selected.has(s.id),selectionReason:selected.has(s.id)?only.length?'explicit stage and dependency closure':mode==='integration'?'exact-commit complete integration':'relevant-change smoke':'outside selection'}));
 const workflow=result.find(s=>s.id==='workflows');
 if(mode==='smoke'&&!only.length&&workflow?.required){
  const policy=workflow.smoke,owned=policy?.owned;
  if(!Array.isArray(owned)||owned.some(p=>typeof p!=='string'||!/^[a-z0-9-]+\.spec\.ts$/.test(p)))throw Error('Automatic workflow smoke requires an explicit owning file inventory; use the full owning config');
  const changedSpecs=changed.filter(p=>/^apps\/docs\/tests\/[^/]+\.spec\.ts$/.test(p)).map(p=>p.split('/').at(-1));
  const elsewhere=new Set(['theme-proof.spec.ts','theme-authoring.spec.ts','theme-composition.spec.ts','theme-refresh.spec.ts']);
  const unowned=changedSpecs.filter(p=>policy.existing.includes(p)&&!owned.includes(p)&&!elsewhere.has(p));
  if(unowned.length)throw Error(`No automatic smoke owner registered for changed test: ${unowned.join(', ')}; run and record its owning config explicitly`);
  const deleted=changedSpecs.filter(p=>!policy.existing.includes(p));
  const shared=changed.some(isDeliveryChange)||changed.some(p=>/^apps\/docs\/tests\/(?!.*\.spec\.ts$)/.test(p)||p==='apps/docs/tests/selection.spec.ts');
  if(shared||deleted.length)workflow.workflowSelection={kind:'full',reason:shared?'shared workflow harness/selection changed':'deleted test: full remaining owning suite',deleted};
  else {
   if(policy.baseline.some(p=>!owned.includes(p)||!policy.existing.includes(p)))throw Error('Required baseline workflow smoke file is missing from its owning config or checkout');
   const files=[...new Set([...policy.baseline,...changedSpecs.filter(p=>owned.includes(p))])].sort();
   // Playwright positional file filters are regexes, so escape every path character.
   const filters=files.map(file=>`apps/docs/tests/${file}`.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$');
   workflow.command=[...workflow.command,...filters];workflow.workflowSelection={kind:'focused',files,filters};
  }
 }
 return result;
}
