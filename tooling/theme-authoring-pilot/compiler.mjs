import postcss from 'postcss';
import { transform } from 'lightningcss';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import manifest from './manifest.json' with { type: 'json' };

export const dialect = manifest.dialect;
import { calls, splitArgs, validateDefinitions } from '../css-authoring/contracts.mjs';
export { calls, validateDefinitions } from '../css-authoring/contracts.mjs';
const modern = { chrome: 999 << 16, firefox: 999 << 16, safari: 999 << 16 };
const hash = data => createHash('sha256').update(data).digest('hex');
const fail = (node, message) => { throw node.error(`${dialect}: ${message}`, { plugin: 'theme-authoring-pilot' }); };

// Scan calls without treating quoted strings or nested commas as authoring syntax.
// Escaped identifiers are outside v1 rather than normalized ambiguously.
function validateCall(name, text, kind, node, definitions) {
  const def = definitions.get(name);
  if (!def || def.kind !== kind) fail(node, `Unknown ${kind} ${name}`);
  const args = splitArgs(text, node);
  if (args.length !== def.parameters.length || args.some(a => !a || /^(inherit|initial|unset|revert|revert-layer)$/.test(a))) fail(node, `${name} requires ${def.parameters.length} explicit nonempty arguments (defined at ${def.node.source.input.file}:${def.node.source.start.line})`);
  for (const arg of args) if (calls(arg, node).some(c => c.name.startsWith('--'))) fail(node, 'Nested helper calls are outside v1');
}
export function validateConsumer(css, filename, definitions) {
  const root = postcss.parse(css, { from: filename });
  for (const rule of root.nodes) {
    if (rule.type === 'comment') continue;
    if (rule.type !== 'rule' || /[\\&@]/.test(rule.selector) || calls(rule.selector, rule).some(c => c.name.startsWith('--'))) fail(rule, 'Consumers contain flat style rules only; scope conditions belong outside this pilot fragment');
    for (const node of rule.nodes) {
      if (node.type === 'comment') continue;
      if (node.type === 'atrule' && node.name === 'apply' && !node.nodes) {
        const m = /^(--[a-z][a-z0-9-]*)\(([\s\S]*)\)$/.exec(node.params.trim());
        if (!m) fail(node, 'Use @apply --name(arguments)');
        validateCall(m[1], m[2], 'mixin', node, definitions);
      } else if (node.type === 'decl') {
        if (node.important) fail(node, '!important consumers are outside v1');
        for (const call of calls(node.value, node)) if (call.name.startsWith('--')) validateCall(call.name, call.args, 'function', node, definitions);
      } else fail(node, 'Nested rules and unsupported at-rules are outside v1');
    }
  }
}
export async function loadEngine(source = process.env.REVE_CSS_FUNCTIONS_SOURCE) {
  if (!source) throw new Error('Set REVE_CSS_FUNCTIONS_SOURCE to the audited Reve css-functions.ts in a checkout with its dependencies installed. This optional pilot is not a production build dependency.');
  const actual = hash(await readFile(source));
  if (actual !== manifest.engine.sha256) throw new Error(`Audited engine digest mismatch: expected ${manifest.engine.sha256}, got ${actual}`);
  const require = createRequire(pathToFileURL(source));
  const configHash = hash(await readFile(require.resolve('@reve-tools/build-config/css')));
  const lightning = JSON.parse(await readFile(resolve(dirname(require.resolve('lightningcss')), '../package.json'), 'utf8'));
  if (configHash !== manifest.engine.buildConfigSha256 || lightning.version !== manifest.engine.lightningcssVersion) throw new Error('Audited engine dependency mismatch; re-audit build-config and Lightning CSS before changing the manifest');
  const { gatherCssFunctions, cssFunctionVisitor } = await import(pathToFileURL(source).href);
  return { gatherCssFunctions, cssFunctionVisitor, sha256: actual };
}
export function canonicalCSS(css, filename = 'generated.css') {
  return transform({ filename, code: Buffer.from(css), targets: modern, minify: true, errorRecovery: false }).code.toString();
}
export function compile(inputs, consumer, engine, filename = 'consumer.css') {
  const definitions = validateDefinitions(inputs);
  validateConsumer(consumer, filename, definitions);
  try {
    // Rebuild from the complete explicit manifest, never a mutable discovery map.
    const registry = engine.gatherCssFunctions(inputs);
    const expanded = transform({ filename, code: Buffer.from(consumer), targets: modern, errorRecovery: false, visitor: engine.cssFunctionVisitor(registry) }).code.toString();
    const root = postcss.parse(expanded, { from: filename });
    root.walkAtRules(n => { if (['function', 'mixin', 'apply'].includes(n.name)) fail(n, 'Unexpanded authoring syntax'); });
    root.walkDecls(n => { if (calls(n.value, n).some(c => c.name.startsWith('--'))) fail(n, 'Unexpanded helper call'); });
    // Expand before a separate browser syntax lowering pass.
    const css = transform({ filename, code: Buffer.from(expanded), targets: { chrome: 120 << 16, firefox: 128 << 16, safari: 18 << 16 }, minify: true, errorRecovery: false }).code.toString();
    return { css, digest: hash(css), dialect, engine: engine.sha256 };
  } catch (error) {
    throw new Error(`${filename}: ${error.message}; definitions: ${inputs.map(i => i.filename).join(', ')}`, { cause: error });
  }
}
