import { invalidDefinitionCases } from '../css-authoring/definition-cases.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateDefinitions, validateConsumer, compile, loadEngine, canonicalCSS } from './compiler.mjs';
import { definitionInputs, makeComparison } from './fixture.mjs';

const inputs = await definitionInputs();
const engine = await loadEngine();
const invalidDefinitions = invalidDefinitionCases(inputs[0].css);
for (const [name, css, message] of invalidDefinitions) test(`rejects ${name} with a definition location`, () => {
  assert.throws(() => validateDefinitions([{ filename: 'bad-definitions.css', css }]), error => message.test(error.message) && /bad-definitions.css:\d+:\d+/.test(error.message));
});
const invalidConsumers = [
  ['unknown call', '.a{width:--unknown(1px)}', /Unknown function/],
  ['wrong argument count', '.a{width:--pilot-inset-radius(1px)}', /requires 2/],
  ['trailing empty argument', '.a{width:--pilot-inset-radius(1px,)}', /nonempty/],
  ['CSS-wide argument', '.a{width:--pilot-inset-radius(inherit,1px)}', /nonempty/],
  ['nested helper', '.a{width:--pilot-inset-radius(--pilot-inset-radius(3px,1px),1px)}', /Nested helper/],
  ['unknown mixin', '.a{@apply --unknown();}', /Unknown mixin/],
  ['kind mismatch', '.a{@apply --pilot-inset-radius(1px,2px)}', /Unknown mixin/],
  ['nested selector', '.a{ &{color:red}}', /Nested rules/],
  ['conditional consumer', '@media (width>1px){.a{color:red}}', /flat style rules/],
  ['consumer definition', '@function --a(){result:1px}', /flat style rules/],
  ['important consumer', '.a{color:red!important}', /!important/],
];
const defs = validateDefinitions(inputs);
for (const [name, css, message] of invalidConsumers) test(`rejects ${name} at the call site`, () => {
  assert.throws(() => validateConsumer(css, 'bad-consumer.css', defs), error => message.test(error.message) && /bad-consumer.css:\d+:\d+/.test(error.message));
});
test('explicit input manifest rejects duplicate files', () => assert.throws(() => validateDefinitions([...inputs, ...inputs]), /Duplicate definition input/));
test('compiled CSS equals the existing size/token-aware Lit composition', () => {
  const { before, after } = makeComparison(inputs, engine);
  assert.equal(after, before);
  assert.match(after, /--_en-sized-/);
});
test('mixin expansion retains declaration override order', () => {
  const css = compile([{filename:'order.css',css:'@mixin --paint(){@result{color:blue;}}'}], '.a{color:green;@apply --paint();color:red}', engine).css;
  assert.equal(canonicalCSS(css), '.a{color:red}');
});
test('quoted helper-looking text and comma-containing fallback font stacks remain literal', () => {
  const css = compile(inputs, '.a{content:"--not-a-call()";@apply --pilot-typography(400,16px,1.5,var(--font, "A, B", serif));}', engine).css;
  assert.match(css, /--not-a-call\(\)/);
  assert.match(css, /var\(--font/);
});
test('changed upstream engine fails before import', async () => {
  const dir = await mkdtemp(join(tmpdir(),'theme07-engine-'));
  try { const path = join(dir,'engine.mjs'); await writeFile(path, 'throw new Error("must not import");'); await assert.rejects(loadEngine(path), /digest mismatch/); }
  finally { await rm(dir,{recursive:true,force:true}); }
});
test('missing engine explains the optional prerequisite', async () => { await assert.rejects(loadEngine(''), /REVE_CSS_FUNCTIONS_SOURCE/); });

test('the extracted typography comparator matches the actual production role declarations', async () => {
  const { typographyStyles } = await import('../../packages/styles/dist/typography.js');
  const { baselineStyles, roles } = await import('./fixtures/baseline.ts');
  const {default:postcss}=await import('postcss');
  const source=postcss.parse(typographyStyles.cssText),baseline=postcss.parse(baselineStyles().cssText);
  for(const role of roles){
    const value=root=>{let found;root.walkRules(rule=>{if(rule.selector.split(',').map(s=>s.trim()).includes(`.en-${role}`))rule.walkDecls('font',d=>found=d.value);});return found;};
    assert.ok(value(source));assert.equal(value(baseline),value(source));
  }
});
