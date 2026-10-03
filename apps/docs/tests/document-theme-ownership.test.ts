import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveTheme } from '@en-reve/tokens';
import { attachDocumentTheme } from '../src/theme-review/document-theme.ts';

/** Ownership/order fixture: rendered CSS and browser lifecycle use browser cases. */
function owner() {
  const styles: Array<{ attributes: Map<string, string>; removed: boolean }> = [];
  const containers: Array<{ children: object[] }> = [];
  const appendCounts = new WeakMap<object, number>();
  const detach = (node: object) => {
    for (const container of containers) {
      const index = container.children.indexOf(node);
      if (index !== -1) container.children.splice(index, 1);
    }
  };
  const container = () => {
    const children: object[] = [];
    const result = {
      children,
      get lastElementChild() { return children.at(-1) ?? null; },
      append(node: object) {
        detach(node);
        children.push(node);
        appendCounts.set(node, (appendCounts.get(node) ?? 0) + 1);
      },
    };
    containers.push(result);
    return result;
  };
  const attributes = new Map<string, string>();
  const document = {
    defaultView: {},
    head: container(),
    body: container() as ReturnType<typeof container> | null,
    documentElement: {
      getAttribute(name: string) { return attributes.get(name) ?? null; },
      setAttribute(name: string, value: string) { attributes.set(name, value); },
      removeAttribute(name: string) { attributes.delete(name); },
      style: { getPropertyValue() { return ''; }, getPropertyPriority() { return ''; } },
    },
    createElement(tag: string) {
      assert.equal(tag, 'style');
      const state = { attributes: new Map<string, string>(), removed: false };
      styles.push(state);
      const node = {
        textContent: '',
        setAttribute(name: string, value: string) { state.attributes.set(name, value); },
        remove() { state.removed = true; detach(node); },
      };
      return node;
    },
  };
  const root = { ownerDocument: document, isConnected: true } as unknown as HTMLElement;
  return { root, styles, document, container, appendCounts, anotherRoot: () => ({ ownerDocument: document, isConnected: true } as unknown as HTMLElement) };
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

test('candidate follows body recipe styles and refresh moves only its owned stylesheet', () => {
  const { root, styles, document, appendCounts } = owner();
  const body = document.body!;
  const recipeLink = { rel: 'stylesheet', href: '/content.css' };
  body.append(root);
  body.append(recipeLink);
  const controller = attachDocumentTheme({ root, manageAppearance: false });
  try {
    assert.equal(controller.apply(resolveTheme({ name: 'document-order-test' })), true);
    const candidate = body.lastElementChild!;
    assert.deepEqual(body.children, [root, recipeLink, candidate]);
    assert.deepEqual(document.head.children, []);
    assert.equal(styles.length, 1);

    const lateRecipeLink = { rel: 'stylesheet', href: '/later-content.css' };
    body.append(lateRecipeLink);
    assert.equal(controller.refresh(), true);
    assert.deepEqual(body.children, [root, recipeLink, lateRecipeLink, candidate]);
    assert.equal(appendCounts.get(candidate), 2);
    for (const appNode of [root, recipeLink, lateRecipeLink]) assert.equal(appendCounts.get(appNode), 1);

    // An ordinary refresh at the correct position does not detach anything.
    assert.equal(controller.refresh(), true);
    assert.equal(appendCounts.get(candidate), 2);
    controller.reset();
    assert.deepEqual(body.children, [root, recipeLink, lateRecipeLink]);
    assert.equal(controller.refresh(), false);
    assert.equal(document.documentElement.getAttribute('data-en-theme'), null);
    assert.equal(styles[0].removed, true);
  } finally { controller.disconnect(); }
});

test('candidate falls back to head and moves to body when it becomes available', () => {
  const { root, document, container, appendCounts } = owner();
  document.body = null;
  document.head.append(root);
  const controller = attachDocumentTheme({ root, manageAppearance: false });
  try {
    assert.equal(controller.apply(resolveTheme({ name: 'document-head-test' })), true);
    const candidate = document.head.lastElementChild!;
    assert.deepEqual(document.head.children, [root, candidate]);
    document.body = container();
    const recipeLink = { rel: 'stylesheet', href: '/content.css' };
    document.body.append(recipeLink);
    assert.equal(controller.refresh(), true);
    assert.deepEqual(document.head.children, [root]);
    assert.deepEqual(document.body.children, [recipeLink, candidate]);
    assert.equal(appendCounts.get(root), 1);
    assert.equal(appendCounts.get(recipeLink), 1);
    controller.reset();
    assert.deepEqual(document.body.children, [recipeLink]);
  } finally { controller.disconnect(); }
});
