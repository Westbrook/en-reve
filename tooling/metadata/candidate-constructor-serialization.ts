import {constructorSemanticTypeText} from './candidate-mixin-origins.ts';
import {createHash} from 'node:crypto';
import {relative, dirname, resolve} from 'node:path';
import {ts} from './compiler-api.mjs';
import {constructorContractComposition, constructorFacets} from './candidate-constructor-composition.ts';
import {assertConstructorExtractionInputs,constructorEventCapture} from './candidate-origin-extraction.ts';
import {candidateSuperclass} from './candidate-inheritance.ts';
import {validateGeneratedManifest} from '@wc-toolkit/cem-generator';
import {completeConstructorComposition,readConstructorComposition,constructorCompositionKey} from './constructor-composition-contract.ts';

import {projectCapturedFactoryEventType,projectCapturedModuleEventType} from './captured-event-type-projection.ts';
import {checkCapturedEventVisibility} from './captured-event-visibility.ts';

const copy = (value: any) => structuredClone(value);
const hash = (value: any) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
function freeze(value: any): any {
  if (value && typeof value === 'object') {for (const child of Object.values(value)) freeze(child); Object.freeze(value);}
  return value;
}

/** Separate experimental projection. No generator cutover or second Program.
 * Exact input bindings and source validation precede any emitted manifest.
 * Unsupported occurrence-dependent annotations fail before returning output.
 */
