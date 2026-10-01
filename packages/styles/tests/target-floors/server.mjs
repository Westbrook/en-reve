import {createServer} from 'vite';
const root=new URL('../../../../',import.meta.url).pathname;
const server=await createServer({root,configFile:false,cacheDir:`${root}/node_modules/.cache/en-api07-target-floors`,server:{host:'127.0.0.1',port:47827,strictPort:true}});
await server.listen();
