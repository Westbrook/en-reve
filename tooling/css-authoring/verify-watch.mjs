// Exercise the real CLI in a disposable workspace, never mutate developer sources.
import {mkdtemp,cp,readFile,writeFile,mkdir,readdir,symlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const source=fileURLToPath(new URL('../../',import.meta.url));
const root=await mkdtemp(join(tmpdir(),'theme07-cli-'));
let child,log='';
try{
 await mkdir(join(root,'packages'),{recursive:true});
 for(const pkg of ['tokens','styles']){
  await mkdir(join(root,'packages',pkg));
  await cp(join(source,'packages',pkg,'package.json'),join(root,'packages',pkg,'package.json'));
 }
 for(const path of ['packages/tokens/dist','packages/styles/src','packages/styles/scripts','packages/styles/tsconfig.json','packages/styles/css-authoring.json','tsconfig.base.json'])await cp(join(source,path),join(root,path),{recursive:true});
 await writeFile(join(root,'package.json'),JSON.stringify({private:true,type:'module',workspaces:['packages/*']}));
 await mkdir(join(root,'tooling'));await symlink(join(source,'tooling/css-authoring'),join(root,'tooling/css-authoring'),'dir');
 await mkdir(join(root,'node_modules/@en-reve'),{recursive:true});
 for(const pkg of ['tokens','styles'])await symlink(join(root,'packages',pkg),join(root,'node_modules/@en-reve',pkg),'dir');
 for(const entry of await readdir(join(source,'node_modules'))){if(entry==='@en-reve'||entry==='.cache')continue;await symlink(join(source,'node_modules',entry),join(root,'node_modules',entry));}
 const file=join(root,'packages/styles/src/css/typography.css'),original=await readFile(file,'utf8');
 const tokenFile=join(root,'packages/tokens/dist/defaults.js'),tokenOriginal=await readFile(tokenFile,'utf8');
 child=spawn(process.execPath,['packages/styles/scripts/watch-css.mjs'],{cwd:root,stdio:['ignore','pipe','pipe']});
 child.stdout.on('data',chunk=>log+=chunk);child.stderr.on('data',chunk=>log+=chunk);
 const wait=async(successes,failures=0)=>{const end=Date.now()+30000;while((log.match(/consumer artifacts refreshed/g)||[]).length<successes||(log.match(/fix the source to resume/g)||[]).length<failures){if(child.exitCode!==null||Date.now()>end)throw Error(log);await new Promise(r=>setTimeout(r,50));}};
 const output=join(root,'packages/styles/dist/typography.css');
 await wait(1);
 await writeFile(file,original+'\n.en-cli-probe { color: red; content: "` ${literal}"; }\n');await wait(2);assert.match(await readFile(output,'utf8'),/en-cli-probe/);
 const imported=await import(pathToFileURL(join(root,'packages/styles/dist/typography.js')));assert.ok(imported.typographyStyles.cssText.includes('content: "` ${literal}"')); 
 await writeFile(file,'.a { color: --token(--en-unknown); }');await wait(2,1);await assert.rejects(readFile(output),{code:'ENOENT'});
 await writeFile(file,original);await wait(3,1);assert.doesNotMatch(await readFile(output,'utf8'),/en-cli-probe/);
 await writeFile(tokenFile,tokenOriginal.replace('export function defaultCSSValue(name) {','export function defaultCSSValue(name) { if(name === "--en-color-text") return "rgb(1 2 3)";'));
 await wait(4,1);assert.match(await readFile(output,'utf8'),/var\(--en-color-text, rgb\(1 2 3\)\)/);
 await writeFile(tokenFile,tokenOriginal);await wait(5,1);assert.doesNotMatch(await readFile(output,'utf8'),/rgb\(1 2 3\)/);
 console.log('CLI watch: initial build, CSS edit, failed-build invalidation, recovery, token dependency refresh and restore passed.');
}finally{
 if(child&&child.exitCode===null){child.kill('SIGTERM');await new Promise(resolve=>child.once('exit',resolve));}
 await rm(root,{recursive:true,force:true});
}
