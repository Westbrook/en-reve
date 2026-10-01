import test from 'node:test';
import assert from 'node:assert/strict';
import {SourceMap} from 'node:module';
import {minifyLitTemplates} from './literals.mjs';

test('nested templates preserve every expression and map unchanged Unicode-adjacent code', async () => {
  const source = "import {html} from 'lit';\nconst value = '🦋';\nexport const view = html`\n  <div>🦋 ${html`  <b>${value}</b>  `}</div>\n`;";
  const result = await minifyLitTemplates({include: ['/fixture']}).transform(source, '/fixture/nested.ts');
  assert.ok(result);
  assert.equal((result.code.match(/\$\{/g) ?? []).length, 2);
  assert.match(result.code, /<div>🦋 \$\{html` <b>\$\{value\}<\/b> `\}<\/div>/);
  const position = (text, offset) => {
    const lines = text.slice(0, offset).split('\n');
    return {line: lines.length - 1, column: lines.at(-1).length};
  };
  const original = position(source, source.indexOf('${value}') + 2);
  const generated = position(result.code, result.code.indexOf('${value}') + 2);
  const entry = new SourceMap(JSON.parse(result.map.toString())).findEntry(generated.line, generated.column);
  assert.equal(entry.originalLine, original.line);
  assert.equal(entry.originalColumn, original.column);
});

test('type-only and shadowed bindings cannot acquire literal-transform ownership', async () => {
  const source = "import type {html} from 'lit';\nimport * as real from 'lit';\nconst local = (html: any) => html`  <i>  untouched  </i>  `;\nconst typed = html`  <b>  untouched  </b>  `;\nconst active = real.html`  <p>  compact  </p>  `;";
  const result = await minifyLitTemplates({include: ['/fixture']}).transform(source, '/fixture/ownership.ts');
  assert.ok(result);
  assert.ok(result.code.includes('html`  <i>  untouched  </i>  `'));
  assert.ok(result.code.includes('html`  <b>  untouched  </b>  `'));
  assert.ok(result.code.includes('real.html` <p> compact </p> `'));
});
