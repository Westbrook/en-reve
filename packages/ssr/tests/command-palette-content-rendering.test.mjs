import '../dist/install.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFragment } from 'parse5';

const { registerDefinitions } = await import('@en-reve/primitives/interactions/registration.js');
const { renderToString } = await import('../dist/index.js');
const { definitions, commandPaletteContentInitial, commandPaletteContentTemplate } = await import('./fixtures/command-palette-content-template.mjs');
registerDefinitions(customElements, definitions);

function all(root, predicate, descendTemplates = true) {
  const result = [];
  const visit = node => {
    if (predicate(node)) result.push(node);
    for (const child of node.childNodes ?? []) visit(child);
    if (node.content && descendTemplates) visit(node.content);
  };
  visit(root);
  return result;
}
const attr = (node, name) => node.attrs?.find(attribute => attribute.name === name)?.value;
const tags = (root, tag) => all(root, node => node.tagName === tag);
const ownShadow = host => host.childNodes.find(node => node.tagName === 'template' && attr(node, 'shadowrootmode') === 'open').content;

for (const palette of commandPaletteContentInitial.palettes) {
  test(`${palette.id}: SSR preserves the modal shell and authored slots with an eager search body`, async () => {
    const snapshot = { ...commandPaletteContentInitial, palettes: [palette] };
    const document = parseFragment(await renderToString(commandPaletteContentTemplate(snapshot)));
    const host = tags(document, 'en-command-palette')[0];
    const shadow = ownShadow(host);
    assert.equal(attr(host, 'open'), palette.open ? '' : undefined);
    const dialogs = tags(shadow, 'dialog');
    assert.equal(dialogs.length, 1);
    // An authored open state does not emit native modality before connection.
    assert.equal(attr(dialogs[0], 'open'), undefined);
    assert.equal(attr(dialogs[0], 'inert'), '');
    for (const part of ['header', 'heading', 'body', 'footer']) {
      assert.equal(all(shadow, node => attr(node, 'part') === part).length, 1);
    }
    assert.equal(tags(shadow, 'en-button').filter(node => attr(node, 'class') === 'en-overlay-close').length, 1);
    assert.equal(all(shadow, node => node.tagName === 'slot' && attr(node, 'name') === undefined, false).length, 1);
    assert.equal(all(shadow, node => node.tagName === 'slot' && attr(node, 'name') === 'footer', false).length, 1);
    assert.equal(host.childNodes.filter(node => attr(node, 'data-support') === palette.id).length, 1);
    assert.equal(host.childNodes.filter(node => attr(node, 'data-footer') === palette.id).length, 1);
    assert.equal(tags(shadow, 'input').length, 1);
    assert.equal(all(shadow, node => attr(node, 'role') === 'listbox').length, 1);
    assert.equal(all(shadow, node => attr(node, 'role') === 'option').length, snapshot.commands.length);
    assert.equal(all(shadow, node => attr(node, 'role') === 'status').length, 1);
    const input = tags(shadow, 'input')[0];
    assert.equal(attr(input, 'aria-expanded'), String(palette.open));
    assert.equal(attr(input, 'value'), '');
    assert.equal(attr(input, 'aria-controls'), 'en-command-list');
    assert.equal(tags(shadow, 'label').filter(node => attr(node, 'for') === attr(input, 'id')).length, 1);
  });
}

test('a previous open request cannot change a later closed request catalog or native modality', async () => {
  const one = palette => ({ ...commandPaletteContentInitial, palettes: [palette] });
  await renderToString(commandPaletteContentTemplate({ ...one(commandPaletteContentInitial.palettes[2]),
    commands: [{ action: 'prior', label: 'Prior request command' }] }));
  const closed = one(commandPaletteContentInitial.palettes[1]);
  const results = await Promise.all(Array.from({ length: 4 }, () => renderToString(commandPaletteContentTemplate(closed))));
  for (const markup of results) {
    const host = tags(parseFragment(markup), 'en-command-palette')[0], shadow = ownShadow(host);
    assert.equal(attr(host, 'open'), undefined);
    assert.equal(tags(shadow, 'input').length, 1);
    assert.equal(attr(tags(shadow, 'input')[0], 'aria-expanded'), 'false');
    assert.deepEqual(all(shadow, node => attr(node, 'role') === 'option').map(node => attr(node, 'data-action')), closed.commands.map(command => command.action));
    assert.equal(tags(shadow, 'dialog').length, 1);
    assert.equal(attr(tags(shadow, 'dialog')[0], 'open'), undefined);
    assert.doesNotMatch(markup, /Prior request command/);
  }
});
