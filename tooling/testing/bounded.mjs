/** One explicit process budget; stop scheduling after failure, await every already-owned child. */
export async function boundedMap(items, limit, run) {
 if(!Number.isInteger(limit)||limit<1||limit>3)throw new Error('Worker budget must be an integer from 1 to 3');
 const results=new Array(items.length);let next=0,error;
 await Promise.all(Array.from({length:Math.min(limit,items.length)},async()=>{
  while(!error&&next<items.length) {const index=next++;try{results[index]=await run(items[index],index);}catch(cause){error??=cause;}}
 }));
 if(error)throw error;return results;
}
