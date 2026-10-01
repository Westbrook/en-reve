import postcss from 'postcss';
import { calls, splitArgs } from '../css-authoring/contracts.mjs';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { ts } from '../metadata/compiler-api.mjs';
import { sizingRoleCSS } from '../../packages/tokens/dist/sizing.js';

const excluded = new Set(['test', 'tests', '__tests__', 'fixtures', 'test-results', 'playwright-report', 'results', 'generated']);
const publicName = /^--en-[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Authored production TypeScript and CSS. Generated adapters/tests are not source evidence. */
export async function discoverCustomizationSources(root) {
  const files = [];
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.isDirectory() && !excluded.has(entry.name)) await visit(join(directory, entry.name));
      else if (entry.isFile() && (/\.(ts|css)$/.test(entry.name)) && !entry.name.endsWith('.d.ts') &&
        !entry.name.slice(0, -3).split(/[.-]/).some(word => ['test', 'spec', 'fixture', 'config'].includes(word))) {
        files.push(relative(root, join(directory, entry.name)).split(sep).join('/'));
      }
    }
  }
  await Promise.all(['packages/styles/src', 'packages/elements/src'].map(directory => visit(resolve(root, directory))));
  return files.sort();
}

function unwrap(node) {
  while (ts.isAsExpression(node) || ts.isParenthesizedExpression(node) || ts.isSatisfiesExpression(node)) node = node.expression;
  return node;
}

/** Narrow adapters for finite authored helpers. Unknown expressions fail coverage. */
function namesFor(node, source, file) {
  node = unwrap(node);
  if (ts.isStringLiteralLike(node)) return [node.text];
  if (ts.isConditionalExpression(node)) {
    const yes = namesFor(node.whenTrue, source, file), no = namesFor(node.whenFalse, source, file);
    return yes && no ? [...new Set([...yes, ...no])] : null;
  }
  const expression = node.getText(source);
  if (file === 'packages/styles/src/internal/focus-core.ts' && expression === '`--en-${family}-focus-${name}`') {
    const familyType = source.statements.find(statement => ts.isTypeAliasDeclaration(statement) && statement.name.text === 'FocusFamily');
    const families = familyType && ts.isUnionTypeNode(familyType.type) ? familyType.type.types.map(type => ts.isLiteralTypeNode(type) && ts.isStringLiteral(type.literal) ? type.literal.text : null) : [];
    const roles = new Set();
    function visit(value) {
      if (ts.isCallExpression(value) && value.expression.getText(source) === 'familyValue' && ts.isStringLiteral(value.arguments[1])) roles.add(value.arguments[1].text);
      ts.forEachChild(value, visit);
    }
    visit(source);
    return families.length && families.every(Boolean) && roles.size ? families.flatMap(family => [...roles].map(role => `--en-${family}-focus-${role}`)) : null;
  }
  if (file === 'packages/styles/src/internal/sizing.ts' && /^variants\.(small|medium|large)$/.test(expression)) {
    return sizingRoleCSS.map(role => role.variants[expression.split('.')[1]]);
  }
  if (file === 'packages/styles/src/toast.ts' && ts.isTemplateExpression(node) && node.templateSpans.every(span => span.expression.getText(source) === 'variant')) {
    let parent = node.parent, variants;
    while (parent) {
      if (ts.isArrowFunction(parent) && parent.parameters.some(parameter => parameter.name.getText(source) === 'variant') && ts.isCallExpression(parent.parent) && ts.isPropertyAccessExpression(parent.parent.expression)) {
        const input = parent.parent.expression.expression;
        if (parent.parent.expression.name.text === 'map' && ts.isArrayLiteralExpression(input) && input.elements.every(ts.isStringLiteral)) variants = input.elements.map(item => item.text);
        break;
      }
      parent = parent.parent;
    }
    if (!variants) return null;
    if (ts.isConditionalExpression(node.parent) && node.parent.whenFalse === node && node.parent.condition.getText(source).replaceAll(/\s/g, '') === "variant==='info'") variants = variants.filter(variant => variant !== 'info');
    return variants.map(variant => node.head.text + node.templateSpans.map(span => variant + span.literal.text).join(''));
  }
  return null;
}

