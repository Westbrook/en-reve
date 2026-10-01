import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
export async function buildFixture({root,output}) {
 const {build,version}=await import('./toolchain.mjs');const out=output;await mkdir(join(out,'site'));
 const plugin={name:'isolated-source',setup(b){b.onResolve({filter:/^@en-reve\//},({path})=>({path:resolve(root,'packages',path.split('/')[1],'src',path.split('/').slice(2).join('/').replace(/\.js$/,'.ts'))}));}};
 const proofs={};
 // No historical measurements or comparison are copied into current-source qualification.
 for(const entry of ['api','disabled','ui']) {
  const result=await build({absWorkingDir:root,entryPoints:[`probes/registry-diagnostics/${entry}.ts`],outfile:join(out,'site',entry+'.js'),bundle:true,format:'esm',platform:'browser',target:'es2022',metafile:true,plugins:[plugin]});
  await writeFile(join(out,entry+'-metafile.json'),JSON.stringify(result.metafile,null,2),{flag:'wx'});
  const bytes=await readFile(join(out,'site',entry+'.js'));const inputs=[];
  for(const path of Object.keys(result.metafile.inputs))inputs.push({path,sha256:createHash('sha256').update(await readFile(resolve(root,path))).digest('hex')});
  proofs[entry]={bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),inputs};
 }
 if(proofs.disabled.inputs.some(p=>p.path.endsWith('/diagnostics.ts')))throw Error('Disabled graph contains diagnostic');
 const proof={schemaVersion:1,kind:'current-source-build',sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),node:process.version,esbuild:version,playwright:JSON.parse(await readFile(join(root,'node_modules/@playwright/test/package.json'))).version,typescript:JSON.parse(await readFile(join(root,'node_modules/typescript/package.json'))).version,disabledImportExclusion:true,proofs};
 await writeFile(join(out,'build-proof.json'),JSON.stringify(proof,null,2),{flag:'wx'});
 const html=(await readFile(join(root,'probes/registry-diagnostics/index.html'),'utf8')).replace('<a id="comparison" href="/comparison.html">Overhead evidence</a>','<p>Current-source conformance only. Timing and retention receipts remain historical.</p>');
 // Preserve the selector used by the fixture without offering an absent historical page.
 await writeFile(join(out,'site/index.html'),html.replace('<p>Current-source','<a id="comparison" hidden></a><p>Current-source'),{flag:'wx'});
 return proof;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){throw Error('Run qualify.mjs with a new EN_DIAGNOSTICS_OUT; build.mjs is an owned stage, not a historical writer.');}
