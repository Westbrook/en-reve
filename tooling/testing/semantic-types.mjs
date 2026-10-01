import {spawnSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {maintainedFiles} from './workload.mjs';
import {root} from './pathways.mjs';
export function diagnostics(output,{rootDirectory}={}){
 if(rootDirectory)output=output.replaceAll(rootDirectory.replaceAll('\\','/').replace(/\/+$/,'')+'/', '<root>/');
 const rows=output.replaceAll('\r\n','\n').trim().split('\n'),entries=[];
 for(const row of rows){
  if(/^.+\(\d+,\d+\): error TS\d+:/.test(row)||/^error TS\d+:/.test(row))entries.push(row);
  else if(row.trim()&&entries.length)entries[entries.length-1]+='\n'+row;
  else if(row.trim())throw Error('Unrecognized compiler diagnostic: '+row);
 }
 return entries.sort();
}
export function compareDiagnostics(actual,baseline){
 const counts=rows=>{const map=new Map();for(const row of rows)map.set(row,(map.get(row)??0)+1);return map;};
 const a=counts(actual),b=counts(baseline),added=[],resolved=[];
 for(const [row,count]of a)for(let n=b.get(row)??0;n<count;n++)added.push(row);
 for(const [row,count]of b)for(let n=a.get(row)??0;n<count;n++)resolved.push(row);
 return {added,resolved,passed:!added.length&&!resolved.length};
}
export async function semanticTypes({writeBaseline=false,scope='core'}={}){
 if(!['core','docs'].includes(scope))throw Error('Unknown semantic type scope');
 const files=(await maintainedFiles()).filter(file=>/\.[cm]?ts$/.test(file)&&!file.startsWith('showcases/')&&!file.includes('/vendor/')&&!file.includes('/fixtures/')&&!file.endsWith('consumer.types.ts')&&(file.startsWith('tooling/')||/\.(?:test|spec)\.[cm]?ts$/.test(file)||/config\.[cm]?ts$/.test(file))).filter(file=>scope==='docs'?file.startsWith('apps/docs/'):!file.startsWith('apps/docs/'));
 const command=['node_modules/typescript/bin/tsc','--ignoreConfig','--strict','--noEmit','--skipLibCheck','--allowJs','--allowImportingTsExtensions','--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext',...(scope==='docs'?['packages/elements/dist/index.d.ts']:[]),...files];
 const result=spawnSync(process.execPath,command,{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024});
 if(result.error||result.signal||![0,1,2].includes(result.status))throw result.error??Error('Semantic compiler did not complete: '+result.signal+' '+result.stderr);
 const actual=diagnostics(result.stdout+result.stderr,{rootDirectory:root});
 if(result.status!==0&&!actual.length)throw Error('Compiler failed without recognized diagnostics');
 const path=resolve(root,`tooling/testing/semantic-types-${scope}-baseline.json`);
 if(writeBaseline){const data={schemaVersion:1,compiler:JSON.parse(await readFile(resolve(root,'node_modules/typescript/package.json'),'utf8')).version,selection:files,diagnostics:actual,policy:'Existing diagnostics only, exact messages and locations. New/resolved diagnostics require a reviewed baseline edit. No source file is ignored because it currently has errors. Isolated showcase installations own their separate type environments.'};await writeFile(path,JSON.stringify(data,null,2)+'\n');return data;}
 const baseline=JSON.parse(await readFile(path,'utf8'));
 const diff=compareDiagnostics(actual,baseline.diagnostics);
 // New files are always checked; compiler upgrades require an explicit baseline review.
 if(baseline.compiler!==JSON.parse(await readFile(resolve(root,'node_modules/typescript/package.json'),'utf8')).version)throw Error('Compiler version changed; review semantic baseline');
 console.log(JSON.stringify({kind:'semantic-test-config-tooling-types',scope,files:files.length,existingDiagnostics:actual.length,...diff},null,2));
 if(!diff.passed)process.exitCode=1;
 return {...diff,files,diagnostics:actual};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);if(args.some(arg=>arg!=='--write-baseline'&&!/^--scope=(core|docs)$/.test(arg)))throw Error('Unknown semantic type option');await semanticTypes({writeBaseline:args.includes('--write-baseline'),scope:args.find(arg=>arg.startsWith('--scope='))?.split('=')[1]??'core'});
}
