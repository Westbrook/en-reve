import {readFile, writeFile, mkdir, readdir} from 'node:fs/promises';
import {existsSync, realpathSync} from 'node:fs';
import {resolve, relative, dirname, sep} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {ts, compilerIdentity} from '../metadata/compiler-api.mjs';
import {inspectCustomizationSource} from '../customization/source-inventory.mjs';
import {readAuthoredSpecimens} from '../../apps/docs/scripts/authored-specimen-sources.mjs';
import {digestBytes, digestJson} from './identity.ts';
import {selectAffected} from './graph.ts';

const defaultRoot=fileURLToPath(new URL('../..',import.meta.url));
const unique=values=>[...new Set(values)].sort();
const property=name=>'property:'+name;

/** Runtime imports, including literal lazy imports. Type-only imports are not paint dependencies. */
export function runtimeImports(file,code){
  const source=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true);
  if(source.parseDiagnostics.length)throw new Error('Invalid source: '+file);
  const imports=[],gaps=[];
  function visit(node){
    if(ts.isImportDeclaration(node)){
      const clause=node.importClause;
      if(!clause?.isTypeOnly && (!clause || clause.name || !clause.namedBindings || !ts.isNamedImports(clause.namedBindings) || clause.namedBindings.elements.some(e=>!e.isTypeOnly)))imports.push(node.moduleSpecifier.text);
    }else if(ts.isExportDeclaration(node)&&node.moduleSpecifier&&!node.isTypeOnly){
      if(!node.exportClause||!ts.isNamedExports(node.exportClause)||node.exportClause.elements.some(e=>!e.isTypeOnly))imports.push(node.moduleSpecifier.text);
    }else if(ts.isCallExpression(node)&&(node.expression.kind===ts.SyntaxKind.ImportKeyword||node.expression.getText(source)==='require')){
      if(node.arguments.length===1&&ts.isStringLiteralLike(node.arguments[0]))imports.push(node.arguments[0].text);
      else gaps.push('Nonliteral runtime import in '+file);
    }
    ts.forEachChild(node,visit);
  }
  visit(source);return {imports:unique(imports),gaps};
}

