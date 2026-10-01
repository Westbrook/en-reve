import {createHash} from 'node:crypto';
import {ts} from './compiler-api.mjs';
import {capturedCompilerProgram} from './captured-compiler-program.ts';
import {constructorHeritageGraph} from './candidate-mixin-graph.ts';
import {checkCapturedFactoryAnnotationScope,capturedFactoryAnnotationSemantics,
 checkCapturedOccurrenceAnnotationScope,capturedOccurrenceAnnotationSemantics,checkCapturedAnnotationScope,capturedModuleAnnotationSemantics} from './captured-annotation-scope.ts';

const certificates=new WeakMap<object,any>();
const digest=(text:string)=>createHash('sha256').update(text).digest('hex');
const descriptor=(node:any)=>({fileName:node.getSourceFile().fileName,sourceSha256:digest(node.getSourceFile().text),kind:node.kind,start:node.getStart(),end:node.end});
const freeze=(value:any):any=>{if(value&&typeof value==='object'){for(const item of Object.values(value))freeze(item);Object.freeze(value);}return value;};

/** Public visibility for an exact factory annotation, including authored aliases
 * before erasure and the selected occurrence's explicit type arguments. This
 * neither selects the final facet nor grants dispatch/helper authority.
 */
function checkEventVisibility(program:any,callable:any,owner:any,tag:any,root:any,stepIndex:number|undefined,module:boolean) {
 const capture=capturedCompilerProgram(program),original=program.getTypeChecker();
 if(module&&(!capture.receipt.roots.some((name:string)=>program.getSourceFile(name)?.statements.includes(owner))||!ts.isClassDeclaration(owner)))
  throw new Error('Module event visibility requires an exact selected owner');
 const own=module?checkCapturedAnnotationScope(program,owner,tag):checkCapturedFactoryAnnotationScope(program,callable,owner,tag),ownSemantic=module?capturedModuleAnnotationSemantics(own,program,owner,tag):capturedFactoryAnnotationSemantics(own,program,callable,owner,tag);
 const ownParameter=callable?.parameters[0];
 if(!module&&(!ownParameter||!ownParameter.type||ownParameter.questionToken||ownParameter.initializer||ownParameter.dotDotDotToken||!ts.isIdentifier(ownParameter.name)))
  throw new Error('Event visibility constructor parameter requires exact typed required binding');
 const implementations=new Set<any>(module?[]:[owner]),parentParameters=new Set<any>(module?[]:[ownParameter]);
 const selected=capture.receipt.roots.map((name:string)=>program.getSourceFile(name));
 const seenOriginalSymbols=new Set<any>(),seenOriginalAnnotations=new Set<any>(),references:any[]=[];
 const unalias=(checker:any,symbol:any)=>symbol?.flags&ts.SymbolFlags.Alias?checker.getAliasedSymbol(symbol):symbol;
 const hidden=(node:any)=>Boolean(ts.getCombinedModifierFlags(node)&(ts.ModifierFlags.Private|ts.ModifierFlags.Protected))||Boolean(node.name&&ts.isPrivateIdentifier(node.name))||ts.getJSDocTags(node).some((tag:any)=>tag.tagName.text==='internal');
 const named=(symbol:any)=>symbol?.declarations?.some((node:any)=>ts.isClassDeclaration(node)||ts.isClassExpression(node)||ts.isInterfaceDeclaration(node)||ts.isTypeAliasDeclaration(node)||ts.isEnumDeclaration(node));
 function exported(symbol:any,seen=new Set<any>()):boolean {
  if(!symbol||seen.has(symbol))return false;seen=new Set(seen);seen.add(symbol);
  return symbol.declarations?.some((node:any)=>{
   const source=node.getSourceFile();if(program.getSourceFile(source.fileName)!==source)return false;
   if(program.isSourceFileDefaultLibrary(source))return true;
   let namespace;for(let parent=node.parent;parent&&!ts.isSourceFile(parent);parent=parent.parent)if(ts.isModuleDeclaration(parent)){namespace=parent;break;}
   const module=original.getSymbolAtLocation(namespace?.name??source);
   return module&&original.getExportsOfModule(module).some((entry:any)=>unalias(original,entry)===symbol)&&(!namespace||exported(module,seen));
  })??false;
 }
 function originalAnnotation(node:any) {
  if(!node||seenOriginalAnnotations.has(node))return;seenOriginalAnnotations.add(node);
  if(program.getSourceFile(node.getSourceFile().fileName)!==node.getSourceFile())throw new Error('Event visibility annotation is not an exact original node');
  const visit=(current:any)=>{
   if(ts.isTypeReferenceNode(current)||ts.isTypeQueryNode(current)||ts.isImportTypeNode(current)||ts.isExpressionWithTypeArguments(current)) {
    const expression=ts.isExpressionWithTypeArguments(current)?current.expression:undefined;
    const name=expression?(ts.isCallExpression(expression)?expression.expression:expression):ts.isTypeReferenceNode(current)?current.typeName:ts.isTypeQueryNode(current)?current.exprName:current.qualifier;
    const symbol=name&&original.getSymbolAtLocation(name);if(!symbol)throw new Error('Event visibility has an unresolved authored symbol');checkOriginal(symbol);
   }
   ts.forEachChild(current,visit);
  };visit(node);
 }
 function checkOriginal(input:any) {
  const symbol=unalias(original,input);if(!symbol?.declarations?.length)throw new Error('Event visibility has no original symbol declarations');
  if(seenOriginalSymbols.has(symbol))return;seenOriginalSymbols.add(symbol);
  if(symbol.declarations.some((node:any)=>program.getSourceFile(node.getSourceFile().fileName)!==node.getSourceFile()))throw new Error('Event visibility symbol belongs to another Program');
  const binder=symbol.declarations.every((node:any)=>ts.isTypeParameterDeclaration(node));
  const parentValue=symbol.declarations.length===1&&parentParameters.has(symbol.declarations[0]);
  const implementation=symbol.declarations.every((node:any)=>implementations.has(node));
  if(!binder&&!parentValue&&!implementation&&!exported(symbol))throw new Error('Public event references unexported type or value: '+symbol.name);
  references.push({name:symbol.name,declarations:symbol.declarations.map(descriptor)});
  for(const node of symbol.declarations) {
   if(!selected.includes(node.getSourceFile()))continue; // external named ownership is opaque after caller arguments

   if(ts.isTypeAliasDeclaration(node))originalAnnotation(node.type);
   if(ts.isTypeParameterDeclaration(node)){originalAnnotation(node.constraint);originalAnnotation(node.default);}
   if(parentValue)originalAnnotation(node.type);
   if(ts.isClassDeclaration(node)||ts.isClassExpression(node)||ts.isInterfaceDeclaration(node))
    for(const clause of node.heritageClauses??[])for(const heritage of clause.types)originalAnnotation(heritage);
   for(const parameter of node.typeParameters??[]){originalAnnotation(parameter.constraint);originalAnnotation(parameter.default);}
   if(ts.isFunctionDeclaration(node)||ts.isFunctionExpression(node)||ts.isArrowFunction(node)) {
    originalAnnotation(node.type);for(const parameter of node.parameters)originalAnnotation(parameter.type);
   }
  }
 }
 const semantics=[ownSemantic];
 if(root!==undefined) {
  const occurrence=checkCapturedOccurrenceAnnotationScope(program,root,stepIndex!,tag);
  semantics.push(capturedOccurrenceAnnotationSemantics(occurrence,program,root,stepIndex!,tag));
  const graph=constructorHeritageGraph(program,selected,(source:any)=>source.fileName,[root]),step=graph.compositionFor(graph.classes.get(root))[stepIndex!];
  for(const candidate of graph.compositionFor(graph.classes.get(root)))if(candidate.kind==='application') {
   const factory=candidate.application.factory,parameter=factory.parameter;
   if(parameter!==factory.callable.parameters[0]||!parameter.type||parameter.questionToken||parameter.initializer||parameter.dotDotDotToken||!ts.isIdentifier(parameter.name))
    throw new Error('Event visibility graph constructor parameter requires exact typed required binding');
   implementations.add(factory.implementation);parentParameters.add(parameter);
  }
  if(step?.kind!=='application'||step.application.factory.callable!==callable||step.application.factory.implementation!==owner)throw new Error('Event visibility requires its exact factory application');
  const inspectEdge=(edge:any)=>{
   if(edge.kind==='constructor-alias')return inspectEdge(edge.target);
   if(edge.kind==='application') {for(const node of edge.expression.typeArguments??[])originalAnnotation(node);inspectEdge(edge.argument);}
   if(edge.kind==='class-reference')for(const clause of edge.entry.node.heritageClauses??[])for(const node of clause.types)originalAnnotation(node);
  };inspectEdge(step.application);
 } else if(stepIndex!==undefined)throw new Error('Own event visibility cannot select an occurrence');
 for(const semantic of semantics) {
  const checker=semantic.checker,probe=semantic.probe,seenTypes=new Set<any>(),pending=new Set<any>(),binderMap=new Map<any,any>();
  // The private probe may name a deferred compiler type with its inserted
  // alias. That exact declaration is not authored source and has no reverse
  // source mapping. Keep its real target and all arguments in the type walk.
  const privateAlias=probe.typeNode.parent;
  if(!ts.isTypeAliasDeclaration(privateAlias)||privateAlias.type!==probe.typeNode)throw new Error('Event visibility requires its exact private probe alias');
  const privateAliasSymbol=checker.getSymbolAtLocation(privateAlias.name);
  if(privateAliasSymbol?.declarations?.length!==1||privateAliasSymbol.declarations[0]!==privateAlias)throw new Error('Event visibility private alias has no exact sole declaration');
  const namedTypeSymbol=(value:any)=>{
   const alias=unalias(checker,value.aliasSymbol);
   return alias&&alias!==privateAliasSymbol?alias:unalias(checker,value.getSymbol?.());
  };

  if(semantic.occurrenceBindings) {
   const bindings=semantic.occurrenceBindings;
   bindings.copiedParameters.forEach((node:any,index:number)=>binderMap.set(checker.getSymbolAtLocation(node.name),original.getSymbolAtLocation(bindings.originalParameters[index].name)));
   binderMap.set(checker.getSymbolAtLocation(bindings.copiedValueParameter.name),original.getSymbolAtLocation(bindings.originalValueParameter.name));
  }
  const queue=(input:any)=>{
   const symbol=unalias(checker,input);if(!symbol?.declarations?.length)throw new Error('Event visibility has an unresolved replay symbol');
   const binder=binderMap.get(symbol);if(binder)checkOriginal(binder);else pending.add(symbol);
  };
  const syntax=(node:any)=>{if(!node)return;const visit=(current:any)=>{
   if(ts.isTypeReferenceNode(current)||ts.isTypeQueryNode(current)||ts.isImportTypeNode(current)) {
    const name=ts.isTypeReferenceNode(current)?current.typeName:ts.isTypeQueryNode(current)?current.exprName:current.qualifier;
    if(!name)throw new Error('Event visibility import has no exact qualifier');queue(checker.getSymbolAtLocation(name));
   }ts.forEachChild(current,visit);
  };visit(node);};
  const selectedPaths=new Set(selected.map((source:any)=>source.fileName));
  function localClassNodes(value:any,seen=new Set<any>()):any[] {
   if(!value||seen.has(value))return [];seen.add(value);
   const symbol=namedTypeSymbol(value);
   const nodes=(symbol?.declarations??[]).filter((node:any)=>(ts.isClassDeclaration(node)||ts.isClassExpression(node))&&selectedPaths.has(node.getSourceFile().fileName));
   return [...new Set([...nodes,...(value.isUnionOrIntersection?.()?value.types.flatMap((part:any)=>localClassNodes(part,seen)):[])])];
  }
  function externalAncestors(classes:any[]) {
   const declarations=new Set<any>(),seen=new Set<any>();
   function visit(value:any,collect=true) {
    if(!value||seen.has(value))return;seen.add(value);if(seen.size>4096)throw new Error('Event external ancestry exceeds its bound');
    if(value.isUnionOrIntersection?.())for(const part of value.types)visit(part,collect);
    if(value.flags&ts.TypeFlags.TypeParameter){const constraint=checker.getBaseConstraintOfType(value);if(constraint&&constraint!==value)visit(constraint,collect);}
    const symbol=unalias(checker,value.getSymbol?.());
    if(collect)for(const node of symbol?.declarations??[]) {
     const source=node.getSourceFile();if((ts.isClassDeclaration(node)||ts.isClassExpression(node))&&semantic.program.getSourceFile(source.fileName)===source&&!selectedPaths.has(source.fileName)&&
       (semantic.program.isSourceFileFromExternalLibrary(source)||semantic.program.isSourceFileDefaultLibrary(source)))declarations.add(node);
    }
    for(const base of value.getBaseTypes?.()??[])visit(base);
    for(const signature of checker.getSignaturesOfType(value,ts.SignatureKind.Construct))visit(checker.getReturnTypeOfSignature(signature),collect);
    if(symbol){const declared=checker.getDeclaredTypeOfSymbol(symbol);if(declared!==value)visit(declared,collect);}
   }
   for(const node of classes) {
    const location=node.name??node.getChildren().find((child:any)=>child.kind===ts.SyntaxKind.ClassKeyword&&child.parent===node);
    const symbol=location&&checker.getSymbolAtLocation(location);if(symbol)visit(checker.getDeclaredTypeOfSymbol(symbol),false);
   }
   return declarations;
  }
  function type(value:any,location:any) {
   if(!value||seenTypes.has(value))return;seenTypes.add(value);if(seenTypes.size>4096)throw new Error('Event visibility type graph exceeds its bound');
   if(value.flags&ts.TypeFlags.TypeParameter){queue(value.getSymbol());type(checker.getBaseConstraintOfType(value),location);return;}
   const symbol=namedTypeSymbol(value);
   if(named(symbol))queue(symbol);
   for(const argument of value.aliasTypeArguments??[])type(argument,location);
   if((value.flags&ts.TypeFlags.Object)&&(value.objectFlags&ts.ObjectFlags.Reference))for(const argument of checker.getTypeArguments(value))type(argument,location);
   if(named(symbol)&&symbol.declarations.every((node:any)=>!selectedPaths.has(node.getSourceFile().fileName)))return;
   for(const base of value.getBaseTypes?.()??[])type(base,location);
   if(value.isUnionOrIntersection?.())for(const part of value.types)type(part,location);
   if(!(value.flags&ts.TypeFlags.Object))return;
   const localClasses=localClassNodes(value),externalBases=externalAncestors(localClasses);
   for(const property of value.getProperties()) {
    if(localClasses.length&&property.declarations?.length&&property.declarations.every((node:any)=>externalBases.has(node.parent)))continue;
    if(property.declarations?.length&&property.declarations.every(hidden))continue;
    for(const node of property.declarations??[])syntax(node.type);
    type(checker.getTypeOfSymbolAtLocation(property,property.valueDeclaration??location),location);
   }
   for(const info of checker.getIndexInfosOfType(value)){syntax(info.declaration?.type);type(info.keyType,location);type(info.type,location);}
   for(const kind of [ts.SignatureKind.Call,ts.SignatureKind.Construct])for(const signature of checker.getSignaturesOfType(value,kind)) {
    const declaration=signature.getDeclaration();syntax(declaration?.type);type(checker.getReturnTypeOfSignature(signature),location);
    type(checker.getTypePredicateOfSignature(signature)?.type,location);
    for(const parameter of signature.getTypeParameters()??[])type(parameter,location);
    for(const parameter of [signature.thisParameter,...signature.parameters].filter(Boolean)) {
     for(const node of parameter.declarations??[])syntax(node.type);
     type(checker.getTypeOfSymbolAtLocation(parameter,parameter.valueDeclaration??location),location);
    }
   }
  }
  syntax(semantic.typeNode);type(semantic.type,semantic.typeNode);
  for(const symbol of probe.mapOriginalSymbols([...pending]))checkOriginal(symbol);
  semantic.assertOriginal();
 }
 function assertOriginal(expectedProgram=program,expectedCallable=callable,expectedOwner=owner,expectedTag=tag,expectedRoot=root,expectedStep=stepIndex) {
  if(expectedProgram!==program||expectedCallable!==callable||expectedOwner!==owner||expectedTag!==tag||expectedRoot!==root||expectedStep!==stepIndex)throw new Error('Event visibility requires its exact original binding');
  for(const semantic of semantics)semantic.assertOriginal();return true;
 }
 const receipt=freeze({version:1,scope:module?'module-event-visibility':root?'factory-occurrence-visibility':'factory-own-visibility',references,source:descriptor(owner),tag:descriptor(tag),...(root?{root:descriptor(root),step:stepIndex}:{}),finalFacetBound:false,dispatchChecked:false});
 const result=Object.freeze({receipt,assertOriginal});certificates.set(result,{program,callable,owner,tag,root,stepIndex,module});return result;
}
export function checkCapturedEventVisibility(program:any,callable:any,owner:any,tag:any,root?:any,stepIndex?:number) {
 return checkEventVisibility(program,callable,owner,tag,root,stepIndex,false);
}
export function checkCapturedModuleEventVisibility(program:any,owner:any,tag:any) {
 return checkEventVisibility(program,undefined,owner,tag,undefined,undefined,true);
}
export function assertCapturedModuleEventVisibility(result:any,program:any,owner:any,tag:any) {
 const entry=certificates.get(result);if(!entry?.module||entry.program!==program||entry.owner!==owner||entry.tag!==tag)throw new Error('Unknown module event visibility');return result.assertOriginal(program,undefined,owner,tag,undefined,undefined);
}
export function assertCapturedEventVisibility(result:any,program:any,callable:any,owner:any,tag:any,root?:any,stepIndex?:number) {
 const entry=certificates.get(result);if(!entry||entry.module||entry.program!==program||entry.callable!==callable||entry.owner!==owner||entry.tag!==tag||entry.root!==root||entry.stepIndex!==stepIndex)throw new Error('Unknown captured event visibility proof');
 return result.assertOriginal(program,callable,owner,tag,root,stepIndex);
}
