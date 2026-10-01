import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = new URL('./build/',import.meta.url);
createServer(async (req,res) => {
 try {
  const pathname = new URL(req.url,'http://localhost').pathname;
  if (!/^\/[a-z0-9-]+\.(html|js|json)$/.test(pathname)) {res.writeHead(404).end();return;}
  const file = new URL('.'+pathname,root);
  res.setHeader('Content-Type',pathname.endsWith('.js')?'text/javascript':pathname.endsWith('.json')?'application/json':'text/html');
  res.end(await readFile(file));
 } catch { res.writeHead(404).end(); }
}).listen(4467,'127.0.0.1',()=>console.log('Framework consumers on http://127.0.0.1:4467/html.html'));
