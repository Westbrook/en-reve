import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { verifyFiles, readVerifiedFile, safePath } from '../offline-review/runtime.mjs';

export async function verifyVersionReview(root) {
  const manifest=JSON.parse(await readFile(resolve(root,'version-review.json'),'utf8'));
  if(manifest.schema!=='en-reve/version-review'||manifest.schemaVersion!==1||!Array.isArray(manifest.files))throw new Error('Invalid version review package');
  await verifyFiles(root,manifest.files,'version-review.json');
  for(const path of ['index.html','review.js','review.css','review.json','release.json','before/review-build.json','after/review-build.json'])if(!manifest.files.some(f=>f.path===path))throw new Error('Missing review entry: '+path);
  const review=JSON.parse(await readFile(resolve(root,'review.json'),'utf8'));
  if(review.digest!==manifest.reviewDigest)throw new Error('Review identity mismatch');
  return manifest;
}
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.jpg':'image/jpeg','.md':'text/plain; charset=utf-8'};
export async function startVersionReview(directory) {
  const root=resolve(directory), manifest=await verifyVersionReview(root), hashes=new Map(manifest.files.map(f=>[f.path,f.sha256]));
  const servers=[],origins={};
  async function start(side) {
    const server=createServer(async(req,res)=>{
      try {
        if(req.headers.host!==`127.0.0.1:${server.address().port}`){res.writeHead(403).end();return;}
        if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'}).end();return;}
        const path=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
        let bytes,file;
        if(side==='portal'&&path==='/session.json') {bytes=Buffer.from(JSON.stringify({before:origins.before,after:origins.after}));file='session.json';}
        else {
          const name=path.replace(/^\//,'').replace(/\/$/,'')||'index.html';safePath(name);
          if(side==='portal'&&!['index.html','review.js','review.css','review.json','release.json'].includes(name)&&!name.startsWith('scoped/')){res.writeHead(404).end();return;}
          file=side==='portal'?name:side+'/'+name;
          if(!hashes.has(file)&&side!=='portal'&&!extname(name))file+='.html';
          if(!hashes.has(file)){res.writeHead(404).end();return;}
          bytes=await readVerifiedFile(root,file,hashes.get(file));
        }
        const portal=side==='portal';
        res.writeHead(200,{'Content-Type':mime[extname(file)]??'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',
          'Content-Security-Policy':portal?`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-src ${origins.before} ${origins.after}; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`:`default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data: blob:; font-src 'self' data:; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self' ${origins.portal}`});
        res.end(req.method==='HEAD'?undefined:bytes);
      }catch {res.writeHead(409).end('Review package changed or request invalid.');}
    });
    await new Promise((done,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',done);});servers.push(server);
    origins[side]=`http://127.0.0.1:${server.address().port}`;
  }
  const close=()=>Promise.all(servers.map(server=>new Promise((done,reject)=>server.close(error=>error?reject(error):done()))));
  try {await start('portal');await start('before');await start('after');return {url:origins.portal,origins,close};}
  catch(error){await close();throw error;}
}
