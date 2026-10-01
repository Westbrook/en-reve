import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
const root=resolve(process.env.EN_CONSUMER_CONTRACTS_OUT ?? 'artifacts/scoped-followup-consumer-contracts','site');
createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+sep))throw Error();res.setHeader('Content-Type',extname(file)==='.js'?'text/javascript':'text/html');res.setHeader('Cache-Control','no-store');res.end(await readFile(file));}catch{res.writeHead(404).end();}}).listen(4257,'127.0.0.1');
