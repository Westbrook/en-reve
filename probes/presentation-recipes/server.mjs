import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
const root=resolve(process.env.EN_PRESENTATION_RECIPES_OUT??'artifacts/presentation-recipes','site');
createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=resolve(root,'.'+(path==='/'?'/index.html':path));if(!file.startsWith(root+sep))throw Error('Outside fixture');res.setHeader('Content-Type',extname(file)==='.js'?'text/javascript':extname(file)==='.css'?'text/css':extname(file)==='.svg'?'image/svg+xml':extname(file)==='.txt'?'text/plain':'text/html');res.setHeader('Cache-Control','no-store');res.end(await readFile(file));}catch{res.writeHead(404).end();}}).listen(Number(process.env.EN_PRESENTATION_RECIPES_PORT??4405),'127.0.0.1');
