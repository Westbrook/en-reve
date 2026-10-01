import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { readAuthoredSpecimens } from '../scripts/authored-specimen-sources.mjs';
import { inlineSpecimenModules, specimenSources, usedImports } from '../scripts/specimen-sources.mjs';

test('copied modules inline nested helpers once and preserve public imports and TypeScript', () => {
  const result = inlineSpecimenModules("import './registration.js';\nimport { html } from 'lit';\nimport { helper } from './helper.js';\nexport const view = html`${helper('ok')}`;", {
    './registration.js': "import { html } from 'lit';\nimport { helper } from './helper.js';\ncustomElements.define('sample-view', class extends HTMLElement { render() { return html`${helper('registered')}`; } });",
    './helper.js': 'export function helper(value: string): string { return value; }',
  });
  assert.equal((result.match(/function helper/g) ?? []).length, 1);
  assert.equal((result.match(/import \{ html \}/g) ?? []).length, 1);
  assert.match(result, /value: string/);
  assert.doesNotMatch(result, /from '\.\//);
  assert.match(result, /customElements.define/);
});

test('conflicting same-name public imports fail instead of changing binding meaning', () => {
  assert.throws(() => inlineSpecimenModules("import { value } from 'one';\nimport './helper.js';", {
    './helper.js': "import { value } from 'two';\nconsole.log(value);",
  }), /Conflicting specimen import: value/);
});

test('only color specimens include the color registration; unrelated side effects remain', () => {
  const authored = "import './color-spaces-demo.js';\nimport './required-side-effect.js';\nimport { html } from 'lit';\n// example-start:button\nexport const button = html`<en-button>Go</en-button>`;\n// example-end:button\n// example-start:color-picker\nexport const picker = html`<en-color-spaces-demo></en-color-spaces-demo>`;\n// example-end:color-picker";
  const sources = specimenSources(authored, '', ...Array(11).fill(undefined), {
    './color-spaces-demo.js': "customElements.define('en-color-spaces-demo', class extends HTMLElement {});",
  });
  assert.doesNotMatch(sources.button, /color-spaces/);
  assert.match(sources.button, /required-side-effect/);
  assert.match(sources['color-picker'], /customElements.define/);
  assert.doesNotMatch(sources['color-picker'], /import '\.\/color-spaces/);
  assert.equal(usedImports("import './required.js';", 'sample.ts'), "import './required.js';");
});

test('compiler migration retains shorthand and re-export imports while removing shadow-only imports', () => {
  const result = usedImports("import {kept, renamed as exported, shadowed, unused} from 'fixture';\nfunction local(shadowed: string) { return shadowed; }\nexport const record = {kept};\nexport {exported as publicValue};", 'binding.ts');
  assert.match(result, /import \{ kept, renamed as exported \} from ['"]fixture['"]/);
  assert.doesNotMatch(result.split('\n')[0], /shadowed|unused/);
  assert.match(result, /record = \{kept\}/);
  assert.match(result, /exported as publicValue/);
});

test('compiler migration preserves authored template and generic function text during import filtering', () => {
  const implementation = 'export function render<T extends string>(value: T) { return html`  <pre>🦋  ${value}\n  exact</pre>  `; }';
  const result = usedImports("import {html, unused} from 'lit';\n" + implementation, 'generic.ts');
  assert.ok(result.endsWith(implementation));
  assert.doesNotMatch(result.split('\n')[0], /unused/);
});

test('both producers read complete eager color modules and retain independent helper imports', async () => {
  const { sources } = await readAuthoredSpecimens(fileURLToPath(new URL('../', import.meta.url)));
  for (const id of ['composable-chat', 'chat-patterns']) {
    const source = sources[id];
    assert.match(source, /export const wideColorExtension/);
    for (const tag of ['en-color-picker', 'en-swatch', 'en-tab', 'en-tab-panel', 'en-tabs']) {
      assert.match(source, new RegExp(`<${tag}(?=[\\s>])`), `${id} retains ${tag}`);
    }
    assert.match(source, /keyed\(session\.signal,\s*html`<div data-color-session/);
    assert.doesNotMatch(source, /composableChatColor|prepareColorControls|createDeliveryProfile/);
    assert.doesNotMatch(source, /(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]\.\.?\//);
    assert.doesNotMatch(source, /import\s*\(\s*['"]\.\.?\//);
    assert.equal((source.match(/export class ComposableChatDemo\b/g) ?? []).length, 1);
    assert.doesNotMatch(source, /import\s*\{[^}]*\bdirective\b[^}]*\}\s*from ['"]lit\/directive\.js['"]/);
  }
  assert.doesNotMatch(sources['composable-chat'], /from ['"]lit\/async-directive\.js['"]/);
  assert.equal((sources['chat-patterns'].match(/from ['"]lit\/async-directive\.js['"]/g) ?? []).length, 1);
  assert.match(sources['color-picker'], /export const wideColorExtension/);
});


test('nested async directives share an authored public import identity while mismatched entries still fail', () => {
  const outer = "import {AsyncDirective, directive} from 'lit/async-directive.js';\nimport {inner} from './inner.js';\nexport const outer = directive(class extends AsyncDirective {render(){return inner();}});";
  const helper = "import {AsyncDirective, directive} from 'lit/async-directive.js';\nexport const inner = directive(class extends AsyncDirective {render(){return 'ready';}});";
  const result = inlineSpecimenModules(outer, {'./inner.js': helper});
  assert.equal((result.match(/from ['"]lit\/async-directive\.js['"]/g) ?? []).length, 1);
  assert.match(result, /export const inner = directive/);
  assert.match(result, /export const outer = directive/);
  assert.throws(() => inlineSpecimenModules(outer, {
    './inner.js': helper.replace("import {AsyncDirective, directive} from 'lit/async-directive.js';", "import {AsyncDirective} from 'lit/async-directive.js';\nimport {directive} from 'lit/directive.js';"),
  }), /Conflicting specimen import: directive/);
});
