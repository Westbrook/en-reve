import postcss from 'postcss';
import { calls, splitArgs, validateDefinitions } from './contracts.mjs';

const fail = (node, message) => { throw node.error(message, { plugin: 'en-css-authoring' }); };

// Walk balanced CSS function calls, retaining literal strings and argument order.
// The shared contract explicitly rejects escapes and comments inside values.
function mapFunctions(value, node, visit) {
  calls(value, node);
  let output = '', i = 0;
  while (i < value.length) {
    if (value[i] === '"' || value[i] === "'") {
      const start = i, quote = value[i++];
      while (value[i] !== quote) i++;
      output += value.slice(start, ++i); continue;
    }
    const match = /^[a-zA-Z_-][a-zA-Z0-9_-]*\(/.exec(value.slice(i));
    if (!match) { output += value[i++]; continue; }
    const name = match[0].slice(0, -1), start = i + match[0].length;
    let end = start, depth = 1, quote = '';
    for (; depth; end++) {
      const c = value[end];
      if (quote) { if (c === quote) quote = ''; }
      else if (c === '"' || c === "'") quote = c;
      else if (c === '(') depth++;
      else if (c === ')') depth--;
    }
    const inner = value.slice(start, end - 1);
    output += visit(name, inner, () => mapFunctions(inner, node, visit));
    i = end;
  }
  return output;
}

/** Build-only, restricted CSS recipes; never a browser or application dependency. */
export function compileStyles({ definitions: inputs, css, filename, token, overrides = [] }) {
  const definitions = validateDefinitions(inputs);
  if (definitions.has('--token')) throw new Error('--token is reserved for the validated token adapter');
  const allowedOverrides = new Set(overrides);
  const root = postcss.parse(css, { from: filename });
  const argumentsFor = (name, text, kind, node) => {
    const def = definitions.get(name);
    if (!def || def.kind !== kind) fail(node, `Unknown ${kind} ${name}`);
    const args = splitArgs(text, node);
    if (args.length !== def.parameters.length || args.some(a => !a || /^(inherit|initial|unset|revert|revert-layer)$/.test(a))) {
      fail(node, `${name} requires ${def.parameters.length} explicit nonempty arguments (defined at ${def.node.source.input.file}:${def.node.source.start.line})`);
    }
    if (args.some(a => calls(a, node).some(c => c.name.startsWith('--') && c.name !== '--token'))) fail(node, 'Nested helper calls are outside v1');
    return { def, args: args.map(a => expand(a, node)) };
  };
  const substitute = (value, def, args) => mapFunctions(value, def.node, (name, inner, descend) => {
    if (name === 'var') return args[def.parameters.indexOf(inner.trim())];
    return `${name}(${descend()})`;
  });
  const expand = (value, node) => mapFunctions(value, node, (name, inner, descend) => {
    if (name === '--token') {
      if (!/^--en-[a-z0-9-]+$/.test(inner.trim())) fail(node, '--token() requires one known token name');
      try { return token(inner.trim()); } catch (error) { fail(node, error.message); }
    }
    if (name.startsWith('--')) {
      const { def, args } = argumentsFor(name, inner, 'function', node);
      return substitute(def.node.nodes.find(n => n.type === 'decl').value, def, args);
    }
    if (name.toLowerCase() === 'var') {
      const property = splitArgs(inner, node)[0];
      if (property?.startsWith('--en-') && !allowedOverrides.has(property)) {
        fail(node, `Unknown style override ${property}; use --token() for design tokens`);
      }
    }
    return `${name}(${descend()})`;
  });
  root.walkRules(rule => {
    if (calls(rule.selector, rule).some(c => c.name.startsWith('--'))) fail(rule, 'Authoring calls are not selectors');
  });
  root.walkDecls(node => { node.value = expand(node.value, node); });
  root.walkAtRules(node => {
    if (node.name === 'apply') {
      const m = /^(--[a-z][a-z0-9-]*)\(([\s\S]*)\)$/.exec(node.params.trim());
      if (!m || node.nodes || node.parent.type !== 'rule') fail(node, 'Use @apply --name(arguments) inside a style rule');
      const { def, args } = argumentsFor(m[1], m[2], 'mixin', node);
      const result = def.node.nodes.find(n => n.type === 'atrule');
      node.replaceWith(...result.nodes.filter(n => n.type === 'decl').map(decl => decl.clone({ value: substitute(decl.value, def, args), source: node.source })));
    } else if (!['media', 'supports', 'container', 'layer'].includes(node.name)) {
      fail(node, `Unsupported authoring at-rule @${node.name}`);
    } else if (calls(node.params, node).some(c => c.name.startsWith('--'))) fail(node, 'Authoring calls are allowed in declaration values only');
  });
  return root.toString();
}
