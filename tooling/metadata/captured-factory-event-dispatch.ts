import {createHash} from 'node:crypto';
import {ts} from './compiler-api.mjs';
import {capturedCompilerProgram} from './captured-compiler-program.ts';
import {checkCapturedFactoryAnnotationScope,capturedFactoryAnnotationSemantics,checkCapturedAnnotationScope,capturedModuleAnnotationSemantics} from './captured-annotation-scope.ts';

const certificates=new WeakMap<object,any>();
const hash=(text:string)=>createHash('sha256').update(text).digest('hex');
const descriptor=(node:any)=>({fileName:node.getSourceFile().fileName,sourceSha256:hash(node.getSourceFile().text),kind:node.kind,start:node.getStart(),end:node.end});
const unalias=(checker:any,symbol:any)=>symbol?.flags&ts.SymbolFlags.Alias?checker.getAliasedSymbol(symbol):symbol;
function freeze(value:any):any{if(value&&typeof value==='object'){for(const item of Object.values(value))freeze(item);Object.freeze(value);}return value;}

/** Check a generic factory declaration's directly owned helper calls in the
 * same replay checker as its authored event type. The caller must bind the
 * exact helper module to its package policy before public admission. This
 * receipt proves neither a final constructor occurrence nor visibility.
 */
function checkFactoryDispatch(program:any,callable:any,owner:any,tag:any,helperSource:any,includeDirect:boolean,moduleOwner=false) {
  const capture=capturedCompilerProgram(program);capture.assertOriginal(program);
  if(moduleOwner&&(!capture.receipt.roots.some((name:string)=>program.getSourceFile(name)?.statements.includes(owner))||!ts.isClassDeclaration(owner)))throw new Error('Module emission requires an exact selected owner');
  if((!includeDirect||helperSource!==undefined)&&!program.getSourceFiles().includes(helperSource))throw new Error('Dispatch helpers require an exact original source module');
  const originalChecker=program.getTypeChecker(),module=helperSource&&originalChecker.getSymbolAtLocation(helperSource);
  if((!includeDirect||helperSource!==undefined)&&!module)throw new Error('Dispatch helpers require an original external module');
  const helperNames=['dispatchChange','dispatchAction','dispatchDraftInput',...(includeDirect?['dispatchNotification']:[])];
  const helpers=new Map<any,string>();
  for(const name of module?helperNames:[]) {
    const symbol=unalias(originalChecker,originalChecker.getExportsOfModule(module).find((entry:any)=>entry.name===name));
    if(includeDirect&&name==='dispatchNotification'&&!symbol)continue;
    if(!symbol?.declarations?.length||symbol.declarations.length!==1||!ts.isFunctionDeclaration(symbol.declarations[0])||symbol.declarations[0].getSourceFile()!==helperSource)
      throw new Error('Dispatch helper has no exact exported function declaration: '+name);
    helpers.set(symbol,name);
  }
  const annotation=moduleOwner?checkCapturedAnnotationScope(program,owner,tag):checkCapturedFactoryAnnotationScope(program,callable,owner,tag);
  const semantic=moduleOwner?capturedModuleAnnotationSemantics(annotation,program,owner,tag):capturedFactoryAnnotationSemantics(annotation,program,callable,owner,tag),{checker,probe}=semantic;
  if(!['fires','event'].includes(tag.tagName.text))throw new Error('Factory event dispatch requires an event annotation');
  const name=owner.getSourceFile().text.slice(annotation.receipt.typeEnd+1,tag.end).trim().split(/\s/)[0];
  const globalEvent=unalias(checker,checker.resolveName('CustomEvent',semantic.typeNode,ts.SymbolFlags.Type,false));
  if(!globalEvent?.declarations?.length||!globalEvent.declarations.every((node:any)=>probe.program.isSourceFileDefaultLibrary(node.getSourceFile())))
    throw new Error('Typed event requires the platform CustomEvent declaration');
  const eventVariants=semantic.type.isUnion()?semantic.type.types:[semantic.type],details:any[]=[];
  function hasPlatformBase(type:any,seen=new Set<any>()):boolean {
    if(!type||seen.has(type)||seen.size>128)return false;seen.add(type);
    if(unalias(checker,type.getSymbol())===globalEvent)return true;
    if(type.isIntersection?.()&&type.types.some((part:any)=>hasPlatformBase(part,seen)))return true;
    return (type.getBaseTypes?.()??[]).some((base:any)=>hasPlatformBase(base,seen));
  }
  for(const type of eventVariants) {
    if(type.flags&(ts.TypeFlags.Any|ts.TypeFlags.Unknown|ts.TypeFlags.Never)||!hasPlatformBase(type))
      throw new Error('Factory event annotation requires a typed platform CustomEvent');
    const property=type.getProperty('detail'),detail=property&&checker.getTypeOfSymbolAtLocation(property,semantic.typeNode);
    if(!detail||detail.flags&(ts.TypeFlags.Any|ts.TypeFlags.Unknown|ts.TypeFlags.Never))throw new Error('Factory event detail must be checked and non-any');
    details.push(...(detail.isUnion()?detail.types:[detail]));
  }
  const factoryTypeParameters=new Set(includeDirect&&!moduleOwner
    ? (callable.typeParameters??[]).map((parameter:any)=>checker.getTypeAtLocation(probe.mapReplayNode(parameter))) : []);
  const overlayOwner=probe.mapReplayNode(owner);
  if(!(ts.isClassExpression(overlayOwner)||ts.isClassDeclaration(overlayOwner)))throw new Error('Factory event has no exact original replay owner');
  const calls:any[]=[],allOwnDispatches:any[]=[];
  function plainFields(expression:any,label:string):Map<string,any> {
    if(!expression)throw new Error(label+' requires an explicit object literal');
    while(ts.isParenthesizedExpression(expression))expression=expression.expression;
    if(!ts.isObjectLiteralExpression(expression))throw new Error(label+' requires an explicit object literal adapter');
    const fields=new Map<string,any>();
    for(const property of expression.properties) {
      if(!(ts.isPropertyAssignment(property)||ts.isShorthandPropertyAssignment(property))||!property.name||!(ts.isIdentifier(property.name)||ts.isStringLiteral(property.name)))
        throw new Error(label+' cannot contain spread, computed or accessor fields');
      if(ts.isPropertyAssignment(property)&&property.name.text==='__proto__')throw new Error(label+' prototype setter is not an emitted own field');
      if(fields.has(property.name.text))throw new Error(label+' contains a duplicated field');
      fields.set(property.name.text,ts.isShorthandPropertyAssignment(property)?property.name:property.initializer);
    }
    return fields;
  }
  function actualType(expression:any) {
    const seenSyntax=new Set<any>(),seenTypes=new Set<any>();
    function syntax(node:any) {
      if(!node||seenSyntax.has(node))return;
      if(seenSyntax.size>=512)throw new Error('Dispatch expression closure requires a bounded adapter');seenSyntax.add(node);
      if(ts.isAsExpression(node)||ts.isTypeAssertionExpression(node)||ts.isNonNullExpression(node))throw new Error('Dispatch payload assertion requires a separate proof');
      if(ts.isCallExpression(node)||ts.isNewExpression(node)||ts.isAwaitExpression(node)||ts.isTaggedTemplateExpression(node))throw new Error('Indirect dispatch payload values require a producer proof');
      if(ts.isElementAccessExpression(node))throw new Error('Indexed payload values require a property adapter');
      if(ts.isIdentifier(node)||ts.isPropertyAccessExpression(node)||ts.isElementAccessExpression(node)) {
        const valueSymbol=ts.isIdentifier(node)&&ts.isShorthandPropertyAssignment(node.parent)&&node.parent.name===node
          ? checker.getShorthandAssignmentValueSymbol(node.parent):checker.getSymbolAtLocation(node);
        const symbol=unalias(checker,valueSymbol);
        for(const declaration of symbol?.declarations??[]) {
          if(ts.isBindingElement(declaration))throw new Error('Destructured payload aliases require a flow adapter');
          if(ts.isPropertyDeclaration(declaration))throw new Error('Stored payload fields require a flow adapter');
          if(ts.isVariableDeclaration(declaration)) {
            if(!(declaration.parent.flags&ts.NodeFlags.Const)||!declaration.initializer)throw new Error('Mutable or uninitialized payload aliases require a flow adapter');
            const declared=checker.getTypeAtLocation(declaration.name);
            if(declared.flags&ts.TypeFlags.Object)throw new Error('Object payload aliases require a flow adapter');
            checked(checker.getTypeAtLocation(declaration.initializer));syntax(declaration.initializer);
          } else if(ts.isParameter(declaration)&&declaration.initializer) {
            checked(checker.getTypeAtLocation(declaration.initializer));syntax(declaration.initializer);
          }
          else if(ts.isGetAccessorDeclaration(declaration))throw new Error('Accessor payload values require a producer proof');
        }
      }
      if(includeDirect&&ts.isObjectLiteralExpression(node))plainFields(node,'Direct event nested detail');
      ts.forEachChild(node,syntax);
    }
    function checked(type:any) {
      if(!type||seenTypes.has(type))return;
      if(seenTypes.size>=512)throw new Error('Dispatch payload type closure exceeds its bound');seenTypes.add(type);
      if(type.flags&(ts.TypeFlags.Any|ts.TypeFlags.Unknown))throw new Error('Dispatch payload contains unchecked any or unknown');
      if(includeDirect&&type.flags&(ts.TypeFlags.TypeParameter|ts.TypeFlags.IndexedAccess|ts.TypeFlags.Conditional)) {
        const alias=unalias(checker,type.aliasSymbol);
        if(type.flags&ts.TypeFlags.Conditional&&alias?.name==='InstanceType'&&alias.declarations?.length===1&&probe.program.isSourceFileDefaultLibrary(alias.declarations[0].getSourceFile())) {
          const arguments_=type.aliasTypeArguments;
          if(arguments_?.length!==1)throw new Error('Platform InstanceType requires its one exact constructor argument');
          const seenConstructors=new Set<any>();
          const constructorShape=(value:any)=>{
            if(!value||seenConstructors.has(value))return;
            if(seenConstructors.size>=128)throw new Error('InstanceType constructor constraint exceeds its bound');seenConstructors.add(value);
            if(value.flags&(ts.TypeFlags.Any|ts.TypeFlags.Unknown))throw new Error('InstanceType constructor constraint is unchecked');
            if(value.flags&(ts.TypeFlags.Conditional|ts.TypeFlags.IndexedAccess))throw new Error('Deferred InstanceType constructor dependency requires a dedicated adapter');
            if(value.isUnionOrIntersection?.())for(const part of value.types)constructorShape(part);
            if(value.flags&ts.TypeFlags.TypeParameter) {
              for(const declaration of value.getSymbol()?.declarations??[])if(ts.isTypeParameterDeclaration(declaration)&&declaration.constraint)constructorShape(checker.getTypeFromTypeNode(declaration.constraint));
              const constraint=checker.getBaseConstraintOfType(value);if(!constraint||constraint===value)throw new Error('InstanceType constructor has no checked constraint');constructorShape(constraint);
            }
          };
          // Constructor parameter types are not emitted instance values. Their
          // declared dependency shapes still cannot hide erased any branches.
          constructorShape(arguments_[0]);
          const constructor=checker.getBaseConstraintOfType(arguments_[0])??arguments_[0];
          if(constructor.flags&(ts.TypeFlags.Any|ts.TypeFlags.Unknown))throw new Error('InstanceType constructor constraint is unchecked');
          const signatures=checker.getSignaturesOfType(constructor,ts.SignatureKind.Construct);
          if(!signatures.length||signatures.some((signature:any)=>signature.getTypeParameters()?.length))throw new Error('InstanceType constructor needs a checked return-type adapter');
          for(const signature of signatures)checked(checker.getReturnTypeOfSignature(signature));
          return;
        }
        if(type.flags&ts.TypeFlags.Conditional)throw new Error('Conditional payload branches require a dedicated value-shape adapter');
        if(type.flags&ts.TypeFlags.IndexedAccess) {
          // The final base constraint may have discarded an any conditional
          // branch. Audit its dependencies before using that reduced shape.
          checked(type.objectType);checked(type.indexType);
        }
        if(type.flags&ts.TypeFlags.TypeParameter)for(const declaration of type.getSymbol()?.declarations??[]) {
          if(ts.isTypeParameterDeclaration(declaration)&&declaration.constraint)checked(checker.getTypeFromTypeNode(declaration.constraint));
        }
        const constraint=checker.getBaseConstraintOfType(type);
        if(!constraint||constraint===type)throw new Error('Direct payload deferred type requires a checked constraint');
        // A constructor used as InstanceType's type argument is not itself an
        // emitted callable. General deferred values are audited through their
        // effective value shape, rather than treating all alias arguments as data.
        checked(constraint);return;
      }
      if(type.isUnionOrIntersection?.())for(const part of type.types)checked(part);
      for(const argument of type.aliasTypeArguments??[])checked(argument);
      if(type.flags&ts.TypeFlags.Object) {
        if(type.objectFlags&ts.ObjectFlags.Reference) {
          const arguments_=checker.getTypeArguments(type),outer=type.target.outerTypeParameters??[];
          if(outer.length>arguments_.length)throw new Error('Payload reference has incomplete lexical type arguments');
          for(let index=0;index<arguments_.length;index++) {
            // A nested class carries its enclosing factory parameters before
            // its local arguments. An exact unchanged lexical capture is not
            // itself emitted data. Bases and every authored member below still
            // audit any actual value use of that constructor parameter.
            const lexical=includeDirect&&index<outer.length&&arguments_[index]===outer[index]&&factoryTypeParameters.has(outer[index]);
            if(!lexical)checked(arguments_[index]);
          }
        }
        if(includeDirect)for(const base of type.getBaseTypes?.()??[])checked(base);
        const symbol=type.getSymbol?.();
        if(includeDirect&&symbol?.declarations?.length&&symbol.declarations.every((node:any)=>probe.program.isSourceFileDefaultLibrary(node.getSourceFile())))return;
        for(const property of checker.getPropertiesOfType(type)) {
          if(includeDirect&&property.declarations?.length&&property.declarations.every((node:any)=>probe.program.isSourceFileDefaultLibrary(node.getSourceFile())))continue;
          checked(checker.getTypeOfSymbolAtLocation(property,expression));
        }
        for(const index of checker.getIndexInfosOfType(type))checked(index.type);
        if(checker.getSignaturesOfType(type,ts.SignatureKind.Call).length||checker.getSignaturesOfType(type,ts.SignatureKind.Construct).length)throw new Error('Callable payload types require a signature adapter');
      }
    }
    syntax(expression);const type=checker.getTypeAtLocation(expression);checked(type);return type;
  }
  function findOverlay(originalNode:any) {return probe.mapReplayNode(originalNode);}
  const helperDeclarations=new Set([...helpers.keys()].map(symbol=>symbol.declarations[0]));
  function platformDispatchSymbol(symbol:any) {
    return symbol?.name==='dispatchEvent'&&symbol.declarations?.length&&symbol.declarations.every((declaration:any)=>
      ts.isMethodSignature(declaration)&&ts.isInterfaceDeclaration(declaration.parent)&&declaration.parent.name.text==='EventTarget'&&program.isSourceFileDefaultLibrary(declaration.getSourceFile()));
  }
  function lexicallyOwned(node:any) {
    for(let parent=node.parent;parent;parent=parent.parent) {
      if(parent===owner||parent===overlayOwner)return true;
      if(ts.isClassDeclaration(parent)||ts.isClassExpression(parent))return false;
      if(ts.isFunctionLike(parent)&&!ts.isArrowFunction(parent)&&parent.parent!==owner&&parent.parent!==overlayOwner)return false;
    }
    return false;
  }
  function ownReceiver(node:any,target:any) {
    let receiver=target;while(receiver&&ts.isParenthesizedExpression(receiver))receiver=receiver.expression;
    if(!receiver||receiver.kind!==ts.SyntaxKind.ThisKeyword)throw new Error('Factory dispatch requires direct owned this');
    for(let parent=node.parent;parent&&parent!==overlayOwner;parent=parent.parent)
      if(parent.parent===overlayOwner&&ts.getCombinedModifierFlags(parent)&ts.ModifierFlags.Static)throw new Error('Factory dispatch requires an instance receiver');
  }

  // An empty dispatch list must not hide a helper escape. Import aliases and
  // direct namespace imports preserve exact symbol authority; value aliases,
  // destructuring and call/apply/bind need separate flow adapters.
  function auditHelperReferences(node:any) {
    if(includeDirect&&node!==owner&&(ts.isClassDeclaration(node)||ts.isClassExpression(node)))return;
    // The declaration proof has no flow analysis for casts or unchecked writes.
    // Refuse these anywhere in the callable rather than miss an earlier mutation.
    if(ts.isAsExpression(node)||ts.isTypeAssertionExpression(node)||ts.isNonNullExpression(node))throw new Error('Dispatch payload assertion requires a separate proof');
    if(ts.isBinaryExpression(node)&&node.operatorToken.kind>=ts.SyntaxKind.FirstAssignment&&node.operatorToken.kind<=ts.SyntaxKind.LastAssignment) {
      const overlay=findOverlay(node.right);actualType(overlay);
    }
    if((ts.isIdentifier(node)||ts.isPropertyAccessExpression(node)||ts.isElementAccessExpression(node))&&
      !(ts.isIdentifier(node)&&ts.isPropertyAccessExpression(node.parent)&&node.parent.name===node)) {
      const symbol=unalias(originalChecker,originalChecker.getSymbolAtLocation(ts.isElementAccessExpression(node)?node.argumentExpression:node));
      const type=originalChecker.getTypeAtLocation(node),signatures=originalChecker.getSignaturesOfType(type,ts.SignatureKind.Call);
      const helper=helpers.has(symbol)||signatures.some((signature:any)=>helperDeclarations.has(signature.getDeclaration()));
      if(includeDirect) {
        const platform=platformDispatchSymbol(symbol)||signatures.some((signature:any)=>{
          const declaration=signature.getDeclaration();return declaration&&platformDispatchSymbol(originalChecker.getSymbolAtLocation(declaration.name));
        });
        const named=(ts.isPropertyAccessExpression(node)&&node.name.text==='dispatchEvent')||(ts.isElementAccessExpression(node)&&ts.isStringLiteral(node.argumentExpression)&&node.argumentExpression.text==='dispatchEvent');
        if((platform||named||helper)&&!lexicallyOwned(node))throw new Error('Dispatch in a non-owned callable requires a flow adapter');
        if(platform||named) {
          if(!platformDispatchSymbol(symbol)||!ts.isPropertyAccessExpression(node)||!ts.isCallExpression(node.parent)||node.parent.expression!==node)
            throw new Error('Direct dispatch aliases, overrides or escapes require a flow adapter');
          let receiver=node.expression;while(ts.isParenthesizedExpression(receiver))receiver=receiver.expression;
          if(receiver.kind!==ts.SyntaxKind.ThisKeyword)throw new Error('Direct dispatch requires exact owned this');
        }
        if(!helper&&helperNames.includes(symbol?.name))throw new Error('Dispatch helper call has no exact authorized source binding');
      }

      if(helper) {
        const direct=(ts.isIdentifier(node)||ts.isPropertyAccessExpression(node))&&helpers.has(symbol)&&ts.isCallExpression(node.parent)&&node.parent.expression===node;
        const exactNamespace=!ts.isPropertyAccessExpression(node)||unalias(originalChecker,originalChecker.getSymbolAtLocation(node.expression))===module;
        if(!direct||!exactNamespace)throw new Error('Dispatch helper aliases or escapes require a flow adapter');
      }
    }
    ts.forEachChild(node,auditHelperReferences);
  }
  auditHelperReferences(moduleOwner?owner:callable.body);
  function visit(node:any) {
    if(node!==overlayOwner&&(ts.isClassExpression(node)||ts.isClassDeclaration(node)))return;
    if(node!==overlayOwner&&ts.isFunctionLike(node)&&!ts.isArrowFunction(node)&&node.parent!==overlayOwner)return;
    if(ts.isCallExpression(node)) {
      const originalCall=probe.mapOriginalNode(node),originalSymbol=unalias(originalChecker,originalChecker.getSymbolAtLocation(originalCall.expression));
      const family=helpers.get(originalSymbol);
      if(includeDirect&&platformDispatchSymbol(originalSymbol)) {
        if(!ts.isPropertyAccessExpression(node.expression)||node.arguments.length!==1)throw new Error('Direct dispatch requires one owned event expression');
        ownReceiver(node,node.expression.expression);
        let constructed=node.arguments[0];while(ts.isParenthesizedExpression(constructed))constructed=constructed.expression;
        if(!ts.isNewExpression(constructed)||!constructed.arguments||constructed.arguments.length<1||constructed.arguments.length>2)
          throw new Error('Direct dispatch requires an immediate platform CustomEvent constructor');
        const ctor=unalias(checker,checker.getSymbolAtLocation(constructed.expression));
        if(ctor!==globalEvent)throw new Error('Direct dispatch requires the exact platform CustomEvent constructor');
        const emittedType=actualType(constructed.arguments[0]);
        if(!emittedType.isStringLiteral())throw new Error('Dynamic dispatch event name requires an occurrence adapter');
        const emitted=emittedType.value,options=constructed.arguments[1]?plainFields(constructed.arguments[1],'Direct event options'):new Map<string,any>();
        const payload=options.get('detail'),record={...descriptor(originalCall),helper:'platform-CustomEvent',eventName:emitted};
        allOwnDispatches.push(record);
        if(emitted===name) {
          const actual=payload?actualType(payload):checker.getNullType();
          const variants=actual.isUnion()?actual.types:[actual];
          const valid=variants.every((variant:any)=>{
            if(variant.flags&(ts.TypeFlags.Undefined|ts.TypeFlags.Void))variant=checker.getNullType();
            if(variant.flags&ts.TypeFlags.TypeParameter) {
              const constraint=checker.getBaseConstraintOfType(variant);
              if(!constraint||constraint.flags&(ts.TypeFlags.Any|ts.TypeFlags.Unknown))throw new Error('Direct detail type parameter requires a checked constraint');
              if(checker.isTypeAssignableTo(checker.getUndefinedType(),constraint)&&!details.some(detail=>checker.isTypeAssignableTo(checker.getNullType(),detail)))return false;
            }
            return details.some(detail=>checker.isTypeAssignableTo(variant,detail));
          });
          if(!valid)throw new Error('Generic direct emitted payload disagrees with @fires: '+name);
          calls.push({...record,fields:payload&&ts.isObjectLiteralExpression(payload)?[...plainFields(payload,'Direct event detail').keys()].sort():null});
        }
      }

      if(family) {
        const overlaySymbol=unalias(checker,checker.getSymbolAtLocation(node.expression));
        if(!overlaySymbol||probe.mapOriginalSymbol(overlaySymbol)!==originalSymbol)throw new Error('Dispatch helper symbol changed in replay');
        const [target,second,third]=node.arguments;
        const payload=family==='dispatchNotification'?third:second,options=family==='dispatchNotification'?undefined:third;
        let receiver=target;while(receiver&&ts.isParenthesizedExpression(receiver))receiver=receiver.expression;
        if(!receiver||receiver.kind!==ts.SyntaxKind.ThisKeyword)throw new Error('Factory dispatch requires direct owned this');
        for(let parent=node.parent;parent&&parent!==overlayOwner;parent=parent.parent)
          if(parent.parent===overlayOwner&&ts.getCombinedModifierFlags(parent)&ts.ModifierFlags.Static)throw new Error('Factory dispatch requires an instance receiver');
        const optionFields=options?plainFields(options,'Dispatch options'):new Map<string,any>();
        let emitted=family==='dispatchChange'?'en-change':family==='dispatchAction'?'en-action':'en-input';
        if(family==='dispatchNotification') {
          const type=actualType(second);if(!type.isStringLiteral())throw new Error('Dynamic dispatch event name requires an occurrence adapter');emitted=type.value;
        }
        if(optionFields.has('eventName')) {
          if(family!=='dispatchChange')throw new Error('This dispatch helper has no event-name override');
          const value=optionFields.get('eventName'),type=actualType(value);
          if(!type.isStringLiteral())throw new Error('Dynamic dispatch event name requires an occurrence adapter');
          emitted=type.value;
        }
        const record={...descriptor(originalCall),helper:family,eventName:emitted};
        allOwnDispatches.push(record);
        if(emitted===name) {
          const fields=plainFields(payload,'Dispatch payload'),transmitted=new Map<string,any>();
          if(family==='dispatchChange') {
            const extras=optionFields.get('extraDetail');
            if(extras)for(const [key,value]of plainFields(extras,'Dispatch extraDetail'))transmitted.set(key,value);
            for(const key of ['previous','proposed','reason']) {
              if(!fields.has(key))throw new Error('Change dispatch omits a required emitted field: '+key);
              transmitted.set(key,fields.get(key));
            }
          } else for(const [key,value]of fields)transmitted.set(key,value);
          const actual=new Map([...transmitted].map(([key,value])=>[key,actualType(value)]));
          const valid=details.some((detail:any)=>{
            if(checker.getIndexInfosOfType(detail).length)throw new Error('Indexed event details require a payload adapter');
            if(detail.flags&ts.TypeFlags.TypeParameter)throw new Error('Unexpanded generic event detail requires a payload adapter');
            for(const property of checker.getPropertiesOfType(detail)) {
              const value=actual.get(property.name);
              if(!value){if(property.flags&ts.SymbolFlags.Optional)continue;return false;}
              if(!checker.isTypeAssignableTo(value,checker.getTypeOfSymbolAtLocation(property,node)))return false;
            }
            // A detail with no properties is not evidence for an object payload.
            return Boolean(checker.getPropertiesOfType(detail).length);
          });
          if(!valid)throw new Error('Generic emitted payload disagrees with @fires: '+name);
          calls.push({...record,fields:[...transmitted.keys()].sort()});
        }
      }
    }
    ts.forEachChild(node,visit);
  }
  visit(overlayOwner);
  const receipt=freeze({version:1,scope:moduleOwner?'module-declaration-dispatch-obligation':'generic-factory-declaration-dispatch-obligation',annotation:annotation.receipt,
    helperModule:helperSource?descriptor(helperSource):null,helperDeclarations:[...helpers.keys()].map(symbol=>descriptor(symbol.declarations[0])),
    eventName:name,checkedCalls:calls,allOwnDispatches,publicVisibilityChecked:false,finalOccurrenceQualified:false,helperPackagePolicyBound:false,helperEscapesRejected:true,...(includeDirect?{directPlatformDispatchChecked:true}:{}),payloadPolicy:'bounded expression and type closure; indirect producers and mutable aliases require adapters'});
  function assertOriginal(expectedProgram=program,expectedCallable=callable,expectedOwner=owner,expectedTag=tag,expectedHelpers=helperSource) {
    if(expectedProgram!==program||expectedCallable!==callable||expectedOwner!==owner||expectedTag!==tag||expectedHelpers!==helperSource)throw new Error('Factory dispatch requires its exact original binding');
    semantic.assertOriginal();return true;
  }
  assertOriginal();const result=Object.freeze({receipt,assertOriginal});certificates.set(result,{program,callable,owner,tag,helperSource,includeDirect,moduleOwner});return result;
}
export function checkCapturedFactoryEventDispatch(program:any,callable:any,owner:any,tag:any,helperSource:any) {
  return checkFactoryDispatch(program,callable,owner,tag,helperSource,false);
}
/** Adds directly owned platform CustomEvent emissions to the retained helper
 * obligations. Indirect producers and aliases remain explicit refusal cases.
 */