/** Lexical evidence is deliberately distinct from browser-effective behavior. */
export function inspectCustomizationSource(file, code) {
  if (file.endsWith('.css')) return inspectCustomizationCSS(file, code);
  const source = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true);
  if (source.parseDiagnostics.length) throw new Error(`Invalid production TypeScript: ${file}`);
  const references = [], declarations = [], annotations = [], unresolved = [], dynamicInputs = [], aliases = new Map();
  const location = position => ({ file, line: source.getLineAndCharacterOfPosition(position).line + 1 });
  const addReference = (cssName, position, form, expression, fallback = null) => {
    if (publicName.test(cssName)) references.push({ cssName, ...location(position), form, expression, fallback });
  };
  for (const statement of source.statements) {
    if (ts.isImportDeclaration(statement) && statement.moduleSpecifier.text?.endsWith('/values.js')) {
      for (const binding of statement.importClause?.namedBindings?.elements ?? []) {
        const name = (binding.propertyName ?? binding.name).text;
        if (['token', 'rawToken', 'override'].includes(name)) aliases.set(binding.name.text, name);
      }
    }
  }
  // Read complete template expressions, keeping interpolation and fallback text as evidence.
  function readCss(text, offset) {
    text = text.replace(/\/\*[\s\S]*?\*\//g, comment => comment.replace(/[^\r\n]/g, ' '));
    for (const match of text.matchAll(/var\(\s*(--en-[^,)]*\$\{[^,)]*)/g)) {
      unresolved.push({ ...location(offset + match.index), form: 'dynamic-var', expression: match[0] });
    }
    for (const match of text.matchAll(/var\(\s*(--en-[a-z0-9-]+)(?=\s*[,)]|$)/g)) {
      const start = match.index + match[0].length;
      let depth = 1, end = start;
      for (; end < text.length && depth; end++) { if (text[end] === '(') depth++; else if (text[end] === ')') depth--; }
      const rest = text.slice(start, depth ? text.length : end - 1).trim();
      addReference(match[1], offset + match.index, 'var', text.slice(match.index, end), rest.startsWith(',') ? rest.slice(1).trim() : null);
    }
    for (const match of text.matchAll(/(--en-[a-z0-9]+(?:-[a-z0-9]+)*)\s*:\s*([^;{}]*)(?=[;}])/g)) {
      declarations.push({ cssName: match[1], ...location(offset + match.index), value: match[2].trim() });
    }
  }
  function visit(node) {
    if (ts.isCallExpression(node) && aliases.has(node.expression.getText(source))) {
      const name = aliases.get(node.expression.getText(source));
      const names = node.arguments[0] && namesFor(node.arguments[0], source, file);
      if (!names) unresolved.push({ ...location(node.getStart(source)), form: name, expression: node.getText(source) });
      else for (const cssName of names) addReference(cssName, node.getStart(source), name, node.getText(source), name === 'override' ? node.arguments[1]?.getText(source) ?? null : `defaultCSSValue(${JSON.stringify(cssName)})`);
    }
    if (ts.isTemplateExpression(node)) {
      for (let index = 0; index < node.templateSpans.length; index++) {
        const preceding = index ? node.templateSpans[index - 1].literal.text : node.head.text;
        if (!/var\(\s*$/.test(preceding)) continue;
        const expression = node.templateSpans[index].expression;
        const text = expression.getText(source);
        const argument = ts.isCallExpression(expression) && expression.expression.getText(source) === 'unsafeCSS' ? expression.arguments[0] : expression;
        const names = argument && namesFor(argument, source, file);
        if (names) {
          // The closing interpolation brace is followed by the outer var() fallback.
          const tail = code.slice(expression.getEnd() + 1);
          let depth = 1, end = 0;
          for (; end < tail.length && depth; end++) { if (tail[end] === '(') depth++; else if (tail[end] === ')') depth--; }
          const fallback = tail.slice(0, end - 1).trim();
          for (const cssName of names) addReference(cssName, expression.getStart(source), 'interpolated-var', text, fallback.startsWith(',') ? fallback.slice(1).trim() : null);
        }
        else if (file === 'packages/styles/src/internal/values.ts' && ['unsafeCSS(name)', 'unsafeCSS(sized)'].includes(text)) {
          dynamicInputs.push({ ...location(expression.getStart(source)), expression: text, reason: 'Shared token/override helper implementation; source call arguments are inventoried separately. Sized names are private implementation properties.' });
        } else if (file === 'packages/styles/src/internal/token-values.ts' && ['name', 'sized'].includes(text)) {
          dynamicInputs.push({ ...location(expression.getStart(source)), expression: text, reason: 'Shared token serializer; explicit TypeScript and CSS token call sites are inventoried separately.' });
        } else if (file === 'packages/elements/src/swatch/model.ts' && text === 'token') {
          dynamicInputs.push({ ...location(expression.getStart(source)), expression: text, reason: 'Swatch accepts an application-provided CSS property name. This open consumer API does not establish an additional library-owned hook.' });
        } else unresolved.push({ ...location(expression.getStart(source)), form: 'interpolated-var', expression: text });
      }
    }
    if (ts.isTemplateExpression(node) || ts.isStringLiteralLike(node)) readCss(node.getText(source), node.getStart(source));
    ts.forEachChild(node, visit);
  }
  visit(source);
  for (const match of code.matchAll(/@cssprop\s+(--en-[a-z0-9]+(?:-[a-z0-9]+)*)\s*(?:-\s*)?([^\n\r]*)/g)) {
    annotations.push({ cssName: match[1], ...location(match.index), description: match[2].replace(/\*\/$/, '').trim() });
  }
  const unique = values => [...new Map(values.map(value => [JSON.stringify(value), value])).values()];
  return { references: unique(references), declarations: unique(declarations), annotations: unique(annotations), unresolved: unique(unresolved), dynamicInputs: unique(dynamicInputs) };
}

