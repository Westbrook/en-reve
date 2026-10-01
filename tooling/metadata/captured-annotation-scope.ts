import {createHash} from 'node:crypto';
import {ts} from './compiler-api.mjs';
import {constructorHeritageGraph} from './candidate-mixin-graph.ts';
import {capturedCompilerProgram} from './captured-compiler-program.ts';

const certificates=new WeakMap<object,any>();
const digest=(value:string)=>createHash('sha256').update(value).digest('hex');
function freeze(value:any):any {
  if(value && typeof value==='object'){for(const item of Object.values(value))freeze(item);Object.freeze(value);}return value;
}

/** Source-only experimental boundary. The result proves checked module-level
 * semantics and lexical name correspondence for one directly attached tag.
 * It does not admit an annotation to a public manifest or a mixin occurrence.
 * Only nongeneric, module-level class declarations are currently supported.
 */
export function checkCapturedAnnotationScope(program:any,owner:any,tag:any) {
  return checkScope(program,owner,tag,'module');
}

/** Closed lexical types on an exact nested class, including returned classes.
 * This proves no factory instantiation, visibility or surviving event occurrence.
 * Factory-local type/value bindings still need their separate occurrence adapter.
 */
export function checkCapturedNestedAnnotationScope(program:any,owner:any,tag:any) {
  return checkScope(program,owner,tag,'nested');
}

/** One checked lexical factory call in a selected constructor graph. This
 * remains separate from surviving-facet selection and public event admission.
 * Generic outer class contexts need a separate consuming-context adapter.
 */
export function checkCapturedOccurrenceAnnotationScope(program:any,root:any,stepIndex:number,tag:any) {
  const capture=capturedCompilerProgram(program),checker=program.getTypeChecker();
  const sources=capture.receipt.roots.map((name:string)=>program.getSourceFile(name));
  if(sources.some((source:any)=>!source)||!sources.some((source:any)=>source.statements.includes(root)))
    throw new Error('Occurrence annotation requires an exact selected root');
  if(!Number.isSafeInteger(stepIndex)||stepIndex<0)throw new Error('Occurrence annotation requires an exact application index');
  const graph=constructorHeritageGraph(program,sources,(source:any)=>source.fileName,[root]);
  const steps=graph.compositionFor(graph.classes.get(root)),step=steps[stepIndex];
  if(step?.kind!=='application')throw new Error('Occurrence annotation requires an exact application index');
  if(root.typeParameters?.length||step.contexts.some((edge:any)=>edge.kind==='class-reference'&&edge.entry.node.typeParameters?.length))
    throw new Error('Generic consuming class contexts require a separate occurrence adapter');
  const application=step.application,factory=application.factory,parameters=factory.callable.typeParameters??[];
  const actualArguments=checker.getTypeArgumentsForResolvedSignature(application.signature)??[];
  if(actualArguments.length!==parameters.length)throw new Error('Factory resolved type arguments have no complete declaration correspondence');
  function renderArguments(edge:any,depth=0):string[] {
    if(depth>64)throw new Error('Occurrence argument rendering exceeds its bound');
    const params=edge.factory.callable.typeParameters??[],actual=checker.getTypeArgumentsForResolvedSignature(edge.signature)??[];
    if(params.length!==actual.length)throw new Error('Nested factory type arguments have no complete declaration correspondence');
    let argument=edge.expression.arguments[0];while(ts.isParenthesizedExpression(argument))argument=argument.expression;
    const parameterType=checker.getTypeAtLocation(edge.factory.parameter.type);
    const index=params.findIndex((node:any)=>checker.getTypeAtLocation(node.name)===parameterType);
    const direct=index>=0&&checker.getTypeAtLocation(argument)===actual[index]&&
      (ts.isIdentifier(argument)||ts.isPropertyAccessExpression(argument)||(ts.isCallExpression(argument)&&edge.argument.kind==='application'));
    // Prefer the exact original expression candidate before asking the printer
    // for a cross-module name. Printing can require additional host queries;
    // it must not run for a representation we immediately replace.
    const texts=actual.map((type:any,i:number)=>direct&&i===index?'':checker.typeToString(type,factory.callable,ts.TypeFormatFlags.NoTruncation|ts.TypeFormatFlags.UseFullyQualifiedType));
    if(direct) {
      if(ts.isIdentifier(argument)||ts.isPropertyAccessExpression(argument)) {
        const symbol=checker.getSymbolAtLocation(argument),target=symbol?.flags&ts.SymbolFlags.Alias?checker.getAliasedSymbol(symbol):symbol;
        const imported=capture.constructorImport?.(target,factory.callable.getSourceFile());
        texts[index]='typeof '+(imported??argument.getText());
      }
      else if(ts.isCallExpression(argument)&&edge.argument.kind==='application') {
        const inner=edge.argument,args=renderArguments(inner,depth+1),symbol=checker.getSymbolAtLocation(inner.expression.expression);
        const target=symbol?.flags&ts.SymbolFlags.Alias?checker.getAliasedSymbol(symbol):symbol;
        const name=capture.constructorImport?.(target,factory.callable.getSourceFile())??inner.expression.expression.getText();
        // Conditional return extraction is only a candidate representation.
        // Admission still requires exact same-replay Type identity below.
        texts[index]=`(typeof ${name}${args.length?'<'+args.join(', ')+'>':''}) extends (...args:any[])=>infer __CemOccurrenceReturn ? __CemOccurrenceReturn : never`;
      }
    }
    return texts;
  }
  const argumentTexts=renderArguments(application);
  const occurrence={root,stepIndex,step,application,factory,argumentTexts,actualArguments,
    receipt:{root:graph.descriptor(root),step:stepIndex,application:application.source,
      contexts:step.contexts.map((edge:any)=>({kind:edge.kind,source:edge.source})),arguments:argumentTexts}};
  return checkScope(program,factory.implementation,tag,'occurrence',occurrence);
}

