import test from 'node:test';
import assert from 'node:assert/strict';
import { assertCompanionBoundary } from './companion-boundary-support.mjs';

// Literal CSS, independent of the compiler and its presentation registry.
const name = 'boundary-parser-check', mode = 'light';
const scope = `[data-en-theme="${name}"][data-en-appearance="${mode}"]`;
const marker = `--en-companion-${name}-${mode}`;
const descendant = ':not(:where([data-en-theme]))';
const root = `:where(${scope})`;
const descendants = `:where(en-button):is(:hover, :focus-visible)${descendant}::part(control),
.en-button:is(:hover, :focus-visible)${descendant}::before`;
const roots = `:where(en-button)${root}::part(control),
.en-button${root}::before`;
function fixture(extra = '') {
  return `:where([data-en-theme]) { container-name: --en-theme-companion; ${marker}: initial; }
${scope} { ${marker}: 1; }
@media (forced-colors: none) {
  @media (hover: hover) {
    @container --en-theme-companion style(${marker}: 1) {
${descendants} { color: red; }
${extra}
    }
    @media (hover: hover) { }
    @container --en-theme-companion style(${marker}: 1) { \n }
  }
${roots} { color: red; }
}
@media (forced-colors: none) { \n }
`;
}

test('boundary assertion ignores only empty supported conditional groups, retaining nested presentation leaves', () => {
  const result = assertCompanionBoundary(fixture(), name, mode);
  assert.deepEqual(result.rules.map(rule => rule.selector), [descendants, roots]);
  assert.ok(result.rules.every(rule => rule.declarations.trim() === 'color: red;'));
});

test('boundary assertion still audits every nested subject and rejects unexpected at-rule leaves', () => {
  for (const extra of [
    'en-unguarded::part(control) { color: red; }',
    `${descendants}, .en-unguarded { color: red; }`,
    `en-unguarded::part(control)${descendant} { color: red; }`,
    '.en-unguarded::before { }',
    '@media (hover: hover) { color: red; }',
    '@container --en-theme-companion style(--other: 1) { color: red; }',
    '@supports (display: grid) { }',
    '@font-face { }',
  ]) assert.throws(() => assertCompanionBoundary(fixture(extra), name, mode),
    /Every presentation subject must be guarded before its public Part or pseudo-element:/,
    `The nested leaf must remain subject to the full guard audit: ${extra}`);
});
