import {checkCapturedFactoryEventAdmission,checkCapturedModuleEventAdmission} from './captured-factory-event-admission.ts';
import {resolve} from 'node:path';
import {extractOwnVanillaClass, validateGeneratedManifest, getJSDocInfo} from '@wc-toolkit/cem-generator';
import {extractOwnLitClass} from '@wc-toolkit/cem-generator-lit';
import {parseCemClassTags, resolveMeaningfulParsedTypeFromText} from '@wc-toolkit/cem-generator-utils';
import {ts} from './compiler-api.mjs';
import {constructorOriginIndex} from './candidate-mixin-origins.ts';
import {constructorLitOwnership, supplementLitWithVanilla} from './candidate-lit-ownership.ts';
import {completeCandidateModules} from './candidate-modules.ts';
import {relativeImportTypes} from './type-text.ts';
import {constructorOriginPolicies} from './candidate-constructor-policies.ts';
import {assertOrdinaryProjection} from './candidate-ordinary-projection.ts';

import {capturedCompilerProgram} from './captured-compiler-program.ts';
import {checkCapturedFactoryAnnotationScope,checkCapturedAnnotationScope} from './captured-annotation-scope.ts';
import {checkCapturedEventVisibility,checkCapturedModuleEventVisibility} from './captured-event-visibility.ts';

const extractionInputs = new WeakMap<object, any>();

export function assertConstructorExtractionInputs(extraction: any, program: any, sources: any[], roots: any[]) {
  const owner = extractionInputs.get(extraction);
  const same = (a: any[], b: any[]) => a.length === b.length && a.every((node, i) => node === b[i]);
  if (!owner || owner.program !== program || !same(owner.sources, sources) || !same(owner.roots, roots)) throw new Error('Serialization requires exact owned extraction inputs');
  extraction.validate();
  return owner.sourceRoot;
}

/** Only the exact extraction-owned capture can select the event route. */
export function constructorEventCapture(extraction:any,program:any) {
  const owner=extractionInputs.get(extraction);
  if(!owner||owner.program!==program)throw new Error('Event serialization requires exact extraction ownership');
  if(owner.eventCapture&&capturedCompilerProgram(program)!==owner.eventCapture)throw new Error('Event capture binding changed');
  return owner.eventCapture;
}

/** Unqualified own-origin extraction seam. This deliberately has no generator
 * cutover, serializer or inheritance composition. All internal rows are bound
 * before module supplementation/strict validation; JSON clones are not origins.
 * The default candidate's callable rejection remains unchanged.
 */