/** Original factory-body lexical scope, for declaration-level payload obligations.
 * The erased alias leaves original class members and generic binders intact.
 * This does not by itself admit a public event or a concrete occurrence.
 */
export function checkCapturedFactoryAnnotationScope(program:any,callable:any,owner:any,tag:any) {
  return checkScope(program,owner,tag,'factory',undefined,callable);
}

function checkScope(program:any,owner:any,tag:any,mode:'module'|'nested'|'occurrence'|'factory',occurrence?:any,callable?:any) {
  const capture=capturedCompilerProgram(program),checker=program.getTypeChecker();
  // Membership precedes reading any caller-provided property or method.
  let source:any;
  for(const file of program.getSourceFiles()) {
    if(mode==='module') {if(file.statements.includes(owner))source=file;}
    else {
      function visit(node:any) {
        if(node===owner && (ts.isClassDeclaration(node)||ts.isClassExpression(node)))source=file;
        ts.forEachChild(node,visit);
      }
      visit(file);
    }
  }
  if(mode==='module') {
    if(!source || program.getSourceFile(source.fileName)!==source ||
      !ts.isClassDeclaration(owner) || !owner.name || owner.parent!==source || owner.typeParameters?.length)
      throw new Error('Annotation scope requires an exact nongeneric module-level class declaration');
  } else if(!source || program.getSourceFile(source.fileName)!==source || source.isDeclarationFile ||
    !ts.isExternalModule(source) || owner.parent===source || owner.typeParameters?.length) {
    throw new Error('Nested annotation scope requires an exact nongeneric nested class in an original source module');
  }
  if(mode==='factory') {
    // owner membership above precedes touching caller inputs. The replay API
    // separately admits only an exact original module-level callable.
    let containing=owner.parent;
    while(containing && !ts.isFunctionDeclaration(containing) && !ts.isFunctionExpression(containing) && !ts.isArrowFunction(containing))containing=containing.parent;
    if(containing!==callable)throw new Error('Factory annotation requires its exact nearest enclosing callable');
  }
  function tagBinding() {
    const doc=ts.getJSDocCommentsAndTags(owner).find((item:any)=>ts.isJSDoc(item)&&item.tags?.includes(tag));
    if(!doc || doc.parent!==owner || tag.parent!==doc || tag.getSourceFile()!==source || !ts.getJSDocTags(owner).includes(tag))
      throw new Error('Annotation scope requires an exact directly attached original JSDoc tag');
    if(!['attr','attribute','event','fires'].includes(tag.tagName.text))throw new Error('Unsupported annotation tag');
    const start=tag.getStart(source),end=tag.end,raw=source.text.slice(start,end);
    if(start<owner.pos || end>owner.getStart(source) || start<0 || end<=start)
      throw new Error('Annotation tag has no exact leading source span');
    // Read the original tag span, not normalized comment text. This small
    // initial grammar supports quoted braces and nested object types. Template
    // literals, comments and multiline types require a separate range adapter.
    const prefix=raw.match(/^@(attr|attribute|event|fires)[ \t]+\{/);
    if(!prefix || prefix[1]!==tag.tagName.text)throw new Error('Annotation needs an exact leading braced type');
    const offset=prefix[0].length;let depth=1,quote='',escaped=false,close=-1;
    for(let i=offset;i<raw.length;i++) {
      const char=raw[i];
      if(char==='\n'||char==='\r')throw new Error('Multiline annotation types require a source-range adapter');
      if(quote) {
        if(escaped)escaped=false;else if(char==='\\')escaped=true;else if(char===quote)quote='';
        continue;
      }
      if(char==='"'||char==="'"){quote=char;continue;}
      if(char==='`'||(char==='/'&&(raw[i+1]==='/'||raw[i+1]==='*')))
        throw new Error('Template or commented annotation types require a source-range adapter');
      if(char==='{')depth++;
      if(char==='}' && --depth===0){close=i;break;}
    }
    if(close<0||quote||!/^\s+(?:[A-Za-z_$][\w$:.-]*|\[[^\]\r\n]+\])(?:\s|$)/.test(raw.slice(close+1)))
      throw new Error('Annotation needs a balanced type followed by an authored contract name');
    const text=raw.slice(offset,close);
    if(!text.trim()||text.length>65536)throw new Error('Annotation type must be bounded and nonempty');
    return {start,end,raw,text,typeStart:start+offset,typeEnd:start+close};
  }
  function supportedSyntax(node:any) {
    if(node.typeParameters?.length || ts.isTypeParameterDeclaration(node) || ts.isMappedTypeNode(node) || ts.isInferTypeNode(node) ||
      node.kind===ts.SyntaxKind.ThisType || ts.isComputedPropertyName(node) || ts.isTypePredicateNode(node) || (ts.isImportTypeNode(node)&&!capture.annotationImportSymbol) ||
      ts.isFunctionTypeNode(node) || ts.isConstructorTypeNode(node) || ts.isCallSignatureDeclaration(node) ||
      ts.isConstructSignatureDeclaration(node) || ts.isMethodSignature(node) || ts.isIndexSignatureDeclaration(node) ||
      ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node))
      throw new Error('Annotation syntax requires a separate lexical or occurrence adapter');
    if(ts.isImportTypeNode(node)&&(node.attributes||!ts.isLiteralTypeNode(node.argument)||!ts.isStringLiteral(node.argument.literal)||!node.qualifier||!ts.isIdentifier(node.qualifier)))throw new Error('Event import syntax requires a qualified literal source adapter');
    ts.forEachChild(node,supportedSyntax);
  }
  const binding=tagBinding(),syntax=ts.createSourceFile('__annotation_scope.ts',`type __Scope = ${binding.text};`,source.languageVersion,true);
  if(syntax.parseDiagnostics.length || syntax.statements.length!==1 || !ts.isTypeAliasDeclaration(syntax.statements[0]))
    throw new Error('Annotation must contain exactly one type expression');
  supportedSyntax(syntax.statements[0].type);
  const probe=occurrence?capture.replayFunctionReturnProbe(occurrence.factory.callable,binding.text,occurrence.argumentTexts)
    :mode==='factory'?capture.replayScopedTypeProbe(callable,binding.text):capture.replayTypeProbe(source,binding.text),overlayChecker=probe.program.getTypeChecker();
  const annotationTypeNode=occurrence?probe.functionProbe.annotationTypeNode:probe.typeNode;
  const unalias=(withChecker:any,symbol:any)=>symbol?.flags&ts.SymbolFlags.Alias?withChecker.getAliasedSymbol(symbol):symbol;
  const descriptor=(node:any)=>({file:node.getSourceFile().fileName,kind:node.kind,start:node.getStart(),end:node.end});
  const referenceChecks:Array<()=>void>=[],references:any[]=[],symbolCorrespondence:any[]=[];
  const copiedBinders=new Map<any,any>();
  if(occurrence) {
    const original=occurrence.factory.callable,copy=probe.functionProbe.declaration;
    const originals=[...(original.typeParameters??[]),...original.parameters],copies=[...(copy.typeParameters??[]),...copy.parameters];
    if(originals.length!==copies.length)throw new Error('Copied function binder count changed');
    originals.forEach((node:any,index:number)=>{
      const counterpart=copies[index],symbol=checker.getSymbolAtLocation(node.name),overlay=overlayChecker.getSymbolAtLocation(counterpart.name);
      if(!symbol||!overlay||node.kind!==counterpart.kind||node.name.text!==counterpart.name.text||node.getText()!==counterpart.getText())
        throw new Error('Copied function binder has no exact authored correspondence');
      copiedBinders.set(symbol,overlay);
    });
    // Copied constraints/defaults/parameter types also retain their exact
    // authored symbols. Text equality alone cannot certify a local self name.
    function signaturePair(authored:any,copied:any) {
      if(!authored&&!copied)return;
      if(!authored||!copied||authored.kind!==copied.kind||authored.getText()!==copied.getText())throw new Error('Copied signature syntax changed');
      if(authored.typeParameters?.length||ts.isInferTypeNode(authored)||ts.isMappedTypeNode(authored))
        throw new Error('Nested signature binders require a separate lexical adapter');
      if(ts.isTypeReferenceNode(authored)||ts.isTypeQueryNode(authored)) {
        const name=ts.isTypeReferenceNode(authored)?authored.typeName:authored.exprName;
        const counterpart=ts.isTypeReferenceNode(copied)?copied.typeName:copied.exprName;
        const originalSymbol=checker.getSymbolAtLocation(name),copiedSymbol=overlayChecker.getSymbolAtLocation(counterpart);
        if(!originalSymbol||!copiedSymbol||(copiedBinders.has(originalSymbol)?copiedBinders.get(originalSymbol)!==copiedSymbol:probe.mapOriginalSymbol(copiedSymbol)!==originalSymbol))
          throw new Error('Copied signature changed an authored lexical symbol');
        referenceChecks.push(()=>{
          if(checker.getSymbolAtLocation(name)!==originalSymbol||overlayChecker.getSymbolAtLocation(counterpart)!==copiedSymbol)
            throw new Error('Copied signature lexical symbol changed');
        });
      }
      if(ts.isImportTypeNode(authored)) {
        supportedSyntax(authored);supportedSyntax(copied);
        const symbol=capture.annotationImportSymbol?.(authored.argument.literal.text,authored.qualifier.text,source),overlay=overlayChecker.getSymbolAtLocation(copied.qualifier);
        if(!symbol||unalias(checker,checker.getSymbolAtLocation(authored.qualifier))!==symbol||!overlay)throw new Error('Copied signature import has no original captured symbol');
        symbolCorrespondence.push({overlay:unalias(overlayChecker,overlay),original:symbol});
      }
      const left:any[]=[],right:any[]=[];ts.forEachChild(authored,(node:any)=>{left.push(node);});ts.forEachChild(copied,(node:any)=>{right.push(node);});
      if(left.length!==right.length)throw new Error('Copied signature child membership changed');
      left.forEach((node:any,index:number)=>signaturePair(node,right[index]));
    }
    (original.typeParameters??[]).forEach((node:any,index:number)=>{
      signaturePair(node.constraint,copy.typeParameters[index].constraint);signaturePair(node.default,copy.typeParameters[index].default);
    });
    signaturePair(original.parameters[0].type,copy.parameters[0].type);
    // Rebind the original call by exact parsed coordinates, then compare type
    // objects within this one replay checker. Assignability is insufficient.
    const call=occurrence.application.expression,callSource=probe.program.getSourceFile(call.getSourceFile().fileName),matches:any[]=[];
    const find=(node:any)=>{if(node.kind===call.kind&&node.getStart(callSource)===call.getStart()&&node.end===call.end)matches.push(node);ts.forEachChild(node,find);};find(callSource);
    if(matches.length!==1||probe.mapOriginalNode(matches[0])!==call)throw new Error('Occurrence call has no unique original replay correspondence');
    const overlayCall=matches[0],signature=overlayChecker.getResolvedSignature(overlayCall);
    if(!signature||probe.mapOriginalNode(signature.getDeclaration())!==original)
      throw new Error('Occurrence call resolved to a different factory implementation');
    const actual=overlayChecker.getTypeArgumentsForResolvedSignature(signature)??[];
    const argumentNodes=probe.functionProbe.signatureTypeNode.typeArguments??[];
    const represented=argumentNodes.map((node:any)=>overlayChecker.getTypeFromTypeNode(node));
    if(actual.length!==represented.length||actual.some((type:any,index:number)=>type!==represented[index]))
      throw new Error('Occurrence type arguments have no exact replay identity; a representation adapter is required');
    referenceChecks.push(()=>{
      if(checker.getResolvedSignature(call)!==occurrence.application.signature||overlayChecker.getResolvedSignature(overlayCall)!==signature||
        actual.some((type:any,index:number)=>overlayChecker.getTypeFromTypeNode(argumentNodes[index])!==type))
        throw new Error('Occurrence resolved signature or type argument identity changed');
    });
  }
  function reference(name:any,meaning:number):any {
    let original:any;
    if(ts.isIdentifier(name))original=checker.resolveName(name.text,owner,meaning|ts.SymbolFlags.Alias,false);
    else if(ts.isQualifiedName(name)) {
      const left=reference(name.left,ts.SymbolFlags.Namespace),target=unalias(checker,left);
      if(!(target?.flags&ts.SymbolFlags.Module))throw new Error('Qualified annotation names require an original namespace');
      original=checker.getExportsOfModule(target).find((entry:any)=>entry.name===name.right.text);
    } else throw new Error('Unsupported annotation name syntax');
    const overlay=overlayChecker.getSymbolAtLocation(name),originalTarget=unalias(checker,original),overlayTarget=unalias(overlayChecker,overlay);
    if(copiedBinders.has(original)) {
      if(overlay!==copiedBinders.get(original)||originalTarget!==original||overlayTarget!==overlay||!(original.flags&meaning))
        throw new Error('Annotation has different authored and copied factory binders');
      referenceChecks.push(()=>{
        if(checker.resolveName(name.text,owner,meaning|ts.SymbolFlags.Alias,false)!==original||overlayChecker.getSymbolAtLocation(name)!==overlay)
          throw new Error('Annotation copied factory binder changed');
      });
      references.push({name:name.getText(),meaning,declarations:original.declarations.map(descriptor),binding:'copied-factory-binder'});
      return original;
    }
    if(!originalTarget?.declarations?.length || !(originalTarget.flags&meaning) || (mode!=='factory' && originalTarget.flags&ts.SymbolFlags.TypeParameter))
      throw new Error('Annotation has no closed original symbol of the required meaning');
    // Qualified-name revalidation is performed below by a separate lookup
    // without adding more records; the initial comparison pins both aliases
    // and their complete target declaration sets.
    symbolCorrespondence.push({overlay,original},{overlay:overlayTarget,original:originalTarget});
    const lookup=(value:any):any=>{
      if(ts.isIdentifier(value))return checker.resolveName(value.text,owner,meaning|ts.SymbolFlags.Alias,false);
      const lookupNamespace=(part:any):any=>ts.isIdentifier(part)?checker.resolveName(part.text,owner,ts.SymbolFlags.Namespace|ts.SymbolFlags.Alias,false):
        checker.getExportsOfModule(unalias(checker,lookupNamespace(part.left))).find((entry:any)=>entry.name===part.right.text);
      return checker.getExportsOfModule(unalias(checker,lookupNamespace(value.left))).find((entry:any)=>entry.name===value.right.text);
    };
    referenceChecks.push(()=>{
      if(lookup(name)!==original || unalias(checker,original)!==originalTarget ||
        overlayChecker.getSymbolAtLocation(name)!==overlay || unalias(overlayChecker,overlay)!==overlayTarget)
        throw new Error('Annotation original symbol correspondence changed');
    });
    references.push({name:name.getText(),meaning,declarations:originalTarget.declarations.map(descriptor)});
    return original;
  }
  function visit(node:any) {
    if(ts.isImportTypeNode(node)) {
      const specifier=node.argument.literal.text,name=node.qualifier.text,meaning=node.isTypeOf?ts.SymbolFlags.Value:ts.SymbolFlags.Type;
      const original=capture.annotationImportSymbol?.(specifier,name,source),overlay=unalias(overlayChecker,overlayChecker.getSymbolAtLocation(node.qualifier));
      if(!original?.declarations?.length||!(original.flags&meaning)||!overlay)throw new Error('Event annotation import has no exact original captured symbol');
      symbolCorrespondence.push({overlay,original});
      references.push({name:node.getText(),meaning,declarations:original.declarations.map(descriptor),binding:'captured-import'});
      referenceChecks.push(()=>{if(capture.annotationImportSymbol(specifier,name,source)!==original||unalias(overlayChecker,overlayChecker.getSymbolAtLocation(node.qualifier))!==overlay)throw new Error('Event annotation import symbol correspondence changed');});
    }
    if(ts.isTypeReferenceNode(node))reference(node.typeName,ts.SymbolFlags.Type);
    if(ts.isTypeQueryNode(node))reference(node.exprName,ts.SymbolFlags.Value);
    ts.forEachChild(node,visit);
  }
  supportedSyntax(annotationTypeNode);
  visit(annotationTypeNode);
  function assertOriginal(expectedProgram=program,expectedOwner=owner,expectedTag=tag) {
    if(expectedProgram!==program || expectedOwner!==owner || expectedTag!==tag)throw new Error('Annotation scope requires its exact original binding');
    capture.assertOriginal(program);probe.assertUnchanged();
    const current=tagBinding();
    if(JSON.stringify(current)!==JSON.stringify(binding))throw new Error('Annotation authored tag binding changed');
    for(const check of referenceChecks)check();
    const mapped=probe.mapOriginalSymbols(symbolCorrespondence.map(entry=>entry.overlay));
    if(mapped.some((symbol:any,index:number)=>symbol!==symbolCorrespondence[index].original))throw new Error('Annotation name has different module and authored lexical bindings');
    return true;
  }
  const receipt=freeze({schemaVersion:1,scope:mode==='module'?'closed-module-tag-lexical-correspondence':mode==='nested'?'closed-nested-tag-lexical-correspondence':mode==='factory'?'original-factory-body-tag-lexical-correspondence':'factory-call-tag-lexical-correspondence',closureDigest:capture.closureDigest,
    sourceSha256:digest(source.text),owner:descriptor(owner),tag:descriptor(tag),tagName:tag.tagName.text,tagSha256:digest(binding.raw),
    typeStart:binding.typeStart,typeEnd:binding.typeEnd,text:binding.text,textSha256:digest(binding.text),references,
    ...(occurrence?{occurrence:occurrence.receipt,lexicalFactoryCallSemanticsChecked:true}:{}),publicVisibilityChecked:false,occurrenceSemanticsQualified:false,annotationSemanticsQualified:false});
  assertOriginal();
  const result=Object.freeze({receipt,assertOriginal,typeSemanticsChecked:true,lexicalNamesChecked:true,
    ...(occurrence?{occurrence:occurrence.receipt,lexicalFactoryCallSemanticsChecked:true}:{}),publicVisibilityChecked:false,occurrenceSemanticsQualified:false,annotationSemanticsQualified:false});
  certificates.set(result,{program,owner,tag,probe,mode,occurrence,callable});return result;
}

