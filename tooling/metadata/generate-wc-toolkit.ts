import {createCapturedEventCompilerProgram} from './captured-compiler-program.ts';
import {mkdtemp, readFile, writeFile, realpath, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve, relative, join, isAbsolute, sep} from 'node:path';
import {generateCem as extract, vanillaBuiltin, detectClassMembers, detectClassEvents, mergeClassEvents, getJSDocInfo} from '@wc-toolkit/cem-generator';
import {litPlugin} from '@wc-toolkit/cem-generator-lit';
import {parseCemClassTags, resolveMeaningfulParsedTypeFromText} from '@wc-toolkit/cem-generator-utils';
import {digestBytes, digestJson} from '../evidence/identity.ts';
import {ts, assertGeneratorCompilerOwners, compilerIdentity} from './compiler-api.mjs';
import {omittedCssPartsKey, readOmittedCssParts} from './omitted-css-parts.ts';
import {candidatePolicy} from './candidate-policy.mjs';
import {candidateSuperclass, candidateInheritancePatch, restoreExternalSuperclasses, type CandidateSuperclass} from './candidate-inheritance.ts';
import {constructorCohort} from './candidate-constructor-cohort.ts';
import {bindOrdinaryProjection} from './candidate-ordinary-projection.ts';
import {extractConstructorOrigins} from './candidate-origin-extraction.ts';
import {serializeConstructorComposition} from './candidate-constructor-serialization.ts';
import {portableConstructorProofs} from './portable-constructor-proofs.ts';
import {litClassOwnership, supplementLitWithVanilla} from './candidate-lit-ownership.ts';
import {completeCandidateModules} from './candidate-modules.ts';
import {candidateContractExclusions} from './candidate-contract-exclusions.ts';
import {reconcileLitContract} from './lit-contract.ts';
import {relativeImportTypes} from './type-text.ts';
import {candidateGeneratorIdentity} from './generator-identity.ts';
import type {GenerateOptions} from './generate.ts';

