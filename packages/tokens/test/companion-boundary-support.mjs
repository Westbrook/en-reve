import assert from 'node:assert/strict';

function selectorsOf(list) {
  const selectors = [];
  let start = 0, depth = 0;
  for (let index = 0; index < list.length; index++) {
    if (list[index] === '(' || list[index] === '[') depth++;
    if (list[index] === ')' || list[index] === ']') depth--;
    if (list[index] === ',' && depth === 0) { selectors.push(list.slice(start, index).trim()); start = index + 1; }
  }
  selectors.push(list.slice(start).trim());
  return selectors;
}

/** Check the public companion boundary contract independently of source values. */
export function assertCompanionBoundary(css, name, mode) {
  const scope = `[data-en-theme="${name}"][data-en-appearance="${mode}"]`;
  const marker = `--en-companion-${name}-${mode}`;
  const descendant = ':not(:where([data-en-theme]))';
  const root = `:where(${scope})`;
  assert.ok(css.startsWith(`:where([data-en-theme]) { container-name: --en-theme-companion; ${marker}: initial; }\n${scope} { ${marker}: 1; }\n`),
    'Every full-theme boundary resets inherited activity; only the matching appearance activates its branch.');
  assert.ok(css.includes(`@container --en-theme-companion style(${marker}: 1) {`),
    'Descendant declarations query their nearest named full-theme container.');
  assert.doesNotMatch(css, /@scope|:scope|container-type\s*:/,
    'Companion delivery must not depend on scoped Parts or impose size containment.');
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, declarations]) => ({ selector: selector.trim(), declarations }));
  // Optional presentation branches can emit empty conditional groups. They
  // have no selector subject; keep every qualified rule (even empty ones),
  // unknown at-rule and declaration-bearing conditional in the guard audit.
  const surfaces = rules.filter(({ selector, declarations }) => selector !== ':where([data-en-theme])' && selector !== scope
    && !(/^@(media|container)\b/.test(selector) && declarations.trim() === ''));
  assert.ok(surfaces.length > 0, 'The recipe emits actual component declarations.');
  assert.ok(surfaces.some(({ selector }) => selector.includes(descendant)), 'Ordinary descendants retain their presentation.');
  assert.ok(surfaces.some(({ selector }) => selector.includes(root)), 'A component or native helper can own its full-theme boundary.');
  for (const { selector } of surfaces) {
    for (const target of selectorsOf(selector)) {
      const pseudo = target.indexOf('::');
      const subject = pseudo < 0 ? target : target.slice(0, pseudo);
      assert.ok(subject.endsWith(descendant) || subject.endsWith(root),
        `Every presentation subject must be guarded before its public Part or pseudo-element: ${target}`);
    }
  }
  return { scope, marker, descendant, root, rules: surfaces };
}
