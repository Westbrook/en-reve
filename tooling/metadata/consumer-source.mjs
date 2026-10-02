import assert from 'node:assert/strict';
import {digestJson} from '../evidence/identity.ts';

const publicField = (declaration, name, type) => declaration.members?.find(member =>
  member.kind === 'field' && member.name === name && member.type?.text === type &&
  !member.readonly && !member.static && !['private', 'protected'].includes(member.privacy));

/** A bounded consumer recipe, not a general code generator or new public CLI. */
export function checkboxConsumer({manifest, graph, types}, selectedTag = 'en-checkbox') {
  assert.equal(manifest.schemaVersion, '2.1.0', 'Unsupported CEM schema');
  assert.equal(graph.packageName, '@en-reve/elements');
  assert.equal(graph.manifestDigest, digestJson(manifest), 'Graph/CEM identity mismatch');
  assert.equal(graph.typeDigest, digestJson(types), 'Graph/type identity mismatch');
  const declarations = manifest.modules.flatMap(module => module.declarations ?? []);
  const discovered = declarations.filter(declaration => declaration.tagName &&
    publicField(declaration, 'checked', 'boolean') && publicField(declaration, 'name', 'string') &&
    declaration.events?.some(event => event.name === 'en-change') &&
    declaration.slots?.some(slot => slot.name === 'label'))
    .map(declaration => ({tagName: declaration.tagName, className: declaration.name, description: declaration.description}));
  assert(discovered.some(item => item.tagName === selectedTag), 'Requested checkbox is not discoverable');
  const matches = declarations.filter(declaration => declaration.tagName === selectedTag);
  assert.equal(matches.length, 1, 'Ambiguous CEM declaration');
  const declaration = matches[0];
  const contracts = graph.components.filter(component => component.tagName === selectedTag);
  assert.equal(contracts.length, 1, 'Missing or ambiguous public graph component');
  const contract = contracts[0];
  assert.equal(contract.className, declaration.name);
  assert.match(selectedTag, /^en-[a-z][a-z0-9-]*$/);
  assert.match(contract.className, /^[A-Za-z_$][\w$]*$/);
  assert.match(contract.classImport, /^@en-reve\/elements\/[a-z][a-z0-9-]*\.js$/);
  assert.match(contract.definitionImport, /^@en-reve\/elements\/define\/[a-z][a-z0-9-]*\.js$/);
  for (const [name, type] of Object.entries({checked:'boolean', defaultChecked:'boolean', disabled:'boolean', name:'string', value:'string', label:'string'})) {
    assert(publicField(declaration, name, type), `Missing CEM writable ${name}:${type}`);
    assert(publicField(contract, name, type), `Missing graph writable ${name}:${type}`);
  }
  for (const name of ['name','value','checked']) {
    const attribute = declaration.attributes?.find(attribute => attribute.name === name);
    assert(attribute, `Missing CEM attribute ${name}`);
    assert.deepEqual(contract.attributes.find(item => item.name === name), attribute, `Attribute disagreement: ${name}`);
  }
  assert.equal(declaration.attributes.find(item => item.name === 'checked').fieldName, 'defaultChecked', 'Checked attribute must describe reset default');
  for (const name of ['label', 'description']) {
    const slot = declaration.slots.find(slot => slot.name === name);
    assert(slot, `Missing CEM slot ${name}`);
    assert.deepEqual(contract.slots.find(item => item.name === name), slot);
  }
  const part = declaration.cssParts?.find(part => part.name === 'control');
  assert(part, 'Missing CEM control Part');
  assert.deepEqual(contract.parts.find(item => item.name === part.name), part);
  const event = declaration.events.find(event => event.name === 'en-change');
  const change = contract.events.find(item => item.name === event.name);
  assert.equal(change?.type, event.type.text, 'Event type disagreement');
  assert.equal(change.behavior?.phase, 'tentative-change');
  for (const flag of ['bubbles','composed','cancelable']) assert.equal(change.behavior[flag], true, `Missing change behavior ${flag}`);
  assert.equal(event.type.text, "import('@en-reve/primitives/interactions/events.js').ChangeEvent<boolean>");
  const retrieved = {tagName:selectedTag, className:contract.className, classImport:contract.classImport,
    definitionImport:contract.definitionImport, dependencies:contract.dependencies, event:change,
    checkedAttribute:declaration.attributes.find(item=>item.name==='checked'), slots:contract.slots, part};
  const q = JSON.stringify;
  const source = `// Generated from the packed CEM and its identity-matched public graph.
import type {${contract.className}} from ${q(contract.classImport)};
import ${q(contract.definitionImport)};
type Change = ${event.type.text};
const form = document.querySelector<HTMLFormElement>('form')!;
const field: ${contract.className} = document.createElement(${q(selectedTag)});
field.setAttribute(${q(retrieved.checkedAttribute.name)}, '');
field.name = 'choice'; field.value = 'accepted'; field.label = 'Fallback label';
const label = document.createElement('span'); label.slot = ${q(contract.slots.find(s=>s.name==='label').name)}; label.textContent = 'Include project'; field.append(label);
const description = document.createElement('span'); description.slot = ${q(contract.slots.find(s=>s.name==='description').name)}; description.textContent = 'Shared with the project team'; field.append(description);
form.prepend(field);
const observations: Array<{previous:boolean;proposed:boolean;checked:boolean;data:FormDataEntryValue|null;bubbles:boolean;composed:boolean;cancelable:boolean}> = [];
let rejectNext = false;
form.addEventListener(${q(event.name)}, raw => {
  const event = raw as Change;
  observations.push({previous:event.detail.previous, proposed:event.detail.proposed, checked:field.checked, data:new FormData(form).get('choice'), bubbles:event.bubbles, composed:event.composed, cancelable:event.cancelable});
  if (rejectNext) { rejectNext = false; event.preventDefault(); }
});
document.querySelector('#reject')!.addEventListener('click', () => {rejectNext = true; field.focus();});
document.querySelector('#write')!.addEventListener('click', () => {field.checked = false;});
document.querySelector('#disable')!.addEventListener('click', () => {field.disabled = !field.disabled;});
form.addEventListener('submit', event => {event.preventDefault(); document.querySelector('output')!.textContent = String(new FormData(form).get('choice'));});
declare global {interface Window {consumer: {snapshot:()=>{checked:boolean;defaultChecked:boolean;disabled:boolean;data:FormDataEntryValue|null;observations:typeof observations}};}}
window.consumer = {snapshot:()=>({checked:field.checked,defaultChecked:field.defaultChecked,disabled:field.disabled,data:new FormData(form).get('choice'),observations:[...observations]})};
document.documentElement.dataset.ready = 'true';
`;
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Discovered API consumer</title><style>body{font:16px system-ui;margin:2rem}button{margin:.5rem}${selectedTag}::part(${part.name}){outline:3px solid rgb(101, 31, 121)}</style><body><h1>Discovered API consumer</h1><form><button type="submit">Submit choice</button><button type="reset">Reset choice</button></form><button id="write">Write unchecked</button><button id="reject">Reject next change</button><button id="disable">Toggle disabled</button><output aria-label="Submitted choice"></output><script type="module" src="./consumer.js"></script></body></html>`;
  return {discovered, retrieved, source, html};
}
