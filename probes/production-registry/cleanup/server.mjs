import {createSecureServer} from 'node:http2';
import {readFile,mkdtemp} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {gzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
let tls;
async function certificate(){if(!tls)tls=(async()=>{const dir=await mkdtemp(resolve(tmpdir(),'en-production-tls-')),key=resolve(dir,'key.pem'),cert=resolve(dir,'cert.pem');execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',key,'-out',cert,'-days','2','-subj','/CN=localhost'],{stdio:'ignore'});return {key:await readFile(key),cert:await readFile(cert)};})();return tls;}
export async function serve(phase,port=0){
 const root=resolve(import.meta.dirname,phase==='control'?'../../../artifacts/scoped-registry-production-v1/phase-3/site':'../../../artifacts/scoped-registry-phase-3-cleanup/candidate/site'),cache=new Map();
 // Precompress executable assets and the measured document outside browser timings.
 const receipt=JSON.parse(await readFile(resolve(root,'../receipt.json')));
 for(const asset of receipt.assets.filter(a=>/\.(js|css)$/.test(a.path)||a.path==='workflows/settings.html')){const file=resolve(root,asset.path),raw=await readFile(file);cache.set(file,{raw,gzip:gzipSync(raw,{level:6})});}
 const server=createSecureServer({...await certificate(),allowHTTP1:true},async(req,res)=>{try{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/favicon.ico'){res.writeHead(204).end();return;}
  const file=resolve(root,'.'+decodeURIComponent(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+'/'))throw Error('path');
  if(!cache.has(file)){const raw=await readFile(file);cache.set(file,{raw,gzip:gzipSync(raw,{level:6})});}
  const {raw,gzip}=cache.get(file),compressed=/\bgzip\b/.test(req.headers['accept-encoding']??'')&&/\.(js|css|html|json|svg)$/.test(file),bytes=compressed?gzip:raw;
  res.writeHead(200,{'content-type':({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png'})[extname(file)]??'application/octet-stream','content-length':bytes.length,'cache-control':file.endsWith('.html')?'no-cache':'public,max-age=31536000,immutable','vary':'Accept-Encoding',...(compressed?{'content-encoding':'gzip'}:{})});res.end(bytes);
 }catch(error){res.writeHead(404).end('Not found');}});
 await new Promise(r=>server.listen(port,'127.0.0.1',r));return {server,url:`https://127.0.0.1:${server.address().port}`,close:()=>new Promise(r=>server.close(r))};
}
if(process.argv[1]===new URL(import.meta.url).pathname){const s=await serve(Number(process.argv[2]??3),Number(process.argv[3]??4205));console.log(s.url);}