/** Potential source impact, not an assertion that every dependent changes visually. */
export async function generateImpact({root=defaultRoot}={}){
  root=realpathSync(root);const nodes=new Map(),inputs={},gaps=[],referenceEvidence={},sourceQueue=[],queued=new Set();
  const normalize=file=>relative(root,file).split(sep).join('/');
  const read=async path=>{const bytes=await readFile(resolve(root,path));inputs[path]=digestBytes(bytes);return bytes.toString();};
  const json=async path=>JSON.parse(await read(path));
  const manifest=await json('packages/tokens/dist/manifest.json');
  const api=await json('packages/elements/public-api.json');
  const authoring=await json('packages/styles/css-authoring.json');
  await read('package-lock.json');await read('tsconfig.base.json');
  for(const path of ['tooling/evidence/impact.mjs','tooling/evidence/graph.ts','tooling/evidence/graph-core.ts','tooling/customization/source-inventory.mjs','apps/docs/scripts/authored-specimen-sources.mjs','apps/docs/scripts/specimen-sources.mjs'])await read(path);
  const add=(id,kind,dependencies=[],complete=true)=>{
    const old=nodes.get(id);nodes.set(id,{id,kind,dependencies:unique([...(old?.dependencies??[]),...dependencies]),complete:(old?.complete??true)&&complete});return id;
  };
  const source=(path)=>{
    path=normalize(resolve(root,path));
    if(path.startsWith('../'))throw new Error('Source outside workspace: '+path);
    if(!queued.has(path)){queued.add(path);sourceQueue.push(path);}
    return 'source:'+path;
  };
  for(const [id,token] of Object.entries(manifest.tokens)){
    add('token:'+id,'token',unique([...(token.dependencies??[]),...(token.potentialDependencies??[])]).map(x=>'token:'+x));
    add(property(token.cssName),'style',['token:'+id]);
  }
  for(const hook of manifest.customization){
    add(property(hook.cssName),'style',[...(hook.tokenId?['token:'+hook.tokenId]:[]),...(hook.fallback?.tokenIds??[]).map(x=>'token:'+x),...(hook.fallback?.cssNames??[]).map(property)]);
  }
  const allProperties=[...nodes.keys()].filter(id=>id.startsWith('property:'));
  const packageSources=new Map();
  for(const name of ['tokens','styles','primitives','elements'])packageSources.set('@en-reve/'+name,await json('packages/'+name+'/package.json'));
  const compilerOptions={moduleResolution:ts.ModuleResolutionKind.NodeNext,module:ts.ModuleKind.NodeNext,target:ts.ScriptTarget.Latest,allowJs:true};
  function resolveImport(specifier,from){
    const owner=[...packageSources.keys()].find(name=>specifier===name||specifier.startsWith(name+'/'));
    if(owner){
      const suffix=specifier.slice(owner.length),key=suffix?'.'+suffix:'.',pkg=packageSources.get(owner);
      let value=pkg.exports[key];
      if(!value)for(const [pattern,target] of Object.entries(pkg.exports))if(pattern.includes('*')){
        const [start,end]=pattern.split('*');if(key.startsWith(start)&&key.endsWith(end)){const part=key.slice(start.length,key.length-end.length||undefined);value=typeof target==='string'?target.replaceAll('*',part):Object.fromEntries(Object.entries(target).map(([k,v])=>[k,v.replaceAll('*',part)]));break;}
      }
      const target=typeof value==='string'?value:(value?.import??value?.default);
      if(!target)throw new Error('Unknown runtime package export '+specifier);
      const base='packages/'+owner.slice('@en-reve/'.length)+'/';
      // Inspect authored modules. Generated CSS adapters have explicit authoring edges below.
      let path=base+target.replace(/^\.\/dist\//,'src/').replace(/\.js$/,'.ts');
      if(!existsSync(resolve(root,path)))path=base+target.replace(/^\.\//,'');
      return {path};
    }
    if(!specifier.startsWith('.'))return {external:specifier};
    const file=ts.resolveModuleName(specifier,resolve(root,from),compilerOptions,ts.sys).resolvedModule?.resolvedFileName;
    if(!file)return {gap:'Unresolved import '+specifier+' in '+from};
    let path=normalize(file).replace(/^(packages\/[^/]+)\/dist\/(.*)\.d\.ts$/,'$1/src/$2.ts');
    if(path.startsWith('../')||path.includes('node_modules/'))return {external:specifier};
    return {path};
  }
  const assets=[];
  async function collectAssets(directory){
    for(const entry of await readdir(resolve(root,directory),{withFileTypes:true})){
      const path=directory+'/'+entry.name;
      if(entry.isSymbolicLink())throw new Error('Public asset links need explicit identity: '+path);
      if(entry.isDirectory())await collectAssets(path);
      else if(entry.isFile()){await read(path);assets.push(add('asset:'+path,'asset'));}
    }
  }
  await collectAssets('apps/docs/public');
  add('assets:docs','asset',assets);
  const components=api.components.map(component=>({tagName:component.tagName,source:component.source}));
  for(const component of api.components)add('component:'+component.tagName,'component',[source('packages/elements/'+component.source),...component.dependencies.map(tag=>'component:'+tag)]);
  await read('apps/docs/src/app.ts');add('source:apps/docs/src/app.ts','docs');
  const {sources}=await readAuthoredSpecimens(resolve(root,'apps/docs'));
  const scenarios=[];
  for(const [id,code] of Object.entries(sources)){
    const path='apps/docs/src/__impact_'+id+'.ts',key='specimen:'+id;
    inputs[key]=digestBytes(code);const tags=unique([...code.matchAll(/<(en-[a-z0-9-]+)(?=[\s>])/g)].map(m=>m[1]));
    const dependencies=['source:apps/docs/src/app.ts','assets:docs',source('apps/docs/src/site.css'),source('apps/docs/src/api-example/styles.css'),...tags.filter(tag=>nodes.has('component:'+tag)).map(tag=>'component:'+tag)];
    const imported=runtimeImports(path,code);gaps.push(...imported.gaps);
    for(const specifier of imported.imports){const found=resolveImport(specifier,path);if(found.path)dependencies.push(source(found.path));else if(found.gap)gaps.push(found.gap);}
    const scanned=inspectCustomizationSource(path,code);for(const ref of scanned.references)dependencies.push(property(ref.cssName));
    // Public swatch/property-name inputs and generic token examples intentionally depend on all tokens.
    if(scanned.dynamicInputs.length||id==='swatches')dependencies.push(...allProperties);
    // This authored case displays arbitrary registered token names; all property
    // edges are the conservative closure, not an exclusion of its dynamic CSS.
    const unresolved=id==='swatches'?[]:scanned.unresolved;
    gaps.push(...unresolved.map(value=>'Unresolved CSS expression in '+key+': '+value.expression));
    add('scenario:'+id,'scenario',dependencies,!imported.gaps.length&&!unresolved.length);
    scenarios.push({id,path:'/#specimen-'+id,tags});
  }
  await read('apps/docs/src/workflow-pages/navigation.ts');
  const {workflowPages}=await import(pathToFileURL(resolve(root,'apps/docs/src/workflow-pages/navigation.ts')).href);
  for(const page of workflowPages){
    const id='workflow:'+page.id;
    add('scenario:'+id,'scenario',['assets:docs',source('apps/docs/src/workflow-pages/'+page.id+'-entry.ts'),source('apps/docs/src/site.css')]);
    scenarios.push({id,path:page.path,tags:[]});
  }
  for(let index=0;index<sourceQueue.length;index++){
    const path=sourceQueue[index],id='source:'+path;let code;
    try{code=await read(path);}catch(error){if(error.code!=='ENOENT')throw error;gaps.push('Missing source '+path);add(id,'module',[],false);continue;}
    const deps=[],localGaps=[];
    if(/\.(?:ts|js)$/.test(path)){
      for(const match of code.matchAll(/<(en-[a-z0-9-]+)(?=[\s>])/g))if(nodes.has('component:'+match[1]))deps.push('component:'+match[1]);
      const imported=runtimeImports(path,code);localGaps.push(...imported.gaps);
      for(const specifier of imported.imports){
        const found=resolveImport(specifier,path);
        if(found.path){
          // Token serializers consume names at their callers; token-source file changes still invalidate their readers.
          if(found.path.startsWith('packages/tokens/')){await read(found.path);deps.push(add('source:'+found.path,'module'));}
          else deps.push(source(found.path));
        }else if(found.gap)localGaps.push(found.gap);
        else deps.push(add('external:'+found.external,'module',['source:package-lock.json']));
      }
    }
    if(/\.(?:ts|js|css)$/.test(path)){
      const scan=inspectCustomizationSource(path,code);
      deps.push(...scan.references.map(ref=>property(ref.cssName)));referenceEvidence[path]=scan.references;
      localGaps.push(...scan.unresolved.map(value=>'Unresolved CSS expression in '+path+': '+value.expression));
      if(scan.dynamicInputs.some(value=>!path.startsWith('packages/styles/src/internal/')))deps.push(...allProperties);
    }
    for(const entry of authoring.entries)if(path==='packages/styles/src/generated/'+entry.module+'.ts'){
      deps.push(source('packages/styles/'+entry.source),...authoring.definitions.map(file=>source('packages/styles/'+file)));
    }
    gaps.push(...localGaps);add(id,path.endsWith('.css')?'style':'module',deps,!localGaps.length);
  }
  add('source:package-lock.json','config');
  // Locally authored properties may be absent from the public token registry. Their
  // declarations are source inputs, not invented token nodes or assumed failures.
  for(const node of [...nodes.values()])for(const dep of node.dependencies)if(dep.startsWith('property:')&&!nodes.has(dep))add(dep,'style');
  if(gaps.length)add('coverage:gaps','config',[],false);
  const graph={schemaVersion:1,nodes:[...nodes.values()].sort((a,b)=>a.id.localeCompare(b.id))};
  const result={schemaVersion:1,kind:'en-reve/source-impact',policy:'Potential lexical/runtime-import impact for authored library and docs consumers. Shared modules and potential token fallbacks intentionally over-select. Full sheet remains required; no claim of effective cascade, external application reach or manual acceptance.',compiler:compilerIdentity(),inputs,graph,components,scenarios,gaps:unique(gaps),referenceEvidence};
  return {...result,digest:digestJson(result)};
}

export function selectImpact(manifest,changed){
  const {digest,...body}=manifest;if(digestJson(body)!==digest)throw new Error('Impact manifest integrity mismatch');
  const receipt=selectAffected(manifest.graph,changed);
  return {...receipt,impactDigest:digest,components:receipt.affected.filter(id=>id.startsWith('component:')).map(id=>id.slice(10)),caseIds:receipt.scenarios.map(id=>id.slice(9)),policy:manifest.policy};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  if(process.argv[2]==='select'){
    if(process.argv.length<5)throw new Error('Usage: node tooling/evidence/impact.mjs select <impact.json> <changed-node-id> ...');
    console.log(JSON.stringify(selectImpact(JSON.parse(await readFile(process.argv[3],'utf8')),process.argv.slice(4)),null,2));
    process.exit(0);
  }
  if(process.argv.length!==3)throw new Error('Usage: node tooling/evidence/impact.mjs <new-output-directory>');
  const result=await generateImpact();const output=resolve(process.argv[2]);await mkdir(output);await writeFile(resolve(output,'impact.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({output,nodes:result.graph.nodes.length,components:result.components.length,scenarios:result.scenarios.length,gaps:result.gaps,digest:result.digest}));
}
