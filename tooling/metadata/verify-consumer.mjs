import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {once} from 'node:events';
import {createServer} from 'node:http';
import {mkdir, readFile, writeFile, readdir, symlink, realpath} from 'node:fs/promises';
import {resolve, join, relative, sep, dirname} from 'node:path';
import {chromium, firefox, webkit, expect} from '@playwright/test';
import {build} from '../../showcases/performance/node_modules/esbuild/lib/main.js';
import {singlePackOutput} from '../test-pipeline/npm-pack.mjs';
import {checkboxConsumer} from './consumer-source.mjs';

const root=resolve(import.meta.dirname,'../..');
const output=resolve(process.env.EN_METADATA_CONSUMER_OUTPUT ?? join(process.env.EN_TEST_PIPELINE_OUTPUT ?? join(root,'artifacts'),'metadata-consumer'));
await mkdir(dirname(output),{recursive:true});
await mkdir(output,{recursive:false});
const stage=join(output,'consumer'), site=join(output,'site'), tarballs=join(output,'tarballs');
for(const directory of [stage,site,tarballs,join(stage,'node_modules')])await mkdir(directory,{recursive:true});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const packages=[], cases=[];
const receipt={schemaVersion:1,status:'running',startedAt:new Date().toISOString(),node:process.version,packages,cases,
  scope:'One CEM-discovered checkbox consumer generated from packed public artifacts. Not full-library, full schema, retail-browser or manual accessibility qualification.'};
