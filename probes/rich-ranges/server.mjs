import {createServer} from 'vite';
const root=process.cwd();
const server=await createServer({configFile:false,root,cacheDir:process.env.EN_CAPABILITY_CACHE,optimizeDeps:{noDiscovery:true,include:[]},resolve:{alias:['elements','primitives','styles'].map(name=>({find:new RegExp('^@en-reve/'+name+'/(.*)\\.js$'),replacement:root+'/packages/'+name+(process.env.EN_CAPABILITY_BUILT?'/dist/$1.js':'/src/$1.ts')}))},server:{host:'127.0.0.1',port:Number(process.env.EN_CAPABILITY_PORT??4498),strictPort:true,fs:{allow:[root]}}});await server.listen();
