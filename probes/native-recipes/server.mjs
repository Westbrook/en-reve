import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
const root=resolve(process.env.EN_NATIVE_RECIPES_OUT??'artifacts/native-recipes','site');
createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost');let path=decodeURIComponent(url.pathname);
 if(/^\/(content-lit|content-css)\/fixture$/.test(path))path='/'+path.split('/')[1]+'-'+url.searchParams.has('loading')+'.html';
 else if(/^\/navigation-(lit|css)\/fixture$/.test(path)){
  const mode=['single','nested','two'].includes(url.searchParams.get('mode'))?url.searchParams.get('mode'):'single';
  path=`/${path.split('/')[1]}-${mode}-${url.searchParams.get('dir')==='rtl'?'rtl':'ltr'}.html`;
 }else if(path==='/packages/tokens/dist/index.js'){res.writeHead(302,{Location:'/assets/tokens.js'}).end();return;} // Existing test's app-served token URL, now backed by the isolated public bundle.
 else if(path==='/')path='/navigation-css-single-ltr.html';
 const file=resolve(root,'.'+path);if(!file.startsWith(root+sep))throw Error('Outside fixture');
 res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.json':'application/json'})[extname(file)]??'text/html');res.setHeader('Cache-Control','no-store');res.end(await readFile(file));
}catch{res.writeHead(404).end();}}).listen(Number(process.env.EN_NATIVE_RECIPES_PORT??4399),'127.0.0.1');
