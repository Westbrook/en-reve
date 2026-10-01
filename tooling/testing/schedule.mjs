/** Dependency scheduler shared by correctness and exact-candidate integration.
 * Unknown work is exclusive. Concurrency requires an explicit resource contract.
 * No receipt from a previous invocation participates in admission.
 */
export const priority = task => task.priority ?? ({preflight:0, barrier:1, types:10, node:20, 'node-group':20, python:20, check:30, producer:50}[task.kind] ?? 100);
const dependencies = task => task.dependencies ?? task.deps ?? [];
const passed = status => ['passed','reused'].includes(status);
export function schedulePlan(tasks, {budget=3}={}) {
 if(!Number.isInteger(budget)||budget<1)throw Error('Invalid global worker budget');
 const byId=new Map(tasks.map(task=>[task.id,task]));
 if(byId.size!==tasks.length)throw Error('Duplicate schedule task');
 const visited=new Set(),visiting=new Set();
 const visit=task=>{if(visiting.has(task.id))throw Error('Schedule dependency cycle: '+task.id);if(visited.has(task.id))return;
  visiting.add(task.id);for(const id of dependencies(task)){if(!byId.has(id))throw Error('Missing schedule dependency: '+id);visit(byId.get(id));}visiting.delete(task.id);visited.add(task.id);};
 tasks.forEach(visit);
 return tasks.map((task,index)=>{
  const contract=task.resources,slots=contract?.slots??budget;
  if(!Number.isInteger(slots)||slots<1||slots>budget)throw Error('Invalid task worker budget: '+task.id);
  return {id:task.id,dependencies:dependencies(task),priority:priority(task),index,slots,exclusive:contract?.exclusive!==false,locks:contract?.locks??[],resourceReason:contract?.reason??'Unresolved resource ownership: serialize conservatively'};
 });
}
export async function runSchedule(tasks, execute, {budget=3,continueIndependent=false,onEvent=()=>{}}={}) {
 const plan=schedulePlan(tasks,{budget}),byId=new Map(tasks.map(task=>[task.id,task])),pending=new Map(plan.map(row=>[row.id,row]));
 const outcomes={},running=new Map(),events=[],start=performance.now();let firstFailureMs=null,stopped=false;
 const emit=async(type,row,extra={})=>{const event={type,id:row.id,elapsedMs:performance.now()-start,...extra};events.push(event);await onEvent(event);};
 const compatible=row=>{
  const active=[...running.values()].map(item=>item.row);
  return !active.some(item=>item.exclusive||row.exclusive||item.locks.some(lock=>row.locks.includes(lock)))&&active.reduce((sum,item)=>sum+item.slots,0)+row.slots<=budget;
 };
 while(pending.size||running.size){
  for(const row of [...pending.values()])if(stopped||row.dependencies.some(id=>outcomes[id]&&!passed(outcomes[id].status))){pending.delete(row.id);outcomes[row.id]={status:'not-run',reason:stopped?'Stopped after failure':'Required dependency did not pass'};await emit('blocked',row,outcomes[row.id]);}
  const ready=[...pending.values()].filter(row=>row.dependencies.every(id=>passed(outcomes[id]?.status))).sort((a,b)=>a.priority-b.priority||a.index-b.index);
  for(const row of ready){
   if(stopped||!compatible(row))continue;
   pending.delete(row.id);await emit('started',row,{slots:row.slots,queueMs:performance.now()-start});
   const work=Promise.resolve().then(()=>execute(byId.get(row.id))).then(value=>({status:value?.status??'passed',...value}),error=>({status:'failed',error,errorMessage:String(error.stack??error)})).then(async outcome=>{
    outcomes[row.id]=outcome;
    if(!passed(outcome.status)){firstFailureMs??=performance.now()-start;if(!continueIndependent)stopped=true;}
    await emit('finished',row,{status:outcome.status});return row.id;
   });
   running.set(row.id,{row,work});
  }
  if(running.size){const id=await Promise.race([...running.values()].map(item=>item.work));running.delete(id);}
  else if(pending.size)throw Error('Schedule made no progress');
 }
 return {budget,plan,events,outcomes,firstFailureMs,wallMs:performance.now()-start};
}
/** Deterministic preview; real admission also observes worker and conflict budgets. */
export function serialOrder(tasks){
 const plan=schedulePlan(tasks),done=new Set(),ordered=[];
 while(done.size<plan.length){const row=plan.filter(row=>!done.has(row.id)&&row.dependencies.every(id=>done.has(id))).sort((a,b)=>a.priority-b.priority||a.index-b.index)[0];done.add(row.id);ordered.push(row.id);}
 return ordered;
}