/** Parse authored CSS declarations and mixin arguments, excluding comments/strings. */
export function inspectCustomizationCSS(file, code) {
  const root = postcss.parse(code, {from:file});
  const references = [], declarations = [];
  const read = (node, value) => {
    for (const call of calls(value, node)) {
      if (!['var', '--token'].includes(call.name)) continue;
      const args = splitArgs(call.args, node), cssName = args[0];
      if (!publicName.test(cssName)) continue;
      references.push({cssName, file, line:node.source.start.line, form:call.name === '--token' ? 'token' : 'var',
        expression:`${call.name}(${call.args})`, fallback:call.name === '--token' ? `defaultCSSValue(${JSON.stringify(cssName)})` : args.slice(1).join(', ') || null});
    }
  };
  root.walkDecls(node => {
    if(publicName.test(node.prop)) declarations.push({cssName:node.prop,file,line:node.source.start.line,value:node.value});
    read(node,node.value);
  });
  root.walkAtRules('apply', node => read(node,node.params));
  return {references,declarations,annotations:[],unresolved:[],dynamicInputs:[]};
}

export async function collectSourceInventory(root) {
  const files = await discoverCustomizationSources(root);
  const results = await Promise.all(files.map(async file => inspectCustomizationSource(file, await readFile(join(root, file), 'utf8'))));
  return { files, ...Object.fromEntries(['references', 'declarations', 'annotations', 'unresolved', 'dynamicInputs'].map(key => [key, results.flatMap(result => result[key])])) };
}
