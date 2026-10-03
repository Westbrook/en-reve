import {readFile,readdir,stat,realpath} from 'node:fs/promises';
import {join} from 'node:path';
import os from 'node:os';
import {digestBytes,digestJson} from '../evidence/identity.ts';
export async function fontInventory() {
 const roots=process.platform==='darwin'?['/System/Library/Fonts','/Library/Fonts',join(os.homedir(),'Library/Fonts')]:process.platform==='win32'?[join(process.env.WINDIR??'C:\\Windows','Fonts')]:['/usr/share/fonts','/usr/local/share/fonts',join(os.homedir(),'.fonts'),join(os.homedir(),'.local/share/fonts')];
 const files={};let complete=true;
 const seen=new Set();
 async function walk(path) {
  let entries;
  try{const actual=await realpath(path);if(seen.has(actual))return;seen.add(actual);}catch(e){if(e.code!=='ENOENT')complete=false;return;}try{entries=await readdir(path,{withFileTypes:true});}catch(e){if(e.code!=='ENOENT')complete=false;return;}
  for(const entry of entries){const file=join(path,entry.name);try{const s=await stat(file);if(s.isDirectory())await walk(file);else if(s.isFile()&&/\.(ttf|otf|ttc|otc|dfont|woff2?)$/i.test(entry.name))files[file]=digestBytes(await readFile(file));}catch{complete=false;}}
 }
 for(const path of roots)await walk(path);
 return {digest:digestJson(files),files,complete:complete&&Object.keys(files).length>0};
}
export async function environmentIdentity(browser,browserType,fonts,runtime) {
 return {engine:browserType.name(),version:browser.version(),installedDistributions:runtime.digest,playwright:JSON.parse(await readFile(new URL('../../node_modules/playwright-core/package.json',import.meta.url),'utf8')).version,platform:os.platform(),release:os.release(),versionOS:os.version(),architecture:os.arch(),cpu:os.cpus()[0]?.model??'unknown',node:process.version,fonts:fonts.digest,fontsComplete:fonts.complete,launch:'Playwright bundled engine, headless, default arguments'};
}
