// Explicitly reviewed servers: separate fixture-local caches and runtime instances.
// Everything else remains exclusive until its port/cache/mutation contract is known.
const caches=new Map([
 ['packages/primitives/tests/navigation/playwright.config.ts','packages/primitives/tests/navigation/.vite'],
 ['packages/elements/src/navigation/tests/playwright.config.ts','packages/elements/src/navigation/tests/.vite'],
 ['packages/elements/src/combobox/tests/playwright.config.ts','packages/elements/src/combobox/tests/.vite'],
]);
export function browserResources(task,discovery,budget,{serial=false}={}){
 if(serial||!caches.has(task.config))return {slots:budget,exclusive:true,reason:serial?'Explicit serial comparison':'Unresolved cross-configuration resource contract'};
 const servers=discovery.webServer??[];
 if(!Array.isArray(servers)||!servers.length||servers.some(server=>!server.url||server.reuseExistingServer!==false))return {slots:budget,exclusive:true,reason:'Server identity or exclusive ownership unresolved'};
 const locks=['cache:'+caches.get(task.config)];
 for(const server of servers){const url=new URL(server.url);if(!['127.0.0.1','localhost'].includes(url.hostname))return {slots:budget,exclusive:true,reason:'Non-loopback server'};locks.push('tcp:'+url.port);}
 return {slots:budget,exclusive:false,locks,reason:'Reviewed fixture-local cache, independently owned loopback server and config-specific evidence; preserve resolved lower worker cap'};
}
