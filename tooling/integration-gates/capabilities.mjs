// Record the public capability decision; this is provenance, not a second assertion suite.
import {createServer} from 'vite';
import {chromium,firefox,webkit} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const server=await createServer({cacheDir:resolve(process.env.EN_GATE_STAGE_OUTPUT,'tmp/vite'),server:{host:'127.0.0.1',port:0,strictPort:true},logLevel:'error'});
const results=[];
try {
 await server.listen();const port=server.httpServer.address().port;
 for(const [name,type] of Object.entries({chromium,firefox,webkit})) {
  let browser;
  try {browser=await type.launch();const page=await browser.newPage();await page.goto(`http://127.0.0.1:${port}/probes/scoped-registry/`);
   const capabilities=await page.evaluate(async()=>{
    const {elementScopeCapabilities,createElementScope}=await import('/packages/elements/dist/element-scope.js');
    const capabilities=elementScopeCapabilities(document);
    return {capabilities,requests:['auto','global'].map(requested=>({requested,actual:createElementScope({document,registry:requested}).registry===window.customElements?'global':'native'})),dormant:capabilities.dormant?'supported':'unsupported'};
   });results.push({browser:name,version:browser.version(),status:'recorded',...capabilities});
  }catch(error){results.push({browser:name,status:'failed',error:String(error)});process.exitCode=1;}
  finally {await browser?.close();}
 }
}finally{await server.close();await writeFile(resolve(process.env.EN_GATE_STAGE_OUTPUT,'capabilities.json'),JSON.stringify({results},null,2)+'\n');}
