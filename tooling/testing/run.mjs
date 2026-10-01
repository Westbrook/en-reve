import { publicGraph, selectTasks } from './pathways.mjs';

const args=process.argv.slice(2);
const requested=(args.find(arg=>arg.startsWith('--pathways='))?.split('=')[1]??'api,release,theme').split(',');
for(const arg of args) if(arg!=='--plan'&&!arg.startsWith('--pathways=')) throw new Error(`Unknown option: ${arg}`);
if(!args.includes('--plan'))throw new Error('The legacy execution runner is retired. Use node tooling/testing/invoke.mjs comprehensive --pathways='+requested.join(','));
const graph=await publicGraph(), selected=selectTasks(graph,requested);
if(args.includes('--plan')) {
 await new Promise((resolve,reject)=>process.stdout.write(JSON.stringify({...graph,requested,selected:selected.map(task=>task.id)},null,2)+'\n',error=>error?reject(error):resolve()));
 process.exit(0);
}
