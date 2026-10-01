import {createServer} from 'vite';
const root=new URL('../../',import.meta.url).pathname;
const server=await createServer({root,configFile:false,cacheDir:root+'node_modules/.cache/component-pattern-parts',optimizeDeps:{entries:[root+'probes/api-contracts/fixture.ts']},server:{host:'127.0.0.1',port:4499,strictPort:true}});await server.listen();
