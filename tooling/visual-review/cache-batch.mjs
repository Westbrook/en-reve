/** Publish completed entries only after the run's source/runtime checks finish. */
export class CaptureCacheBatch {
 constructor(cache){this.cache=cache;this.entries=[];this.images=new Map();this.unstable=new Set();}
 stage(entry){
  if(entry.identity.kind==='rendering'&&entry.outcome==='passed'){
   const image=entry.artifacts.find(artifact=>artifact.mediaType==='image/png')?.digest;
   const prior=this.images.get(entry.identity.digest);
   if(prior&&prior!==image){this.unstable.add(entry.identity.digest);entry={...entry,outcome:'failed',result:{error:'Identical rendering inputs produced different pixels.',previous:prior,current:image}};}
   this.images.set(entry.identity.digest,image);
  }
  this.entries.push(entry);
 }
 async commit(){for(const entry of this.entries)await this.cache.writeCompleted(entry);}
}
