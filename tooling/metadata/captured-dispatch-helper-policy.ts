import {createHash} from 'node:crypto';
import {dirname,join,resolve} from 'node:path';
import {ts} from './compiler-api.mjs';

const digest=(text:string)=>createHash('sha256').update(text).digest('hex');
const specifier='@en-reve/primitives/interactions/events.js';
// Reviewed repository helper artifacts, built by the pinned native compiler.
// Updating implementation/declarations requires a deliberate policy update and
// the family/transaction tests; a matching name or shape is not authority.
const expected=Object.freeze({
 declaration:'ea44701e341ecfd494beb0eeb3520179f0f8d37c680483fdbf89b074ef2511ef',
 runtime:'eb0569335d5266defd088066c9315366a16bc081aa0ee4b7bbd1dee2b91bf422',
});
const families=['dispatchChange','dispatchAction','dispatchDraftInput'];

/** Internal pre-seal policy capture. Reads only the exact package target
 * reached by an original import; the recording host closes every lookup.
 * No component or helper module is executed to establish this policy.
 */
export function captureDispatchHelperPolicy(program:any,recordingHost:any) {
 const options=program.getCompilerOptions();
 // Initial runtime-resolution policy admits standard ESM package imports only.
 // Each additional compiler/runtime resolution mode needs an explicit adapter.
 if(['paths','baseUrl','moduleSuffixes','rootDirs','customConditions'].some(key=>options[key]!==undefined)||
   options.preserveSymlinks===true||options.resolvePackageJsonExports===false||
   options.module!==ts.ModuleKind.ESNext||options.moduleResolution!==ts.ModuleResolutionKind.Bundler)
   throw new Error('Dispatch helper runtime resolution options require a separate adapter');
 const checker=program.getTypeChecker(),policies=new Map<any,any>(),edges:any[]=[];
 const unalias=(symbol:any)=>symbol?.flags&ts.SymbolFlags.Alias?checker.getAliasedSymbol(symbol):symbol;
 for(const source of program.getSourceFiles())for(const statement of source.statements) {
  if(!(ts.isImportDeclaration(statement)||ts.isExportDeclaration(statement))||!statement.moduleSpecifier||!ts.isStringLiteral(statement.moduleSpecifier)||statement.moduleSpecifier.text!==specifier)continue;
  const usage=statement.moduleSpecifier,mode=program.getModeForUsageLocation(source,usage);
  const cache=ts.createModuleResolutionCache(recordingHost.getCurrentDirectory(),recordingHost.getCanonicalFileName,program.getCompilerOptions());
  const resolved=ts.resolveModuleName(specifier,source.fileName,program.getCompilerOptions(),recordingHost,cache,undefined,mode).resolvedModule;
  const module=unalias(checker.getSymbolAtLocation(usage)),target=resolved&&program.getSourceFile(resolved.resolvedFileName);
  if(!resolved||!target||!target.isDeclarationFile||module!==checker.getSymbolAtLocation(target)||resolved.packageId?.name!=='@en-reve/primitives'||!resolved.isExternalLibraryImport||
    !resolve(target.fileName).endsWith('/dist/interactions/events.d.ts'))throw new Error('Dispatch helper import has no exact package declaration owner');
  const packageRoot=dirname(dirname(dirname(resolve(target.fileName)))),packagePath=join(packageRoot,'package.json');
  const packageText=recordingHost.readFile(packagePath);if(typeof packageText!=='string')throw new Error('Dispatch helper package policy is absent');
  const pkg=JSON.parse(packageText),entry=pkg.exports?.['./interactions/*.js'];
  if(pkg.name!=='@en-reve/primitives'||pkg.type!=='module'||typeof pkg.version!=='string'||!pkg.version||!entry||
    JSON.stringify(Object.keys(entry).sort())!==JSON.stringify(['default','types'])||entry.types!=='./dist/interactions/*.d.ts'||entry.default!=='./dist/interactions/*.js'||
    Object.keys(pkg.exports).filter(key=>key.startsWith('./interactions/')).some(key=>key!=='./interactions/*.js'))throw new Error('Dispatch helper package export policy changed');
  if(typeof recordingHost.realpath!=='function')throw new Error('Dispatch helper runtime resolution requires recorded physical paths');
  const physicalPackage=resolve(recordingHost.realpath(packageRoot)),physicalSource=resolve(recordingHost.realpath(source.fileName));
  // Check Node's physical-source ancestor search independently of TS resolution.
  // A same-name self reference requires its own explicit adapter.
  let directory=dirname(physicalSource),runtimeOwner:string|undefined;
  for(let depth=0;depth<128;depth++) {
    const scope=recordingHost.readFile(join(directory,'package.json'));
    if(typeof scope==='string') {
      if(JSON.parse(scope).name==='@en-reve/primitives')throw new Error('Dispatch helper self reference requires a separate runtime adapter');
      break;
    }
    const parent=dirname(directory);if(parent===directory)break;directory=parent;
  }
  directory=dirname(physicalSource);
  for(let depth=0;depth<128;depth++) {
    const candidate=join(directory,'node_modules/@en-reve/primitives/package.json');
    if(recordingHost.directoryExists(dirname(candidate))) {
      if(!recordingHost.fileExists(candidate))throw new Error('Dispatch helper nearer runtime package has no authorized package policy');
      runtimeOwner=dirname(resolve(recordingHost.realpath(candidate)));break;
    }
    const parent=dirname(directory);if(parent===directory)break;directory=parent;
  }
  if(runtimeOwner!==physicalPackage)throw new Error('Dispatch helper TypeScript and runtime package owners differ');
  // A nested package scope or escaped file symlink changes module classification.
  for(const scope of ['dist/package.json','dist/interactions/package.json'])
    if(recordingHost.readFile(join(physicalPackage,scope))!==undefined)throw new Error('Dispatch helper nested runtime package scope requires a separate adapter');
  const runtimePath=join(physicalPackage,'dist/interactions/events.js'),runtimeText=recordingHost.readFile(runtimePath);
  if(resolve(recordingHost.realpath(runtimePath))!==runtimePath||
    resolve(recordingHost.realpath(target.fileName))!==join(physicalPackage,'dist/interactions/events.d.ts'))
    throw new Error('Dispatch helper artifact physical owner changed');
  if(digest(target.text)!==expected.declaration||typeof runtimeText!=='string'||digest(runtimeText)!==expected.runtime)throw new Error('Dispatch helper runtime or declaration policy changed');
  const helpers=families.map(name=>{
    const symbol=unalias(checker.getExportsOfModule(module).find((entry:any)=>entry.name===name));
    if(!symbol?.declarations?.length||symbol.declarations.length!==1||!ts.isFunctionDeclaration(symbol.declarations[0])||symbol.declarations[0].getSourceFile()!==target)
      throw new Error('Dispatch helper export has no exact policy declaration');
    return {name,start:symbol.declarations[0].getStart(target),end:symbol.declarations[0].end};
  });
  const policy={version:1,runtimeResolution:'standard-esm-physical-ancestor',runtimeModuleKind:'esm',physicalPackage,packageName:pkg.name,packageVersion:pkg.version,packagePath,packageSha256:digest(packageText),specifier,
    declarationFile:target.fileName,declarationSha256:expected.declaration,runtimeFile:runtimePath,runtimeSha256:expected.runtime,helpers};
  const prior=policies.get(target);if(prior&&JSON.stringify(prior)!==JSON.stringify(policy))throw new Error('Dispatch helper policy identity changed');
  policies.set(target,policy);edges.push({from:source.fileName,start:usage.getStart(source),end:usage.end,mode:mode??null,target:target.fileName,resolution:{...resolved}});
  if(edges.length>256||policies.size>32)throw new Error('Dispatch helper policy capture exceeds its bound');
 }
 return {receipt:{version:1,policies:[...policies.values()],edges},policy(source:any) {
  // Private Map membership is checked before any caller-owned properties.
  const value=policies.get(source);if(!value)throw new Error('No captured implementation policy for this exact helper source');return value;
 }};
}