export function checkCapturedFactoryEventEmissions(program:any,callable:any,owner:any,tag:any,helperSource?:any) {
  return checkFactoryDispatch(program,callable,owner,tag,helperSource,true);
}
export function assertCapturedFactoryEventEmissions(result:any,program:any,callable:any,owner:any,tag:any,helperSource?:any) {
  const entry=certificates.get(result);
  if(!entry?.includeDirect||entry.moduleOwner||entry.program!==program||entry.callable!==callable||entry.owner!==owner||entry.tag!==tag||entry.helperSource!==helperSource)throw new Error('Unknown factory emission certificate');
  return result.assertOriginal(program,callable,owner,tag,helperSource);
}
export function assertCapturedFactoryEventDispatch(result:any,program:any,callable:any,owner:any,tag:any,helperSource:any) {
  const entry=certificates.get(result);
  if(!entry||entry.moduleOwner||entry.program!==program||entry.callable!==callable||entry.owner!==owner||entry.tag!==tag||entry.helperSource!==helperSource)throw new Error('Unknown factory event dispatch certificate');
  return result.assertOriginal(program,callable,owner,tag,helperSource);
}

/** Module mode shares the same bounded payload obligations, using the original
 * annotation's captured replay checker and exact bidirectional node mapping. */
export function checkCapturedModuleEventEmissions(program:any,owner:any,tag:any,helperSource?:any) {
  return checkFactoryDispatch(program,undefined,owner,tag,helperSource,true,true);
}
export function assertCapturedModuleEventEmissions(result:any,program:any,owner:any,tag:any,helperSource?:any) {
  const entry=certificates.get(result);
  if(!entry?.moduleOwner||entry.program!==program||entry.owner!==owner||entry.tag!==tag||entry.helperSource!==helperSource)throw new Error('Unknown module emission certificate');
  return result.assertOriginal(program,undefined,owner,tag,helperSource);
}
