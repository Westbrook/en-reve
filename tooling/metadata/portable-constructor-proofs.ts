import {readFileSync} from 'node:fs';
import {dirname, resolve, relative, isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import {ts, compilerIdentity} from './compiler-api.mjs';
import {digestJson} from '../evidence/identity.ts';

const digest = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
/** Relocate exact in-memory source descriptors into portable evidence.
 * This does not authenticate arbitrary JSON; the producer first validates its
 * privately bound extraction/serialization, then records this narrow projection.
 */
export function portableConstructorProofs(program: any, sources: readonly any[], sourceRoot: string, proofs: any) {
  const selected = new Set(sources), root = resolve(sourceRoot), cache = new Map<any, any>();
  const relativePath = (base: string, path: string) => {
    const value = relative(base, path).replaceAll('\\', '/');
    if (!value || value === '..' || value.startsWith('../') || isAbsolute(value)) throw new Error('Portable proof path escapes its owning root');
    return value;
  };
  function fileIdentity(source: any) {
    if (cache.has(source)) return cache.get(source);
    const absolute = resolve(source.fileName);
    let value: any;
    if (selected.has(source)) value = {kind: 'selected-source', path: relativePath(root, absolute)};
    else {
      // Bind the actually resolved package, never a guessed node_modules name.
      let directory = dirname(absolute);
      for (;;) {
        let bytes: Buffer | undefined;
        try {bytes = readFileSync(resolve(directory, 'package.json'));}
        catch (error: any) {if (error.code !== 'ENOENT') throw error;}
        if (bytes) {
          const metadata = JSON.parse(bytes.toString('utf8'));
          if (typeof metadata.name !== 'string' || typeof metadata.version !== 'string') throw new Error('Proof dependency has no exact package identity');
          value = {kind: program.isSourceFileDefaultLibrary(source) ? 'compiler-default-library' : 'dependency-source',
            package: metadata.name, version: metadata.version, packageSha256: digest(bytes), path: relativePath(directory, absolute)};
          if (program.isSourceFileDefaultLibrary(source)) value.compiler = compilerIdentity();
          else if (!program.isSourceFileFromExternalLibrary(source)) throw new Error('Unselected project proof source has no dependency ownership');
          break;
        }
        const parent = dirname(directory);
        if (parent === directory) throw new Error('Proof source has no portable package owner');
        directory = parent;
      }
    }
    cache.set(source, value); return value;
  }
  function project(value: any): any {
    if (Array.isArray(value)) return value.map(project);
    if (!value || typeof value !== 'object') return value;
    const result: any = {};
    if (Object.hasOwn(value, 'fileName')) {
      const source = program.getSourceFile(value.fileName);
      if (!source || value.sourceSha256 !== digest(source.text)) throw new Error('Portable proof descriptor has no exact Program source bytes');
      result.file = fileIdentity(source);
    }
    // Internal proof records use undefined for absent optional object fields.
    // The published evidence is the same finite JSON shape that persistence
    // retains; absent values must not survive only in the in-memory receipt.
    for (const [key, child] of Object.entries(value)) if (key !== 'fileName' && child !== undefined) result[key] = project(child);
    return result;
  }
  function portableType(text: any, descriptor: any, returnContract = false) {
    if (typeof text !== 'string') throw new Error('Portable type evidence must be original text');
    const scope = program.getSourceFile(descriptor?.fileName);
    if (!scope || descriptor.sourceSha256 !== digest(scope.text)) throw new Error('Portable type has no exact original scope');
    const syntax = ts.createSourceFile('__portable_constructor_type.ts',
      (returnContract ? 'declare function __Type(): ' : 'type __Type = ') + text + ';', ts.ScriptTarget.Latest, true);
    const declaration = syntax.statements[0];
    if (syntax.parseDiagnostics.length || syntax.statements.length !== 1 || !declaration?.type
      || !(returnContract ? ts.isFunctionDeclaration(declaration) : ts.isTypeAliasDeclaration(declaration))) {
      throw new Error('Portable type must contain one valid ' + (returnContract ? 'return contract' : 'type expression'));
    }
    const imports: any[] = [];
    const transformed = ts.transform(declaration.type, [(context: any) => {
      const visit = (node: any): any => {
        if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)
          && isAbsolute(node.argument.literal.text)) {
          if (node.attributes) throw new Error('Portable import attributes require a mode-aware adapter');
          const resolved = ts.resolveModuleName(node.argument.literal.text, scope.fileName, program.getCompilerOptions(), ts.sys,
            undefined, undefined, scope.impliedNodeFormat).resolvedModule;
          const source = resolved && program.getSourceFile(resolved.resolvedFileName);
          if (!source) throw new Error('Absolute proof import has no exact Program target');
          const target = fileIdentity(source), sourceSha256 = digest(source.text);
          // The exact owner and bytes distinguish nested installations with the
          // same package name/path while remaining independent of checkout roots.
          const owner = digest(JSON.stringify({target, sourceSha256}));
          const token = '@cem-proof/' + owner + '/' + target.path;
          imports.push({token, target, sourceSha256});
          return ts.factory.updateImportTypeNode(node, ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(token)),
            node.attributes, node.qualifier, node.typeArguments?.map((argument: any) => ts.visitNode(argument, visit)), node.isTypeOf);
        }
        return ts.visitEachChild(node, visit, context);
      };
      return (node: any) => ts.visitNode(node, visit);
    }]);
    try {
      if (!imports.length) return text;
      // This is explicitly a proof representation, not a runnable module type.
      return {representation: 'source-owned-import-tokens', text: ts.createPrinter({removeComments: true}).printNode(ts.EmitHint.Unspecified, transformed.transformed[0], syntax), imports};
    } finally {transformed.dispose();}
  }
  function metadataProjection(value: any, scope: any, returnContract = false): any {
    if (Array.isArray(value)) return value.map(item => metadataProjection(item, scope, returnContract));
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key,
      ['type', 'parsedType', 'detail'].includes(key) && typeof child === 'string' ? portableType(child, scope, returnContract && key !== 'detail') : metadataProjection(child, scope, key === 'return')]));
  }
  const result = project(proofs);
  result.portableFormat = 'source-owned-constructor-proofs-v1';
  result.types = proofs.types.map((proof: any) => ({...project(proof), input: portableType(proof.input, proof.source),
    emitted: portableType(proof.emitted, proof.output),
    symbols: proof.symbols.map((symbol: any) => ({...project(symbol), name: portableType(symbol.name, proof.source)}))}));
  result.facets = proofs.facets.map((proof: any) => {
    if (!proof.metadata || digest(JSON.stringify(proof.metadata)) !== proof.metadataSha256) throw new Error('Raw facet metadata does not match its validated proof');
    const value = project(proof), metadata = metadataProjection(project(proof.metadata), proof.origin);
    value.metadata = metadata;
    value.metadataSha256 = digest(JSON.stringify(metadata));
    value.metadataRepresentation = 'source-owned-import-tokens';
    return value;
  });
  digestJson(result); // Refuse any remaining non-finite/non-JSON proof value.
  return result;
}