export function assertCapturedAnnotationScope(result:any,program:any,owner:any,tag:any) {
  const entry=certificates.get(result);
  if(!entry || entry.mode!=='module' || entry.program!==program || entry.owner!==owner || entry.tag!==tag)throw new Error('Unknown annotation scope certificate');
  return result.assertOriginal(program,owner,tag);
}

export function assertCapturedNestedAnnotationScope(result:any,program:any,owner:any,tag:any) {
  const entry=certificates.get(result);
  if(!entry || entry.mode!=='nested' || entry.program!==program || entry.owner!==owner || entry.tag!==tag)throw new Error('Unknown nested annotation scope certificate');
  return result.assertOriginal(program,owner,tag);
}


export function assertCapturedOccurrenceAnnotationScope(result:any,program:any,root:any,stepIndex:number,tag:any) {
  const entry=certificates.get(result);
  if(!entry||entry.mode!=='occurrence'||entry.program!==program||entry.tag!==tag||entry.occurrence.root!==root||entry.occurrence.stepIndex!==stepIndex)
    throw new Error('Unknown occurrence annotation scope certificate');
  return result.assertOriginal(program,entry.owner,tag);
}

export function assertCapturedFactoryAnnotationScope(result:any,program:any,callable:any,owner:any,tag:any) {
  const entry=certificates.get(result);
  if(!entry||entry.mode!=='factory'||entry.program!==program||entry.callable!==callable||entry.owner!==owner||entry.tag!==tag)
    throw new Error('Unknown factory annotation scope certificate');
  return result.assertOriginal(program,owner,tag);
}

