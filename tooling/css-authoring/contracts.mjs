import postcss from 'postcss';
const ident = /^--[a-z][a-z0-9-]*$/;
const fail = (node, message) => { throw node.error(message, { plugin: 'en-css-authoring' }); };
export function calls(value, node) {
  const found = [];
  let quote = '', start = 0, depth = 0;
  for (let i = 0; i < value.length; i++) {
    const c = value[i];
    if (c === '\\') fail(node, 'Escapes are outside the pilot dialect');
    if (quote) { if (c === quote) quote = ''; continue; }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === '/' && value[i + 1] === '*') fail(node, 'Comments inside values are outside the pilot dialect');
    if (c === '(') { if (depth++ === 0) start = i; }
    else if (c === ')') {
      if (--depth < 0) fail(node, 'Unbalanced value');
      if (depth === 0) {
        let n = start;
        while (n > 0 && /[a-zA-Z0-9_-]/.test(value[n - 1])) n--;
        const name = value.slice(n, start), args = value.slice(start + 1, i);
        found.push({ name, args });
        found.push(...calls(args, node));
      }
    }
  }
  if (quote || depth) fail(node, 'Unbalanced value');
  return found;
}
export function splitArgs(value, node) {
  calls(value, node);
  let depth = 0, quote = '', start = 0;
  const parts = [];
  for (let i = 0; i < value.length; i++) {
    const c = value[i];
    if (quote) { if (c === quote) quote = ''; continue; }
    if (c === '"' || c === "'") quote = c;
    else if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === ',' && !depth) { parts.push(value.slice(start, i).trim()); start = i + 1; }
  }
  if (value.trim()) parts.push(value.slice(start).trim());
  return parts;
}
function signature(node) {
  const match = /^(--[a-z][a-z0-9-]*)\(([^()]*)\)$/.exec(node.params.trim());
  if (!match) fail(node, 'Use an untyped name(parameter, …) signature; defaults and returns clauses are unsupported');
  const parameters = splitArgs(match[2], node);
  if (parameters.some(p => !ident.test(p)) || new Set(parameters).size !== parameters.length) fail(node, 'Parameters must be unique dashed identifiers without types or defaults');
  return { name: match[1], parameters };
}
export function validateDefinitions(inputs) {
  const definitions = new Map(), filenames = new Set();
  for (const { filename, css } of inputs) {
    if (filenames.has(filename)) throw new Error(`Duplicate definition input: ${filename}`);
    filenames.add(filename);
    const root = postcss.parse(css, { from: filename });
    for (const node of root.nodes) {
      if (node.type === 'comment') continue;
      if (node.type !== 'atrule' || !['function', 'mixin'].includes(node.name) || !node.nodes) fail(node, 'Definitions must be unconditional top-level @function or @mixin blocks');
      const definition = { ...signature(node), kind: node.name, node };
      if (definitions.has(definition.name)) fail(node, `Duplicate definition ${definition.name}; first at ${definitions.get(definition.name).node.source.input.file}`);
      const children = node.nodes.filter(n => n.type !== 'comment');
      let declarations;
      if (node.name === 'function') {
        if (children.length !== 1 || children[0].type !== 'decl' || children[0].prop !== 'result') fail(node, 'Functions contain exactly one result declaration; locals and conditions are unsupported');
        declarations = children;
      } else {
        if (children.length !== 1 || children[0].type !== 'atrule' || children[0].name !== 'result' || children[0].params || !children[0].nodes) fail(node, 'Mixins require exactly one @result block');
        declarations = children[0].nodes.filter(n => n.type !== 'comment');
        if (!declarations.length) fail(node, 'Empty mixins are unsupported');
      }
      for (const decl of declarations) {
        if (decl.type !== 'decl' || !/^[a-z][a-z-]*$/.test(decl.prop) || decl.important) fail(decl, 'Only ordinary declarations; no locals, nesting, @apply, or !important in definitions');
        for (const call of calls(decl.value, decl)) {
          if (call.name.startsWith('--')) fail(decl, 'Helper composition is outside v1; pass explicit runtime values');
          if (!['var', 'calc', 'max', 'min', 'clamp'].includes(call.name)) fail(decl, 'Definitions allow only var(), calc(), max(), min(), and clamp()');
          if (call.name === 'var') {
            const args = splitArgs(call.args, decl);
            if (!definition.parameters.includes(args[0]) || args.length !== 1) fail(decl, 'Definition var() must reference a parameter without a fallback; supply runtime variables at the call site');
          }
        }
      }
      definitions.set(definition.name, definition);
    }
  }
  return definitions;
}
