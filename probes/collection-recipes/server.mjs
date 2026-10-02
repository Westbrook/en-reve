import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
const root=resolve(process.env.EN_COLLECTION_RECIPES_OUT??'artifacts/collection-recipes','site');
createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost');let path=decodeURIComponent(url.pathname);
 if(path==='/'||path==='/api-examples/virtual-collection.html')path='/table.html';
 else if(path==='/apps/docs/document-scroll.html')path='/document.html';
 const file=resolve(root,'.'+path);if(!file.startsWith(root+sep))throw Error('Outside fixture');
 res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.json':'application/json'})[extname(file)]??'text/html');res.setHeader('Cache-Control','no-store');res.end(await readFile(file));
}catch{res.writeHead(404).end();}}).listen(Number(process.env.EN_COLLECTION_RECIPES_PORT??4398),'127.0.0.1');
