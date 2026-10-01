import {captureDispatchHelperPolicy} from './captured-dispatch-helper-policy.ts';
import {createHash} from 'node:crypto';
import {isAbsolute} from 'node:path';
import {ts, compilerIdentity} from './compiler-api.mjs';
import {captureConstructorImports} from './captured-constructor-imports.ts';

const capabilities = new WeakMap<object, any>();
const digest = (text: string) => createHash('sha256').update(text).digest('hex');
const copy = <T>(value: T): T => structuredClone(value);
function encoded(value: any): string {
  const seen=new Set<object>();
  const visit = (item: any): any => {
    if (item === undefined) return {kind:'undefined'};
    if (item === null || typeof item === 'string' || typeof item === 'boolean') return {kind:'value',value:item};
    if (typeof item === 'number' && Number.isFinite(item)) return {kind:'value',value:item};
    const array=Array.isArray(item);
    if (!item || typeof item!=='object' || (!array && Object.getPrototypeOf(item)!==Object.prototype) || seen.has(item)) throw new Error('Captured compiler inputs must be plain serializable values');
    seen.add(item);
    try {
      const descriptors=Object.getOwnPropertyDescriptors(item),keys=Reflect.ownKeys(descriptors);
      if(keys.some(key=>typeof key!=='string'))throw new Error('Captured compiler inputs must have serializable data properties');
      for(const key of keys as string[]) {
        const descriptor=descriptors[key];
        if(!Object.hasOwn(descriptor,'value') || (!descriptor.enumerable && !(array&&key==='length')))throw new Error('Captured compiler inputs must have serializable data properties');
      }
      if(array) {
        const length=descriptors.length.value;
        if(keys.length!==length+1 || Array.from({length},(_,i)=>String(i)).some(key=>!descriptors[key]))throw new Error('Captured compiler arrays must have serializable dense data');
        return {kind:'array',value:Array.from({length},(_,i)=>visit(descriptors[String(i)].value))};
      }
      return {kind:'object',value:(keys as string[]).sort().map(key=>[key,visit(descriptors[key].value)])};
    } finally {seen.delete(item);}
  };
  return JSON.stringify(visit(value));
}
function frozen<T>(value: T): T {
  if (value && typeof value === 'object') {for (const item of Object.values(value)) frozen(item);Object.freeze(value);}
  return value;
}
const queryMethods = ['readFile','fileExists','directoryExists','getDirectories','readDirectory','realpath','getEnvironmentVariable'] as const;
function diagnostics(program: any) {
  const rows = [...program.getOptionsDiagnostics(),...program.getGlobalDiagnostics(),...program.getSyntacticDiagnostics(),...program.getSemanticDiagnostics()];
  const describe = (item: any): any => ({file:item.file?.fileName,start:item.start,length:item.length,category:item.category,code:item.code,
    message:ts.flattenDiagnosticMessageText(item.messageText,'\n'),related:item.relatedInformation?.map(describe)});
  const values = rows.map(describe).sort((a,b)=>encoded(a).localeCompare(encoded(b)));
  if (rows.some(item=>item.category===ts.DiagnosticCategory.Error)) throw new Error('Captured original/replay Program must have no compiler errors: '+values.map(item=>item.code+': '+item.message).join('\n'));
  return values;
}
function sourceRows(program: any) {
  return program.getSourceFiles().map((source: any)=>({fileName:source.fileName,textSha256:digest(source.text),languageVersion:source.languageVersion,
    scriptKind:source.scriptKind,impliedNodeFormat:source.impliedNodeFormat,isDeclarationFile:source.isDeclarationFile,
    externalModule:ts.isExternalModule(source),defaultLibrary:program.isSourceFileDefaultLibrary(source),externalLibrary:program.isSourceFileFromExternalLibrary(source)}));
}

// A checked new import may change TypeScript's dependency traversal order.
// Compare the complete source set across distinct Programs, keeping every
// source byte/format/ownership field and refusing duplicate identities. Each
// Program's own source order remains pinned by its later mutation guard.
function sourceSetIdentity(rows:any[]) {
  if(new Set(rows.map(row=>row.fileName)).size!==rows.length)throw new Error('Compiler source closure contains duplicate file identities');
  return encoded([...rows].sort((a,b)=>a.fileName<b.fileName?-1:a.fileName>b.fileName?1:0));
}

// Public parsed-node structure, authored scalar payloads and reference directives.
// Internal checker/cache state is outside this inventory. Original source text
// remains separately bound; later annotation admission still needs its own
// suppression, resolution-edge and semantic certificate checks.
const syntaxFields=['kind','pos','end','escapedText','text','rawText','isUnterminated','hasExtendedUnicodeEscape','hasUnicodeEscape',
  'isTypeOnly','isExportEquals','isTypeOf','operator','token','keywordToken','isSpread','containsOnlyTriviaWhiteSpaces',
  'isNameFirst','isBracketed','isArrayType','comment','fileName','languageVersion','languageVariant','isDeclarationFile','hasNoDefaultLib','impliedNodeFormat','moduleName'];
