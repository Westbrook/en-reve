import { relative, resolve, sep } from 'node:path';
import { selectTasks } from './pathways.mjs';

/**
 * Standalone commands keep their documented prerequisite boundary. In particular,
 * an API check must not regenerate stale metadata, and a reader test must not
 * silently rebuild the report that its existing receipt is intended to inspect.
 * The complete lane selects producer dependencies separately through selectTasks.
 */
export function publicViews(graph) {
  const nodes=(pathway)=>graph.pathways[pathway].filter(id=>id.startsWith('node:'));
  const browser=(config)=>`browser:${config}`;
  const make=(pathway,steps,extra={})=>({pathway,steps,forwardTo:steps.at(-1),...extra});
  const views={
    'root#test:api':make('api',['check-api',{nodeGroup:nodes('tooling')},...graph.pathways.api.filter(id=>id.startsWith('browser:'))]),
    'root#test:tooling':make('tooling',[{nodeGroup:nodes('tooling')}]),
    'root#test:minify':make('minify',[{nodeGroup:nodes('minify')}]),
    'root#test:probes':make('probes',[{nodeGroup:nodes('probes')},browser('probes/reference-target/playwright.config.ts'),browser('probes/playwright.config.ts')]),
    'root#test:breadcrumbs-ssr':make('breadcrumbs',['build:ssr','breadcrumbs-types',{nodeGroup:nodes('breadcrumbs')}]),
    'root#test:breadcrumbs-ssr:browser':make('breadcrumbs-browser',[browser('probes/breadcrumbs-ssr-adapter/playwright.config.ts')]),
    'root#test:properties:browser':make('properties',['properties']),
    'root#test:sheet':make('sheet',['direct:sticker-sheet']),
    'root#test:scoped-registries':make('scoped-registries',['build:elements','scoped-consumer-types','prepare:scoped-registry',browser('probes/scoped-registry/playwright.config.ts'),browser('probes/scoped-registry/context-regressions.config.ts')]),
    'root#test:lazy-registries':make('lazy-registries',['build:elements','direct:lazy',{nodeGroup:['node:probes/lazy-registry/loader.test.mjs']},'prepare:lazy-registry',browser('probes/lazy-registry/playwright.config.ts')]),
    'root#test:extended:node':make('extended-node',[{nodeGroup:nodes('extended-node')}]),
    'root#test:extended:button':make('extended-button',[browser('packages/elements/src/button/playwright.config.mjs')]),
    'root#test:extended:portability':make('extended-portability',['direct:portable']),
    'root#test:extended:types':make('extended-types',['consumer-types']),
    'packages/tokens#test':make('tokens',['build:tokens',{nodeGroup:nodes('tokens')}],{cwd:'packages/tokens'}),
    'packages/primitives#test':make('primitives',['build:primitives','primitives-types',{nodeGroup:nodes('primitives')}],{cwd:'packages/primitives'}),
    'packages/primitives#test:browser':make('primitives-browser',['build:primitives',browser('packages/primitives/playwright.config.ts')],{cwd:'packages/primitives'}),
    'packages/ssr#test':make('ssr',['build:ssr',{nodeGroup:nodes('ssr')}],{cwd:'packages/ssr'}),
    'packages/ssr#test:browser':make('ssr-browser',['prepare:ssr-minification',browser('packages/ssr/playwright.config.ts')],{cwd:'packages/ssr'}),
    'packages/styles#test:authoring':make('styles-authoring',[{nodeGroup:nodes('styles-authoring')}],{cwd:'packages/styles'}),
    'apps/docs#test:workflows:core':make('docs-workflows-core',[{nodeGroup:nodes('docs-workflows-core')}],{cwd:'apps/docs'}),
    'apps/docs#test:workflows':make('docs-workflows',[browser('apps/docs/tests/playwright.config.ts')],{cwd:'apps/docs'}),
    'showcases/performance-results#test':make('reader-tests-existing-build',[
      {nodeGroup:nodes('reader')},browser('showcases/performance-results/playwright.config.js'),
    ],{cwd:'showcases/performance-results',existingBuild:true,excludes:'The comprehensive reader pathway additionally builds and runs four report-specific certification commands.'}),
  };
  const build=selectTasks(graph,['release']).filter(task=>task.kind==='producer').map(task=>task.id);
  const tooling=new Set(nodes('tooling'));
  const apiBrowsers=new Set(graph.pathways.api.filter(id=>id.startsWith('browser:')));
  views['root#test:release']=make('release',[...build,...views['root#test:api'].steps,{nodeGroup:nodes('release').filter(id=>!tooling.has(id))},'customization',...graph.pathways.release.filter(id=>id.startsWith('browser:')&&!apiBrowsers.has(id)),'attestation:release'],{acceptsSkipBuild:true,acceptsForwarded:false});
  views['root#test:theme']=make('theme',[...build,'customization',{nodeGroup:nodes('theme')},'candidate-contrast','properties','scopes',...graph.pathways.theme.filter(id=>id.startsWith('browser:'))],{acceptsSkipBuild:true,acceptsForwarded:false});
  views['root#test:tokens']={...views['packages/tokens#test'],aliasOf:'packages/tokens#test'};
  for(const [id,view] of Object.entries(views)) {
    view.id=id;view.cwd??='.';
    view.prerequisitePolicy='Execute exactly these original public prerequisite stages. Unselected build edges require caller-supplied artifacts, as in the original command. Comprehensive selection follows the full dependency graph.';
    view.forwardTo=view.steps.length-1;
    view.requiredTasks=view.steps.flatMap(step=>typeof step==='string'?[step]:step.nodeGroup);
    for(const task of view.requiredTasks)if(!graph.tasks.some(candidate=>candidate.id===task))throw new Error(`Unknown public view task ${id}: ${task}`);
  }
  return views;
}

