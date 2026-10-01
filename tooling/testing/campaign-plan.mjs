import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {inventoryDigest} from '../evidence/setup.mjs';
/** Prospective only. This planner cannot acquire, append samples or promote a baseline. */
export function campaignPlan(policy){
 const text=name=>{if(typeof policy[name]!=='string'||!policy[name].trim())throw Error('Campaign requires '+name);};
 for(const name of ['decision','functionalQualification','sourceBinding','comparisonFamily','precision','analysis','stoppingRule','coldSessionPolicy'])text(name);
 if(policy.stoppingRule!=='fixed-budget')throw Error('Only predeclared fixed-budget stopping is supported; sequential designs require a separately reviewed analyzer');
 if(!Number.isSafeInteger(policy.maximumJobs)||policy.maximumJobs<1)throw Error('Campaign requires a positive maximumJobs');
 if(!Array.isArray(policy.cells)||!policy.cells.length)throw Error('Campaign requires explicit cells');
 const seen=new Set(),cells=policy.cells.map(cell=>{
  if(typeof cell.id!=='string'||!cell.id||seen.has(cell.id))throw Error('Missing or duplicate campaign cell');seen.add(cell.id);
  for(const name of ['arms','configurations','modes'])if(!Array.isArray(cell[name])||!cell[name].length||new Set(cell[name]).size!==cell[name].length||cell[name].some(value=>typeof value!=='string'||!value))throw Error('Explicit distinct '+name+' required');
  for(const name of ['timingSamples','retentionRuns','retentionCycles'])if(!Number.isSafeInteger(cell[name])||cell[name]<0)throw Error('Invalid '+name);
  if(!cell.timingSamples&&!cell.retentionRuns)throw Error('Empty campaign cell');
  if(cell.retentionRuns&&!cell.retentionCycles)throw Error('Retention jobs require cycles');
  const contexts=cell.arms.length*cell.configurations.length*cell.modes.length;
  const timingJobs=contexts*cell.timingSamples,retentionJobs=contexts*cell.retentionRuns;
  if(!Number.isSafeInteger(timingJobs+retentionJobs))throw Error('Unsafe sample expansion');
  return {...cell,contexts,timingJobs,retentionJobs,totalJobs:timingJobs+retentionJobs,totalRetentionCycles:retentionJobs*cell.retentionCycles};
 });
 const totalJobs=cells.reduce((n,cell)=>n+cell.totalJobs,0);
 if(!Number.isSafeInteger(totalJobs)||totalJobs>policy.maximumJobs)throw Error('Expanded campaign exceeds its predeclared maximumJobs');
 return {schemaVersion:1,kind:'prospective-campaign-plan',policyDigest:inventoryDigest(policy),decision:policy.decision,stoppingRule:policy.stoppingRule,totalJobs,timingJobs:cells.reduce((n,c)=>n+c.timingJobs,0),retentionJobs:cells.reduce((n,c)=>n+c.retentionJobs,0),cells,policy,
  uncertaintyOutcome:'Report uncertain at the fixed budget. Do not automatically extend samples, pool earlier campaigns, weaken thresholds or promote anchors.',
  acquisitionAuthorized:false,historicalProtocolsChanged:false};
}

/** Call once before each fresh acquisition attempt. Retries spend budget too. */
export function campaignBudget(policy){
 const plan=campaignPlan(policy),counts=new Map(),events=[];
 return {plan,events,admit({cellId,kind}){
  const cell=plan.cells.find(cell=>cell.id===cellId);if(!cell||!['timing','retention'].includes(kind))throw Error('Unknown campaign acquisition');
  const key=cellId+':'+kind,maximum=kind==='timing'?cell.timingJobs:cell.retentionJobs,count=counts.get(key)??0;
  if(count>=maximum||events.length>=policy.maximumJobs)throw Error('Fixed campaign budget exhausted; retain uncertainty and stop');
  counts.set(key,count+1);const event={cellId,kind,attempt:count+1,totalAttempt:events.length+1};events.push(event);return event;
 },remaining(){return plan.totalJobs-events.length;}};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length!==3)throw Error('Usage: node tooling/testing/campaign-plan.mjs policy.json');
 console.log(JSON.stringify(campaignPlan(JSON.parse(await readFile(process.argv[2],'utf8'))),null,2));
}