function semantics(entry:any,result:any) {
  const {probe}=entry,checker=probe.program.getTypeChecker();
  let type=checker.getTypeFromTypeNode(probe.typeNode);
  if(entry.mode==='occurrence') {
    const signatures=checker.getSignaturesOfType(type,ts.SignatureKind.Call);
    if(signatures.length!==1)throw new Error('Occurrence annotation has no unique instantiated return type');
    type=checker.getReturnTypeOfSignature(signatures[0]);
  }
  const occurrenceBindings=entry.mode==='occurrence'?Object.freeze({
    arguments:Object.freeze([...(probe.functionProbe.signatureTypeNode.typeArguments??[])]),
    originalParameters:Object.freeze([...(entry.occurrence.factory.callable.typeParameters??[])]),
    copiedParameters:Object.freeze([...(probe.functionProbe.declaration.typeParameters??[])]),
    originalValueParameter:entry.occurrence.factory.callable.parameters[0],
    copiedValueParameter:probe.functionProbe.declaration.parameters[0],
  }):undefined;
  return Object.freeze({program:probe.program,checker,type,occurrenceBindings,typeNode:entry.mode==='occurrence'?probe.functionProbe.annotationTypeNode:probe.typeNode,
    probe,mode:entry.mode,receipt:result.receipt,assertOriginal:()=>result.assertOriginal(entry.program,entry.owner,entry.tag)});
}

/** A private certificate is required before any consumer obtains its checker type.
 * Returned compiler objects belong to the replay, never the original Program.
 */
export function capturedFactoryAnnotationSemantics(result:any,program:any,callable:any,owner:any,tag:any) {
  assertCapturedFactoryAnnotationScope(result,program,callable,owner,tag);
  return semantics(certificates.get(result),result);
}
export function capturedOccurrenceAnnotationSemantics(result:any,program:any,root:any,stepIndex:number,tag:any) {
  assertCapturedOccurrenceAnnotationScope(result,program,root,stepIndex,tag);
  return semantics(certificates.get(result),result);
}

export function capturedModuleAnnotationSemantics(result:any,program:any,owner:any,tag:any) {
  assertCapturedAnnotationScope(result,program,owner,tag);return semantics(certificates.get(result),result);
}