const persist=()=>writeFile(join(output,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');
let server;
try {
  for(const name of ['elements','primitives','styles','tokens']) {
    const packed=singlePackOutput(execFileSync('npm',['pack','--ignore-scripts','--offline','--workspaces=false','--json','--pack-destination',tarballs,'--cache',join(output,'npm-cache')],{cwd:join(root,'packages',name),encoding:'utf8'}),'@en-reve/'+name);
    const destination=join(stage,'node_modules/@en-reve',name);await mkdir(destination,{recursive:true});
    execFileSync('tar',['-xzf',join(tarballs,packed.filename),'-C',destination,'--strip-components=1']);
    packages.push({name:'@en-reve/'+name,integrity:packed.integrity,shasum:packed.shasum,sha256:hash(await readFile(join(tarballs,packed.filename)))});
  }
  // Only third-party dependencies use the pinned installation. Every @en-reve
  // import and declaration resolves within the newly unpacked consumer.
  for(const name of await readdir(join(root,'node_modules')))if(name!=='@en-reve'&&!name.startsWith('.'))await symlink(join(root,'node_modules',name),join(stage,'node_modules',name));
  await writeFile(join(stage,'package.json'),'{"type":"module"}\n');
  const files={manifest:'custom-elements.json',graph:'public-api.json',types:'public-types.json'},bundle={};
  receipt.metadata={};
  for(const [key,file] of Object.entries(files)) {
    const bytes=await readFile(join(stage,'node_modules/@en-reve/elements',file));
    bundle[key]=JSON.parse(bytes);receipt.metadata[key]={file,sha256:hash(bytes)};
  }
  const generated=checkboxConsumer(bundle);
  receipt.discovery={query:'writable checked:boolean, name:string, en-change and label slot',results:generated.discovered,selected:generated.retrieved};
  await writeFile(join(output,'retrieved-api.json'),JSON.stringify(generated.retrieved,null,2)+'\n');
  await writeFile(join(stage,'consumer.ts'),generated.source);await writeFile(join(site,'index.html'),generated.html);
  receipt.generated={sourceSHA256:hash(generated.source),htmlSHA256:hash(generated.html)};
  const compiler=join(root,'node_modules/typescript/bin/tsc');
  const typeArgs=['--ignoreConfig','--strict','--noEmit','--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext','--skipLibCheck'];
  const listed=execFileSync(process.execPath,[compiler,...typeArgs,'--listFiles','consumer.ts'],{cwd:stage,encoding:'utf8'});
  await writeFile(join(output,'type-files.txt'),listed);
  const ownTypes=listed.trim().split('\n').filter(file=>file.includes('/@en-reve/'));
  assert(ownTypes.length>0,'Compiler must consume actual public declarations');
  for(const file of ownTypes)assert((await realpath(file)).startsWith(join(stage,'node_modules/@en-reve')+sep),'Declaration escaped packed installation: '+file);
  const negative=`import type {${generated.retrieved.className}} from ${JSON.stringify(generated.retrieved.classImport)};\nconst field: ${generated.retrieved.className}=document.createElement(${JSON.stringify(generated.retrieved.tagName)});\nfield.checked='not a boolean';\nfield.unknownConsumerProperty=true;\n`;
  await writeFile(join(stage,'negative.ts'),negative);
  let negativeOutput='',negativeExitCode;
  try {execFileSync(process.execPath,[compiler,...typeArgs,'negative.ts'],{cwd:stage,encoding:'utf8',stdio:['ignore','pipe','pipe']});assert.fail('Invalid consumer types unexpectedly compiled');}
  catch(error){negativeOutput=String(error.stdout);negativeExitCode=error.status;await writeFile(join(output,'negative-types.txt'),negativeOutput);assert([1,2].includes(error.status),'Expected compiler diagnostics, not a launch/signal failure');assert.match(negativeOutput,/TS2322/);assert.match(negativeOutput,/TS2339/);assert.equal([...negativeOutput.matchAll(/error TS\d+/g)].length,2);}
  await writeFile(join(output,'negative-types.txt'),negativeOutput);
  receipt.types={status:'passed',packedDeclarations:ownTypes.map(file=>relative(stage,file)),negativeDiagnostics:['TS2322','TS2339'],negativeExitCode};
  const built=await build({entryPoints:[join(stage,'consumer.ts')],outfile:join(site,'consumer.js'),bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,metafile:true});
  const inputs=Object.keys(built.metafile.inputs);
  assert(inputs.some(file=>file.includes('elements/dist/define/checkbox.js')));
  assert(!inputs.some(file=>/elements\/dist\/(catalog|index)\.js|\/packages\/[^/]+\/src\//.test(file)),'Broad catalog or workspace source entered the consumer');
  for(const input of inputs.filter(file=>file.includes('/@en-reve/')))assert((await realpath(resolve(root,input))).startsWith(join(stage,'node_modules/@en-reve')+sep));
  receipt.production={minified:true,format:'esm',inputCount:inputs.length,inputs,jsSHA256:hash(await readFile(join(site,'consumer.js')))};
  await writeFile(join(output,'metafile.json'),JSON.stringify(built.metafile,null,2)+'\n');
  server=createServer(async(req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname;if(!['/','/index.html','/consumer.js'].includes(path)){res.writeHead(404).end();return;}res.setHeader('Content-Type',path.endsWith('.js')?'text/javascript':'text/html');res.setHeader('Cache-Control','no-store');res.end(await readFile(join(site,path.endsWith('.js')?'consumer.js':'index.html')));}catch{res.writeHead(500).end();}});
  server.listen(0,'127.0.0.1');await once(server,'listening');const url=`http://127.0.0.1:${server.address().port}`;
  for(const [engine,type] of Object.entries({chromium,firefox,webkit})) {
    const browser=await type.launch();
    try {
      for(const scenario of ['discovered-contract','transaction-and-form','silent-authority-and-reset']) {
        const row={engine,version:browser.version(),scenario,status:'running',errors:[]};cases.push(row);await persist();
        const page=await browser.newPage();page.setDefaultTimeout(10000);
        page.on('pageerror',error=>row.errors.push(error.message));
        await page.addInitScript(()=>{window.registeredTags=[];const define=customElements.define;customElements.define=function(name,constructor,options){const value=define.call(this,name,constructor,options);window.registeredTags.push(name);return value;};});
        try {
          assert.equal((await page.goto(url)).status(),200);await expect(page.locator('html')).toHaveAttribute('data-ready','true');
          const control=page.getByRole('checkbox',{name:'Include project',exact:true});
          const snapshot=()=>page.evaluate(()=>window.consumer.snapshot());
          await expect(control).toBeChecked();
          assert.deepEqual(await page.evaluate(()=>window.registeredTags),[...generated.retrieved.dependencies,generated.retrieved.tagName]);
          if(scenario==='discovered-contract') {
            await expect(control).toHaveAccessibleDescription('Shared with the project team');
            await expect(control).toHaveCSS('outline-color','rgb(101, 31, 121)');
            await expect(control).toHaveCSS('outline-width','3px');
            assert.deepEqual(await snapshot(),{checked:true,defaultChecked:true,disabled:false,data:'accepted',observations:[]});
            await page.getByRole('button',{name:'Submit choice',exact:true}).click();await expect(page.locator('output')).toHaveText('accepted');
          } else if(scenario==='transaction-and-form') {
            await control.click();await expect(control).not.toBeChecked();
            let state=await snapshot();assert.equal(state.data,null);assert.deepEqual(state.observations,[{previous:true,proposed:false,checked:false,data:null,bubbles:true,composed:true,cancelable:true}]);
            await page.getByRole('button',{name:'Reject next change',exact:true}).click();await expect(control).toBeFocused();await control.press('Space');await expect(control).not.toBeChecked();await expect(control).toBeFocused();
            state=await snapshot();assert.equal(state.data,null);assert.equal(state.observations.length,2);assert.deepEqual(state.observations[1],{previous:false,proposed:true,checked:true,data:'accepted',bubbles:true,composed:true,cancelable:true});
            await control.press('Space');await expect(control).toBeChecked();state=await snapshot();assert.equal(state.data,'accepted');assert.equal(state.observations.length,3);
          } else {
            await page.getByRole('button',{name:'Write unchecked',exact:true}).click();await expect(control).not.toBeChecked();assert.deepEqual((await snapshot()).observations,[]);
            await page.getByRole('button',{name:'Reset choice',exact:true}).click();await expect(control).toBeChecked();assert.deepEqual((await snapshot()).observations,[]);
            await page.getByRole('button',{name:'Toggle disabled',exact:true}).click();await expect(control).toBeDisabled();assert.equal((await snapshot()).data,null);
            await page.getByRole('button',{name:'Toggle disabled',exact:true}).click();await expect(control).toBeEnabled();assert.equal((await snapshot()).data,'accepted');assert.deepEqual((await snapshot()).observations,[]);
          }
          row.final=await snapshot();assert.deepEqual(row.errors,[]);row.status='passed';
        } catch(error){row.status='failed';row.failure=error.stack;throw error;}
        finally{await page.close();await persist();}
      }
    } finally{await browser.close();}
  }
  assert.equal(cases.length,9);assert(cases.every(row=>row.status==='passed'));receipt.status='passed';
} catch(error){receipt.status='failed';receipt.failure=error.stack;throw error;}
finally {if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}receipt.finishedAt=new Date().toISOString();await persist();console.log(JSON.stringify({output,status:receipt.status,cases:cases.length,passed:cases.filter(row=>row.status==='passed').length}));}
