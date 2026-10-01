import {createServer} from 'vite';
const server=await createServer({root:process.cwd(),server:{host:'127.0.0.1',port:4497,strictPort:true},appType:'mpa'});
await server.listen();
