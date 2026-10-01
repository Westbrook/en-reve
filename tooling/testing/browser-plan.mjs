import { configurationAliases, proveConfigurationAlias } from './equivalence.mjs';

/** Only explicitly reviewed configuration relationships can change execution selection. */
export function browserReusePlan(tasks, discoveries, bindings) {
 const byConfig=new Map(tasks.map(task=>[task.config,task])), ordered=[],visiting=new Set(),visited=new Set();
 function visit(task) {
  if(visited.has(task.config))return;
  if(visiting.has(task.config))throw new Error('Browser alias dependency cycle');
  visiting.add(task.config);
  const producer=byConfig.get(configurationAliases.get(task.config));
  if(producer)visit(producer);
  visiting.delete(task.config);visited.add(task.config);ordered.push(task);
 }
 tasks.forEach(visit);
 return ordered.map(task=>{
  const producer=byConfig.get(configurationAliases.get(task.config));
  if(!producer)return {task,mode:'execute-full',reason:'No selected reviewed producer'};
  try {
   const proof=proveConfigurationAlias(task.config,producer.config,discoveries[task.id],discoveries[producer.id],{alias:bindings[task.id],producer:bindings[producer.id]});
   return {task,producer,proof,mode:proof.remaining.length?'execute-residual':'reference-producer'};
  }catch(error){return {task,mode:'execute-full',reason:String(error.message)};}
 });
}
/** A test-list optimization is accepted only when fresh resolved discovery selects exactly its residual IDs. */
export function verifyResidualSelection(expected, actual) {
 const ids=actual.selected.map(test=>test.id);
 if(ids.length!==new Set(ids).size || JSON.stringify([...expected].sort())!==JSON.stringify([...ids].sort()))throw new Error('Residual test-list changed the required selected cases; execute full configuration');
}