/** Resolve a concrete standalone sequence without recursively broadening it to a docs build. */
export function publicViewPlan(graph,id,{root,node=process.execPath,forwarded=[],skipBuild=false}={}) {
  const view=publicViews(graph)[id];if(!view)throw new Error(`Unknown public command view: ${id}`);
  if(skipBuild&&!view.acceptsSkipBuild)throw new Error('This public command does not accept --skip-build');
  if(forwarded.length&&view.acceptsForwarded===false)throw new Error('Only --skip-build is accepted by this public command');
  const byId=new Map(graph.tasks.map(task=>[task.id,task]));
  let steps=skipBuild?view.steps.filter(step=>typeof step!=='string'||byId.get(step).kind!=='producer'):view.steps;
  // This preparation originally belonged to the SSR web server, which Playwright
  // does not start for discovery/help/version requests.
  if(forwarded.some(arg=>['--list','--help','-h','--version','-V'].includes(arg)))steps=steps.filter(step=>step!=='prepare:ssr-minification');
  const plan=steps.map((step,index)=>{
    if(typeof step==='string') {
      const task=byId.get(step);
      // Keep the browser invocation's package cwd and relative configuration path.
      // Producer/custom programs retain their root-relative implementation contract.
      const cwd=task.kind==='browser'?view.cwd:task.cwd??'.';
      const command=task.kind==='browser'
        ? [node,resolve(root,task.command[1]),'test','--config',resolve(root,task.config)]
        : [...task.command];
      return {...task,cwd,command,fulfilled:[step],standalonePrerequisites:true};
    }
    const sources=step.nodeGroup.map(id=>byId.get(id).assertionSources).flat();
    if(!sources.length)throw new Error(`Empty required Node selection: ${view.id}`);
    const cwd=view.cwd;
    return {id:`node-view:${view.pathway}`,kind:'node-group',cwd,command:[node,'--test','--test-concurrency=3',...sources.map(file=>relative(resolve(root,cwd),resolve(root,file)).split(sep).join('/'))],assertionSources:sources,fulfilled:step.nodeGroup,standalonePrerequisites:true};
  });
  if(forwarded.length)plan.at(-1).command.push(...forwarded);
  return {view,plan,forwarded,skipBuild,buildEvidence:skipBuild?'caller-supplied-existing-artifacts':plan.some(task=>task.kind==='producer')?'original-public-prerequisites':'caller-supplied-prerequisites',scope:forwarded.length?'caller-selected-public-command':'declared-public-command',completedResultReuse:false};
}