export function extractConstructorOrigins(program: any, sources: any[], sourceRoot: string, roots: any[], lit = true, ordinaryPacket?: any, eventCapture?: any) {
  sources = [...sources]; roots = [...roots];
  if(eventCapture&&(capturedCompilerProgram(program)!==eventCapture||!eventCapture.dispatchHelperPolicy))throw new Error('Event extraction requires its exact explicit event capture');
  const checker = program.getTypeChecker(), selected = new Set(sources);
  const paths = new Map(sources.map(source => [source, source.fileName]));
  // The supplement uses these exact source-root-relative module paths too.
  const rootPrefix = resolve(sourceRoot);
  const sourcePath = (source: any) => {
    if (!selected.has(source) || program.getSourceFile(source.fileName) !== source) throw new Error('Extraction source is outside the selected Program');
    const file = resolve(source.fileName);
    if (!file.startsWith(rootPrefix + '/')) throw new Error('Extraction source escapes its root');
    return file.slice(rootPrefix.length + 1);
  };
  const ordinary = ordinaryPacket && assertOrdinaryProjection(ordinaryPacket, program, sources, roots);
  if (ordinary && ordinary.sourceRoot !== rootPrefix) throw new Error('Ordinary projection belongs to a different source root');
  const index = constructorOriginIndex(program, sources, sourcePath, roots);
  const all = new Set<any>();
  for (const root of roots) for (const step of index.compositionFor(root)) if (step.origin) all.add(step.origin);
  // A partial root selection cannot silently turn a selected class into an
  // unrepresented declaration during export supplementation.
  for (const source of sources) for (const node of source.statements) if (ts.isClassDeclaration(node) && node.name) {
    if (![...all].some(origin => origin.node === node) && !ordinary?.declarationFor(node)) throw new Error('Selected class has no extraction root or ordinary projection: ' + node.name.text);
  }
  const isLit = lit ? constructorLitOwnership(program, index, roots) : () => false;
  const ordinaryOnly = new Map<any, any>();
  const originsByNode = new Map([...all].map(origin => [origin.node, origin]));
  const rows = new Map<any, any>(), factories = new Map<any, any>(), implementations = new Set<any>();
  const modules = sources.map(source => ({kind: 'javascript-module', path: sourcePath(source), source: source.fileName, declarations: [] as any[], exports: [] as any[]}));
  const modulesBySource = new Map(sources.map((source, i) => [source, modules[i]]));
  function assertProgram(owner: any, selection: any[]) {
    if (owner !== program || owner.getTypeChecker() !== checker || selection.length !== sources.length ||
        new Set(selection).size !== selected.size || selection.some(source => !selected.has(source) || owner.getSourceFile(source.fileName) !== source || paths.get(source) !== source.fileName)) {
      throw new Error('Constructor bindings require their exact Program and source selection');
    }
  }
  function assertDeclaration(module: string, declaration: any) {
    const ordinaryNode = ordinary?.nodeFor(declaration);
    if (ordinaryNode) {
      if (module !== sourcePath(ordinaryNode.getSourceFile()) || ordinary.declarationFor(ordinaryNode) !== declaration) throw new Error('Ordinary declaration is not its exact projected row');
      return;
    }
    const origin = index.originOf(declaration);
    if (origin.reference.module !== module || rows.get(origin) !== declaration) throw new Error('Constructor declaration is not its exact extracted row');
  }
  const eventBindings=new WeakMap<object,any>(),eventAdmissions=new WeakMap<object,any>();
  function factoryAdmission(owner:any) {
    if(!eventCapture)return undefined;
    const origin=originsByNode.get(owner);if(!origin?.factory)return undefined;
    let proof=eventAdmissions.get(owner);
    if(!proof){proof=checkCapturedFactoryEventAdmission(program,origin.factory.callable,owner);eventAdmissions.set(owner,proof);}
    proof.assertOriginal();return proof;
  }
  function factoryEvent(owner:any,name:string) {
    if(!eventCapture)return undefined;
    const origin=originsByNode.get(owner);if(!origin?.factory)return undefined;
    const declaration=rows.get(origin),matches=declaration?.events?.filter((row:any)=>row.name===name)??[];
    if(matches.length!==1)throw new Error('Factory event requires one exact own metadata row');
    const row=matches[0],prior=eventBindings.get(row);
    if(prior){prior.visibility.assertOriginal();prior.annotation.assertOriginal();prior.admission.assertOriginal();return prior;}
    const callable=origin.factory.callable,source=owner.getSourceFile();
    const candidates=ts.getJSDocTags(owner).filter((tag:any)=>['fires','event'].includes(tag.tagName.text)).map((tag:any)=>{
      const annotation=checkCapturedFactoryAnnotationScope(program,callable,owner,tag);
      const name=source.text.slice(annotation.receipt.typeEnd+1,tag.end).trim().split(/\s/)[0];
      return {tag,annotation,name};
    }).filter((entry:any)=>entry.name===name);
    if(candidates.length!==1)throw new Error('Factory event requires one exact directly authored event tag');
    const {tag,annotation}=candidates[0],visibility=checkCapturedEventVisibility(program,callable,owner,tag);
    const admission=factoryAdmission(owner),dispatch=admission.event(tag);
    const result=Object.freeze({program,owner,callable,tag,name,annotation,visibility,admission,dispatch});eventBindings.set(row,result);return result;
  }
  function moduleEvent(owner:any,name:string) {
    if(!eventCapture)return undefined;
    const origin=originsByNode.get(owner);if(!origin||origin.factory)return undefined;
    const declaration=rows.get(origin),matches=declaration?.events?.filter((row:any)=>row.name===name)??[];
    if(matches.length!==1)throw new Error('Module event requires one exact own metadata row');
    const row=matches[0],prior=eventBindings.get(row);
    if(prior){prior.visibility.assertOriginal();prior.annotation.assertOriginal();prior.admission?.assertOriginal();return prior;}
    const source=owner.getSourceFile(),candidates=ts.getJSDocTags(owner).filter((tag:any)=>['fires','event'].includes(tag.tagName.text)).map((tag:any)=>{
      const annotation=checkCapturedAnnotationScope(program,owner,tag);
      return {tag,annotation,name:source.text.slice(annotation.receipt.typeEnd+1,tag.end).trim().split(/\s/)[0]};
    }).filter((entry:any)=>entry.name===name);
    if(candidates.length!==1)throw new Error('Module event requires one exact directly authored event tag');
    const {tag,annotation}=candidates[0],visibility=checkCapturedModuleEventVisibility(program,owner,tag);
    const admission=row.detail===undefined?undefined:checkCapturedModuleEventAdmission(program,owner),dispatch=admission?.event(tag);
    const result=Object.freeze({program,owner,tag,name,annotation,visibility,admission,dispatch});eventBindings.set(row,result);return result;
  }
  const bindings = Object.freeze({assertProgram, assertDeclaration, factoryEvent, factoryAdmission, moduleEvent,
    checkedCapturedEventVisibility(declaration:any,event:any) {
      if(!eventCapture)return false;
      const node=ordinary?.nodeFor(declaration);if(node)return false;
      const origin=index.originOf(declaration);
      assertDeclaration(origin.reference.module,declaration);
      if(!declaration.events?.includes(event))throw new Error('Event visibility requires its exact own extracted row');
      const binding=origin.factory?factoryEvent(origin.node,event.name):moduleEvent(origin.node,event.name);binding.visibility.assertOriginal();return true;
    },
    factoryDeclaration(node: any) {
      if (program.getSourceFile(node.getSourceFile().fileName) !== node.getSourceFile()) throw new Error('Factory query belongs to another Program');
      return factories.get(node);
    },
    isLitOrigin(origin: any) {
      if (index.originFor(origin?.node) !== origin || !rows.has(origin)) throw new Error('Lit policy requires an exact extracted origin');
      return isLit(origin);
    },
    joinFactory: index.joinFactory,
    provenanceUnits(declaration: any) {
      const node = ordinary?.nodeFor(declaration);
      return node ? Object.freeze({implementation: node}) : index.provenanceUnits(declaration);
    },
    isPassthroughDeclaration(declaration: any) {return ordinaryOnly.has(declaration);},
    isImplementationSymbol(symbol: any) {
      return Boolean(symbol?.declarations?.length && symbol.declarations.every((node: any) => implementations.has(node)));
    },
  });
  for (const origin of all) {
    const node = origin.node, source = node.getSourceFile();
    if ([node, ...node.members].some((part: any) => ts.canHaveDecorators(part) && ts.getDecorators(part)?.length)) throw new Error('Constructor/member decorators require an installed-symbol ownership adapter');
    const side = new Map<string, boolean>();
    for (const member of node.members) if (member.name) {
      // Until all extraction/provenance stages share semantic property keys,
      // accepting source spellings such as "value" or [key] would bypass own
      // accessor/policy matching. Reject before any contract row is extracted.
      if ((!ts.isIdentifier(member.name) && !ts.isPrivateIdentifier(member.name)) || member.name.getText(source) !== member.name.text) throw new Error('Quoted, numeric, computed and escaped member names require a semantic property-key adapter');
      const name = member.name.getText(source), isStatic = Boolean(ts.getCombinedModifierFlags(member) & ts.ModifierFlags.Static);
      if (side.has(name) && side.get(name) !== isStatic) throw new Error('Own extractor requires distinct static/instance names until member-key composition is integrated');
      side.set(name, isStatic);
    }
    const context = {program, filePath: source.fileName, sourceFile: source, sourceText: source.text, checker, typeParsing: 'public'};
    const litOwned = isLit(origin);
    const policy = constructorOriginPolicies(node, litOwned);
    const native = extractOwnVanillaClass(node, context);
    const declaration = litOwned ? supplementLitWithVanilla(extractOwnLitClass(node, context), native, origin.reference.module + '#' + origin.reference.name) : native;
    declaration.kind = origin.kind; declaration.name = origin.reference.name; declaration.module = source.fileName;
    // A factory implementation is a constructor contract, never a direct tag
    // registration. A tagged mixin needs explicit application-site semantics.
    if (origin.kind === 'mixin') {
      if (declaration.tagName) throw new Error('A returned mixin class cannot own a custom-element registration');
      const callable = origin.factory.callable, authored = origin.factory.declaration;
      const factoryDoc = parseCemClassTags(authored);
      const facetKeys = ['attributes','properties','slots','cssParts','cssProperties','cssStates','events','tagName','omitInherited'];
      if (facetKeys.some(key => factoryDoc[key] !== undefined) || ts.getJSDocTags(authored).some((tag: any) => ['outputAttribute','internalEvent'].includes(tag.tagName.text))) throw new Error('Factory-level facet tags require an explicit callable/implementation composition adapter');
      if (!declaration.description) declaration.description = getJSDocInfo(authored).description || undefined;
      let statement = authored;
      if (ts.isVariableDeclaration(authored)) statement = authored.parent.parent;
      const flags = ts.getCombinedModifierFlags(statement);
      declaration.exportName = flags & ts.ModifierFlags.Export ? flags & ts.ModifierFlags.Default ? 'default' : origin.reference.name : undefined;
      declaration.customElement = false;
      declaration.parameters = callable.parameters.map((parameter: any) => ({name: parameter.name.getText(source),
        type: relativeImportTypes(checker.typeToString(checker.getTypeAtLocation(parameter), parameter, ts.TypeFormatFlags.NoTruncation), source.fileName, ts)}));
      implementations.add(node);
    }
    const projected = ordinary?.declarationFor(node);
    if (projected) {
      if (projected.tagName === undefined) delete declaration.tagName; else declaration.tagName = projected.tagName;
      declaration.customElement = projected.customElement;
    }
    applyOwnOriginContracts(node, declaration, checker, sourcePath(source), policy);
    index.bindExtracted(origin.reference.module, origin.source, declaration); rows.set(origin, declaration);
    if (origin.factory) factories.set(origin.factory.declaration, declaration);
    modulesBySource.get(source)!.declarations.push(declaration);
  }
  for (const {node, declaration} of ordinary?.entries() ?? []) {
    if (originsByNode.has(node)) continue; // Its own row supports composition; final ordinary projection stays separate.
    ordinaryOnly.set(declaration, node);
    modulesBySource.get(node.getSourceFile())!.declarations.push(declaration);
  }
  for (const definition of ordinary?.definitions() ?? []) modulesBySource.get(definition.source)!.exports.push(definition.edge);
  function ordinaryRegistryAlias(expression: any, seen = new Set<any>()): any {
    if (!ts.isIdentifier(expression) && !ts.isPropertyAccessExpression(expression)) return undefined;
    let symbol = checker.getSymbolAtLocation(expression);
    if (symbol?.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
    const declaration = symbol?.valueDeclaration;
    if (!declaration || seen.has(declaration)) return undefined;
    seen.add(declaration);
    if (ts.isClassDeclaration(declaration)) return ordinary?.declarationFor(declaration) ? declaration : undefined;
    if (!ts.isVariableDeclaration(declaration) || !ts.isVariableDeclarationList(declaration.parent)
      || !(declaration.parent.flags & ts.NodeFlags.Const) || !declaration.initializer
      || !selected.has(declaration.getSourceFile())) return undefined;
    return ordinaryRegistryAlias(declaration.initializer, seen);
  }
  // Bind standard registry declarations through the compiler's lib.dom method
  // identity. A same-spelled local define/customElements object is not evidence.
  const ordinaryRegistrationTags = new Set<string>(), callableRegistrationTags = new Set<string>();
  const registered = new Map<any, string>(), registeredTags = new Set<string>((ordinary?.definitions() ?? []).map((row: any) => row.edge.name));
  for (const source of sources) {
    function visit(node: any) {
      if (ts.isCallExpression(node) && (ts.isPropertyAccessExpression(node.expression) || ts.isElementAccessExpression(node.expression))) {
        const property = ts.isPropertyAccessExpression(node.expression) ? node.expression.name : node.expression.argumentExpression;
        let method = checker.getSymbolAtLocation(node.expression) ?? (property && checker.getSymbolAtLocation(property));
        if (!method && ts.isElementAccessExpression(node.expression)) {
          const nameType = checker.getTypeAtLocation(node.expression.argumentExpression);
          if (nameType.isStringLiteral() && nameType.value === 'define') method = checker.getPropertyOfType(checker.getTypeAtLocation(node.expression.expression), 'define');
        }
        const platform = method?.name === 'define' && method.declarations?.some((declaration: any) =>
          program.isSourceFileDefaultLibrary(declaration.getSourceFile()) && ts.isInterfaceDeclaration(declaration.parent) && declaration.parent.name.text === 'CustomElementRegistry');
        if (platform) {
          const [tag, expression] = node.arguments;
          if (!expression) throw new Error('Registry constructor needs an exact selected class');
          let symbol = checker.getSymbolAtLocation(expression);
          if (symbol?.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
          const direct = symbol?.valueDeclaration;
          const target = direct && ts.isClassDeclaration(direct) ? direct : ordinaryRegistryAlias(expression);
          if (!target || !ts.isClassDeclaration(target)) throw new Error('Registry constructor needs an exact selected class');
          const origin = originsByNode.get(target), projected = ordinary?.declarationFor(target);
          // Completed ordinary output owns both registration acceptance and
          // its exact edge set, including conditional/imported registrations.
          // Scanning here must not add edges or impose callable grammar on it.
          if (projected) {
            if (!tag || !ts.isStringLiteralLike(tag)) throw new Error('Dynamic ordinary registry tags require a collision-proof adapter in mixed modules');
            ordinaryRegistrationTags.add(tag.text);
            ts.forEachChild(node, visit); return;
          }
          if (!ts.isPropertyAccessExpression(node.expression)) throw new Error('Element-access registry definitions need an explicit adapter');
          if (method.declarations.some((declaration: any) => !program.isSourceFileDefaultLibrary(declaration.getSourceFile()))) throw new Error('Augmented registry definitions need an explicit adapter');
          if (!ts.isExpressionStatement(node.parent) || node.parent.parent !== source) throw new Error('Registry definition requires an unconditional module-level call');
          if (node.arguments.length > 2) throw new Error('Registry definition requires a literal tag and direct constructor');
          if (!tag || !ts.isStringLiteralLike(tag)) throw new Error('Registry definition requires a literal tag and direct constructor');
          const declaration = origin ? rows.get(origin) : projected;
          if (!declaration || declaration.kind !== 'class') throw new Error('Registry constructor is not an extracted or projected class');
          if (registered.has(target) || registeredTags.has(tag.text)) throw new Error('Duplicate registry definition');
          if (declaration.tagName && declaration.tagName !== tag.text) throw new Error('Registry tag disagrees with authored class tag');
          registered.set(target, tag.text); registeredTags.add(tag.text); callableRegistrationTags.add(tag.text);
          if (origin) {declaration.tagName = tag.text; declaration.customElement = true;}
          const reference = origin?.reference ?? {name: target.name.text, module: sourcePath(target.getSourceFile())};
          modulesBySource.get(source)!.exports.push({kind:'custom-element-definition', name:tag.text, declaration:{...reference}});
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  for (const tag of ordinaryRegistrationTags) if (callableRegistrationTags.has(tag)) throw new Error('Duplicate registry definition across ordinary and callable cohorts: ' + tag);
  const internal = {schemaVersion: '2.1.0', modules};
  const topology = completeCandidateModules(internal, rootPrefix, sources, checker, program, bindings);
  // The supplemental classifier proves type-only and package export edges
  // independently; upstream's invariants require local declaration rows for all
  // edges. Remove only those exact classified edges from its validation view.
  // Their full records remain in internal/topology and cannot change unnoticed.
  const edgeKey = (module: string, name: string, reference: any) => JSON.stringify([module, name,
    (reference.package ? reference.package + ':' : '') + (reference.module ?? '') + '#' + reference.name]);
  const separatelyChecked = new Set([
    ...topology.typeOnlyExports.map((edge: any) => JSON.stringify([edge.module, edge.name, edge.target])),
    ...topology.externalExports.map((edge: any) => edgeKey(edge.module, edge.name, edge.declaration)),
  ]);
  const validationManifest = {...internal, modules: internal.modules.map(module => ({...module,
    exports: module.exports.filter((edge: any) => edge.kind !== 'js' || !separatelyChecked.has(edgeKey(module.path, edge.name, edge.declaration))),
  }))};
  const snapshot = JSON.stringify({internal, topology});
  function validate() {
    assertProgram(program, sources);
    if (ordinaryPacket) assertOrdinaryProjection(ordinaryPacket, program, sources, roots);
    if (JSON.stringify({internal, topology}) !== snapshot) throw new Error('Own extraction/export draft changed before validation');
    for (const [origin, declaration] of rows) {
      assertDeclaration(origin.reference.module, declaration);
      if(eventCapture&&origin.factory)factoryAdmission(origin.node);
    }
    return validateGeneratedManifest(validationManifest, internal, checker, sources, {invariants: 'error', exportTypes: 'error'}, program, bindings);
  }
  const extraction = Object.freeze({internal, index, bindings, topology, validate, ordinaryProjection: ordinary, qualified: false,
    scope: 'own-origin extraction/export/provenance draft; no seven-facet composition or production cutover'});
  extractionInputs.set(extraction, {program, sources, roots, sourceRoot: rootPrefix, eventCapture});
  return extraction;
}

function applyOwnOriginContracts(node: any, declaration: any, checker: any, module: string, policy: any) {
  const source = node.getSourceFile();
  const nameOf = (name: any) => name && (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isPrivateIdentifier(name)) ? name.text : undefined;
  const noAttributes = policy.noAttributes;
  const authored = new Map((parseCemClassTags(node).attributes ?? []).map((attribute: any) => [attribute.name, attribute]));
  const authoredAttributes = new Set((parseCemClassTags(node).attributes ?? [])
    .filter((attribute: any) => attribute.type !== undefined).map((attribute: any) => attribute.name));
  const accessors = new Map<string, {getter?: any; setter?: any}>();
  for (const member of node.members) {
    const name = nameOf(member.name); if (!name) continue;
    if (ts.isGetAccessorDeclaration(member) || ts.isSetAccessorDeclaration(member)) {
      const pair = accessors.get(name) ?? {};
      if (ts.isGetAccessorDeclaration(member)) pair.getter = member; else pair.setter = member;
      accessors.set(name, pair);
    }
  }
  for (const member of declaration.members ?? []) {
    if (policy.internal.has(JSON.stringify([Boolean(member.static), member.name]))) member.privacy = 'private';
    const reactive = !member.static && policy.reactive.get(member.name);
    if (reactive) {
      if (reactive.attribute === undefined) delete member.attribute; else member.attribute = reactive.attribute;
      if (reactive.reflect) member.reflects = true; else delete member.reflects;
    }
    if (noAttributes.has(member.name)) {delete member.attribute; delete member.reflects;}
    const pair = accessors.get(member.name);
    if (!pair) continue;
    const get = pair.getter && checker.getSignatureFromDeclaration(pair.getter);
    const read = get && checker.getReturnTypeOfSignature(get);
    const write = pair.setter && checker.getTypeAtLocation(pair.setter.parameters[0]);
    if (read && write && !checker.isTypeAssignableTo(read, write)) throw new Error('Accessor getter/setter type disagreement: ' + module + '#' + member.name);
    const type = read ?? write, scope = pair.getter ?? pair.setter;
    member.type = relativeImportTypes(checker.typeToString(type, scope, ts.TypeFormatFlags.NoTruncation), source.fileName, ts);
    delete member.parsedType;
    for (const attribute of declaration.attributes ?? []) if (attribute.fieldName === member.name && !authoredAttributes.has(attribute.name)) {attribute.type = member.type; delete attribute.parsedType;}
  }
  // Normalize generated links using exact source options, including quoted keys.
  // Class-authored contracts remain independent and keep their explicit types.
  const oldAttributes = declaration.attributes ?? [];
  const attributes = oldAttributes.filter((attribute: any) => !policy.reactive.has(attribute.fieldName) || authored.has(attribute.name));
  for (const [field, reactive] of policy.reactive) {
    if (reactive.attribute === undefined || noAttributes.has(field)) continue;
    const member = (declaration.members ?? []).find((row: any) => row.kind === 'field' && !row.static && row.name === field);
    if (!member) continue;
    const candidates = oldAttributes.filter((row: any) => row.fieldName === field);
    const prior = candidates.find((row: any) => row.name === reactive.attribute) ?? (candidates.length === 1 ? candidates[0] : undefined);
    let attribute = attributes.find((row: any) => row.name === reactive.attribute);
    if (attribute?.fieldName !== undefined && attribute.fieldName !== field) throw new Error('Reactive attribute collision: ' + reactive.attribute);
    if (!attribute) {attribute = {...prior, name: reactive.attribute, fieldName: field}; attributes.push(attribute);}
    else attribute.fieldName = field;
    if ((authored.get(attribute.name) as any)?.type === undefined && member.type !== undefined) {
      attribute.type = member.type;
      if (member.parsedType === undefined) delete attribute.parsedType; else attribute.parsedType = member.parsedType;
    }
    for (const key of ['description', 'summary', 'deprecated', 'default']) {
      if ((authored.get(attribute.name) as any)?.[key] === undefined && member[key] !== undefined) attribute[key] = member[key];
    }
  }
  declaration.attributes = attributes.flatMap((attribute: any) => {
    if (!noAttributes.has(attribute.fieldName)) return [attribute];
    const contract = authored.get(attribute.name) as any;
    if (!contract) return []; // A suppressed generated link is not a public attribute.
    // Class-authored documentation is independent of the suppressed field.
    // Rebuild from that contract so generated type/default/docs cannot leak.
    const parsedType = resolveMeaningfulParsedTypeFromText(contract.type, source, checker);
    return [{...contract, ...(parsedType !== undefined ? {parsedType} : {})}];
  });
  const internalEvents = new Set(ts.getJSDocTags(node).filter((tag: any) => tag.tagName.text === 'internalEvent')
    .map((tag: any) => typeof tag.comment === 'string' ? tag.comment.trim().split(/\s+/)[0] : ''));
  for (const event of declaration.events ?? []) if (internalEvents.has(event.name)) event.privacy = 'private';
  for (const tag of ts.getJSDocTags(node).filter((tag: any) => tag.tagName.text === 'outputAttribute')) {
    const match = typeof tag.comment === 'string' && /^(\S+)\s+(\S+)\s+-\s+(.+)$/.exec(tag.comment);
    if (!match) throw new Error('Invalid @outputAttribute in ' + module);
    const [, attribute, property, description] = match, pair = accessors.get(property);
    const member = (declaration.members ?? []).find((item: any) => item.kind === 'field' && item.name === property && !item.static);
    if (!member || !pair?.getter || pair.setter) throw new Error('Output attribute requires a read-only getter: ' + module + '#' + property);
    const attributes = declaration.attributes ??= [], existing = attributes.find((item: any) => item.name === attribute);
    if (existing && (existing.fieldName !== property || existing.type !== member.type || (existing.description !== undefined && existing.description !== description))) throw new Error('Conflicting output attribute: ' + attribute);
    member.attribute = attribute; member.reflects = true; member.readonly = true;
    if (existing) existing.description = description;
    else attributes.push({name:attribute, fieldName:property, type:member.type, description});
  }
}
