import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {ts} from './compiler-api.mjs';
import {relativeImportTypes} from './type-text.ts';

/** Parse balanced @fires type expressions, including object types with nested braces. */
export function eventAnnotation(comment: string) {
  const value = comment.trim();
  if (!value.startsWith('{')) return undefined;
  let depth = 0, end = -1;
  for (let i = 0; i < value.length; i++) {
    if (value[i] === '{') depth++;
    if (value[i] === '}' && --depth === 0) {end = i; break;}
  }
  if (end < 0) return undefined;
  const name = value.slice(end + 1).trim().split(/\s/)[0];
  return name ? {name, type: value.slice(1, end)} : undefined;
}

/** Validate actual annotated types in their original import scope, without executing components. */
export async function readEventContracts(packageRoot: string, sources: string[], checkTags = false, effective?:{roots:any[];contracts:any[]}) {
  const rootKey=(source:string,className:string)=>JSON.stringify([source,className]);
  const effectiveRoots=new Map<string,any[]>(),effectivePublicRoots=new Set<string>(),seenContracts=new Set<string>();
  if(effective) {
    if(!Array.isArray(effective.roots)||!Array.isArray(effective.contracts))throw new Error('Effective event inputs require explicit roots and contracts');
    for(const root of effective.roots) {
      const key=rootKey(root.source,root.className);
      if(!sources.includes(root.source)||effectiveRoots.has(key))throw new Error('Effective event root is unselected or duplicated');
      effectiveRoots.set(key,[]);if(root.public===true)effectivePublicRoots.add(key);
    }
    for(const contract of effective.contracts) {
      const root=rootKey(contract.source,contract.className),key=JSON.stringify([root,contract.name]);
      if(!effectiveRoots.has(root)||seenContracts.has(key)||!contract.composition||typeof contract.type!=='string'||!contract.type.trim()||typeof contract.detail!=='string'||!contract.detail.trim())
        throw new Error('Effective typed event has no unique declared root');
      seenContracts.add(key);effectiveRoots.get(root)!.push(contract);
    }
  }
  const observedEffectiveRoots=new Set<string>();
  const publicClasses = new Set<any>();
  const internalEvents = new Map<any, Set<string>>();
  const files = new Map<string, {text: string; length: number; entries: any[]; classes: any[]}>();
  for (const source of sources) {
    const absolute = resolve(packageRoot, source), text = await readFile(absolute, 'utf8');
    const parsed = ts.createSourceFile(absolute, text, ts.ScriptTarget.Latest, true);
    const entries: any[] = [], classes: any[] = [];
    const tagAssertions: string[] = [];
    let containsPublicClass=false,containsEffectiveRoot=false;
    for (const node of parsed.statements) if (ts.isClassDeclaration(node) && node.name) {
      const tags = ts.getJSDocTags(node);
      const effectiveKey=rootKey(source,node.name.text);
      const isPublic = tags.some((tag:any)=>['tagname','tag'].includes(tag.tagName.text))||effectivePublicRoots.has(effectiveKey);
      if(isPublic)containsPublicClass=true;
      for (const tag of tags) if (checkTags && ['tagname','tag'].includes(tag.tagName.text) && typeof tag.comment === 'string') {
        const name=tag.comment.trim().split(/\s/)[0];
        tagAssertions.push(`type __EnTag${tagAssertions.length} = __EnAssert<HTMLElementTagNameMap['${name}'] extends ${node.name.text} ? true : false>;`);
      }
      const internal = new Set(tags.filter((tag: any) => tag.tagName.text === 'internalEvent').map((tag: any) => String(tag.comment).split(/\s/)[0]));
      // Rebind to the owning Program below: spelling is not class identity.
      const origin = {start: node.getStart(parsed), end: node.end, name: node.name.text};
      classes.push({...origin, isPublic, internal});
      if(effectiveRoots.has(effectiveKey)) {
        containsEffectiveRoot=true;
        if(observedEffectiveRoots.has(effectiveKey))throw new Error('Effective event root has ambiguous source declaration');
        observedEffectiveRoots.add(effectiveKey);
        for(const contract of effectiveRoots.get(effectiveKey)!) {
          if(internal.has(contract.name))throw new Error('Effective event proof exposes an internally classified event');
          const {detail:expectedDetail,...value}=contract;entries.push({...value,expectedDetail,origin});
        }
      }
      for (const tag of tags) if (tag.tagName.text === 'fires'&&!effectiveRoots.has(effectiveKey)) {
        const entry = eventAnnotation(typeof tag.comment === 'string' ? tag.comment : '');
        if (!entry) throw new Error(`Missing typed @fires contract: ${source}#${node.name.text}: ${tag.getText(parsed)}`);
        if (!internal.has(entry.name)) entries.push({...entry, source, className: node.name.text, origin});
      }
    }
    if (!entries.length && !tagAssertions.length && !containsPublicClass&&!containsEffectiveRoot) continue;
    const assertions = entries.map((entry, index) => `type __EnEvent${index} = ${entry.type}; type __EnCheck${index} = __EnAssert<__EnTyped<__EnEvent${index}>>;`).join('\n');
    files.set(absolute, {length: text.length, entries, classes, text: text + '\n' +
      'type __EnAssert<T extends true> = T; type __EnTyped<T> = 0 extends (1 & T) ? false : T extends CustomEvent<infer D> ? 0 extends (1 & D) ? false : unknown extends D ? false : true : false;\n' + assertions + '\n' + tagAssertions.join('\n')});
  }
  if(observedEffectiveRoots.size!==effectiveRoots.size)throw new Error('Effective event root has no exact selected class');
  const options = {strict: true, skipLibCheck: true, noEmit: true, target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler};
  const host = ts.createCompilerHost(options), original = host.readFile;
  host.readFile = (file: string) => files.get(resolve(file))?.text ?? original(file);
  const program = ts.createProgram([...files.keys()], options, host), checker = program.getTypeChecker();
  const contracts: any[] = [];
  const details = new Map<any, Map<string, any>>();
  for (const [absolute, file] of files) {
    const source = program.getSourceFile(absolute)!;
    const classSymbols = new Map<number, any>();
    for (const origin of file.classes) {
      const node = source.statements.find((node:any) => ts.isClassDeclaration(node) &&
        node.getStart(source) === origin.start && node.end === origin.end && node.name?.text === origin.name);
      const symbol = node?.name && checker.getSymbolAtLocation(node.name);
      if (!symbol || !symbol.declarations?.includes(node)) throw new Error('Event class has no exact Program identity: ' + absolute + '#' + origin.name);
      classSymbols.set(origin.start, symbol);
      if (origin.isPublic) publicClasses.add(symbol);
      internalEvents.set(symbol, origin.internal);
    }
    const errors = program.getSemanticDiagnostics(source).filter((d: any) => d.start >= file.length);
    if (errors.length) throw new Error(ts.formatDiagnostics(errors, {getCanonicalFileName: (f: string) => f, getCurrentDirectory: () => packageRoot, getNewLine: () => '\n'}));
    for (const [index, entry] of file.entries.entries()) {
      const alias = source.statements.find((node: any) => ts.isTypeAliasDeclaration(node) && node.name.text === `__EnEvent${index}`);
      const type = checker.getTypeFromTypeNode(alias.type), detail = type.getProperty('detail');
      const symbol = classSymbols.get(entry.origin.start);
      if (!symbol) throw new Error('Event annotation has no owning class');
      const classDetails = details.get(symbol) ?? new Map<string, any>();
      if (classDetails.has(entry.name)) throw new Error('Duplicate typed @fires contract: ' + entry.source + '#' + entry.className + '.' + entry.name);
      classDetails.set(entry.name, checker.getTypeOfSymbolAtLocation(detail, alias));
      details.set(symbol, classDetails);
      const {origin,expectedDetail,...contract} = entry;
      const detailText=relativeImportTypes(checker.typeToString(checker.getTypeOfSymbolAtLocation(detail,alias),alias,
        ts.TypeFormatFlags.NoTruncation|(entry.composition?ts.TypeFormatFlags.UseFullyQualifiedType:0)),source.fileName,ts);
      if(expectedDetail!==undefined&&detailText!==expectedDetail)throw new Error('Effective event detail disagrees with its checked final type');
      contracts.push({...contract,detail:detailText});
    }
  }
  // Verify directly authored shared-dispatch calls against the source-declared payload.
  // Calls inside generic primitive controllers retain their own family/transaction tests.
  for (const source of program.getSourceFiles()) {
    if (!source.fileName.startsWith(resolve(packageRoot,'src') + '/')) continue;
    function visit(node: any) {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && ['dispatchChange','dispatchAction','dispatchDraftInput'].includes(node.expression.text)) {
        const [target, argument, options] = node.arguments;
        if (target && argument && ts.isObjectLiteralExpression(argument)) {
          const targetType = checker.getTypeAtLocation(target), classSymbol = targetType.getSymbol(), className = classSymbol?.name;
          let name = node.expression.text === 'dispatchChange' ? 'en-change' : node.expression.text === 'dispatchAction' ? 'en-action' : 'en-input';
          if (options && ts.isObjectLiteralExpression(options)) {
            const override = options.properties.find((p: any) => p.name?.getText() === 'eventName');
            if (override) {
              if (override.initializer && ts.isStringLiteral(override.initializer)) name = override.initializer.text;
              else {ts.forEachChild(node,visit);return;} // Generic event-name adapters retain family tests.
            }
          }
          const expected = details.get(classSymbol)?.get(name);
          if (!expected && publicClasses.has(classSymbol) && !internalEvents.get(classSymbol)?.has(name)) throw new Error(`Unclassified emitted event: ${source.fileName} ${className}.${name}`);
          if (expected) {
            const keys = node.expression.text === 'dispatchChange' ? ['previous','proposed','reason'] : node.expression.text === 'dispatchAction' ? ['action','data'] : ['value','isComposing','inputType'];
            const variants = expected.isUnion() ? expected.types : [expected];
            const valid = variants.some((variant: any) => keys.every(key => {
              const property = argument.properties.find((p: any) => p.name?.getText() === key);
              const expectedProperty = variant.getProperty(key);
              if (!property || !expectedProperty) return key === 'reason' && !property;
              const actual = checker.getTypeAtLocation(ts.isShorthandPropertyAssignment(property) ? property.name : property.initializer);
              return checker.isTypeAssignableTo(actual, checker.getTypeOfSymbolAtLocation(expectedProperty, node));
            }));
            if (!valid) throw new Error(`Emitted payload disagrees with @fires: ${source.fileName}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1} ${className}.${name}`);
          }
        }
      }
      ts.forEachChild(node,visit);
    }
    visit(source);
  }
  return contracts;
}
