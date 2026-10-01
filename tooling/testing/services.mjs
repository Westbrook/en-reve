/** Lazy invocation-owned services. Contexts and pages still belong to each test. */
export class Services {
 constructor(factories){this.factories=factories;this.pending=new Map();this.events=[];}
 async get(name){
  if(!this.factories[name])throw Error('Unknown service: '+name);
  if(!this.pending.has(name)){
   const start=performance.now();
   const promise=Promise.resolve().then(()=>this.factories[name]()).then(service=>{this.events.push({name,event:'ready',readinessMs:performance.now()-start,url:service.url});return service;});
   this.pending.set(name,promise);
  }
  return this.pending.get(name);
 }
 async close(){const errors=[];for(const [name,promise]of [...this.pending].reverse()){try{const service=await promise;const start=performance.now();await service.close();this.events.push({name,event:'closed',cleanupMs:performance.now()-start});}catch(error){errors.push(error);}}this.pending.clear();if(errors.length)throw new AggregateError(errors,'Owned service cleanup failed');}
}
