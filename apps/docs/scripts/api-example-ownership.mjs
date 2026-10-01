import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ts } from '../../../tooling/metadata/compiler-api.mjs';
import { verifyDefinitionEntries } from '../../../tooling/metadata/definition-graph.ts';

const optionalTags = ['en-color-picker', 'en-swatch', 'en-tab', 'en-tab-panel', 'en-tabs'];
const identity = {
  schemaVersion: 1, exampleId: 'composable-chat',
  profileId: 'en-reve-docs/composable-chat-color', profileVersion: '1',
  featureId: 'en-reve-docs/composable-chat-color/popup', featureVersion: '1',
  sourceModule: './composable-chat-color-delivery.js', loaderExport: 'composableChatColorLoaders',
};
const fail = message => { throw new Error(`Invalid composable-chat registration ownership: ${message}`); };
const sameTags = (left, right) => JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
const unwrap = node => node && (ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isParenthesizedExpression(node)) ? unwrap(node.expression) : node;
const isFreeze = node => node && ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)
  && ts.isIdentifier(node.expression.expression) && node.expression.expression.text === 'Object'
  && node.expression.name.text === 'freeze' && node.arguments.length === 1;
const unfrozen = node => { node = unwrap(node); return isFreeze(node) ? unwrap(node.arguments[0]) : node; };
function properties(node) {
  if (!node || !ts.isObjectLiteralExpression(node)) fail('expected a literal object');
  const result = new Map();
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property) || ts.isComputedPropertyName(property.name)
      || !ts.isIdentifier(property.name) && !ts.isStringLiteral(property.name) || result.has(property.name.text)) fail('duplicate or nonliteral property');
    result.set(property.name.text, property.initializer);
  }
  return result;
}

