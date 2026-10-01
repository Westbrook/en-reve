import {constructorSemanticTypeText} from './candidate-mixin-origins.ts';
import {relative,dirname,resolve} from 'node:path';
import {ts} from './compiler-api.mjs';
import {constructorCohort} from './candidate-constructor-cohort.ts';
import {constructorHeritageGraph} from './candidate-mixin-graph.ts';

/** Internal pre-seal derivation. The caller supplies the recording host, never
 * a replay fallback. Only exact selected source targets from checked calls can
 * create edges. Missing public exports are left unrepresentable.
 */
export function captureConstructorImports(program:any,rootNames:readonly string[],recordingHost:any,eventImports=false) {
  const checker=program.getTypeChecker(),sources=rootNames.map(name=>program.getSourceFile(name));
  if(sources.some(source=>!source))throw new Error('Constructor import capture requires exact selected sources');
  const selected=new Set(sources),cohort=constructorCohort(program,sources,(source:any)=>source.fileName);
  const graph=constructorHeritageGraph(program,sources,(source:any)=>source.fileName,[...cohort.roots]);
  const edges=new Map<string,any>(),references=new Map<any,Map<any,string>>(),reverse=new Map<any,Map<string,any>>();
  const annotationEdges=new Map<string,any>(),annotationSymbols=new Map<any,Map<string,any>>(),annotationReferencesBySymbol=new Map<any,Map<any,string>>();
  const unalias=(symbol:any)=>symbol?.flags&ts.SymbolFlags.Alias?checker.getAliasedSymbol(symbol):symbol;
  function admit(symbol:any,scope:any) {
    symbol=unalias(symbol);
    const declarations=symbol?.declarations;
    if(!declarations?.length)return;
    const target=declarations[0].getSourceFile();
    if(target===scope||!selected.has(target)||declarations.some((node:any)=>node.getSourceFile()!==target))return;
    const module=checker.getSymbolAtLocation(target);
    const exported=module&&checker.getExportsOfModule(module).filter((entry:any)=>unalias(entry)===symbol)
      .sort((a:any,b:any)=>a.name.localeCompare(b.name))[0];
    if(!exported||!/^[$A-Z_a-z][$\w]*$/.test(exported.name)||exported.name==='default')return;
    let specifier=relative(dirname(scope.fileName),target.fileName).replaceAll('\\','/').replace(/\.(?:d\.)?[cm]?tsx?$/,match=>match.includes('mts')?'.mjs':match.includes('cts')?'.cjs':'.js');
    if(!specifier.startsWith('.'))specifier='./'+specifier;
    const syntax=ts.createSourceFile('__constructor_import_mode.ts',`type __Edge=typeof import(${JSON.stringify(specifier)}).${exported.name};`,scope.languageVersion,true);
    const usage=syntax.statements[0].type.argument.literal;
    const mode=program.getModeForUsageLocation(scope,usage),key=JSON.stringify([scope.fileName,specifier,mode??null]);
    if(!edges.has(key)) {
      if(edges.size>=256)throw new Error('Constructor import capture exceeds256 source-owned edges');
      // Fresh cache per mode-aware resolution ensures every lookup is recorded.
      const cache=ts.createModuleResolutionCache(recordingHost.getCurrentDirectory(),recordingHost.getCanonicalFileName,program.getCompilerOptions());
      const answer=ts.resolveModuleName(specifier,scope.fileName,program.getCompilerOptions(),recordingHost,cache,undefined,mode);
      const resolved=answer.resolvedModule;
      if(!resolved||program.getSourceFile(resolved.resolvedFileName)!==target||resolve(resolved.resolvedFileName)!==resolve(target.fileName)||resolved.isExternalLibraryImport)
        throw new Error('Constructor import did not resolve to its exact selected target');
      edges.set(key,{from:scope.fileName,specifier,mode:mode??null,target:target.fileName,resolution:{...resolved},exports:[]});
    }
    const edge=edges.get(key);
    if(edge.target!==target.fileName)throw new Error('Constructor import target changed');
    if(!edge.exports.includes(exported.name))edge.exports.push(exported.name);
    let scopes=references.get(symbol);if(!scopes){scopes=new Map();references.set(symbol,scopes);}
    scopes.set(scope,`import(${JSON.stringify(specifier)}).${exported.name}`);
    let names=reverse.get(scope);if(!names){names=new Map();reverse.set(scope,names);}
    const referenceKey=JSON.stringify([specifier,exported.name]);
    if(names.has(referenceKey)&&names.get(referenceKey)!==symbol)throw new Error('Captured import reference changed its original symbol');
    names.set(referenceKey,symbol);
  }
  function importReference(node:any,authoredScope:any,outputScope:any) {
    if(!eventImports)return;
    if(node.attributes||!ts.isLiteralTypeNode(node.argument)||!ts.isStringLiteral(node.argument.literal)||!node.qualifier||!ts.isIdentifier(node.qualifier))return;
    const specifier=node.argument.literal.text,name=node.qualifier.text;
    if(!specifier||specifier.startsWith('/')||specifier.includes('\\'))return;
    function resolveSymbol(from:any,spec:string) {
      const syntax=ts.createSourceFile('__event_import_mode.ts',`type __Edge=import(${JSON.stringify(spec)}).${name};`,from.languageVersion,true);
      const mode=program.getModeForUsageLocation(from,syntax.statements[0].type.argument.literal);
      const cache=ts.createModuleResolutionCache(recordingHost.getCurrentDirectory(),recordingHost.getCanonicalFileName,program.getCompilerOptions());
      const resolved=ts.resolveModuleName(spec,from.fileName,program.getCompilerOptions(),recordingHost,cache,undefined,mode).resolvedModule;
      const target=resolved&&program.getSourceFile(resolved.resolvedFileName),module=target&&checker.getSymbolAtLocation(target);
      const symbol=module&&unalias(checker.getExportsOfModule(module).find((entry:any)=>entry.name===name));
      // This route cannot fabricate an original symbol for a declaration that
      // the original Program did not load. Such imports remain unsupported.
      if(!resolved||!target||!symbol?.declarations?.length)return undefined;
      return {symbol,target,mode:mode??null,resolution:{...resolved}};
    }
    const authored=resolveSymbol(authoredScope,specifier);if(!authored)return;
    const scopeKey=JSON.stringify([specifier,name]);let symbols=annotationSymbols.get(authoredScope);
    if(!symbols){symbols=new Map();annotationSymbols.set(authoredScope,symbols);}
    if(symbols.has(scopeKey)&&symbols.get(scopeKey)!==authored.symbol)throw new Error('Authored import symbol changed during capture');
    symbols.set(scopeKey,authored.symbol);
    let outputSpecifier=specifier;
    if(specifier.startsWith('.')&&authoredScope!==outputScope) {
      if(!selected.has(authored.target))return;
      outputSpecifier=relative(dirname(outputScope.fileName),authored.target.fileName).replaceAll('\\','/').replace(/\.(?:d\.)?[cm]?tsx?$/,match=>match.includes('mts')?'.mjs':match.includes('cts')?'.cjs':'.js');
      if(!outputSpecifier.startsWith('.'))outputSpecifier='./'+outputSpecifier;
    }
    const output=resolveSymbol(outputScope,outputSpecifier);
    if(!output||output.symbol!==authored.symbol||output.target!==authored.target)throw new Error('Event import relocation changed exact module or symbol ownership');
    const key=JSON.stringify([authoredScope.fileName,specifier,name,outputScope.fileName,outputSpecifier]);
    if(annotationEdges.size>=512&&!annotationEdges.has(key))throw new Error('Captured event imports exceed their bound');
    annotationEdges.set(key,{from:authoredScope.fileName,specifier,name,output:outputScope.fileName,outputSpecifier,target:authored.target.fileName,authoredMode:authored.mode,outputMode:output.mode,authoredResolution:authored.resolution,outputResolution:output.resolution});
    let references=annotationReferencesBySymbol.get(authored.symbol);if(!references){references=new Map();annotationReferencesBySymbol.set(authored.symbol,references);}
    const text=`import(${JSON.stringify(outputSpecifier)}).${name}`,prior=references.get(outputScope);
    // Multiple exact exported aliases are safe; choose a deterministic spelling.
    references.set(outputScope,prior&&prior.localeCompare(text)<0?prior:text);
  }
  function types(type:any,scope:any,seen=new Set<any>()) {
    if(!type||seen.has(type))return;if(seen.size>=256)throw new Error('Constructor argument type closure exceeds256 nodes');seen.add(type);
    admit(type.aliasSymbol,scope);admit(type.getSymbol?.(),scope);
    for(const item of [...(type.aliasTypeArguments??[]),...(type.typeArguments??[]),...(type.types??[])])types(item,scope,seen);
  }
  function expression(node:any,scope:any) {
    while(ts.isParenthesizedExpression(node))node=node.expression;
    if(ts.isCallExpression(node)){admit(checker.getSymbolAtLocation(node.expression),scope);for(const arg of node.arguments)expression(arg,scope);}
    else admit(checker.getSymbolAtLocation(node),scope);
    types(checker.getTypeAtLocation(node),scope);
  }
  // This pass records candidate edges only. Annotation certificates separately
  // prove syntax, lexical identity and semantics after the host is sealed.
  function annotationReferences(owner:any,scope:any) {
    for(const tag of ts.getJSDocTags(owner)) {
      if(!['fires','event'].includes(tag.tagName.text))continue;
      const raw=tag.getText(),prefix=raw.match(/^@(fires|event)\s+\{/);if(!prefix)continue;
      let depth=1,quote='',escaped=false,end=-1;
      for(let i=prefix[0].length;i<raw.length;i++) {
        const char=raw[i];
        if(quote){if(escaped)escaped=false;else if(char==='\\')escaped=true;else if(char===quote)quote='';continue;}
        if(char==='"'||char==="'"){quote=char;continue;}
        if(char==='{')depth++;if(char==='}'&&--depth===0){end=i;break;}
      }
      if(end<0||end-prefix[0].length>65536)continue;
      const parsed=ts.createSourceFile('__event_edges.ts',`type __Edge=${raw.slice(prefix[0].length,end)};`,owner.getSourceFile().languageVersion,true);
      if(parsed.parseDiagnostics.length||parsed.statements.length!==1||!ts.isTypeAliasDeclaration(parsed.statements[0]))continue;
      const entity=(name:any,meaning:number):any=>{
        if(ts.isIdentifier(name))return unalias(checker.resolveName(name.text,owner,meaning|ts.SymbolFlags.Alias,false));
        const left=entity(name.left,meaning|ts.SymbolFlags.Namespace);
        return left?.flags&ts.SymbolFlags.Module?unalias(checker.getExportsOfModule(left).find((entry:any)=>entry.name===name.right.text)):undefined;
      };
      const visit=(node:any)=>{
        if(ts.isImportTypeNode(node))importReference(node,owner.getSourceFile(),scope);
        if(ts.isTypeReferenceNode(node)||ts.isTypeQueryNode(node)) {
          const symbol=entity(ts.isTypeReferenceNode(node)?node.typeName:node.exprName,ts.isTypeReferenceNode(node)?ts.SymbolFlags.Type:ts.SymbolFlags.Value);
          admit(symbol,scope);
        }
        ts.forEachChild(node,visit);
      };visit(parsed.statements[0].type);
    }
  }
  if(eventImports)for(const source of sources) {
    const visit=(node:any)=>{
      if(ts.isClassDeclaration(node)||ts.isClassExpression(node))annotationReferences(node,source);
      if(ts.isImportTypeNode(node))importReference(node,source,source);
      ts.forEachChild(node,visit);
    };visit(source);
  }
  for(const root of cohort.roots)for(const step of graph.compositionFor(graph.classes.get(root))) {
    if(step.kind!=='application') {
      if(eventImports&&step.kind==='class')annotationReferences(step.entry.node,root.getSourceFile());
      continue;
    }
    const application=step.application,scope=application.factory.callable.getSourceFile();
    for(const type of checker.getTypeArgumentsForResolvedSignature(application.signature)??[])types(type,scope);
    expression(application.expression.arguments[0],scope);
    // Final-root projection may relocate the authored type and the proved
    // argument candidates. Record only these source-derived identities.
    annotationReferences(application.factory.implementation,root.getSourceFile());
    for(const type of checker.getTypeArgumentsForResolvedSignature(application.signature)??[])types(type,root.getSourceFile());
    expression(application.expression.arguments[0],root.getSourceFile());
  }
  // TypeScript may consult package metadata while naming imported semantic
  // types. Record those real queries before sealing, at the same final roots
  // and with the same formatter used by serialization. This finite candidate
  // set comes only from supported declared members in admitted compositions.
  // Hidden/omitted/overridden candidates may add input answers; they receive no
  // metadata, import-reference, visibility, event or proof admission here.
  const print = (type: any, scope: any) => {
    constructorSemanticTypeText(checker, type, scope);
    constructorSemanticTypeText(checker, type, scope, true);
  };
  const printCallable = (type: any, scope: any) => {
    const signatures = checker.getSignaturesOfType(type, ts.SignatureKind.Call);
    if (signatures.length !== 1 || signatures[0].getTypeParameters()?.length) return;
    const signature = signatures[0];
    for (const parameter of signature.parameters) print(checker.getTypeOfSymbolAtLocation(parameter, scope), scope);
    const predicate = checker.getTypePredicateOfSignature(signature);
    if (predicate) {if (predicate.type) print(predicate.type, scope);}
    else print(checker.getReturnTypeOfSignature(signature), scope);
  };
  const methodScopes = new Map<any, Set<any>>();
  for (const root of cohort.roots) {
    const steps = cohort.index!.compositionFor(root);
    // Private methods deliberately use their original declaration signature at
    // a final root. Every supported own factory method also uses that original
    // signature in the factory callable's scope. Public composed methods below
    // retain effectiveMember; private fields keep authored conversion.
    for (const step of steps) if (step.origin) for (const node of step.origin.node.members) {
      if (!ts.isMethodDeclaration(node) || !(ts.isIdentifier(node.name) || ts.isPrivateIdentifier(node.name)) || node.name.getText() !== node.name.text) continue;
      const outputScopes = [...(ts.isPrivateIdentifier(node.name) ? [root] : []), ...(step.origin.factory ? [step.origin.factory.callable] : [])];
      let scopes = methodScopes.get(node);if (!scopes) {scopes = new Set();methodScopes.set(node, scopes);}
      for (const scope of outputScopes) if (!scopes.has(scope)) {
        scopes.add(scope);printCallable(checker.getTypeAtLocation(node), scope);
      }
    }
    const origins = new Set(steps.flatMap((step: any) => step.origin ? [step.origin.node] : []));
    const candidates = new Map<string, {name: string; isStatic: boolean}>();
    const memberOwner = (node: any) => ts.isParameter(node) && ts.isConstructorDeclaration(node.parent)
      && ts.isParameterPropertyDeclaration(node, node.parent) ? node.parent.parent
      : ts.isPropertyDeclaration(node) || ts.isMethodDeclaration(node) || ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node) ? node.parent : undefined;
    const supported = (node: any) => origins.has(memberOwner(node)) && selected.has(node.getSourceFile())
      && ts.isIdentifier(node.name) && node.name.getText() === node.name.text;
    for (const origin of origins as Set<any>) for (const node of origin.members) {
      const members = ts.isConstructorDeclaration(node)
        ? node.parameters.filter((parameter: any) => ts.isParameterPropertyDeclaration(parameter, node)) : [node];
      for (const member of members) if (supported(member)) {
        const name = member.name.text, isStatic = Boolean(ts.getCombinedModifierFlags(member) & ts.ModifierFlags.Static);
        candidates.set(JSON.stringify([isStatic, name]), {name, isStatic});
      }
    }
    const rootSymbol = checker.getSymbolAtLocation(root.name);
    for (const {name, isStatic} of candidates.values()) {
      const side = isStatic ? checker.getTypeOfSymbolAtLocation(rootSymbol, root) : checker.getTypeAtLocation(root);
      const symbol = checker.getPropertyOfType(side, name);
      // Unsupported declaration forms stay for the normal producer to reject
      // if exposed. Do not turn a discarded candidate into eager validation.
      if (!symbol?.declarations?.length || symbol.declarations.some((node: any) => !supported(node)
        || Boolean(ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Static) !== isStatic)) continue;
      const semantic = cohort.index!.effectiveMember(root, name, isStatic);
      const winner = semantic.contributors.find((entry: any) => entry.origin === semantic.origin && entry.step === semantic.step)!.declaration;
      if (ts.isMethodDeclaration(winner)) printCallable(semantic.type, root);
      else print(semantic.type, root);
    }
  }
  const receipt=[...edges.values()].map(edge=>({...edge,exports:edge.exports.sort()})).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return {receipt,...(eventImports?{annotationReceipt:[...annotationEdges.values()].sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))),
    annotationSymbol(specifier:string,name:string,scope:any) {
      if(!selected.has(scope)||typeof specifier!=='string'||typeof name!=='string')throw new Error('Event import requires exact selected scope and literal names');
      return annotationSymbols.get(scope)?.get(JSON.stringify([specifier,name]));
    },annotationReference(symbol:any,scope:any) {
      if(!selected.has(scope))throw new Error('Event import requires exact selected output scope');return annotationReferencesBySymbol.get(symbol)?.get(scope);
    },printedReference(specifier:string,name:string,scope:any) {
      if(!selected.has(scope)||typeof specifier!=='string'||!specifier.startsWith('/')||typeof name!=='string')throw new Error('Printed event import requires an exact output scope and absolute module spelling');
      const candidates=program.getSourceFiles().filter((source:any)=>source.fileName===specifier||source.fileName.replace(/\.(?:d\.)?[cm]?tsx?$/,'')===specifier);
      if(candidates.length!==1)throw new Error('Printed event import has no unique original source module');
      const matches=[];
      for(const source of candidates) {
        const module=checker.getSymbolAtLocation(source),symbol=module&&unalias(checker.getExportsOfModule(module).find((entry:any)=>entry.name===name));
        const text=symbol&&(references.get(symbol)?.get(scope)??annotationReferencesBySymbol.get(symbol)?.get(scope));
        if(text)matches.push(text);
      }
      if(matches.length!==1)throw new Error('Printed event import has no unique captured public symbol reference');return matches[0];
    }}:{}),reference(symbol:any,scope:any) {
    // Exact source/symbol membership before caller-owned properties are read.
    if(!selected.has(scope))throw new Error('Constructor import requires an exact selected source');
    return references.get(symbol)?.get(scope);
  },symbol(specifier:string,name:string,scope:any) {
    if(!selected.has(scope))throw new Error('Constructor import requires an exact selected source');
    if(typeof specifier!=='string'||typeof name!=='string')throw new Error('Captured import requires literal reference names');
    return reverse.get(scope)?.get(JSON.stringify([specifier,name]));
  }};
}