const syntaxFlagMask=()=>ts.NodeFlags.BlockScoped|ts.NodeFlags.NestedNamespace|ts.NodeFlags.Namespace|ts.NodeFlags.OptionalChain|ts.NodeFlags.GlobalAugmentation|ts.NodeFlags.ContextFlags|ts.NodeFlags.JavaScriptFile|ts.NodeFlags.JSDoc|ts.NodeFlags.JsonFile|ts.NodeFlags.Synthesized;
// Each retained value is normalized once at capture. Named property reads in
// the hot guard avoid a dynamic-key lookup across every parsed-node shape.
// All 28 fields remain checked, including fields absent at capture.
function syntaxScalar(value:any,sourceText=false) {
  if(typeof value!=='string'&&typeof value!=='number'&&typeof value!=='boolean'&&value!==null)return undefined;
  if(typeof value==='number'&&!Number.isFinite(value))throw new Error('Captured compiler inputs must be plain serializable values');
  return sourceText?digest(value):value;
}
function sameSyntaxScalar(value:any,expected:any,sourceText=false) {
  if(sourceText)return syntaxScalar(value,true)===expected;
  // An unchanged primitive was already checked for finiteness at capture.
  if(value===expected)return true;
  return syntaxScalar(value)===expected;
}
function syntaxScalars(node:any) {
  return [
    syntaxScalar(node.kind),
    syntaxScalar(node.pos),
    syntaxScalar(node.end),
    syntaxScalar(node.escapedText),
    syntaxScalar(node.text,ts.isSourceFile(node)),
    syntaxScalar(node.rawText),
    syntaxScalar(node.isUnterminated),
    syntaxScalar(node.hasExtendedUnicodeEscape),
    syntaxScalar(node.hasUnicodeEscape),
    syntaxScalar(node.isTypeOnly),
    syntaxScalar(node.isExportEquals),
    syntaxScalar(node.isTypeOf),
    syntaxScalar(node.operator),
    syntaxScalar(node.token),
    syntaxScalar(node.keywordToken),
    syntaxScalar(node.isSpread),
    syntaxScalar(node.containsOnlyTriviaWhiteSpaces),
    syntaxScalar(node.isNameFirst),
    syntaxScalar(node.isBracketed),
    syntaxScalar(node.isArrayType),
    syntaxScalar(node.comment),
    syntaxScalar(node.fileName),
    syntaxScalar(node.languageVersion),
    syntaxScalar(node.languageVariant),
    syntaxScalar(node.isDeclarationFile),
    syntaxScalar(node.hasNoDefaultLib),
    syntaxScalar(node.impliedNodeFormat),
    syntaxScalar(node.moduleName),
  ];
}
function sameSyntaxScalars(node:any,expected:any[]) {
  if(expected.length!==syntaxFields.length)return false;
  // Keep one live read per field and the original short-circuit order.
  // Normalize only a mismatch; unchanged captured primitives are already finite.
  let value:any;
  value=node.kind;
  if(value!==expected[0]&&syntaxScalar(value)!==expected[0])return false;
  value=node.pos;
  if(value!==expected[1]&&syntaxScalar(value)!==expected[1])return false;
  value=node.end;
  if(value!==expected[2]&&syntaxScalar(value)!==expected[2])return false;
  value=node.escapedText;
  if(value!==expected[3]&&syntaxScalar(value)!==expected[3])return false;
  value=node.text;
  if(!sameSyntaxScalar(value,expected[4],ts.isSourceFile(node)))return false;
  value=node.rawText;
  if(value!==expected[5]&&syntaxScalar(value)!==expected[5])return false;
  value=node.isUnterminated;
  if(value!==expected[6]&&syntaxScalar(value)!==expected[6])return false;
  value=node.hasExtendedUnicodeEscape;
  if(value!==expected[7]&&syntaxScalar(value)!==expected[7])return false;
  value=node.hasUnicodeEscape;
  if(value!==expected[8]&&syntaxScalar(value)!==expected[8])return false;
  value=node.isTypeOnly;
  if(value!==expected[9]&&syntaxScalar(value)!==expected[9])return false;
  value=node.isExportEquals;
  if(value!==expected[10]&&syntaxScalar(value)!==expected[10])return false;
  value=node.isTypeOf;
  if(value!==expected[11]&&syntaxScalar(value)!==expected[11])return false;
  value=node.operator;
  if(value!==expected[12]&&syntaxScalar(value)!==expected[12])return false;
  value=node.token;
  if(value!==expected[13]&&syntaxScalar(value)!==expected[13])return false;
  value=node.keywordToken;
  if(value!==expected[14]&&syntaxScalar(value)!==expected[14])return false;
  value=node.isSpread;
  if(value!==expected[15]&&syntaxScalar(value)!==expected[15])return false;
  value=node.containsOnlyTriviaWhiteSpaces;
  if(value!==expected[16]&&syntaxScalar(value)!==expected[16])return false;
  value=node.isNameFirst;
  if(value!==expected[17]&&syntaxScalar(value)!==expected[17])return false;
  value=node.isBracketed;
  if(value!==expected[18]&&syntaxScalar(value)!==expected[18])return false;
  value=node.isArrayType;
  if(value!==expected[19]&&syntaxScalar(value)!==expected[19])return false;
  value=node.comment;
  if(value!==expected[20]&&syntaxScalar(value)!==expected[20])return false;
  value=node.fileName;
  if(value!==expected[21]&&syntaxScalar(value)!==expected[21])return false;
  value=node.languageVersion;
  if(value!==expected[22]&&syntaxScalar(value)!==expected[22])return false;
  value=node.languageVariant;
  if(value!==expected[23]&&syntaxScalar(value)!==expected[23])return false;
  value=node.isDeclarationFile;
  if(value!==expected[24]&&syntaxScalar(value)!==expected[24])return false;
  value=node.hasNoDefaultLib;
  if(value!==expected[25]&&syntaxScalar(value)!==expected[25])return false;
  value=node.impliedNodeFormat;
  if(value!==expected[26]&&syntaxScalar(value)!==expected[26])return false;
  value=node.moduleName;
  if(value!==expected[27]&&syntaxScalar(value)!==expected[27])return false;
  return true;
}
function syntaxLinks(node:any) {
  const children:any[]=[],arrays:any[]=[];
  ts.forEachChild(node,(child:any)=>{children.push(child);},(array:any)=>{arrays.push({array,pos:array.pos,end:array.end,hasTrailingComma:array.hasTrailingComma});children.push(...array);});
  if(Array.isArray(node.comment)&&!arrays.some(row=>row.array===node.comment)) {
    const array=node.comment;arrays.push({array,pos:array.pos,end:array.end,hasTrailingComma:array.hasTrailingComma});
    for(const comment of array)if(!children.includes(comment))children.push(comment);
  }
  for(const doc of ts.getJSDocCommentsAndTags(node))if(!children.includes(doc))children.push(doc);
  const references=ts.isSourceFile(node)?['referencedFiles','typeReferenceDirectives','libReferenceDirectives','amdDependencies'].map(key=>{
    const array=node[key];return {key,array,items:array&&[...array],values:encoded(array)};
  }):[];
  return {children,arrays,references};
}
function syntaxInventory(sources:any[]) {
  const syntaxFlags=syntaxFlagMask();
  const seen=new Set<any>(),rows:any[]=[],stack=[...sources].reverse();
  while(stack.length) {
    const node=stack.pop();if(seen.has(node))continue; // Public JSDoc queries may share an owning tag.
    if(rows.length>=1000000)throw new Error('Captured parsed structure exceeds its node bound');seen.add(node);
    const {children,arrays,references}=syntaxLinks(node);
    rows.push({node,parent:node.parent,children,arrays,references,syntaxFlags:node.flags&syntaxFlags,scalar:syntaxScalars(node)});
    stack.push(...[...children].reverse());
  }
  return {sources:[...sources],rows};
}
function createSyntaxLinkMatcher() {
  // A fresh context for each full guard invocation keeps nested checks isolated.
  // Callbacks are reused across its sequential nodes; every live edge is still
  // read and compared on every invocation, with no retained validity result.
  let prior:any,childIndex=0,arrayIndex=0,unchanged=true;
  const child=(value:any)=>{if(prior.children[childIndex++]!==value)unchanged=false;};
  const array=(value:any)=>{
    const expected=prior.arrays[arrayIndex++];
    if(!expected||value!==expected.array||value.pos!==expected.pos||value.end!==expected.end||value.hasTrailingComma!==expected.hasTrailingComma)unchanged=false;
  };
  const childArray=(value:any)=>{array(value);for(const item of value)child(item);};
  const hasChild=(value:any)=>{for(let i=0;i<childIndex;i++)if(prior.children[i]===value)return true;return false;};
  return (node:any,current:any)=>{
    prior=current;childIndex=0;arrayIndex=0;unchanged=true;
    ts.forEachChild(node,child,childArray);
    if(!unchanged)return false;
    // So far the live edges equal the retained prefix, which can be used for
    // duplicate detection without constructing another live edge inventory.
    const comment=node.comment;
    if(Array.isArray(comment)) {
      let alreadyArray=false;
      for(let i=0;i<arrayIndex;i++)if(prior.arrays[i].array===comment)alreadyArray=true;
      if(!alreadyArray) {
        array(comment);if(!unchanged)return false;
        for(const item of comment)if(!hasChild(item)){child(item);if(!unchanged)return false;}
      }
    }
    for(const doc of ts.getJSDocCommentsAndTags(node))if(!hasChild(doc)){child(doc);if(!unchanged)return false;}
    if(childIndex!==prior.children.length||arrayIndex!==prior.arrays.length)return false;
    if(ts.isSourceFile(node)) {
      const keys=['referencedFiles','typeReferenceDirectives','libReferenceDirectives','amdDependencies'];
      if(prior.references.length!==keys.length)return false;
      for(let i=0;i<keys.length;i++) {
        const key=keys[i],value=node[key],expected=prior.references[i];
        if(expected.key!==key||value!==expected.array||encoded(value)!==expected.values)return false;
        if(value) {
          // Use the same iterator as the captured spread; never invoke a method
          // supplied by the mutable directive array to prove its own identity.
          let itemIndex=0;
          for(const item of value)if(item!==expected.items[itemIndex++])return false;
          if(itemIndex!==expected.items.length)return false;
        }
      }
    } else if(prior.references.length)return false;
    return true;
  };
}
function assertSyntax(sources:any[],expected:ReturnType<typeof syntaxInventory>) {
  const sameArray=(a:any[],b:any[])=>a.length===b.length&&a.every((value,i)=>value===b[i]);
  const changed=()=>{throw new Error('Original compiler parsed structure changed');};
  if(!sameArray(sources,expected.sources))changed();
  const syntaxFlags=syntaxFlagMask();
  const sameSyntaxLinks=createSyntaxLinkMatcher();
  // Exact roots plus every original ordered child edge prove the same reachable
  // node membership. Every invocation rechecks every retained node and edge.
  for(const prior of expected.rows) {
    const node=prior.node;
    if(node.parent!==prior.parent||(node.flags&syntaxFlags)!==prior.syntaxFlags||!sameSyntaxScalars(node,prior.scalar)||!sameSyntaxLinks(node,prior))changed();
  }
}

