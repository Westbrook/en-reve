import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inspectCustomizationSource } from './source-inventory.mjs';
import { inspectCoverage } from './verify.mjs';
import { applyReviewedExceptions } from './reviewed-exceptions.mjs';
import { decorateCustomizationMetadata, cemAssociations } from './cem.mjs';

test('source inventory sees helper aliases, nested raw fallbacks and annotations but excludes comment-only consumers', () => {
  const source = inspectCustomizationSource('packages/styles/src/example.ts', `
    import { token as t, override as pin } from './internal/values.js';
    // var(--en-comment-only) does not establish consumption.
    /** @cssprop --en-choice-color - Choice paint. */
    export const styles = css\`/* var(--en-css-comment-only) */ color: \${pin('--en-choice-color', t('--en-color-text'))};
      gap:var(--en-choice-gap,var(--en-space-2)); --en-forwarded:var(--en-choice-size);\`;
  `);
  assert.deepEqual([...new Set(source.references.map(item => item.cssName))].sort(), ['--en-choice-color', '--en-choice-gap', '--en-choice-size', '--en-color-text', '--en-space-2']);
  assert.equal(source.references.find(item => item.cssName === '--en-choice-gap').fallback, 'var(--en-space-2)');
  assert.equal(source.references.find(item => item.cssName === '--en-choice-color').form, 'override');
  assert.equal(source.annotations[0].cssName, '--en-choice-color');
  assert.equal(source.declarations[0].cssName, '--en-forwarded');
  assert.deepEqual(source.unresolved, []);
});

test('new dynamic helper and direct var expressions fail closed', () => {
  const source = inspectCustomizationSource('packages/styles/src/example.ts', "import { token as t } from './internal/values.js'; export const styles = css`color:${t(dynamicName)};gap:var(--en-${name});padding:var(${unsafeCSS(unknownName)});`;");
  assert.equal(source.unresolved.some(item => item.form === 'token'), true);
  assert.equal(source.unresolved.some(item => item.form === 'dynamic-var'), true);
  assert.equal(source.unresolved.some(item => item.form === 'interpolated-var'), true);
});

function fixture() {
  const contract = { cssName: '--en-demo-gap', kind: 'override', family: 'demo', reset: 'theme', managed: { supported: false }, consumers: ['packages/elements/src/demo.ts'] };
  const manifest = { modules: [{ path: 'src/demo.ts', declarations: [{ tagName: 'en-demo', cssProperties: [{ name: '--en-demo-gap' }], cssParts: [{ name: 'base' }] }] }] };
  decorateCustomizationMetadata(manifest, [contract]);
  return { inventory: { references: [{ cssName: '--en-demo-gap', file: 'packages/elements/src/demo.ts', line: 2 }], declarations: [], annotations: [{ cssName: '--en-demo-gap', file: 'packages/elements/src/demo.ts', line: 1 }], unresolved: [] },
    contracts: [contract], manifest, theme: { tokens: {} }, resetNames: ['--en-demo-gap'], fullDeclarations: new Map([['--en-demo-gap', 'initial']]), editorDescriptor: () => null };
}

test('coverage rejects an added unclassified hook and preserved inputs in resets', () => {
  const input = fixture();
  assert.deepEqual(inspectCoverage(input).findings, []);
  input.inventory.references.push({ cssName: '--en-new-hook', file: 'packages/styles/src/new.ts', line: 3 });
  input.contracts[0].reset = 'preserve';
  const findings = inspectCoverage(input).findings;
  assert.equal(findings.some(item => item.code === 'unclassified-reference' && item.cssName === '--en-new-hook'), true);
  assert.equal(findings.some(item => item.code === 'reset-list-mismatch'), true);
  assert.equal(findings.some(item => item.code === 'preserved-hook-emitted'), true);
});

test('a lexical reference forwarded to an unread property remains disconnected', () => {
  const input = fixture();
  input.inventory.declarations.push({ cssName: '--en-destination-gap', file: 'packages/elements/src/demo.ts', line: 2, value: 'var(--en-demo-gap)' });
  assert.equal(inspectCoverage(input).findings.some(item => item.code === 'disconnected-hook' && item.cssName === '--en-demo-gap'), true);
});

test('managed metadata and authored CEM annotations are checked without inventing Parts mappings', () => {
  const input = fixture();
  const association = cemAssociations(input.manifest)[0];
  assert.deepEqual(association.partsAvailableOnComponent, [{ name: 'base', description: '' }]);
  assert.match(association.partRelationship, /no hook-to-Part mapping/);
  input.contracts[0].managed = { supported: true, tokenId: 'component.missing' };
  const findings = inspectCoverage(input).findings;
  assert.equal(findings.some(item => item.code === 'managed-token-mismatch'), true);
  assert.equal(findings.some(item => item.code === 'cem-contract-metadata-mismatch'), true);
  input.manifest.modules[0].declarations[0].cssProperties = [];
  assert.equal(inspectCoverage(input).findings.some(item => item.code === 'missing-cem-annotation'), true);
});

test('review exceptions require exact hook, finding, source and a reason; stale entries fail', () => {
  const exception = { code: 'unclassified-reference', cssNames: ['--en-known'], source: 'known.ts', reason: 'Existing typo; isolated follow-up.' };
  const result = applyReviewedExceptions([
    { code: 'unclassified-reference', cssName: '--en-known', sources: ['known.ts'] },
    { code: 'unclassified-reference', cssName: '--en-new', sources: ['known.ts'] },
  ], [exception]);
  assert.deepEqual(result.findings.map(item => item.reviewed), [true, false]);
  assert.deepEqual(result.staleExceptions, []);
  assert.equal(applyReviewedExceptions([], [exception]).staleExceptions.length, 1);
  assert.equal(applyReviewedExceptions([{ code: exception.code, cssName: '--en-known', sources: ['different.ts'] }], [exception]).findings[0].reviewed, false);
});


test('CSS source inventory follows token calls and mixin arguments without generated adapters', () => {
  const source = inspectCustomizationSource('packages/styles/src/css/example.css', `
    /* var(--en-comment-only) */
    .a { color:var(--en-demo-color,--token(--en-color-text));
      @apply --font(--token(--en-font-body-weight),16px,1.5,serif);
      content:"var(--en-string-only)";
      --en-forwarded:var(--en-demo-gap);
    }
  `);
  assert.deepEqual([...new Set(source.references.map(item => item.cssName))].sort(),
    ['--en-color-text','--en-demo-color','--en-demo-gap','--en-font-body-weight']);
  assert.equal(source.references.find(item => item.cssName === '--en-demo-color').fallback, '--token(--en-color-text)');
  assert.equal(source.declarations[0].cssName,'--en-forwarded');
  assert.equal(source.references.find(item => item.cssName === '--en-font-body-weight').line,4);
  assert.deepEqual(source.unresolved,[]);
});