/** Deliberately bounded to the one approved consumer, with a complete scanned-tag partition. */
export function validateComposableChatOwnership({ descriptor, tags, helperSource, canonicalDefinitions }) {
  if (!descriptor || Object.keys(descriptor).length !== Object.keys(identity).length + 2
    || Object.entries(identity).some(([key, value]) => descriptor[key] !== value)) fail('unsupported consumer, schema or identity');
  for (const key of ['eagerTags', 'optionalTags']) {
    if (!Array.isArray(descriptor[key]) || descriptor[key].some(tag => typeof tag !== 'string')
      || new Set(descriptor[key]).size !== descriptor[key].length) fail(`invalid or duplicate ${key}`);
  }
  if (!sameTags(descriptor.optionalTags, optionalTags)) fail('the five optional roots must be declared exactly');
  if (descriptor.eagerTags.some(tag => descriptor.optionalTags.includes(tag))) fail('eager and optional roots overlap');
  if (!sameTags(tags, [...descriptor.eagerTags, ...descriptor.optionalTags])) fail('eager and optional roots must exactly cover the complete scanned tags');
  const graph = new Map(canonicalDefinitions.map(definition => [definition.tagName, definition]));
  if (tags.some(tag => tag !== 'en-composable-chat-demo' && !graph.has(tag))) fail('unknown tag');
  const source = ts.createSourceFile(descriptor.sourceModule, helperSource, ts.ScriptTarget.Latest, true);
  if (source.parseDiagnostics.length) fail('invalid helper TypeScript');
  let ownershipBinding, profileFactory;
  const loaderDeclarations = [];
  const profileCalls = [];
  for (const statement of source.statements) {
    if (ts.isImportDeclaration(statement)) {
      const specifier = statement.moduleSpecifier.text;
      if (!statement.importClause?.isTypeOnly && /^@en-reve\/elements\/(?:define|definitions)\//u.test(specifier)) fail('helper eagerly imports a definition');
      const bindings = statement.importClause?.namedBindings;
      if (bindings && ts.isNamedImports(bindings)) for (const binding of bindings.elements) {
        if (specifier === './composable-chat-color-ownership.mjs' && (binding.propertyName ?? binding.name).text === 'composableChatColorOwnership') {
          if (binding.propertyName || statement.importClause.isTypeOnly || binding.isTypeOnly) fail('ownership must use its unaliased value binding for copied source');
          ownershipBinding = binding.name.text;
        }
        if (!statement.importClause.isTypeOnly && !binding.isTypeOnly && specifier === '@en-reve/elements/delivery.js' && (binding.propertyName ?? binding.name).text === 'createDeliveryProfile') profileFactory = binding.name.text;
      }
    }
    if (ts.isVariableStatement(statement)) for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === descriptor.loaderExport) {
        if (!(statement.declarationList.flags & ts.NodeFlags.Const) || !statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) fail('loader must be an exported const');
        loaderDeclarations.push(declaration);
      }
    }
  }
  if (!ownershipBinding || !profileFactory || loaderDeclarations.length !== 1) fail('missing ownership, profile factory or unique loader export');
  const loader = unwrap(loaderDeclarations[0].initializer);
  if (!isFreeze(loader)) fail('loader must use Object.freeze');
  const loaders = properties(unwrap(loader.arguments[0]));
  if (!sameTags(loaders.keys(), descriptor.optionalTags)) fail('loader keys must exactly cover optional roots');
  for (const [tag, initializer] of loaders) {
    const arrow = unwrap(initializer);
    if (!arrow || !ts.isArrowFunction(arrow) || arrow.parameters.length || !arrow.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword)) fail(`loader for ${tag} must be a zero-argument async arrow`);
    const result = unwrap(arrow.body);
    const awaited = result && ts.isPropertyAccessExpression(result) ? unwrap(result.expression) : undefined;
    const call = awaited && ts.isAwaitExpression(awaited) ? unwrap(awaited.expression) : undefined;
    const definition = graph.get(tag);
    const exportedName = tag.slice(3).replace(/-([a-z])/gu, (_, letter) => letter.toUpperCase()) + 'Definition';
    const expectedImport = '@en-reve/elements/' + definition.source.replace(/^src\//u, '').replace(/\.ts$/u, '.js');
    if (!call || !ts.isCallExpression(call) || call.expression.kind !== ts.SyntaxKind.ImportKeyword || call.arguments.length !== 1
      || !ts.isStringLiteral(call.arguments[0]) || call.arguments[0].text !== expectedImport || result.name.text !== exportedName) fail(`noncanonical literal loader for ${tag}`);
  }
  const visit = node => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === profileFactory) profileCalls.push(node);
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (profileCalls.length !== 1 || profileCalls[0].arguments.length !== 1) fail('expected one profile construction');
  const profile = properties(unfrozen(profileCalls[0].arguments[0]));
  const owns = (node, key) => { node = unwrap(node); return node && ts.isPropertyAccessExpression(node)
    && ts.isIdentifier(node.expression) && node.expression.text === ownershipBinding && node.name.text === key; };
  const profileLoaders = unwrap(profile.get('loaders'));
  if (!owns(profile.get('id'), 'profileId') || !owns(profile.get('version'), 'profileVersion')
    || !(owns(profile.get('schemaVersion'), 'schemaVersion') || profile.get('schemaVersion')?.kind === ts.SyntaxKind.NumericLiteral && profile.get('schemaVersion').text === '1')
    || !profileLoaders || !ts.isIdentifier(profileLoaders) || profileLoaders.text !== descriptor.loaderExport) fail('profile must use the declared identity and loader');
  const features = unfrozen(profile.get('features'));
  if (!features || !ts.isArrayLiteralExpression(features) || features.elements.length !== 1) fail('expected one owned feature');
  const feature = properties(unfrozen(features.elements[0]));
  if (!owns(feature.get('id'), 'featureId') || !owns(feature.get('version'), 'featureVersion')
    || !owns(feature.get('definitionTags'), 'optionalTags')) fail('feature must use the declared identity and optional tags');
  return { eagerTags: [...descriptor.eagerTags], delivery: {
    schemaVersion: descriptor.schemaVersion, profileId: descriptor.profileId, profileVersion: descriptor.profileVersion,
    featureId: descriptor.featureId, featureVersion: descriptor.featureVersion,
    definitionTags: [...descriptor.optionalTags], sourceModule: descriptor.sourceModule, loaderExport: descriptor.loaderExport,
  } };
}

export async function readComposableChatOwnership(workspaceRoot) {
  const [{ composableChatColorOwnership: descriptor }, helperSource, canonicalDefinitions] = await Promise.all([
    import(pathToFileURL(resolve(workspaceRoot, 'apps/docs/src/composable-chat-color-ownership.mjs')).href),
    readFile(resolve(workspaceRoot, 'apps/docs/src', identity.sourceModule.replace(/\.js$/u, '.ts')), 'utf8'),
    verifyDefinitionEntries(resolve(workspaceRoot, 'packages/elements')),
  ]);
  return { descriptor, helperSource, canonicalDefinitions };
}
