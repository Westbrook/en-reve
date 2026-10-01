import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import postcss from 'postcss';

// Each public stylesheet must parse independently, and concatenation must not
// turn subsequent recipes into children of an unterminated media query.
test('every exported native stylesheet has balanced CSS syntax', async () => {
  const root = new URL('../../packages/styles/', import.meta.url);
  const manifest = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
  const exports = Object.entries(manifest.exports).filter(([name]) => name.endsWith('.css'));
  assert.ok(exports.length > 0);
  const styles = [];
  for (const [name, path] of exports) {
    const css = await readFile(new URL(path, root), 'utf8');
    assert.doesNotThrow(() => postcss.parse(css, { from: name }), name);
    styles.push(css);
  }
  assert.doesNotThrow(() => postcss.parse(styles.join('\n')));
});
