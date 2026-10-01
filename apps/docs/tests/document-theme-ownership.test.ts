import test from 'node:test';
import assert from 'node:assert/strict';
import { attachDocumentTheme } from '../src/theme-review/document-theme.ts';

/** Ownership-only fixture: CSS generation, DOM styling and lifecycle use browser cases. */
function owner() {
  const styles: Array<{ attributes: Map<string, string>; removed: boolean }> = [];
  const document = {
    defaultView: {},
    documentElement: {},
    createElement(tag: string) {
      assert.equal(tag, 'style');
      const state = { attributes: new Map<string, string>(), removed: false };
      styles.push(state);
      return {
        setAttribute(name: string, value: string) { state.attributes.set(name, value); },
        remove() { state.removed = true; },
      };
    },
  };
  const root = { ownerDocument: document, isConnected: true } as unknown as HTMLElement;
  return { root, styles, anotherRoot: () => ({ ownerDocument: document, isConnected: true } as unknown as HTMLElement) };
}

test('document theme attachment normalizes omitted defaults and preserves controller identity', () => {
  const { root, styles } = owner();
  const controller = attachDocumentTheme({ root });
  try {
    assert.equal(attachDocumentTheme({ root, styleAttribute: 'data-en-document-theme', manageAppearance: true }), controller);
    assert.equal(attachDocumentTheme({ root, selector: undefined, styleAttribute: undefined, manageAppearance: undefined }), controller);
    assert.equal(styles.length, 1);
    assert.deepEqual([...styles[0].attributes], [['data-en-document-theme', '']]);
  } finally { controller.disconnect(); }
});

test('incompatible attachment options and competing roots cannot replace a document owner', () => {
  const { root, styles, anotherRoot } = owner();
  const controller = attachDocumentTheme({ root });
  try {
    for (const options of [
      { selector: 'html[data-example-density]' as const },
      { styleAttribute: 'data-example-theme' as const },
      { manageAppearance: false },
    ]) {
      assert.throws(() => attachDocumentTheme({ root, ...options }), TypeError);
      assert.equal(attachDocumentTheme({ root }), controller);
      assert.equal(styles.length, 1);
      assert.equal(styles[0].removed, false);
      assert.deepEqual([...styles[0].attributes], [['data-en-document-theme', '']]);
    }
    assert.throws(() => attachDocumentTheme({ root: anotherRoot() }), TypeError);
    assert.equal(attachDocumentTheme({ root }), controller);
  } finally { controller.disconnect(); }
});

test('disconnect releases document ownership for a new root and fixed presentation options', () => {
  const { root, styles, anotherRoot } = owner();
  const first = attachDocumentTheme({ root });
  first.disconnect();
  first.disconnect();
  assert.equal(styles[0].removed, true);
  const nextRoot = anotherRoot();
  const options = { root: nextRoot, selector: 'html[data-example-density]' as const, styleAttribute: 'data-example-theme' as const, manageAppearance: false };
  const next = attachDocumentTheme(options);
  try {
    assert.notEqual(next, first);
    assert.equal(attachDocumentTheme({ ...options }), next);
    assert.equal(styles.length, 2);
    assert.deepEqual([...styles[1].attributes], [['data-example-theme', '']]);
    assert.equal(styles[1].removed, false);
    first.disconnect();
    assert.equal(attachDocumentTheme(options), next);
  } finally { next.disconnect(); }
});
