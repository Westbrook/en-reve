const parameters = new URL(location.href).searchParams;
await Promise.all([
  import('@en-reve/elements/define/button.js'),
  import('@en-reve/elements/define/menu.js'),
  import('@en-reve/elements/define/menu-item.js'),
  import('@en-reve/elements/define/toolbar.js'),
  ...(parameters.has('skip-palette-definition') ? [] : [import('@en-reve/elements/define/command-palette.js')]),
]);
const palette = document.querySelector('#palette');
const commands = [
  { action: 'copy', label: 'Copy document', keywords: ['duplicate'] },
  { action: 'delete', label: 'Delete document', disabled: true },
  { action: 'download', label: 'Download document', shortcut: 'Control+S' },
  { action: 'rename', label: 'Rename document' },
];
palette.commands = commands;
const events = [];
const submissions = [];
const nativeClicks = [];
document.querySelector('#form').addEventListener('submit', event => {
  event.preventDefault(); submissions.push(Object.fromEntries(new FormData(event.currentTarget)));
});
document.addEventListener('en-action', event => {
  const record = { type: event.type, target: event.target.id, action: event.detail.action, cancelable: event.cancelable, canceled: false };
  events.push(record);
  queueMicrotask(() => { record.canceled = event.defaultPrevented; });
});
document.addEventListener('en-change', event => {
  if (!['menu', 'palette'].includes(event.target.id)) return;
  events.push({ type: event.type, target: event.target.id, detail: event.detail, openDuring: event.target.open, cancelable: event.cancelable });
});
for (const id of ['tool-one', 'tool-two', 'tool-three']) document.getElementById(id).addEventListener('click', () => nativeClicks.push(id));
window.commandsFixture = {
  commands, events, submissions, nativeClicks,
  async settle() {
    for (let turn = 0; turn < 4; turn++) {
      await Promise.resolve();
      await Promise.all([...document.querySelectorAll('en-button,en-menu,en-menu-item,en-toolbar,en-command-palette')].map(element => element.updateComplete));
    }
  },
};
await window.commandsFixture.settle();
document.body.dataset.ready = 'true';