/** Snapshot the existing parsed AST without adopting a foreign compiler host.
 * This guards syntax identity only, not diagnostics, resolution or visibility.
 */
export function guardParsedSources(sources: readonly any[]) {
  const selection = [...sources], expected = syntaxInventory(selection);
  return () => assertSyntax(selection, expected);
}

/** Experimental input capture only. No annotation certificate or generator cutover.
 * The capability creates its original Program; it cannot adopt a foreign one.
 * Filesystem answers and source bytes stay in memory; portable receipts contain
 * digests, never environment values or complete captured source contents.
 */
export function createCapturedCompilerProgram(rootNames: string[], compilerOptions: any) {
  return createCapture(rootNames,compilerOptions,false);
}

/** Additional closed-host queries for selected constructor graph arguments.
 * Derivation is internal and source-owned; callers cannot nominate import edges.
 */
export function createCapturedConstructorCompilerProgram(rootNames:string[],compilerOptions:any) {
  return createCapture(rootNames,compilerOptions,true);
}
/** Explicit event policy capture; constructor-only capture retains its scope. */
export function createCapturedEventCompilerProgram(rootNames:string[],compilerOptions:any) {
  return createCapture(rootNames,compilerOptions,true,true);
}
function createCapture(rootNames:string[],compilerOptions:any,constructorImports:boolean,dispatchPolicyEnabled=false) {
  if (!Array.isArray(rootNames) || !rootNames.length || rootNames.some(name=>typeof name!=='string' || !isAbsolute(name)) || new Set(rootNames).size!==rootNames.length) throw new Error('Captured Program requires explicit unique absolute roots');
  encoded(compilerOptions); // Reject AST configuration objects, callbacks and custom hosts.
  const roots = frozen([...rootNames]), options = copy(compilerOptions);
  if (options.noEmit!==true || options.strict!==true || options.noCheck || options.incremental || options.composite || options.configFile || options.configFilePath) throw new Error('Captured Program initially supports strict noEmit explicit options without config/project/incremental state');
  const optionsIdentity=encoded(options), compiler=compilerIdentity(), compilerKey=encoded(compiler);
  const originalHost=ts.createCompilerHost(copy(options),true);
  const settings=frozen({currentDirectory:originalHost.getCurrentDirectory(),caseSensitive:originalHost.useCaseSensitiveFileNames(),
    newLine:originalHost.getNewLine(),defaultLibrary:originalHost.getDefaultLibFileName(options),defaultLibraryLocation:originalHost.getDefaultLibLocation?.()});
  const canonicalFileName=originalHost.getCanonicalFileName.bind(originalHost);
  const functions=new Map<string,Function>();
  for (const method of queryMethods) if (typeof originalHost[method]==='function') functions.set(method,originalHost[method].bind(originalHost));
  const queries=new Map<string,{method:string,args:any[],value:any,valueIdentity:string}>();
  let closed=false;
  function query(method: string,args:any[], replay=false) {
    const key=method+':'+encoded(args), prior=queries.get(key);
    if (closed || replay) {
      if (!prior) throw new Error('Unrecorded compiler host query: '+method);
      return copy(prior.value);
    }
    const implementation=functions.get(method);
    if (!implementation) throw new Error('Unsupported compiler host method: '+method);
    const value=implementation(...args), valueIdentity=encoded(value);
    if (prior && prior.valueIdentity!==valueIdentity) throw new Error('Compiler input changed during capture: '+method);
    if (!prior) queries.set(key,{method,args:copy(args),value:copy(value),valueIdentity});
    return copy(value);
  }
  function host(replay: boolean, appended?: {fileName:string,suffix:string}, inserted?:{fileName:string,offset:number,text:string}) {
    const readFile=(fileName:string,...args:any[])=>{
      const text=query('readFile',[fileName,...args],replay);
      if(inserted?.fileName===fileName&&typeof text==='string')return text.slice(0,inserted.offset)+inserted.text+text.slice(inserted.offset);
      return appended?.fileName===fileName && typeof text==='string' ? text+appended.suffix : text;
    };
    const value: any={
      getSourceFile(fileName:string,languageVersionOrOptions:any) {
        // Do not catch missing-closure errors and turn them into empty files.
        const text=readFile(fileName);
        return text===undefined ? undefined : ts.createSourceFile(fileName,text,languageVersionOrOptions,true);
      },
      getCurrentDirectory:()=>settings.currentDirectory,
      useCaseSensitiveFileNames:()=>settings.caseSensitive,
      getCanonicalFileName:canonicalFileName,
      getNewLine:()=>settings.newLine,
      getDefaultLibFileName(requested:any) {if(encoded(requested)!==optionsIdentity)throw new Error('Default library options changed');return settings.defaultLibrary;},
      getDefaultLibLocation:()=>settings.defaultLibraryLocation,
      writeFile() {throw new Error('Captured compiler host does not emit');},
      trace() {throw new Error('Compiler trace output needs a separately captured adapter');},
      createHash:(text:string)=>digest(text),
    };
    for (const method of functions.keys()) value[method]=(...args:any[])=>query(method,args,replay);
    value.readFile=readFile;
    return value;
  }
  const original=ts.createProgram({rootNames:[...roots],options:copy(options),host:host(false)});
  const originalDiagnostics=diagnostics(original), originalSources=[...original.getSourceFiles()], originalRows=sourceRows(original);
  if (encoded(original.getCompilerOptions())!==optionsIdentity || encoded(compilerIdentity())!==compilerKey) throw new Error('Compiler options or identity changed during capture');
  if (!queries.size || originalSources.some(source=>!queries.has('readFile:'+encoded([source.fileName])))) throw new Error('Original Program has an uncaptured source read');
  function verifyCapturedInputs() {
    // A default host memoizes cwd; this explicit live sweep uses fresh settings.
    const currentHost=ts.createCompilerHost(copy(options),true);
    if (currentHost.getCurrentDirectory()!==settings.currentDirectory || currentHost.useCaseSensitiveFileNames()!==settings.caseSensitive || currentHost.getNewLine()!==settings.newLine || currentHost.getDefaultLibFileName(options)!==settings.defaultLibrary || currentHost.getDefaultLibLocation?.()!==settings.defaultLibraryLocation) throw new Error('Compiler environment changed since capture');
    for(const row of queries.values()) if(encoded(functions.get(row.method)!(...copy(row.args)))!==row.valueIdentity) throw new Error('Captured compiler query changed: '+row.method);
  }
  const imported=constructorImports?captureConstructorImports(original,roots,host(false),dispatchPolicyEnabled):undefined;
  const dispatchPolicy=dispatchPolicyEnabled?captureDispatchHelperPolicy(original,host(false)):undefined;
  verifyCapturedInputs(); // Include values queried only once before admitting capture.
  const originalSyntax=syntaxInventory(originalSources);
  closed=true;
  const closure=frozen({schemaVersion:1,roots:[...roots],options:copy(options),settings:copy(settings),compiler:copy(compiler),sources:copy(originalRows),diagnostics:copy(originalDiagnostics),
    ...(imported?{constructorImports:imported.receipt}:{}),
    ...(imported?.annotationReceipt?{eventAnnotationImports:imported.annotationReceipt}:{}),
    ...(dispatchPolicy?{dispatchHelperPolicy:dispatchPolicy.receipt}:{}),
    queries:[...queries].map(([key,row])=>({key,sha256:digest(row.valueIdentity)})).sort((a,b)=>a.key.localeCompare(b.key))});
  const closureDigest=digest(encoded(closure));
  function assertOriginal(program:any=original) {
    if (program!==original || capabilities.get(program)!==capability || program.getTypeChecker()!==checker || encoded(program.getCompilerOptions())!==optionsIdentity) throw new Error('Compiler capture requires its exact original Program');
    const actual=program.getSourceFiles();
    if (actual.length!==originalSources.length || actual.some((source:any,i:number)=>source!==originalSources[i] || program.getSourceFile(source.fileName)!==source) || encoded(sourceRows(program))!==encoded(originalRows)) throw new Error('Original compiler source identity changed');
    assertSyntax(actual,originalSyntax);
    if (encoded(compilerIdentity())!==compilerKey) throw new Error('Captured compiler identity changed');
  }
  function revalidate() {
    assertOriginal();
    verifyCapturedInputs();
    return true;
  }
  function replayBaseline() {
    assertOriginal();
    const program=ts.createProgram({rootNames:[...roots],options:copy(options),host:host(true)});
    const actualDiagnostics=diagnostics(program), actualRows=sourceRows(program);
    if(encoded(actualRows)!==encoded(originalRows) || encoded(actualDiagnostics)!==encoded(originalDiagnostics)) throw new Error('Frozen compiler replay differs from its original baseline');
    if(program.getSourceFiles().some((source:any)=>originalSources.includes(source))) throw new Error('Replay reused an original SourceFile');
    return Object.freeze({program,closureDigest,identity:'separate-replay-baseline',annotationSemanticsQualified:false});
  }
  /** A checked, frozen-input module probe. This does not certify that comment
   * names have the same lexical meaning, expose only public types, or describe
   * a particular constructor occurrence. Those are separate admission steps.
   */
  function replayTypeProbe(source:any,text:string) {
    return replayAppendedProbe(source,text);
  }
  /** Separate private-declaration probe. This checks an explicitly instantiated
   * copied signature; callers must still prove authored binder correspondence,
   * original-call argument identity and consuming occurrence semantics.
   */
  function replayFunctionReturnProbe(callable:any,text:string,typeArguments:string[]) {
    assertOriginal();
    // Establish AST membership before reading any caller-owned property.
    let source:any;
    for(const file of originalSources) {
      const visit=(node:any)=>{if(node===callable)source=file;ts.forEachChild(node,visit);};visit(file);
    }
    if(!source || ![ts.SyntaxKind.FunctionDeclaration,ts.SyntaxKind.FunctionExpression,ts.SyntaxKind.ArrowFunction].includes(callable.kind))
      throw new Error('Function probe requires an exact original callable');
    const namedFunction=ts.isFunctionDeclaration(callable)&&callable.parent===source;
    const variable=callable.parent;
    const namedVariable=ts.isVariableDeclaration(variable)&&variable.initializer===callable&&
      ts.isVariableDeclarationList(variable.parent)&&ts.isVariableStatement(variable.parent.parent)&&variable.parent.parent.parent===source;
    if((!namedFunction&&!namedVariable)||!callable.body||callable.type||callable.asteriskToken||
      (ts.getCombinedModifierFlags(callable)&ts.ModifierFlags.Async)||callable.parameters.length!==1)
      throw new Error('Function probe requires a supported module-level implementation');
    const parameter=callable.parameters[0],parameters=callable.typeParameters??[];
    if(!ts.isIdentifier(parameter.name)||!parameter.type||parameter.initializer||parameter.questionToken||parameter.dotDotDotToken||parameters.length>32)
      throw new Error('Function probe requires one required explicitly typed parameter');
    if(!Array.isArray(typeArguments)||Object.getPrototypeOf(typeArguments)!==Array.prototype)
      throw new Error('Function probe arguments require a plain dense data array');
    const descriptors=Object.getOwnPropertyDescriptors(typeArguments),keys=Reflect.ownKeys(descriptors);
    const length=descriptors.length?.value;
    if(length!==parameters.length||keys.length!==length+1||keys.some(key=>typeof key!=='string')||
      Array.from({length},(_,index)=>String(index)).some(key=>!descriptors[key])||
      keys.some(key=>!Object.hasOwn(descriptors[key as string],'value')||(key!=='length'&&!descriptors[key as string].enumerable)))
      throw new Error('Function probe requires every explicit checked type argument in a plain dense data array');
    const argumentsCopy=Array.from({length},(_,index)=>descriptors[String(index)].value);
    if(argumentsCopy.some(item=>typeof item!=='string'||!item.trim()||item.length>65536))
      throw new Error('Function probe requires every explicit checked type argument');
    for(const item of argumentsCopy) {
      const parsed=ts.createSourceFile('__argument.ts',`type __Argument = ${item};`,source.languageVersion,true);
      if(parsed.parseDiagnostics.length||parsed.statements.length!==1||!ts.isTypeAliasDeclaration(parsed.statements[0]))
        throw new Error('Function probe argument must contain exactly one type expression');
    }
    return replayAppendedProbe(source,text,{callable,parameterText:parameter.getText(source),
      typeParametersText:parameters.length?'<'+parameters.map((item:any)=>item.getText(source)).join(', ')+'>':'',typeArguments:argumentsCopy});
  }
  function replayAppendedProbe(source:any,text:string,signature?:any) {
    assertOriginal();
    if(!originalSources.includes(source) || original.getSourceFile(source.fileName)!==source || source.isDeclarationFile ||
      ![ts.ScriptKind.TS,ts.ScriptKind.TSX].includes(source.scriptKind) || !ts.isExternalModule(source)) throw new Error('Type probe requires an exact original TS module implementation');
    if(options.noUnusedLocals || options.noUnusedParameters)throw new Error('Type probe does not alter unused-check compiler options');
    if(typeof text!=='string' || !text.trim() || text.length>65536)throw new Error('Type probe requires bounded nonempty authored text');
    // Conservative initial admission: directives in even an unrelated source
    // or string refuse. A later adapter may distinguish comments explicitly.
    if(originalSources.some((item:any)=>/@ts-(?:nocheck|ignore|expect-error)\b/.test(item.text)) || /@ts-(?:nocheck|ignore|expect-error)\b/.test(text) || (signature&&/@ts-(?:nocheck|ignore|expect-error)\b/.test(encoded({parameter:signature.parameterText,parameters:signature.typeParametersText,arguments:signature.typeArguments}))))throw new Error('Type probe refuses checking suppression');
    const signatureText=signature&&{parameter:signature.parameterText,parameters:signature.typeParametersText,arguments:signature.typeArguments};
    const name='__cem_probe_'+digest(closureDigest+'\0'+source.fileName+'\0'+text+(signature?'\0'+encoded(signatureText):''));
    if([name,name+'_fn'].some(value=>checker.resolveName(value,source,ts.SymbolFlags.All,false)||source.text.includes(value)) || text.includes('__cem_probe_') || (signature&&encoded(signatureText).includes('__cem_probe_')))throw new Error('Type probe name collides with authored input');
    const syntax=ts.createSourceFile('__probe.ts',`type ${name} = ${text};`,source.languageVersion,true);
    if(syntax.parseDiagnostics.length || syntax.statements.length!==1 || !ts.isTypeAliasDeclaration(syntax.statements[0]))throw new Error('Type probe must contain exactly one type expression');
    // A type declaration cannot continue a preceding expression. A prefixed
    // semicolon would instead consume an original ASI boundary and move it.
    const baseline=replayBaseline(),suffix=signature
      ? `\ndeclare function ${name}_fn${signature.typeParametersText}(${signature.parameterText}): ${text};\ntype ${name} = typeof ${name}_fn${signature.typeArguments.length?'<'+signature.typeArguments.join(', ')+'>':''};\n`
      : `\ntype ${name} = ${text};\n`;
    const appendedSyntax=ts.createSourceFile('__appended.ts',suffix,source.languageVersion,true);
    if(appendedSyntax.parseDiagnostics.length||appendedSyntax.statements.length!==(signature?2:1))throw new Error('Function probe changed synthetic statement membership');
    const program=ts.createProgram({rootNames:[...roots],options:copy(options),host:host(true,{fileName:source.fileName,suffix})});
    const checkedDiagnostics=diagnostics(program),overlaySource=program.getSourceFile(source.fileName),overlayChecker=program.getTypeChecker();
    if(!overlaySource || overlaySource.text!==source.text+suffix || overlaySource.statements.length!==source.statements.length+(signature?2:1) ||
      source.statements.some((prior:any,i:number)=>{const next=overlaySource.statements[i];return next.kind!==prior.kind || next.getStart(overlaySource)!==prior.getStart(source) || next.end!==prior.end || next.getText(overlaySource)!==prior.getText(source);}))throw new Error('Type probe changed its insertion boundary');
    const alias=overlaySource.statements.at(-1);
    if(!ts.isTypeAliasDeclaration(alias) || alias.name.text!==name || alias.modifiers?.length || alias.typeParameters?.length || alias.getStart(overlaySource)<source.text.length)throw new Error('Type probe has unexpected synthetic membership');
    let functionProbe:any;
    if(signature) {
      const declaration=overlaySource.statements.at(-2);
      if(!ts.isFunctionDeclaration(declaration)||declaration.name?.text!==name+'_fn'||declaration.body||
        declaration.modifiers?.length!==1||declaration.modifiers[0].kind!==ts.SyntaxKind.DeclareKeyword||
        declaration.parameters.length!==1||declaration.parameters[0].getText(overlaySource)!==signature.parameterText||
        (declaration.typeParameters??[]).map((item:any)=>item.getText(overlaySource)).join(', ')!==(signature.callable.typeParameters??[]).map((item:any)=>item.getText(source)).join(', ')||
        !ts.isTypeQueryNode(alias.type)||alias.type.exprName.getText(overlaySource)!==name+'_fn'||
        (alias.type.typeArguments?.length??0)!==signature.typeArguments.length)
        throw new Error('Function probe has unexpected synthetic declarations');
      functionProbe={declaration,signatureTypeNode:alias.type,annotationTypeNode:declaration.type};
    }

    const rows=sourceRows(program),expected=copy(originalRows);
    expected.find((row:any)=>row.fileName===source.fileName).textSha256=digest(source.text+suffix);
    if(sourceSetIdentity(rows)!==sourceSetIdentity(expected))throw new Error('Type probe changed source descriptor set');
    if(encoded(checkedDiagnostics)!==encoded(originalDiagnostics))throw new Error('Type probe changed diagnostics');
    if(program.getSourceFiles().some((item:any)=>originalSources.includes(item)||baseline.program.getSourceFiles().includes(item)))throw new Error('Type probe reused a source identity');
    const sourceOrderChanged=encoded(rows.map((row:any)=>row.fileName))!==encoded(expected.map((row:any)=>row.fileName));
    // Mapping uses exact owned parsed nodes, not caller supplied descriptors.
    // Overlay symbols never become symbols owned by the original checker.
    function nodeIndex(owner:any) {
      const map=new Map<string,any[]>(),nodes=new Set<any>();
      const visit=(node:any)=>{
        if(nodes.has(node))return;if(nodes.size>=1000000)throw new Error('Type probe exceeds its node bound');nodes.add(node);
        const file=node.getSourceFile(),key=encoded([file.fileName,node.kind,node.getStart(file),node.end]);
        const items=map.get(key)??[];items.push(node);map.set(key,items);ts.forEachChild(node,visit);
      };
      for(const file of owner.getSourceFiles())visit(file);return {map,nodes};
    }
    const originalIndex=nodeIndex(original),overlayIndex=nodeIndex(program);
    for(const node of originalIndex.nodes) {
      if(ts.isSourceFile(node)||node.kind===ts.SyntaxKind.EndOfFileToken)continue;
      const file=node.getSourceFile(),key=encoded([file.fileName,node.kind,node.getStart(file),node.end]),matches=overlayIndex.map.get(key);
      if(matches?.length!==1 || matches[0].getText(matches[0].getSourceFile())!==node.getText(file))throw new Error('Type probe changed an original parsed-node boundary');
    }
    let guardReady=false;
    function mapOriginalNodeExact(node:any) {
      if(!overlayIndex.nodes.has(node))throw new Error('Type probe mapping requires its exact overlay node');
      const file=node.getSourceFile(),prior=original.getSourceFile(file.fileName);
      if(!prior)throw new Error('Type probe node has no original source');
      if(ts.isSourceFile(node))return prior;
      if(file===overlaySource && node.end>source.text.length)throw new Error('Synthetic probe declarations have no original identity');
      const matches=originalIndex.map.get(encoded([file.fileName,node.kind,node.getStart(file),node.end]));
      if(matches?.length!==1 || node.getText(file)!==matches[0].getText(prior))throw new Error('Type probe node has no unique original correspondence');
      return matches[0];
    }
    function mapOriginalNode(node:any) {
      if(guardReady)assertUnchanged();return mapOriginalNodeExact(node);
    }
    function mapReplayNode(node:any) {
      if(guardReady)assertUnchanged();
      if(!originalIndex.nodes.has(node))throw new Error('Type probe mapping requires its exact original node');
      const file=node.getSourceFile();let result:any;
      if(ts.isSourceFile(node))result=program.getSourceFile(file.fileName);
      else {
        const matches=overlayIndex.map.get(encoded([file.fileName,node.kind,node.getStart(file),node.end]));
        if(matches?.length!==1||mapOriginalNodeExact(matches[0])!==node)throw new Error('Type probe original node has no unique replay correspondence');
        result=matches[0];
      }
      if(guardReady)assertUnchanged();return result;
    }
    // An anonymous class owns its symbol at its direct class keyword, not at
    // the declaration node. Use the same exact public lookup as scoped probes.
    const symbolLocation=(node:any)=>node.name??((ts.isClassDeclaration(node)||ts.isClassExpression(node))
      ?node.getChildren(node.getSourceFile()).find((child:any)=>child.kind===ts.SyntaxKind.ClassKeyword&&child.parent===node):node);
    function mapOriginalSymbolExact(symbol:any) {
      const declarations=symbol?.declarations;
      if(!declarations?.length)throw new Error('Type probe symbol has no owned declarations');
      const mapped=declarations.map(mapOriginalNodeExact);
      const candidates=mapped.map((node:any)=>checker.getSymbolAtLocation(symbolLocation(node)));
      const result=candidates[0];
      if(!result || candidates.some((item:any)=>item!==result) || result.declarations?.length!==mapped.length || result.declarations.some((node:any)=>!mapped.includes(node)))throw new Error('Type probe symbol has no exact original declaration set');
      // Prove the incoming symbol really owns these declarations. A structural
      // lookalike object must not be usable as a compiler-owned symbol.
      if(declarations.some((node:any)=>overlayChecker.getSymbolAtLocation(symbolLocation(node))!==symbol))throw new Error('Type probe mapping requires its exact overlay symbol');
      if((symbol.flags&ts.SymbolFlags.Alias)!==(result.flags&ts.SymbolFlags.Alias))throw new Error('Type probe alias identity changed');
      return result;
    }
    // One synchronous batch retains complete pre/post mutation guards. No
    // unchecked mapper or callback escapes, and no successful guard is cached
    // across calls. Exact duplicate symbols are resolved once within this call.
    function mapOriginalSymbols(symbols:any) {
      if(guardReady)assertUnchanged();
      if(!Array.isArray(symbols)||Object.getPrototypeOf(symbols)!==Array.prototype)throw new Error('Probe symbol batch requires a plain dense data array');
      const descriptors=Object.getOwnPropertyDescriptors(symbols),length=descriptors.length?.value,keys=Reflect.ownKeys(descriptors);
      if(!Number.isSafeInteger(length)||length<0||length>4096||keys.length!==length+1||keys.some(key=>typeof key!=='string')||
        keys.some(key=>!Object.hasOwn(descriptors[key as string],'value')||(key!=='length'&&!descriptors[key as string].enumerable))||
        Array.from({length},(_,index)=>String(index)).some(key=>!descriptors[key]))throw new Error('Probe symbol batch requires a plain dense data array');
      const seen=new Map<any,any>(),result=[];
      for(let index=0;index<length;index++) {
        const symbol=descriptors[String(index)].value;
        if(!seen.has(symbol))seen.set(symbol,mapOriginalSymbolExact(symbol));
        result.push(seen.get(symbol));
      }
      if(guardReady)assertUnchanged();return Object.freeze(result);
    }
    function mapOriginalSymbol(symbol:any) {return mapOriginalSymbols([symbol])[0];}
    const exportRows:any[]=[];
    for(const file of program.getSourceFiles()) {
      if(!ts.isExternalModule(file))continue;
      const module=overlayChecker.getSymbolAtLocation(file),prior=checker.getSymbolAtLocation(original.getSourceFile(file.fileName));
      if(!module || !prior)throw new Error('Type probe module has no exact export owner');
      const currentExports=overlayChecker.getExportsOfModule(module),originalExports=checker.getExportsOfModule(prior);
      if(currentExports.length!==originalExports.length)throw new Error('Type probe changed module exports');
      for(const entry of currentExports) {
        const mapped=mapOriginalSymbol(entry);
        if(!originalExports.some((item:any)=>item===mapped && item.name===entry.name))throw new Error('Type probe changed export identity');
        exportRows.push({file:file.fileName,name:entry.name,declarations:mapped.declarations.map((node:any)=>({file:node.getSourceFile().fileName,kind:node.kind,start:node.getStart(),end:node.end}))});
      }
    }
    const overlaySources=[...program.getSourceFiles()],overlaySyntax=syntaxInventory(overlaySources);
    function assertUnchanged() {
      assertOriginal();
      const actual=program.getSourceFiles();
      if(program.getTypeChecker()!==overlayChecker || actual.length!==overlaySources.length || actual.some((file:any,i:number)=>file!==overlaySources[i] || program.getSourceFile(file.fileName)!==file))throw new Error('Type probe checker or source identity changed');
      if(encoded(program.getCompilerOptions())!==optionsIdentity || encoded(sourceRows(program))!==encoded(rows))throw new Error('Type probe Program changed');
      assertSyntax(actual,overlaySyntax);return true;
    }
    const receipt=frozen({schemaVersion:1,closureDigest,sourceFile:source.fileName,sourceSha256:digest(source.text),textSha256:digest(text),
      ...(signature?{probeKind:'explicit-function-return',signatureSha256:digest(encoded(signatureText))}:{}),suffixSha256:digest(suffix),insertionOffset:source.text.length,probeName:name,sourceOrderChanged,exports:exportRows,diagnostics:checkedDiagnostics});
    assertUnchanged();guardReady=true;
    return Object.freeze({program,typeNode:alias.type,closureDigest,receipt,mapReplayNode,mapOriginalNode,mapOriginalSymbol,mapOriginalSymbols,assertUnchanged,
      ...(functionProbe?{functionProbe:Object.freeze(functionProbe)}:{}),typeSemanticsChecked:true,annotationSemanticsQualified:false});
  }
  /** A separate lexical insertion overlay. One private type alias is inserted
   * at the start of an exact original function body. No class member, value
   * statement, callable signature or original token is replaced. This proves
   * checked lexical type semantics only, not public event/occurrence admission.
   */
  function replayScopedTypeProbe(callable:any,text:string) {
    assertOriginal();
    let source:any;
    for(const file of originalSources) {
      const visit=(node:any)=>{if(node===callable)source=file;ts.forEachChild(node,visit);};visit(file);
    }
    if(!source||source.isDeclarationFile||!ts.isExternalModule(source)||
      ![ts.SyntaxKind.FunctionDeclaration,ts.SyntaxKind.FunctionExpression,ts.SyntaxKind.ArrowFunction].includes(callable.kind)||
      !callable.body||!ts.isBlock(callable.body))throw new Error('Scoped probe requires an exact original block-bodied function');
    const direct=ts.isFunctionDeclaration(callable)&&callable.parent===source;
    const variable=callable.parent;
    if(!direct&&!(ts.isVariableDeclaration(variable)&&variable.initializer===callable&&ts.isIdentifier(variable.name)&&
      ts.isVariableDeclarationList(variable.parent)&&ts.isVariableStatement(variable.parent.parent)&&variable.parent.parent.parent===source))
      throw new Error('Scoped probe requires a module-level callable');
    if(typeof text!=='string'||!text.trim()||text.length>65536)throw new Error('Scoped probe requires a bounded nonempty type');
    if(source.checkJsDirective?.enabled===false||source.commentDirectives?.length)throw new Error('Scoped probe refuses original suppression directives');
    let name='__CemScoped_'+digest(source.text+text).slice(0,20),counter=0;
    while(source.text.includes(name)){name='__CemScoped_'+digest(source.text+text+String(++counter)).slice(0,20);}
    const insertion=`\ntype ${name} = ${text};\n`,syntax=ts.createSourceFile('__scope.ts',insertion,source.languageVersion,true);
    if(syntax.parseDiagnostics.length||syntax.statements.length!==1||!ts.isTypeAliasDeclaration(syntax.statements[0])||
      syntax.statements[0].name.text!==name||syntax.statements[0].typeParameters?.length||syntax.statements[0].modifiers?.length||
      syntax.commentDirectives?.length||syntax.checkJsDirective?.enabled===false)throw new Error('Scoped probe must contain exactly one unsuppressed type expression');
    const offset=callable.body.getStart(source)+1,expectedText=source.text.slice(0,offset)+insertion+source.text.slice(offset);
    const baseline=replayBaseline(),program=ts.createProgram({rootNames:[...roots],options:copy(options),host:host(true,undefined,{fileName:source.fileName,offset,text:insertion})});
    const checkedDiagnostics=diagnostics(program),overlayChecker=program.getTypeChecker(),overlaySource=program.getSourceFile(source.fileName);
    const expected=copy(originalRows);expected.find((row:any)=>row.fileName===source.fileName).textSha256=digest(expectedText);
    const rows=sourceRows(program);
    if(!overlaySource||overlaySource.text!==expectedText||sourceSetIdentity(rows)!==sourceSetIdentity(expected)||encoded(checkedDiagnostics)!==encoded(originalDiagnostics)||
      program.getSourceFiles().some((file:any)=>originalSources.includes(file)||baseline.program.getSourceFiles().includes(file)))
      throw new Error('Scoped probe changed source closure or diagnostics');
    const overlays=syntaxInventory(program.getSourceFiles()),originalNodes=new Set(originalSyntax.rows.map(row=>row.node));
    const overlayNodes=new Set(overlays.rows.map(row=>row.node));
    const aliasMatches=[...overlayNodes].filter((node:any)=>ts.isTypeAliasDeclaration(node)&&node.name.text===name&&node.getSourceFile()===overlaySource);
    if(aliasMatches.length!==1)throw new Error('Scoped probe has no unique inserted declaration');
    const alias:any=aliasMatches[0],synthetic=new Set<any>();
    const collect=(node:any)=>{if(synthetic.has(node))return;synthetic.add(node);ts.forEachChild(node,collect);for(const doc of ts.getJSDocCommentsAndTags(node))collect(doc);};collect(alias);
    const mapping=new Map<any,any>(),forward=new Map<any,any>();
    const at=(n:number)=>n>=offset?n+insertion.length:n;
    const originalIndex=new Map<string,any[]>();
    for(const node of originalNodes) {
      const file=node.getSourceFile(),start=node.getStart(file),end=node.end;
      const key=encoded([file.fileName,node.kind,file===source?at(start):start,file===source?at(end):end]);
      const values=originalIndex.get(key)??[];values.push(node);originalIndex.set(key,values);
    }
    for(const node of overlayNodes) {
      if(synthetic.has(node))continue;
      const file=node.getSourceFile(),key=encoded([file.fileName,node.kind,node.getStart(file),node.end]);
      const matches=originalIndex.get(key);
      if(matches?.length!==1)throw new Error('Scoped probe changed an original parsed-node boundary');
      const prior=matches[0],start=node.getStart(file),end=node.end;
      const actual=file===overlaySource&&start<=offset&&end>=offset+insertion.length
        ?file.text.slice(start,offset)+file.text.slice(offset+insertion.length,end):node.getText(file);
      if(actual!==prior.getText(prior.getSourceFile())||forward.has(prior))throw new Error('Scoped probe changed original parsed text or membership');
      mapping.set(node,prior);forward.set(prior,node);
    }
    if(forward.size!==originalNodes.size||mapping.get(alias.parent)!==callable.body||alias.parent.statements[0]!==alias)
      throw new Error('Scoped probe changed its lexical insertion topology');
    const originalRowsByNode=new Map(originalSyntax.rows.map(row=>[row.node,row]));
    for(const row of overlays.rows) {
      if(synthetic.has(row.node))continue;
      const prior=originalRowsByNode.get(mapping.get(row.node));
      if(!prior||mapping.get(row.parent)!==prior.parent||row.children.filter((node:any)=>!synthetic.has(node)).length!==prior.children.length||
        row.children.filter((node:any)=>!synthetic.has(node)).some((node:any,i:number)=>mapping.get(node)!==prior.children[i]))
        throw new Error('Scoped probe changed original parent or child topology');
    }
    const location=(node:any)=>node.name??((ts.isClassDeclaration(node)||ts.isClassExpression(node))
      ?node.getChildren(node.getSourceFile()).find((child:any)=>child.kind===ts.SyntaxKind.ClassKeyword&&child.parent===node):node);
    let guardReady=false;
    function mapOriginalNodeExact(node:any) {
      if(!overlayNodes.has(node)||!mapping.has(node))throw new Error('Scoped probe mapping requires an exact original overlay node');
      return mapping.get(node);
    }
    function mapOriginalNode(node:any) {
      if(guardReady)assertUnchanged();return mapOriginalNodeExact(node);
    }
    function mapOriginalSymbolExact(symbol:any) {
      const declarations=symbol?.declarations;
      if(!declarations?.length)throw new Error('Scoped probe symbol has no owned declarations');
      const mapped=declarations.map(mapOriginalNodeExact),values=mapped.map((node:any)=>checker.getSymbolAtLocation(location(node))),result=values[0];
      if(!result||values.some((value:any)=>value!==result)||result.declarations?.length!==mapped.length||result.declarations.some((node:any)=>!mapped.includes(node))||
        declarations.some((node:any)=>overlayChecker.getSymbolAtLocation(location(node))!==symbol)||(symbol.flags&ts.SymbolFlags.Alias)!==(result.flags&ts.SymbolFlags.Alias))
        throw new Error('Scoped probe symbol has no exact original correspondence');
      return result;
    }
    // One synchronous batch retains complete pre/post mutation guards. No
    // unchecked mapper or callback escapes, and no successful guard is cached
    // across calls. Exact duplicate symbols are resolved once within this call.
    function mapOriginalSymbols(symbols:any) {
      if(guardReady)assertUnchanged();
      if(!Array.isArray(symbols)||Object.getPrototypeOf(symbols)!==Array.prototype)throw new Error('Probe symbol batch requires a plain dense data array');
      const descriptors=Object.getOwnPropertyDescriptors(symbols),length=descriptors.length?.value,keys=Reflect.ownKeys(descriptors);
      if(!Number.isSafeInteger(length)||length<0||length>4096||keys.length!==length+1||keys.some(key=>typeof key!=='string')||
        keys.some(key=>!Object.hasOwn(descriptors[key as string],'value')||(key!=='length'&&!descriptors[key as string].enumerable))||
        Array.from({length},(_,index)=>String(index)).some(key=>!descriptors[key]))throw new Error('Probe symbol batch requires a plain dense data array');
      const seen=new Map<any,any>(),result=[];
      for(let index=0;index<length;index++) {
        const symbol=descriptors[String(index)].value;
        if(!seen.has(symbol))seen.set(symbol,mapOriginalSymbolExact(symbol));
        result.push(seen.get(symbol));
      }
      if(guardReady)assertUnchanged();return Object.freeze(result);
    }
    function mapOriginalSymbol(symbol:any) {return mapOriginalSymbols([symbol])[0];}
    function mapReplayNode(node:any) {
      if(guardReady)assertUnchanged();
      if(!originalNodes.has(node)||!forward.has(node))throw new Error('Scoped reverse mapping requires an exact original node');
      return forward.get(node);
    }
    for(const file of program.getSourceFiles())if(ts.isExternalModule(file)) {
      const module=overlayChecker.getSymbolAtLocation(file),prior=checker.getSymbolAtLocation(original.getSourceFile(file.fileName));
      if(!module||!prior)throw new Error('Scoped probe module has no exact original owner');
      const exports=overlayChecker.getExportsOfModule(module),expected=checker.getExportsOfModule(prior);
      if(exports.length!==expected.length||exports.some((symbol:any)=>!expected.some((prior:any)=>prior===mapOriginalSymbol(symbol)&&prior.name===symbol.name)))
        throw new Error('Scoped probe changed module exports');
    }
    const overlaySources=[...program.getSourceFiles()],overlaySyntax=syntaxInventory(overlaySources);
    function assertUnchanged() {
      assertOriginal();const actual=program.getSourceFiles();
      if(program.getTypeChecker()!==overlayChecker||encoded(program.getCompilerOptions())!==optionsIdentity||encoded(sourceRows(program))!==encoded(rows)||
        actual.length!==overlaySources.length||actual.some((file:any,i:number)=>file!==overlaySources[i]||program.getSourceFile(file.fileName)!==file))
        throw new Error('Scoped probe compiler source identity changed');
      assertSyntax(actual,overlaySyntax);return true;
    }
    assertUnchanged();guardReady=true;
    return Object.freeze({program,typeNode:alias.type,callable:forward.get(callable),mapReplayNode,mapOriginalNode,mapOriginalSymbol,mapOriginalSymbols,assertUnchanged,closureDigest,
      receipt:frozen({schemaVersion:1,probeKind:'lexical-body-type-alias',closureDigest,sourceFile:source.fileName,sourceSha256:digest(source.text),
        offset,insertionSha256:digest(insertion),typeTextSha256:digest(text),originalNodeCount:originalNodes.size}),
      typeSemanticsChecked:true,annotationSemanticsQualified:false});
  }
  const checker=original.getTypeChecker();
  const capability=Object.freeze({program:original,assertOriginal,revalidate,replayBaseline,replayTypeProbe,replayFunctionReturnProbe,replayScopedTypeProbe,canonicalFileName,receipt:closure,closureDigest,
    ...(imported?{constructorImport:(symbol:any,scope:any)=>{assertOriginal();return imported.reference(symbol,scope);},constructorImportSymbol:(specifier:string,name:string,scope:any)=>{assertOriginal();return imported.symbol(specifier,name,scope);}}:{}),
    ...(imported?.annotationSymbol?{annotationImportSymbol:(specifier:string,name:string,scope:any)=>{assertOriginal();return imported.annotationSymbol(specifier,name,scope);},annotationImportReference:(symbol:any,scope:any)=>{assertOriginal();return imported.annotationReference(symbol,scope);},eventPrintedImportReference:(specifier:string,name:string,scope:any)=>{assertOriginal();return imported.printedReference(specifier,name,scope);}}:{}),
    ...(dispatchPolicy?{dispatchHelperPolicy:(source:any)=>{assertOriginal();return frozen(copy(dispatchPolicy.policy(source)));}}:{}),
    scope:'captured explicit host inputs, baseline replay and module type probes; no public annotation admission',annotationSemanticsQualified:false});
  capabilities.set(original,capability);
  return capability;
}

export function capturedCompilerProgram(program:any) {
  const capability=capabilities.get(program);
  if(!capability)throw new Error('Program has no original captured-host capability');
  capability.assertOriginal(program);return capability;
}