/** Source-only WC Toolkit adapter; callers own output publication. Components are never imported. */
export async function generateCandidateCem(options: GenerateOptions) {
  if (!options.sources.length) throw new Error('Supply actual component source files; empty manifests are not generated as coverage.');
  const sourceRoot = resolve(options.sourceRoot), physicalRoot = await realpath(sourceRoot);
  const owners = assertGeneratorCompilerOwners();
  const files = await Promise.all([...new Set(options.sources)].sort().map(async source => {
    const absolute = resolve(sourceRoot, source), path = relative(sourceRoot, absolute);
    const physical = relative(physicalRoot, await realpath(absolute));
    if (!path || path === '..' || path.startsWith(`..${sep}`) || isAbsolute(path) || physical === '..' || physical.startsWith(`..${sep}`) || isAbsolute(physical)) {
      throw new Error('Source must be inside sourceRoot: ' + source);
    }
    return {absolute, path: path.split(sep).join('/'), code: await readFile(absolute, 'utf8')};
  }));
  const selected = new Map(files.map(file => [file.absolute, file]));
  const compilerOptions={target:ts.ScriptTarget.ESNext,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,
    strict:true,skipLibCheck:true,noEmit:true};
  // Discovery chooses only the route. Every hybrid binding below is recomputed
  // from the captured Program; no node or symbol crosses these Programs.
  let parsed=ts.createProgram(files.map(file=>file.absolute),compilerOptions),eventCapture:any;
  const discoverySources=files.map(file=>parsed.getSourceFile(file.absolute));
  if(discoverySources.some(source=>!source))throw new Error('Hybrid discovery requires exact selected sources');
  const discovery=constructorCohort(parsed,discoverySources,(source:any)=>selected.get(resolve(source.fileName))!.path);
  if(discovery.roots.length) {eventCapture=createCapturedEventCompilerProgram(files.map(file=>file.absolute),compilerOptions);parsed=eventCapture.program;}
  const checker = parsed.getTypeChecker();
  const sourceFiles = files.map(file => {
    const source = parsed.getSourceFile(file.absolute);
    if (!source || source.text !== file.code) throw new Error('Program source mismatch: ' + file.path);
    const diagnostics = parsed.getSyntacticDiagnostics(source);
    if (diagnostics.length) throw new Error('Cannot generate metadata from invalid source ' + file.path + ': ' + ts.formatDiagnostics(diagnostics, {
      getCanonicalFileName: (file: string) => file, getCurrentDirectory: () => sourceRoot, getNewLine: () => '\n',
    }));
    return source;
  });
  const sourcePath = (source: any) => {
    const file = selected.get(resolve(typeof source === 'string' ? source : source.fileName));
    if (!file) throw new Error('Unexpected source outside explicit membership: ' + (source.fileName ?? source));
    return file.path;
  };
  const cohort = constructorCohort(parsed, sourceFiles, sourcePath), hybrid = cohort.roots.length > 0;
  if(hybrid!==Boolean(eventCapture))throw new Error('Constructor cohort changed between discovery and capture');
  const ordinary = new Set(cohort.ordinary), detectorBindings = new Set<any>();
  function originalClass(foreign: any, context: any) {
    const source = parsed.getSourceFile(context.filePath);
    if (!source || source.text !== context.sourceText || context.sourceFile.text !== source.text
      || foreign.getSourceFile() !== context.sourceFile || foreign.parent !== context.sourceFile) return undefined;
    const matches = source.statements.filter(node => ts.isClassDeclaration(node) && node.pos === foreign.pos && node.end === foreign.end && node.name?.text === foreign.name?.text);
    if (matches.length !== 1) throw new Error('Ordinary detector has no exact original class correspondence');
    return matches[0];
  }
  function includeOrdinary(foreign: any, context: any) {
    const node = originalClass(foreign, context);
    if (!node || !ordinary.has(node)) return false;
    detectorBindings.add(node); return true;
  }
  const observed = new Set<string>();
  const observer = {name: 'en-source-membership', onFile(context: any) {
    const absolute = resolve(context.filePath), file = selected.get(absolute);
    if (!file || context.sourceText !== file.code) throw new Error('Generator analyzed an unselected or changed source: ' + context.filePath);
    if (observed.has(absolute)) throw new Error('Generator visited a source twice: ' + file.path);
    observed.add(absolute); return {};
  }};
  const vanilla = vanillaBuiltin(hybrid ? {isClass: includeOrdinary} : undefined), litClaims = new Map<string, Set<string>>();
  const nativeFragments = new Map<string, Record<string, any>>();
  const readVanilla = (context: any) => {
    if (!nativeFragments.has(context.filePath)) {
      const topLevel = new Set(context.sourceFile.statements.filter(ts.isClassDeclaration).map((node: any) => node.name?.text));
      const counts = new Map<string, number>();
      function count(node: any) {
        if (ts.isClassDeclaration(node) && node.name && (!hybrid || includeOrdinary(node, context))) counts.set(node.name.text, (counts.get(node.name.text) ?? 0) + 1);
        ts.forEachChild(node, count);
      }
      count(context.sourceFile);
      const detected = vanilla.shouldAnalyze?.(context.sourceText, context.filePath) ? vanilla.onFile!(context) : {};
      // A function-local helper is not a module declaration. The native detector
      // keys recursively visited classes only by name, so reject ambiguous keys.
      const declarations = Object.fromEntries(Object.entries(detected).filter(([name, declaration]) => {
        if (!topLevel.has(name)) return false;
        if (counts.get(name) !== 1) throw new Error('Ambiguous native class name: ' + name);
        if ((declaration as any).name !== name || (declaration as any).module !== context.filePath) throw new Error('Native class source correspondence changed: ' + name);
        return true;
      }));
      nativeFragments.set(context.filePath, declarations);
    }
    return nativeFragments.get(context.filePath)!;
  };
  const routedVanilla = {...vanilla, onFile(context: any) {
    return Object.fromEntries(Object.entries(readVanilla(context)).filter(([name]) => !litClaims.get(context.filePath)?.has(name)));
  }};
  const externalSuperclasses = new Map<string, CandidateSuperclass>();
  const plainClasses = {name: 'en-plain-source-classes', onFile(context: any) {
    const detected = readVanilla(context);
    const claimed = new Set([...Object.keys(detected), ...(litClaims.get(context.filePath) ?? [])]);
    const fragment: Record<string, any> = {};
    for (const node of context.sourceFile.statements) {
      if (!ts.isClassDeclaration(node) || !node.name || claimed.has(node.name.text) || (hybrid && !includeOrdinary(node, context))) continue;
      const flags = ts.getCombinedModifierFlags(node), docs = getJSDocInfo(node), classDoc = parseCemClassTags(node);
      const tag = ts.getJSDocTags(node).find((item: any) => ['tag', 'tagname'].includes(item.tagName.text));
      const tagName = typeof tag?.comment === 'string' ? tag.comment.trim().split(/\s/)[0] : undefined;
      const extendsType = node.heritageClauses?.find((clause: any) => clause.token === ts.SyntaxKind.ExtendsKeyword)?.types[0];
      let superclass;
      if (extendsType) {
        if (!ts.isIdentifier(extendsType.expression)) throw new Error('Unqualified callable superclass: ' + sourcePath(context.sourceFile) + '#' + node.name.text);
        // Superclass resolution uses our own Program and its own AST, never the upstream checker with foreign nodes.
        const authoredSource = parsed.getSourceFile(context.filePath);
        const authoredClass = authoredSource?.statements.filter(ts.isClassDeclaration).find(statement => statement.name?.text === node.name.text);
        const authoredExtends = authoredClass?.heritageClauses?.find((clause: any) => clause.token === ts.SyntaxKind.ExtendsKeyword)?.types[0];
        if (!authoredExtends || !ts.isIdentifier(authoredExtends.expression)) throw new Error('Superclass source correspondence missing: ' + sourcePath(context.sourceFile) + '#' + node.name.text);
        superclass = candidateSuperclass(authoredExtends.expression, parsed, selected, sourcePath);
        if (superclass.package) externalSuperclasses.set(sourcePath(context.sourceFile) + '#' + node.name.text, superclass);
      }
      fragment[node.name.text] = {name: node.name.text, kind: 'class', module: context.filePath,
        customElement: Boolean(tagName), ...(tagName ? {tagName} : {}),
        ...(flags & ts.ModifierFlags.Export ? {exportName: flags & ts.ModifierFlags.Default ? 'default' : node.name.text} : {}),
        ...(docs.description ? {description: docs.description} : {}), ...(superclass ? {superclass} : {}),
        ...(classDoc.omitInherited ? {omitInherited: classDoc.omitInherited} : {}),
        ...(classDoc.cssParts ? {cssParts: classDoc.cssParts} : {}),
        members: detectClassMembers(node, context),
        events: mergeClassEvents(detectClassEvents(node, context), classDoc.events?.map((event: any) => ({
          ...event,
          parsedType: context.typeParsing === 'none' ? undefined
            : resolveMeaningfulParsedTypeFromText(event.type, context.sourceFile, context.checker),
        })))};
    }
    return fragment;
  }};
  const configDirectory = await mkdtemp(join(tmpdir(), 'en-cem-config-'));
  let manifest: any;
  try {
    const configPath = join(configDirectory, 'tsconfig.json');
    const config = {files: files.map(file => file.absolute), include: [], exclude: [], compilerOptions: {
      target: 'ESNext', module: 'ESNext', moduleResolution: 'Bundler', strict: true, skipLibCheck: true, noEmit: true,
    }};
    await writeFile(configPath, JSON.stringify(config), {flag: 'wx'});
    const plugin = litPlugin(litClassOwnership(parsed, sourceFiles, hybrid ? cohort.ordinary : undefined));
    // Analysis must reach indirect Lit subclasses even if a file lacks a direct `from 'lit'` import.
    const lit = {...plugin, shouldAnalyze: () => true, onFile(context: any) {
      const fragment = plugin.onFile(context);
      if (hybrid) for (const foreign of context.sourceFile.statements) if (ts.isClassDeclaration(foreign) && foreign.name && fragment[foreign.name.text] && !includeOrdinary(foreign, context)) throw new Error('Lit emitted a class outside the ordinary cohort');
      // Bind Lit-owned direct superclass references through our originating Program too.
      const authoredSource = parsed.getSourceFile(context.filePath);
      for (const node of authoredSource?.statements ?? []) {
        if (!ts.isClassDeclaration(node) || !node.name || !fragment[node.name.text]) continue;
        const expression = node.heritageClauses?.find(clause => clause.token === ts.SyntaxKind.ExtendsKeyword)?.types[0]?.expression;
        if (!expression || (!ts.isIdentifier(expression) && !ts.isPropertyAccessExpression(expression))) continue;
        const superclass = candidateSuperclass(expression, parsed, selected, sourcePath);
        fragment[node.name.text].superclass = superclass;
        if (superclass.package) externalSuperclasses.set(sourcePath(authoredSource) + '#' + node.name.text, superclass);
      }
      const native = readVanilla(context);
      for (const [name, declaration] of Object.entries(fragment)) {
        if (!native[name]) continue;
        if ((declaration as any).name !== name || (declaration as any).module !== context.filePath || native[name].name !== name || native[name].module !== context.filePath) throw new Error('Lit/native class correspondence changed: ' + name);
        fragment[name] = supplementLitWithVanilla(declaration, native[name], sourcePath(authoredSource) + '#' + name);
      }
      litClaims.set(context.filePath, new Set(Object.keys(fragment))); return fragment;
    }};
    manifest = extract({tsConfigPath: configPath, include: files.map(file => file.absolute.split(sep).join('/')),
      inheritance: false, builtinVanilla: false,
      plugins: [observer, ...(options.lit === false ? [] : [lit]), routedVanilla, plainClasses, {name: 'en-declaration-inheritance', afterManifest: candidateInheritancePatch}, ...(options.lit === false ? [] : [{name: 'en-source-contract-exclusions', afterManifest: (manifest: any) => candidateContractExclusions(manifest, sourceFiles, sourcePath)}])], conflictPolicy: candidatePolicy.conflictPolicy,
      // The partial ordinary projection cannot validate the shared factory
      // export graph. No partial result escapes: both own-source and completed
      // merged views are strictly validated below before returning a manifest.
      validation: hybrid ? {invariants: 'error', exportTypes: 'off'} : candidatePolicy.validation, typeParsing: candidatePolicy.typeParsing,
      sort: candidatePolicy.sort, deprecatedLast: candidatePolicy.deprecatedLast, customJsDocTags: candidatePolicy.customJsDocTags,
      modulePathResolver: {modulePathTemplate: file => sourcePath(file)},
    });
  } finally {await rm(configDirectory, {recursive: true, force: true});}
  if (observed.size !== selected.size || files.some(file => !observed.has(file.absolute))) throw new Error('Generator skipped an explicitly selected source.');
  if (manifest?.schemaVersion !== candidatePolicy.schemaVersion || !Array.isArray(manifest.modules)) throw new Error('Unexpected candidate CEM schema.');
  // Upstream optional fields are `undefined`; retain their JSON meaning before hashing serialized CEM.
  manifest = JSON.parse(JSON.stringify(manifest));
  restoreExternalSuperclasses(manifest, externalSuperclasses);
  let topology = hybrid ? undefined : completeCandidateModules(manifest, sourceRoot, sourceFiles, checker, parsed);
  // Upstream consumes omitInherited during flattening but omits it from JSON.
  // Preserve only the authored CSS-part exclusion needed by downstream mergers.
  for (const source of sourceFiles) for (const node of source.statements) {
    if (!ts.isClassDeclaration(node) || !node.name || (hybrid && !ordinary.has(node))) continue;
    const names = parseCemClassTags(node).omitInherited?.cssParts;
    if (!names?.length) continue;
    const module = manifest.modules.find((item: any) => item.path === sourcePath(source));
    const declaration = module?.declarations?.find((item: any) => item.kind === 'class' && item.name === node.name!.text);
    if (!declaration) throw new Error('Authored CSS part omission has no emitted declaration: ' + sourcePath(source) + '#' + node.name.text);
    declaration[omittedCssPartsKey] = readOmittedCssParts({[omittedCssPartsKey]: names}).sort();
  }

  const accessorType = (node: any, source: any) => {
    if (node.getSourceFile() !== source || parsed.getSourceFile(source.fileName) !== source) throw new Error('Accessor belongs to a different compiler program.');
    if (ts.isSetAccessorDeclaration(node)) {
      const getter = node.parent.members.find((member: any) => ts.isGetAccessorDeclaration(member) && member.name.getText() === node.name.getText());
      if (getter && !checker.isTypeAssignableTo(checker.getReturnTypeOfSignature(checker.getSignatureFromDeclaration(getter)!), checker.getTypeAtLocation(node.parameters[0]!))) {
        throw new Error(`Accessor getter/setter type disagreement: ${sourcePath(source)}#${node.name.getText()}`);
      }
    }
    const annotation = ts.isSetAccessorDeclaration(node) ? node.parameters[0]?.type : node.type;
    const type = ts.isSetAccessorDeclaration(node) ? checker.getTypeAtLocation(node.parameters[0]!) : checker.getReturnTypeOfSignature(checker.getSignatureFromDeclaration(node)!);
    return annotation?.getText() ?? relativeImportTypes(checker.typeToString(type, node, ts.TypeFormatFlags.NoTruncation), source.fileName, ts);
  };
  const corrections = options.lit === false ? [] : reconcileLitContract(manifest, sourceFiles, ts, accessorType, sourcePath, hybrid ? node => ordinary.has(node) : undefined);
  let constructorComposition, localConstructorProofs;
  if (hybrid) {
    const entries: any[] = [], definitions: any[] = [];
    for (const module of manifest.modules) {
      const source = sourceFiles.find(source => sourcePath(source) === module.path);
      if (!source) throw new Error('Ordinary output has no selected source');
      for (const declaration of module.declarations ?? []) {
        const node = cohort.ordinary.find(node => node.getSourceFile() === source && node.name?.text === declaration.name);
        if (!node || !detectorBindings.has(node)) throw new Error('Ordinary output has no observed exact detector binding');
        entries.push({node, module: module.path, declaration});
      }
      for (const edge of module.exports ?? []) if (edge.kind === 'custom-element-definition') {
        const node = cohort.ordinary.find(node => sourcePath(node.getSourceFile()) === edge.declaration?.module && node.name?.text === edge.declaration?.name);
        if (!node || !detectorBindings.has(node)) throw new Error('Ordinary definition target has no exact observed source');
        definitions.push({source, node, edge});
      }
    }
    const projection = bindOrdinaryProjection(parsed, sourceFiles, sourceRoot, cohort, entries, definitions);
    const extraction = extractConstructorOrigins(parsed, sourceFiles, sourceRoot, [...cohort.roots], options.lit !== false, projection, eventCapture);
    const result = serializeConstructorComposition(parsed, sourceFiles, [...cohort.roots], extraction);
    result.validate();
    manifest = result.manifest; topology = result.proofs.topology; localConstructorProofs = result.proofs;
    constructorComposition = {version: 1, route: 'exact-declaration-hybrid', proofs: portableConstructorProofs(parsed, sourceFiles, sourceRoot, result.proofs)};
  }
  const literalTypeAliases = sourceFiles.flatMap(source => source.statements.flatMap(statement => {
    if (!ts.isTypeAliasDeclaration(statement) || !ts.isUnionTypeNode(statement.type)) return [];
    const members = statement.type.types;
    if (!members.every(member => ts.isLiteralTypeNode(member) && ts.isStringLiteral(member.literal))) return [];
    return [{module: sourcePath(source), name: statement.name.text, type: statement.type.getText(source),
      values: members.map((member: any) => member.literal.text), exported: Boolean(ts.getCombinedModifierFlags(statement) & ts.ModifierFlags.Export)}];
  }));
  eventCapture?.revalidate();
  for (const file of files) if (await readFile(file.absolute, 'utf8') !== file.code) throw new Error('Source changed during CEM generation: ' + file.path);
  return {manifest, ...(localConstructorProofs ? {localEvidence: {constructorProofs: localConstructorProofs}} : {}), receipt: {schemaVersion: 2, kind: 'cem-generation', generator: await candidateGeneratorIdentity(), analyzer: {name: '@wc-toolkit/cem-generator', version: owners['@wc-toolkit/cem-generator']!.version},
    compiler: compilerIdentity(), parserVersion: ts.version, packages: owners, policy: candidatePolicy,
    lit: options.lit !== false, sources: Object.fromEntries(files.map(file => [file.path, digestBytes(file.code)])),
    manifestDigest: digestJson(manifest), corrections, literalTypeAliases, topology,
    ...(constructorComposition ? {constructorComposition} : {}),
    completeness: 'generated-metadata-requires-public-contract-review'}};
}

