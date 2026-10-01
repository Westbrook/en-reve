import { installInterruptionHandlers, finishExecution } from './interruption.mjs';
import { root } from './pathways.mjs';
import { withMachineOwner } from './machine-owner.mjs';
import { withExecutionOwner, recoverExecutionOwner } from './execution-owner.mjs';
const mode=process.argv[2];
if(mode==='recover-owner'){console.log(JSON.stringify(await recoverExecutionOwner(root),null,2));}
else {
 const modules={public:'./run-public-view.mjs',comprehensive:'./run-comprehensive.mjs',specialized:'./run-specialized.mjs'};
 if(!modules[mode])throw new Error('Choose public, comprehensive, specialized, or recover-owner');
 const invocation=[...process.argv];process.argv.splice(2,1);
 const run=()=>import(modules[mode]);
 const args=process.argv.slice(2),separator=args.indexOf('--');
 const plan=(separator<0?args:args.slice(0,separator)).includes('--plan');
 if(plan)await run();else {
  const dispose=installInterruptionHandlers();let failure;
  try{await withMachineOwner(ownership=>{process.env.EN_TEST_MACHINE_QUEUE_MS=String(ownership?.queueMs??0);return withExecutionOwner(root,run,{invocation});},{invocation,waitMs:Number(process.env.EN_TEST_MACHINE_WAIT_MS??60000)});}
  catch(error){failure=error;}
  try{await finishExecution(failure);}finally{dispose();}
 }
}
