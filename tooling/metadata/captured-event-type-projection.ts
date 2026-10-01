import {createHash} from 'node:crypto';
import {ts} from './compiler-api.mjs';
import {capturedCompilerProgram} from './captured-compiler-program.ts';
import {checkCapturedFactoryAnnotationScope,capturedFactoryAnnotationSemantics,
  checkCapturedOccurrenceAnnotationScope,capturedOccurrenceAnnotationSemantics,checkCapturedAnnotationScope,capturedModuleAnnotationSemantics} from './captured-annotation-scope.ts';

const certificates=new WeakMap<object,any>();
const hash=(text:string)=>createHash('sha256').update(text).digest('hex');
const freeze=(value:any):any=>{if(value&&typeof value==='object'){for(const item of Object.values(value))freeze(item);Object.freeze(value);}return value;};
const descriptor=(node:any)=>({fileName:node.getSourceFile().fileName,sourceSha256:hash(node.getSourceFile().text),kind:node.kind,start:node.getStart(),end:node.end});

/** A source-syntax projection, not an event-admission certificate. Generic
 * substitution is keyed by exact original binder symbols and argument strings
 * already certified against the original call in one replay checker. Every
 * free name retains its original symbol or an exact captured import edge.
 * No caller text, compiler Type from another Program, or live host fallback
 * can authorize this route. Public visibility and dispatch remain separate.
 */
