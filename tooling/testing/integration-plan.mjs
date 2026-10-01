import {serialOrder} from './schedule.mjs';
/** Integration retains exact-candidate adapters but uses canonical builds/assertion owners.
 * No browser facets are merged merely because their test titles match.
 */
export function integrationPlan(graph, stages){
 const tasks=new Map(graph.tasks.map(task=>[task.id,task]));
 const producers=graph.tasks.filter(task=>task.kind==='producer'&&(task.id.startsWith('build:')||task.id.startsWith('metadata:'))||task.kind==='barrier');
 const build=stages.find(stage=>stage.id==='build'),expanded=[];
 const nodeSources=stage=>stage.command?.includes('--test')?stage.command.filter(arg=>/\.test\.[cm]?[jt]s$/.test(arg)):[];
 for(const original of stages){
  if(original.id==='build'){
   for(const task of producers)expanded.push({...task,deps:task.dependencies,required:false,selectionReason:build.selectionReason,requestedSkip:build.requestedSkip??false,canonicalTasks:[task.id]});
   continue;
  }
  const stage={...original},sources=nodeSources(stage);
  if(stage.id==='tooling')sources.push(...graph.pathways.tooling.map(id=>tasks.get(id).assertionSources).flat());
  // The compatibility file is the union of these three existing assertion owners.
  const catalogue=sources.indexOf('tooling/theme-candidates/catalogue.test.mjs');
  if(catalogue>=0)sources.splice(catalogue,1,...[1,2,3].map(n=>`tooling/theme-candidates/catalogue-group-${n}.test.mjs`));
  if(sources.length){stage.nodeSources=[...new Set(sources)];stage.referenceableSources=stage.nodeSources.filter(file=>['tooling/customization/customization.test.mjs','tooling/metadata/metadata.test.ts'].includes(file));stage.command=[process.execPath,'--test','--test-concurrency=3',...stage.nodeSources];stage.kind='node';stage.canonicalTasks=stage.nodeSources.map(file=>tasks.has('node:'+file)?'node:'+file:'integration-node:'+file);}
  else if(stage.config){stage.kind='browser';stage.canonicalTasks=['browser:'+stage.config];}
  else {stage.kind=stage.id.includes('types')?'types':stage.id.endsWith('prepare')?'producer':['frozen','date-fixtures-original'].includes(stage.id)?'preflight':'check';stage.canonicalTasks=['integration:'+stage.id];}
  if(stage.id==='registry-types')stage.deps=['build:elements'];
  expanded.push(stage);
 }
 if(build?.required){const task=tasks.get('semantic-test-types');expanded.push({...task,deps:task.dependencies,required:true,canonicalTasks:[task.id],selectionReason:'Test/config/tooling semantic admission before browser work'});}
 if(build?.required&&!stages.some(stage=>stage.required&&stage.id!=='build'))expanded.find(stage=>stage.id==='build').required=true;
 const required=expanded.filter(stage=>stage.required),known=new Map(expanded.map(stage=>[stage.id,stage]));
 // Narrow explicit stage selections still need the complete canonical producer closure.
 const require=id=>{const task=known.get(id);if(!task)throw Error('Unmapped integration prerequisite: '+id);if(task.required)return;task.required=true;task.deps.forEach(require);};
 for(const stage of required)stage.deps.forEach(require);
 if(known.get('build:docs-sources')?.required){const task=tasks.get('semantic-doc-types');expanded.push({...task,deps:task.dependencies,required:true,canonicalTasks:[task.id],selectionReason:'Docs semantic types after owned source preparation, before bundling/browser work'});}
 return {stages:expanded,schedulePreview:serialOrder(expanded.filter(stage=>stage.required)),mapping:expanded.map(stage=>({stage:stage.id,canonicalTasks:stage.canonicalTasks})),completedResultReuse:false};
}