export function serializeConstructorComposition(program: any, sources: any[], roots: any[], extraction: any) {
  sources = [...sources]; roots = [...roots];
  const sourceRoot=assertConstructorExtractionInputs(extraction, program, sources, roots);
  const eventCapture=constructorEventCapture(extraction,program);
  const composition = constructorContractComposition(program, sources, extraction), checker = composition.checker;
  const selected = new Set(sources), selectedPaths = new Map(sources.map(source=>[source.fileName,source])), printer = ts.createPrinter({removeComments:true});
  const originPacket = extraction.index.portable(), facetProofs: any[] = [], typeProofs: any[] = [];
  const typeChecks: Array<()=>void> = [];
  const sourceModules=new Map(sources.map(source=>{
    const file=resolve(source.fileName);
    if (!file.startsWith(sourceRoot+'/')) throw new Error('Serialization source escapes branded extraction root');
    const path=file.slice(sourceRoot.length+1), matches=extraction.internal.modules.filter((item:any)=>item.path===path);
    if (matches.length!==1 || matches[0].source!==path) throw new Error('Selected source has no exact extracted module');
    return [source,path];
  }));
  const modulePath = (source:any) => {
    if (!sourceModules.has(source) || program.getSourceFile(source.fileName)!==source) throw new Error('Public source descriptor must belong to a selected module');
    return sourceModules.get(source);
  };
  const publicSource = (descriptor:any) => {
    const source=program.getSourceFile(descriptor.fileName);
    if (!source || !selected.has(source)) throw new Error('Public source descriptor is not selected');
    const {fileName,...rest}=descriptor;return {...rest,module:modulePath(source)};
  };
  const sourceDescriptor = (node: any) => {
    const source = node.getSourceFile();
    if (program.getSourceFile(source.fileName) !== source) throw new Error('Serialization source belongs to another Program');
    return {fileName:source.fileName, sourceSha256:createHash('sha256').update(source.text).digest('hex'),
      kind:node.kind, start:node.getStart(source), end:node.end};
  };
  const unalias = (symbol: any): any => symbol?.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  const entity = (name: any, scope: any, meaning: number): any => {
    if (ts.isIdentifier(name)) return unalias(checker.resolveName(name.text, scope, meaning | ts.SymbolFlags.Alias, false));
    const left = entity(name.left, scope, meaning | ts.SymbolFlags.Namespace);
    if (!left) return undefined;
    return unalias(left.flags & ts.SymbolFlags.Module ? checker.getExportsOfModule(left).find((s: any) => s.name === name.right.text) : checker.getTypeOfSymbolAtLocation(left, scope).getProperty(name.right.text));
  };
  function importTarget(symbol: any, scope: any) {
    symbol = unalias(symbol);
    const declaration = symbol?.declarations?.[0], source = declaration?.getSourceFile();
    if (!declaration || !selected.has(source)) throw new Error('Cross-scope external type needs a public package reference adapter');
    const module = checker.getSymbolAtLocation(source);
    const exports = module && checker.getExportsOfModule(module).filter((entry: any) => unalias(entry) === symbol);
    if (!exports?.length) throw new Error('Cross-scope type is not a proved selected module export');
    const exported = exports.find((entry: any) => entry.name === symbol.name) ?? [...exports].sort((a:any,b:any)=>a.name.localeCompare(b.name))[0];
    if (!/^[$A-Z_a-z][$\w]*$/.test(exported.name)) throw new Error('Type export needs an explicit identifier adapter');
    let specifier = relative(dirname(scope.getSourceFile().fileName), source.fileName).replaceAll('\\','/').replace(/\.(?:d\.)?tsx?$/, '.js');
    if (!specifier.startsWith('.')) specifier = './' + specifier;
    const resolved=ts.resolveModuleName(specifier,scope.getSourceFile().fileName,program.getCompilerOptions(),ts.sys,undefined,undefined,scope.getSourceFile().impliedNodeFormat).resolvedModule;
    const targetSource=resolved && program.getSourceFile(resolved.resolvedFileName), targetModule=targetSource && checker.getSymbolAtLocation(targetSource);
    if (targetSource!==source || !targetModule || unalias(checker.getExportsOfModule(targetModule).find((entry:any)=>entry.name===exported.name))!==symbol) throw new Error('Emitted import does not resolve to the exact source symbol');
    return {specifier, name:exported.name};
  }
  function typeText(text: any, sourceScope: any, outputScope: any, allowOwnParameters = false, checkedSemantic = false) {
    if (text === undefined) return undefined;
    if (typeof text !== 'string' || !text.trim()) throw new Error('Constructor type must be an authored or compiler string');
    const syntax = ts.createSourceFile('__constructor_contract_type.ts', `type __Contract = ${text};`, ts.ScriptTarget.Latest, true);
    if (syntax.parseDiagnostics.length || syntax.statements.length !== 1 || !ts.isTypeAliasDeclaration(syntax.statements[0])) throw new Error('Invalid constructor contract type syntax');
    const names: any[] = [];
    const transformed = ts.transform(syntax.statements[0].type, [(context: any) => {
      const visit = (node: any): any => {
        // Locally bound mapped/infer/signature type variables need their own
        // lexical adapter; never resolve synthetic declaration nodes in checker.
        if (node.typeParameters?.length || ts.isMappedTypeNode(node) || ts.isInferTypeNode(node)) throw new Error('Locally generic contract syntax requires a lexical type adapter');
        if (ts.isComputedPropertyName(node)) throw new Error('Computed contract keys require a source symbol adapter');
        if (ts.isTypeReferenceNode(node) || ts.isTypeQueryNode(node)) {
          const name = ts.isTypeReferenceNode(node) ? node.typeName : node.exprName;
          if (ts.isTypeQueryNode(node)) {
            let first=name;while(ts.isQualifiedName(first))first=first.left;
            const binds=(binding:any):boolean=>ts.isIdentifier(binding)?binding.text===first.text:
              (ts.isObjectBindingPattern(binding)||ts.isArrayBindingPattern(binding)) && binding.elements.some((item:any)=>!ts.isOmittedExpression(item)&&binds(item.name));
            for(let parent=node.parent;parent && parent!==syntax;parent=parent.parent) {
              if(parent.parameters?.some((parameter:any)=>binds(parameter.name)))throw new Error('Method-local type queries require a lexical type adapter');
            }
          }
          const meaning=ts.isTypeQueryNode(node)?ts.SymbolFlags.Value:ts.SymbolFlags.Type;
          const symbol = entity(name, sourceScope,meaning);
          if (!symbol?.declarations?.length || !(symbol.flags & meaning)) throw new Error('Contract type has no exact source symbol of the requested meaning: ' + name.getText(syntax));
          if (!checkedSemantic && ((node.typeArguments?.length ?? 0)>0 || symbol.declarations.some((declaration:any)=>declaration.typeParameters?.some((parameter:any)=>!parameter.default)))) throw new Error('Authored generic contract requires checked lexical instantiation');
          if (symbol.flags & ts.SymbolFlags.TypeParameter) {
            const own = allowOwnParameters && entity(name, outputScope,meaning) === symbol && symbol.declarations.every((declaration: any) => declaration.parent === outputScope || declaration.parent === outputScope.parent);
            if (!own) throw new Error('Authored generic contract requires occurrence binding');
          }
          const originalName=name.getText(syntax);
          const declarations=symbol.declarations.map(sourceDescriptor);
          names.push({name:originalName,declarations});
          typeChecks.push(()=>{
            if (entity(name,sourceScope,meaning)!==symbol || hash(symbol.declarations.map(sourceDescriptor))!==hash(declarations)) throw new Error('Authored type symbol correspondence changed');
          });
          const args = node.typeArguments?.map((argument: any) => ts.visitNode(argument, visit));
          if (entity(name, outputScope,meaning) === symbol) {
            typeChecks.push(()=>{if(entity(name,outputScope,meaning)!==symbol)throw new Error('Emitted type symbol correspondence changed');});
            return ts.isTypeReferenceNode(node) ? ts.factory.updateTypeReferenceNode(node,name,args) : ts.factory.updateTypeQueryNode(node,name,args);
          }
          const target = importTarget(symbol, outputScope);
          typeChecks.push(()=>{if(hash(importTarget(symbol,outputScope))!==hash(target))throw new Error('Emitted import correspondence changed');});
          return ts.factory.createImportTypeNode(ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(target.specifier)), undefined,
            ts.factory.createIdentifier(target.name), args, ts.isTypeQueryNode(node));
        }
        if (ts.isImportTypeNode(node)) {
          if (node.attributes) throw new Error('Import type attributes require mode-aware module ownership');
          if (!ts.isLiteralTypeNode(node.argument) || !ts.isStringLiteral(node.argument.literal) || !node.qualifier) throw new Error('Unsupported authored import type');
          const resolved = ts.resolveModuleName(node.argument.literal.text, sourceScope.getSourceFile().fileName, program.getCompilerOptions(), ts.sys,undefined,undefined,sourceScope.getSourceFile().impliedNodeFormat).resolvedModule;
          const source = resolved && program.getSourceFile(resolved.resolvedFileName), module = source && checker.getSymbolAtLocation(source);
          const parts = node.qualifier.getText(syntax).split('.');
          let symbol = module;
          for (const part of parts) symbol = symbol?.flags & ts.SymbolFlags.Module ? unalias(checker.getExportsOfModule(symbol).find((entry:any)=>entry.name===part)) : undefined;
          if (!symbol || !(symbol.flags & (node.isTypeOf?ts.SymbolFlags.Value:ts.SymbolFlags.Type))) throw new Error('Authored import type has no owned module symbol of the requested meaning');
          if (!checkedSemantic && ((node.typeArguments?.length ?? 0)>0 || symbol.declarations?.some((declaration:any)=>declaration.typeParameters?.some((parameter:any)=>!parameter.default)))) throw new Error('Authored generic contract requires checked lexical instantiation');
          const declarations=(symbol.declarations ?? []).map(sourceDescriptor);
          names.push({name:node.getText(syntax),declarations});
          typeChecks.push(()=>{if(hash((symbol.declarations ?? []).map(sourceDescriptor))!==hash(declarations))throw new Error('Import type source changed');});
          const args = node.typeArguments?.map((argument:any)=>ts.visitNode(argument,visit));
          if (sourceScope.getSourceFile() === outputScope.getSourceFile() && !node.argument.literal.text.startsWith('/')) return ts.factory.updateImportTypeNode(node,node.argument,node.attributes,node.qualifier,args,node.isTypeOf);
          const target = importTarget(symbol, outputScope);
          return ts.factory.createImportTypeNode(ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(target.specifier)),undefined,ts.factory.createIdentifier(target.name),args,node.isTypeOf);
        }
        return ts.visitEachChild(node, visit, context);
      };
      return (node:any)=>ts.visitNode(node,visit);
    }]);
    try {
      const value = printer.printNode(ts.EmitHint.Unspecified, transformed.transformed[0], syntax);
      typeProofs.push({input:text,emitted:value,kind:checkedSemantic?'checked-semantic-rendering':'authored-symbol-projection',source:sourceDescriptor(sourceScope),output:sourceDescriptor(outputScope),symbols:names});
      return {value:{text:value}, names};
    } finally {transformed.dispose();}
  }
  function convertTypes(row: any, sourceScope: any, outputScope: any, allowOwnParameters = false) {
    const value = copy(row), types: any[] = [];
    for (const name of ['type','parsedType','detail']) if (value[name] !== undefined) {
      const result = typeText(value[name],sourceScope,outputScope,allowOwnParameters)!;
      value[name] = result.value; types.push({field:name, symbols:result.names});
    }
    if (value.parameters) value.parameters = value.parameters.map((parameter:any)=>convertTypes(parameter,sourceScope,outputScope,allowOwnParameters).value);
    if (value.return) value.return = convertTypes(value.return,sourceScope,outputScope,allowOwnParameters).value;
    return {value,types};
  }
  function checkedEventFields(row:any,projected:any,source:any,output:any) {
    const value=copy(row);value.type={text:projected.receipt.type};
    // These auxiliary fields came from the private owning extractor, whose
    // entire row snapshot is revalidated before and after serialization. Their
    // public form denotes the checked authored contract: inferred emission
    // narrowing must not replace the documented generic payload contract.
    for(const field of ['parsedType','detail'])if(row[field]!==undefined) {
      if(typeof row[field]!=='string'||!row[field].trim())throw new Error('Extracted event auxiliary type must be a nonempty compiler string');
      const emitted=field==='parsedType'?projected.receipt.type:
        projected.receipt.detail??`(${projected.receipt.type})["detail"]`;
      value[field]={text:emitted};
      typeProofs.push({input:row[field],emitted,kind:'captured-event-contract-field',field,transformation:'authored-public-contract-representation',semanticEquivalenceClaimed:false,
        source:sourceDescriptor(source),output:sourceDescriptor(output),symbols:projected.receipt.references.map((entry:any)=>({name:entry.name,declarations:entry.declarations}))});
    }
    return value;
  }
  function semanticText(type: any, root: any, expanded = false) {
    const text = constructorSemanticTypeText(checker,type,root,expanded);
    return typeText(text,root,root,true,true)!;
  }
  const method = (row: any, semantic: any, root: any) => {
    const signatures = checker.getSignaturesOfType(semantic.type,ts.SignatureKind.Call);
    if (signatures.length !== 1 || signatures[0].getTypeParameters()?.length) throw new Error('Overloaded or generic methods require a signature composition adapter');
    const signature = signatures[0], value = copy(row);
    if (signature.parameters.length !== (row.parameters ?? []).length) throw new Error('Method parameter metadata disagrees with semantic signature');
    value.parameters = signature.parameters.map((parameter: any,i:number) => {
      const type=checker.getTypeOfSymbolAtLocation(parameter,root), parameterValue=copy(row.parameters[i]);
      parameterValue.type=semanticText(type,root).value;
      if (parameterValue.parsedType!==undefined) parameterValue.parsedType=semanticText(type,root,true).value;
      return parameterValue;
    });
    const predicate=checker.getTypePredicateOfSignature(signature);
    const returnContract=(expanded=false)=>{
      if (!predicate) return semanticText(checker.getReturnTypeOfSignature(signature),root,expanded).value;
      const asserts=predicate.kind===ts.TypePredicateKind.AssertsIdentifier || predicate.kind===ts.TypePredicateKind.AssertsThis;
      const isThis=predicate.kind===ts.TypePredicateKind.This || predicate.kind===ts.TypePredicateKind.AssertsThis;
      const name=isThis?'this':signature.parameters[predicate.parameterIndex]?.name;
      if (!name || (!isThis && row.parameters[predicate.parameterIndex]?.name!==name)) throw new Error('Predicate parameter metadata disagrees with semantic signature');
      return {text:`${asserts?'asserts ':''}${name}${predicate.type?' is '+semanticText(predicate.type,root,expanded).value.text:''}`};
    };
    value.return = {...copy(row.return ?? {}),type:returnContract()};
    if (value.return.parsedType!==undefined) value.return.parsedType=returnContract(true);
    delete value.parsedType;
    return value;
  };
  const declarationsByRoot = new Map(roots.map(root=>[root,composition.compose(root)]));
  const modules = extraction.internal.modules.map((module: any) => ({kind:'javascript-module',path:module.path,source:module.path,
    exports:copy(module.exports), declarations:module.declarations.map((own:any)=>{
      if (!['class','mixin'].includes(own.kind)) {
        if (!['function','variable'].includes(own.kind)) throw new Error('Unsupported ordinary declaration representation');
        return copy(own); // completeCandidateModules already emitted these as CEM.
      }
      extraction.bindings.assertDeclaration(module.path,own);
      const ordinaryNode = extraction.bindings.provenanceUnits(own).implementation;
      const ordinaryRow = extraction.ordinaryProjection?.declarationFor(ordinaryNode);
      if (ordinaryRow) {
        if (own.kind !== 'class') throw new Error('A factory cannot use an ordinary class projection');
        return copy(ordinaryRow);
      }
      const origin = extraction.index.originOf(own), root = origin.node;
      const composed = own.kind === 'class' ? declarationsByRoot.get(root) : undefined;
      if (own.kind === 'class' && !composed) throw new Error('Class has no exact serialization root');
      const output:any = {};
      for (const key of ['kind','name','customElement','tagName','description','summary','deprecated']) if (own[key] !== undefined) output[key]=copy(own[key]);
      if (own.kind === 'mixin') {output.customElement=false;output.parameters=(own.parameters ?? []).map((row:any)=>convertTypes(row,origin.factory.callable,origin.factory.callable,true).value);}
      const rawParameters = (origin.factory?.callable ?? root).typeParameters ?? [];
      if (rawParameters.length) output['x-en-type-parameters']=rawParameters.map((node:any)=>({name:node.name.text,
        ...(node.constraint?{constraint:typeText(node.constraint.getText(),node,node.parent,true)!.value}:{}),
        ...(node.default?{default:typeText(node.default.getText(),node,node.parent,true)!.value}:{})}));
      const seenPrivate = new Set<string>();
      for (const facet of constructorFacets) {
        const records = composed ? composed.facets[facet] : (own[facet] ?? []).map((metadata:any)=>({metadata}));
        const converted = records.map((record:any)=>{
          const proof = composed ? composition.provenanceOf(record) : {origin,step:null,contexts:[],semanticMember:undefined,contributions:[],policies:[]};
          const row = record.metadata, source = proof.origin.node, outputScope=composed?root:origin.factory.callable;
          let value,eventContract,eventVisibility,eventDispatch;const typeProofStart=typeProofs.length;
          const ownMethod=facet==='members' && row.kind==='method' && !proof.semanticMember
            ? source.members.filter((node:any)=>ts.isMethodDeclaration(node) &&
              (ts.isIdentifier(node.name)||ts.isStringLiteral(node.name)||ts.isPrivateIdentifier(node.name)) && node.name.text===row.name &&
              Boolean(ts.getCombinedModifierFlags(node)&ts.ModifierFlags.Static)===Boolean(row.static)) : [];
          if (facet==='members' && row.kind==='method' && !proof.semanticMember && !ownMethod.length) throw new Error('Own method has no exact source signature');
          if(facet==='events'&&eventCapture&&proof.origin.factory) {
            // This branch is inside the serializer-owned composition. A copied
            // record or a certificate from another root/step cannot select it.
            if(composed&&(proof.root!==root||!composed.facets.events.includes(record)||proof.step?.kind!=='application'))
              throw new Error('Checked event requires its exact surviving factory facet');
            const binding=extraction.bindings.factoryEvent(source,row.name);
            if(!binding||binding.callable!==proof.origin.factory.callable)throw new Error('Checked event has no exact original factory tag binding');
            const projected=projectCapturedFactoryEventType(program,binding.callable,source,binding.tag,composed?root:undefined,composed?proof.step.index:undefined);
            const visibility=composed?checkCapturedEventVisibility(program,binding.callable,source,binding.tag,root,proof.step.index):binding.visibility;
            value=checkedEventFields(row,projected,source,outputScope);
            typeChecks.push(()=>{projected.assertOriginal();visibility.assertOriginal();binding.admission.assertOriginal();if(composed&&composition.provenanceOf(record)!==proof)throw new Error('Surviving event facet provenance changed');});
            typeProofs.push({input:binding.annotation.receipt.text,emitted:projected.receipt.type,kind:'captured-factory-event-projection',source:sourceDescriptor(source),output:sourceDescriptor(outputScope),symbols:projected.receipt.references.map((entry:any)=>({name:entry.name,declarations:entry.declarations}))});
            eventVisibility={scope:visibility.receipt.scope,references:visibility.receipt.references};
            const policy=binding.admission.receipt.policy;
            eventDispatch={scope:binding.admission.receipt.scope,emissions:binding.dispatch.receipt.checkedCalls,
              helperDeclarations:binding.dispatch.receipt.helperDeclarations,
              helperPolicy:policy?{packageName:policy.packageName,packageVersion:policy.packageVersion,packageSha256:policy.packageSha256,
                declarationSha256:policy.declarationSha256,runtimeSha256:policy.runtimeSha256}:null,arbitraryFlowQualified:false};
            if(composed)eventContract={type:value.type.text,detail:projected.receipt.detail};
          } else if(facet==='events'&&eventCapture&&!proof.origin.factory) {
            if(!composed||proof.root!==root||!composed.facets.events.includes(record)||proof.step?.kind!=='class')
              throw new Error('Checked event requires its exact surviving module facet');
            const binding=extraction.bindings.moduleEvent(source,row.name);
            if(!binding)throw new Error('Checked event has no exact original module tag binding');
            const projected=projectCapturedModuleEventType(program,source,binding.tag,root),visibility=binding.visibility;
            if(row.detail!==undefined&&!binding.admission)throw new Error('Module inferred detail requires a same-replay emission compatibility proof');
            value=checkedEventFields(row,projected,source,outputScope);
            typeChecks.push(()=>{projected.assertOriginal();visibility.assertOriginal();binding.admission?.assertOriginal();binding.annotation.assertOriginal();if(composition.provenanceOf(record)!==proof)throw new Error('Surviving module event facet provenance changed');});
            typeProofs.push({input:binding.annotation.receipt.text,emitted:projected.receipt.type,kind:'captured-module-event-projection',source:sourceDescriptor(source),output:sourceDescriptor(outputScope),symbols:projected.receipt.references.map((entry:any)=>({name:entry.name,declarations:entry.declarations}))});
            eventVisibility={scope:visibility.receipt.scope,references:visibility.receipt.references};
            eventContract={type:value.type.text,detail:projected.receipt.detail};
            if(binding.admission) {
              const policy=binding.admission.receipt.policy;
              eventDispatch={scope:binding.admission.receipt.scope,emissions:binding.dispatch.receipt.checkedCalls,helperDeclarations:binding.dispatch.receipt.helperDeclarations,
                helperPolicy:policy?{packageName:policy.packageName,packageVersion:policy.packageVersion,packageSha256:policy.packageSha256,declarationSha256:policy.declarationSha256,runtimeSha256:policy.runtimeSha256}:null,arbitraryFlowQualified:false};
            }
          } else if (facet === 'members' && row.name.startsWith('#')) {
            const key=JSON.stringify([Boolean(row.static),row.name]);
            if (seenPrivate.has(key)) throw new Error('Repeated private brands require an explicit serialized representation');
            seenPrivate.add(key);value=row.kind==='method'?method(row,proof.semanticMember ?? {type:checker.getTypeAtLocation(ownMethod[0])},outputScope):convertTypes(row,source,outputScope,source===root).value;
          } else if (facet === 'members' && proof.semanticMember) {
            if (row.kind === 'method') value=method(row,proof.semanticMember,root);
            else {
              value=copy(row);value.type=semanticText(proof.semanticMember.type,root).value;
              if (row.parsedType !== undefined) value.parsedType=semanticText(proof.semanticMember.type,root,true).value;
            }
          } else if (ownMethod.length) {
            value=method(row,{type:checker.getTypeAtLocation(ownMethod[0])},outputScope);
          } else if (facet === 'attributes' && proof.attributeTypeContract?.kind === 'generated' && proof.semanticMember) {
            value=copy(row);value.type=semanticText(proof.semanticMember.type,root).value;
            if (row.parsedType!==undefined) value.parsedType=semanticText(proof.semanticMember.type,root,true).value;
          } else {
            const contract=proof.attributeTypeContract;
            const scope=contract?.kind==='authored'?contract.origin.node:source;
            value=convertTypes(row,scope,outputScope,scope===root).value;
          }
          facetProofs.push({module:module.path,declaration:own.name,facet,key:record.key ?? row.name,
            ...(eventContract?{eventContract}:{}),...(eventVisibility?{eventVisibility}:{}),...(eventDispatch?{eventDispatch}:{}),
            origin:proof.origin.source,step:proof.step?.index ?? null,contexts:proof.contexts,
            semanticSources:proof.semanticMember?.sources ?? [],metadata:copy(row),metadataSha256:hash(row),emittedSha256:hash(value),
            typeProofs: typeProofs.slice(typeProofStart).map((_:any,index:number)=>typeProofStart+index),
            attributeTypeContract:proof.attributeTypeContract && (proof.attributeTypeContract.kind==='authored'?{kind:'authored',origin:proof.attributeTypeContract.origin.source,name:proof.attributeTypeContract.name,type:proof.attributeTypeContract.type}:{kind:'generated',fieldName:proof.attributeTypeContract.fieldName}),
            policies:proof.policies.map((item:any)=>({kind:item.kind,by:item.by.index})),
            contributions:proof.contributions.map((item:any)=>({kind:item.kind ?? (item.assignment?'constructor-assignment':'reactive-configuration'),by:item.by.index,
              ...(item.assignment?{assignment:sourceDescriptor(item.assignment)}:{}),...(item.reactive?{reactive:sourceDescriptor(item.reactive.property)}:{})}))});
          return value;
        });
        if (converted.length) output[facet]=converted;
      }
      if (composed) {
        const ownIndex = composed.steps.findIndex((step:any)=>step.origin===origin);
        const base = [...composed.steps.slice(0,ownIndex)].reverse().find((step:any)=>step.kind==='class');
        const terminal = composed.steps.find((step:any)=>step.kind==='terminal');
        if (base) output.superclass=copy(base.origin.reference);
        else if (terminal) output.superclass=candidateSuperclass(terminal.terminal.expression,program,selectedPaths,modulePath);
        const mixins = composed.steps.filter((step:any)=>step.kind==='application' && step.index>(base?.index ?? -1) && step.index<ownIndex);
        if (mixins.length) output.mixins=mixins.map((step:any)=>copy(step.origin.reference));
        output['x-en-constructor-composition']={version:1,root:publicSource(origin.source),steps:composed.steps.map((step:any)=>({index:step.index,kind:step.kind,
          ...(step.origin?{origin:publicSource(step.origin.source)}:{terminal:{ownership:step.terminal.ownership,reference:candidateSuperclass(step.terminal.expression,program,selectedPaths,modulePath)}}),
          ...(step.application?{application:publicSource(step.application)}:{}),
          contexts:step.contexts.map((context:any)=>({kind:context.kind,source:publicSource(context.source)}))})),
          omissions:composed.omissions.map((item:any)=>({facet:item.facet,names:item.names,by:item.by.index}))};
      }
      const serialized=JSON.parse(JSON.stringify(output));
      if(composed)serialized[constructorCompositionKey]=completeConstructorComposition(serialized,module.path,serialized[constructorCompositionKey]);
      return serialized;
    })}));
  const manifest=JSON.parse(JSON.stringify({schemaVersion:'2.1.0',modules}));
  const topology=copy(extraction.topology), proofs={version:1,origins:originPacket,facets:facetProofs,types:typeProofs,topology,
    ...(extraction.ordinaryProjection ? {ordinaryProjection: copy(extraction.ordinaryProjection.portable)} : {})};
  const snapshot=hash({manifest,proofs});
  function validate() {
    assertConstructorExtractionInputs(extraction,program,sources,roots);
    if (hash({manifest,proofs})!==snapshot) throw new Error('Serialized constructor projection changed');
    for (const check of typeChecks) check();
    const checkTypes=(row:any)=>{
      for(const field of ['type','parsedType','detail']) if(row[field]!==undefined && (typeof row[field]!=='object' || typeof row[field].text!=='string' || !row[field].text.trim())) throw new Error('Serialized type must use a nonempty CEM text object');
      for(const parameter of row.parameters ?? [])checkTypes(parameter);
      if(row.return)checkTypes(row.return);
    };
    for (const module of manifest.modules) {
      const original=extraction.internal.modules.find((item:any)=>item.path===module.path);
      if (JSON.stringify(module.exports)!==JSON.stringify(original.exports)) throw new Error('Serialized export topology changed');
      for(const declaration of module.declarations){readConstructorComposition(declaration,module.path);checkTypes(declaration);for(const facet of constructorFacets)for(const row of declaration[facet] ?? [])checkTypes(row);}
    }
    const edgeKey=(module:string,name:string,reference:any)=>JSON.stringify([module,name,(reference.package?reference.package+':':'')+(reference.module??'')+'#'+reference.name]);
    const separatelyChecked=new Set([...topology.typeOnlyExports.map((edge:any)=>JSON.stringify([edge.module,edge.name,edge.target])),...topology.externalExports.map((edge:any)=>edgeKey(edge.module,edge.name,edge.declaration))]);
    const validationManifest={...manifest,modules:manifest.modules.map((module:any)=>({...module,exports:module.exports.filter((edge:any)=>edge.kind!=='js'||!separatelyChecked.has(edgeKey(module.path,edge.name,edge.declaration)))}))};
    const finalValidationInternal = {...extraction.internal, modules: extraction.internal.modules.map((module: any) => ({...module,
      declarations: module.declarations.map((row: any) => {
        if (!['class', 'mixin'].includes(row.kind)) return row;
        const node = extraction.bindings.provenanceUnits(row).implementation;
        return extraction.ordinaryProjection?.declarationFor(node) ?? row;
      }),
    }))};
    // Own-origin validation above retains shadowed contracts. This second view
    // also checks all effective ordinary producer rows, including support bases.
    validateGeneratedManifest(validationManifest,finalValidationInternal,checker,sources,{invariants:'error',exportTypes:'error'},program,extraction.bindings);
    return {manifestSha256:hash(manifest),proofsSha256:hash(proofs),constructorFacets:facetProofs.length};
  }
  validate();freeze(manifest);freeze(proofs);
  return Object.freeze({manifest,proofs,validate,qualified:false,
    scope:'experimental source-bound CEM projection; no generator cutover, receipt publication or full generic annotation qualification'});
}