function projectEventType(program:any,callable:any,owner:any,tag:any,root:any,stepIndex:number|undefined,module:boolean) {
  const capture=capturedCompilerProgram(program),checker=program.getTypeChecker();
  const own=!module&&root===undefined;
  if(module) {
    if(!capture.receipt.roots.some((name:string)=>program.getSourceFile(name)?.statements.includes(owner))||!ts.isClassDeclaration(owner))
      throw new Error('Module event projection requires an exact selected owner');
    if(stepIndex!==undefined||!capture.receipt.roots.some((name:string)=>program.getSourceFile(name)?.statements.includes(root))||!ts.isClassDeclaration(root)||root.typeParameters?.length)
      throw new Error('Module event projection requires an exact nongeneric selected root');
  }
  if(own&&stepIndex!==undefined)throw new Error('Own event template cannot have an occurrence index');
  const annotation=module?checkCapturedAnnotationScope(program,owner,tag):own?checkCapturedFactoryAnnotationScope(program,callable,owner,tag)
    :checkCapturedOccurrenceAnnotationScope(program,root,stepIndex!,tag);
  const semantic=module?capturedModuleAnnotationSemantics(annotation,program,owner,tag):own?capturedFactoryAnnotationSemantics(annotation,program,callable,owner,tag)
    :capturedOccurrenceAnnotationSemantics(annotation,program,root,stepIndex!,tag);
  // The occurrence certificate selected its exact factory; a caller cannot
  // pair the tag with another same-shaped owner/callable.
  semantic.assertOriginal();
  if(!['event','fires'].includes(tag.tagName.text))throw new Error('Event projection requires an exact authored event tag');
  if(!own&&!module) {
    if(owner!==tag.parent?.parent)throw new Error('Event projection requires its exact original factory owner');
    let containing=owner.parent;
    while(containing&&!ts.isFunctionDeclaration(containing)&&!ts.isFunctionExpression(containing)&&!ts.isArrowFunction(containing))containing=containing.parent;
    if(containing!==callable||!ts.getJSDocTags(owner).includes(tag)||tag.parent?.parent!==owner)
      throw new Error('Event projection requires its exact original factory owner');
  }
  const source=owner.getSourceFile(),output=own?callable:root,outputSource=output.getSourceFile();
  const unalias=(symbol:any)=>symbol?.flags&ts.SymbolFlags.Alias?checker.getAliasedSymbol(symbol):symbol;
  const parameters=callable?.typeParameters??[],binderArguments=new Map<any,string>();
  if(!own&&!module) {
    const bindings=semantic.occurrenceBindings;
    if(!bindings||bindings.originalParameters.length!==parameters.length||bindings.arguments.length!==parameters.length||
      bindings.originalParameters.some((parameter:any,index:number)=>parameter!==parameters[index]))throw new Error('Event projection has no private checked argument correspondence');
    parameters.forEach((parameter:any,index:number)=>binderArguments.set(checker.getSymbolAtLocation(parameter.name),bindings.arguments[index].getText()));
  }
  const valueParameter=callable?.parameters[0],valueSymbol=valueParameter&&checker.getSymbolAtLocation(valueParameter.name);
  const references:any[]=[],checks:Array<()=>void>=[],printer=ts.createPrinter({removeComments:true});
  function parse(text:string) {
    if(typeof text!=='string'||!text.trim()||text.length>65536)throw new Error('Projected event syntax must be bounded');
    const file=ts.createSourceFile('__event_projection.ts',`type __Event=${text};`,source.languageVersion,true);
    if(file.parseDiagnostics.length||file.statements.length!==1||!ts.isTypeAliasDeclaration(file.statements[0]))throw new Error('Projected event syntax must contain one type');
    return file.statements[0].type;
  }
  function entity(name:any,scope:any,meaning:number):any {
    if(ts.isIdentifier(name))return unalias(checker.resolveName(name.text,scope,meaning|ts.SymbolFlags.Alias,false));
    const left=entity(name.left,scope,meaning|ts.SymbolFlags.Namespace);
    return left?.flags&ts.SymbolFlags.Module?unalias(checker.getExportsOfModule(left).find((entry:any)=>entry.name===name.right.text)):undefined;
  }
  function boundInfer(name:any):boolean {
    if(!ts.isIdentifier(name))return false;
    for(let parent=name.parent;parent;parent=parent.parent) {
      if(!ts.isConditionalTypeNode(parent))continue;
      // An infer declaration binds only the conditional's true branch.
      let branch=name;while(branch.parent&&branch.parent!==parent)branch=branch.parent;
      if(branch!==parent.trueType)continue;
      let found=false;const visit=(node:any)=>{if(ts.isInferTypeNode(node)&&node.typeParameter.name.text===name.text)found=true;ts.forEachChild(node,visit);};visit(parent.extendsType);
      if(found)return true;
    }
    return false;
  }
  function reference(symbol:any,name:any,meaning:number,args:any[]|undefined,isQuery:boolean,context:any) {
    if(!symbol?.declarations?.length||!(symbol.flags&meaning))throw new Error('Projected event has no exact original free symbol');
    const renderedArgs=args?.map(argument=>ts.visitNode(argument,context.visit));
    const same=entity(name,output,meaning)===symbol;
    const declarations=symbol.declarations.map(descriptor);
    if(same) {
      references.push({kind:'same-symbol',name:name.getText(),meaning,declarations});
      checks.push(()=>{if(entity(name,output,meaning)!==symbol)throw new Error('Projected event output symbol changed');});
      return isQuery?ts.factory.createTypeQueryNode(name,renderedArgs):ts.factory.createTypeReferenceNode(name,renderedArgs);
    }
    const imported=capture.constructorImport?.(symbol,outputSource)??capture.annotationImportReference?.(symbol,outputSource);
    if(!imported)throw new Error('Event relocation requires an exact captured public import edge');
    const node=parse(imported);
    if(!ts.isImportTypeNode(node)||node.isTypeOf||node.attributes||!node.qualifier)throw new Error('Captured event import has unexpected syntax');
    references.push({kind:'captured-import',name:imported,meaning,declarations});
    checks.push(()=>{if((capture.constructorImport?.(symbol,outputSource)??capture.annotationImportReference?.(symbol,outputSource))!==imported)throw new Error('Projected event import identity changed');});
    return ts.factory.createImportTypeNode(ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(node.argument.literal.text)),undefined,ts.factory.createIdentifier(node.qualifier.text),renderedArgs,isQuery);
  }
  function project(node:any,scope:any,substitute:boolean,argumentCandidate=false,depth=0):any {
    if(depth>64)throw new Error('Event substitution exceeds its bounded depth');
    const transformed=ts.transform(node,[(context:any)=>{
      const state:any={};
      const visit=(current:any):any=>{
        // Parsed candidates originate in distinct syntax files. Fresh literal
        // nodes cannot reuse their offsets in the annotation's source text.
        if(ts.isStringLiteral(current))return ts.factory.createStringLiteral(current.text);
        if(ts.isNumericLiteral(current))return ts.factory.createNumericLiteral(current.text);
        if(ts.isBigIntLiteral(current))return ts.factory.createBigIntLiteral(current.text);
        if(ts.isNoSubstitutionTemplateLiteral(current)||ts.isTemplateLiteralTypeNode(current))throw new Error('Projected template literals require a syntax adapter');
        if(substitute&&ts.isConditionalTypeNode(current))throw new Error('Conditional event substitution requires a distributive-type adapter');
        if(current.typeParameters?.length||ts.isMappedTypeNode(current)||current.kind===ts.SyntaxKind.ThisType||ts.isComputedPropertyName(current))throw new Error('Projected event requires a local-binder adapter');
        if(ts.isInferTypeNode(current)) {
          if(!argumentCandidate)throw new Error('Authored infer syntax requires a lexical adapter');
          return ts.visitEachChild(current,visit,context);
        }
        if(ts.isTypeReferenceNode(current)||ts.isTypeQueryNode(current)) {
          const isQuery=ts.isTypeQueryNode(current),name=isQuery?current.exprName:current.typeName,meaning=isQuery?ts.SymbolFlags.Value:ts.SymbolFlags.Type;
          if(argumentCandidate&&boundInfer(name))return ts.visitEachChild(current,visit,context);
          const symbol=entity(name,scope,meaning);
          if(substitute&&binderArguments.has(symbol)) {
            if(isQuery||current.typeArguments?.length)throw new Error('Factory type binder has unexpected query or arguments');
            return project(parse(binderArguments.get(symbol)!),callable,false,true,depth+1);
          }
          if(substitute&&symbol===valueSymbol) {
            if(!isQuery||!ts.isIdentifier(name)||current.typeArguments?.length||!valueParameter.type)throw new Error('Factory value binder needs a dedicated projection adapter');
            const copied=semantic.occurrenceBindings?.copiedValueParameter;
            if(!copied?.type||semantic.occurrenceBindings.originalValueParameter!==valueParameter||valueParameter.questionToken||valueParameter.dotDotDotToken||valueParameter.initializer||!ts.isIdentifier(valueParameter.name))
              throw new Error('Factory value query requires one exact required typed parameter');
            const queryNodes:any[]=[];
            const find=(node:any)=>{if(ts.isTypeQueryNode(node)&&ts.isIdentifier(node.exprName)&&node.exprName.text===name.text)queryNodes.push(node);ts.forEachChild(node,find);};find(semantic.typeNode);
            const parameterType=semantic.checker.getTypeFromTypeNode(copied.type),parameterSymbol=semantic.checker.getSymbolAtLocation(copied.name);
            if(!queryNodes.length||queryNodes.some(query=>semantic.checker.getSymbolAtLocation(query.exprName)!==parameterSymbol||semantic.checker.getTypeFromTypeNode(query)!==parameterType))
              throw new Error('Factory value query has no exact same-replay declared type identity');
            return project(parse(valueParameter.type.getText()),callable,true,false,depth+1);
          }
          if(own&&isQuery&&symbol===valueSymbol&&ts.isIdentifier(name)&&!current.typeArguments?.length) {
            if(entity(name,callable,meaning)!==valueSymbol||!ts.isIdentifier(valueParameter.name)||valueParameter.questionToken||valueParameter.dotDotDotToken||valueParameter.initializer)
              throw new Error('Own event value query requires its exact original required binder');
            references.push({kind:'original-value-binder',name:name.text,meaning,declarations:valueSymbol.declarations.map(descriptor)});
            checks.push(()=>{if(entity(name,callable,meaning)!==valueSymbol)throw new Error('Own event value binder changed');});
            return ts.factory.createTypeQueryNode(ts.factory.createIdentifier(name.text));
          }
          if(!own&&symbol?.flags&ts.SymbolFlags.TypeParameter)throw new Error('Unsubstituted event type parameter');
          if(!symbol||symbol.flags&ts.SymbolFlags.FunctionScopedVariable||symbol.flags&ts.SymbolFlags.BlockScopedVariable) {
            // Bare value-parameter substitution above is the sole factory-local
            // value route. A module value is permitted if it has exact ownership.
            if(symbol?.declarations?.some((decl:any)=>decl.getSourceFile()===source&&decl.parent!==source&&ts.isParameter(decl)))throw new Error('Unsubstituted event value parameter');
          }
          checks.push(()=>{if(entity(name,scope,meaning)!==symbol)throw new Error('Projected event authored symbol changed');});
          return reference(symbol,name,meaning,current.typeArguments,isQuery,state);
        }
        if(ts.isImportTypeNode(current)) {
          if((!argumentCandidate&&!capture.annotationImportSymbol)||current.attributes||!ts.isLiteralTypeNode(current.argument)||!ts.isStringLiteral(current.argument.literal)||!current.qualifier||!ts.isIdentifier(current.qualifier))
            throw new Error('Event import syntax requires an exact captured argument adapter');
          const specifier=current.argument.literal.text,name=current.qualifier.text,symbol=argumentCandidate?capture.constructorImportSymbol?.(specifier,name,scope.getSourceFile())??capture.annotationImportSymbol?.(specifier,name,scope.getSourceFile()):capture.annotationImportSymbol?.(specifier,name,scope.getSourceFile());
          if(!symbol)throw new Error('Event argument import has no recorded original identity');
          // A synthetic identifier is only a syntax candidate. The reverse
          // capability above, not name lookup, determines original ownership.
          return reference(symbol,current.qualifier,current.isTypeOf?ts.SymbolFlags.Value:ts.SymbolFlags.Type,current.typeArguments,current.isTypeOf,state);
        }
        return ts.visitEachChild(current,visit,context);
      };state.visit=visit;return(node:any)=>ts.visitNode(node,visit);
    }]);
    try{return transformed.transformed[0];}finally{transformed.dispose();}
  }
  const syntax=parse(annotation.receipt.text),projected=project(syntax,owner,!own&&!module),text=printer.printNode(ts.EmitHint.Unspecified,projected,syntax.getSourceFile());
  // Printing must preserve the complete supported syntax tree, including
  // literal payload values and captured module specifiers. Parentheses added
  // for precedence are transparent; all other nodes and tokens stay exact.
  function shape(node:any):any {
    if(ts.isParenthesizedTypeNode(node))return shape(node.type);
    const children:any[]=[];ts.forEachChild(node,(child:any)=>{children.push(shape(child));});
    return [node.kind,node.operator??null,node.isTypeOf??null,ts.isIdentifier(node)||ts.isStringLiteral(node)||ts.isNumericLiteral(node)||ts.isBigIntLiteral(node)?node.text:null,children];
  }
  if(JSON.stringify(shape(projected))!==JSON.stringify(shape(parse(text))))throw new Error('Event printer changed projected syntax or literal identity');
  let rootProbe:any,detail:string|undefined;
  if(!own) {
    rootProbe=capture.replayTypeProbe(outputSource,text);
    const rootChecker=rootProbe.program.getTypeChecker(),eventType=rootChecker.getTypeFromTypeNode(rootProbe.typeNode),property=eventType.getProperty('detail');
    const globalEvent=rootChecker.resolveName('CustomEvent',rootProbe.typeNode,ts.SymbolFlags.Type,false);
    function platform(type:any,seen=new Set<any>()):boolean {
      if(!type||seen.has(type)||seen.size>=128)return false;seen.add(type);
      if(type.getSymbol?.()===globalEvent)return true;
      if(type.isUnion?.())return type.types.every((part:any)=>platform(part,new Set(seen)));
      if(type.isIntersection?.())return type.types.some((part:any)=>platform(part,new Set(seen)));
      return(type.getBaseTypes?.()??[]).some((base:any)=>platform(base,seen));
    }
    if(!globalEvent?.declarations?.every((node:any)=>rootProbe.program.isSourceFileDefaultLibrary(node.getSourceFile()))||!platform(eventType)||!property)
      throw new Error('Projected public event requires platform CustomEvent detail');
    const detailType=rootChecker.getTypeOfSymbolAtLocation(property,rootProbe.typeNode);
    if(detailType.flags&(ts.TypeFlags.Any|ts.TypeFlags.Unknown|ts.TypeFlags.Never))throw new Error('Projected event requires checked non-any detail');
    detail=rootChecker.typeToString(detailType,rootProbe.typeNode,ts.TypeFormatFlags.NoTruncation|ts.TypeFormatFlags.UseFullyQualifiedType);
    // Absolute compiler imports need a separately checked relocation adapter.
    // Relative output imports are already source-owned captured edges.
    if(/import\(["']\//.test(detail)) {
      if(!capture.eventPrintedImportReference)throw new Error('Event detail printer requires a captured relative representation adapter');
      const syntax=parse(detail),file=syntax.getSourceFile(),offset=syntax.getStart(file),edits:any[]=[];
      if(syntax.getText(file)!==detail)throw new Error('Event detail printer syntax cannot be rebound exactly');
      const visit=(node:any)=>{
        if(ts.isImportTypeNode(node)&&ts.isLiteralTypeNode(node.argument)&&ts.isStringLiteral(node.argument.literal)&&node.argument.literal.text.startsWith('/')) {
          if(node.attributes||!node.qualifier||!ts.isIdentifier(node.qualifier))throw new Error('Printed event detail import requires an exact named export');
          const specifier=node.argument.literal.text,name=node.qualifier.text,reference=capture.eventPrintedImportReference(specifier,name,outputSource),candidate=parse(reference);
          if(!ts.isImportTypeNode(candidate)||candidate.isTypeOf||candidate.attributes||!candidate.qualifier||!ts.isIdentifier(candidate.qualifier))throw new Error('Captured detail import has unexpected syntax');
          edits.push({start:node.argument.literal.getStart(file)-offset,end:node.argument.literal.end-offset,text:JSON.stringify(candidate.argument.literal.text)},
            {start:node.qualifier.getStart(file)-offset,end:node.qualifier.end-offset,text:candidate.qualifier.text});
          checks.push(()=>{if(capture.eventPrintedImportReference(specifier,name,outputSource)!==reference)throw new Error('Event detail public import changed');});
        }
        ts.forEachChild(node,visit);
      };visit(syntax);
      for(const edit of edits.sort((a,b)=>b.start-a.start))detail=detail.slice(0,edit.start)+edit.text+detail.slice(edit.end);
      parse(detail);
    }
  }
  function assertOriginal(expectedProgram=program,expectedCallable=callable,expectedOwner=owner,expectedTag=tag,expectedRoot=root,expectedStep=stepIndex) {
    if(expectedProgram!==program||expectedCallable!==callable||expectedOwner!==owner||expectedTag!==tag||expectedRoot!==root||expectedStep!==stepIndex)throw new Error('Event type projection requires its exact original binding');
    semantic.assertOriginal();rootProbe?.assertUnchanged();for(const check of checks)check();return true;
  }
  assertOriginal();
  const receipt=freeze({version:1,scope:module?'module-event-syntax':own?'factory-own-template':'factory-occurrence-syntax',source:descriptor(owner),output:descriptor(output),tag:descriptor(tag),
    annotation:annotation.receipt,substitutions:own?[]:parameters.map((parameter:any,index:number)=>({parameter:descriptor(parameter),argument:annotation.receipt.occurrence.arguments[index]})),
    type:text,...(detail!==undefined?{detail}:{}),references,publicVisibilityChecked:false,dispatchChecked:false,finalFacetBound:false});
  const result=Object.freeze({receipt,assertOriginal});certificates.set(result,{program,callable,owner,tag,root,stepIndex,module});return result;
}

export function projectCapturedFactoryEventType(program:any,callable:any,owner:any,tag:any,root?:any,stepIndex?:number) {
  return projectEventType(program,callable,owner,tag,root,stepIndex,false);
}
export function projectCapturedModuleEventType(program:any,owner:any,tag:any,root:any=owner) {
  return projectEventType(program,undefined,owner,tag,root,undefined,true);
}
export function assertCapturedModuleEventTypeProjection(result:any,program:any,owner:any,tag:any,root:any=owner) {
  const entry=certificates.get(result);
  if(!entry?.module||entry.program!==program||entry.owner!==owner||entry.tag!==tag||entry.root!==root)throw new Error('Unknown module event type projection');
  return result.assertOriginal(program,undefined,owner,tag,root,undefined);
}
export function assertCapturedEventTypeProjection(result:any,program:any,callable:any,owner:any,tag:any,root?:any,stepIndex?:number) {
  const entry=certificates.get(result);
  if(!entry||entry.module||entry.program!==program||entry.callable!==callable||entry.owner!==owner||entry.tag!==tag||entry.root!==root||entry.stepIndex!==stepIndex)throw new Error('Unknown captured event type projection');
  return result.assertOriginal(program,callable,owner,tag,root,stepIndex);
}