/** Verify selected source and tool provenance without rewriting output.
 * Maintained retained-CEM verification also compares fresh extraction so imported
 * declaration bodies and newly resolvable modules cannot leave stale metadata. */
export async function verifyCandidateReceipt(manifest: any, receipt: any, options: GenerateOptions) {
  if (receipt?.schemaVersion !== 2 || receipt.kind !== 'cem-generation' || manifest?.schemaVersion !== candidatePolicy.schemaVersion) throw new Error('Unsupported candidate receipt');
  if (digestJson(manifest) !== receipt.manifestDigest) throw new Error('Candidate manifest digest mismatch');
  if (digestJson(receipt.generator) !== digestJson(await candidateGeneratorIdentity()) || digestJson(receipt.policy) !== digestJson(candidatePolicy)
    || digestJson(receipt.compiler) !== digestJson(compilerIdentity()) || digestJson(receipt.packages) !== digestJson(assertGeneratorCompilerOwners())) throw new Error('Candidate compiler, generator or policy identity changed');
  if (receipt.parserVersion !== ts.version || receipt.analyzer?.name !== '@wc-toolkit/cem-generator'
    || receipt.analyzer?.version !== assertGeneratorCompilerOwners()['@wc-toolkit/cem-generator']!.version) throw new Error('Candidate parser or analyzer identity changed');
  if (receipt.lit !== (options.lit !== false)) throw new Error('Candidate Lit policy changed');
  const root = resolve(options.sourceRoot), physicalRoot = await realpath(root), sources: Record<string, string> = {};
  if (!options.sources.length) throw new Error('Candidate verification requires explicit sources');
  for (const input of [...new Set(options.sources)].sort()) {
    const file = resolve(root, input), path = relative(root, file), physical = relative(physicalRoot, await realpath(file));
    if (!path || path === '..' || path.startsWith(`..${sep}`) || isAbsolute(path) || physical === '..' || physical.startsWith(`..${sep}`) || isAbsolute(physical)) throw new Error('Candidate source escapes root');
    sources[path.split(sep).join('/')] = digestBytes(await readFile(file));
  }
  if (digestJson(sources) !== digestJson(receipt.sources)) throw new Error('Candidate source selection or contents changed');
  return {manifestDigest: receipt.manifestDigest, sourceFiles: Object.keys(sources).length};
}

/** Bind retained optional composition evidence at the fresh re-extraction boundary.
 * Provenance checks alone cannot authenticate derived proof contents. */
export function verifyCandidateComposition(receipt: any, freshReceipt: any) {
  const projection = (value: any) => Object.hasOwn(value, 'constructorComposition')
    ? {present: true, value: value.constructorComposition} : {present: false};
  if (digestJson(projection(receipt)) !== digestJson(projection(freshReceipt))) {
    throw new Error('CEM constructor composition proof changed; regenerate the CEM.');
  }
}
