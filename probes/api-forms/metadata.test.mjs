import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const manifest = JSON.parse(await readFile(new URL('../../packages/elements/custom-elements.json', import.meta.url), 'utf8'));
const declaration = tag => manifest.modules.flatMap(module => module.declarations ?? []).find(entry => entry.tagName === tag);

test('published form metadata separates live properties from default attributes', () => {
  for (const tag of ['en-text-field','en-textarea','en-number-field','en-search-input','en-date-input','en-time-field','en-color-field','en-select','en-combobox','en-radio-group','en-segmented-control','en-slider','en-color-slider','en-rating','en-date-picker']) {
    const entry=declaration(tag);
    assert.equal(entry.attributes.find(attribute=>attribute.name==='value')?.fieldName,'defaultValue',tag);
    assert.equal(entry.members.find(member=>member.name==='value')?.attribute,undefined,tag);
  }
  for (const tag of ['en-checkbox','en-switch','en-radio']) {
    const entry=declaration(tag);
    assert.equal(entry.attributes.find(attribute=>attribute.name==='checked')?.fieldName,'defaultChecked',tag);
    assert.equal(entry.members.find(member=>member.name==='checked')?.attribute,undefined,tag);
  }
});

test('every form-associated family advertises validation facade and error presentation',()=>{
 for(const tag of ['en-text-field','en-checkbox','en-switch','en-radio','en-radio-group','en-segmented-control','en-slider','en-color-slider','en-rating','en-date-picker','en-file-upload']){
  const entry=declaration(tag);
  for(const name of ['form','labels','validity','validationMessage','willValidate','checkValidity','reportValidity','error']) assert.ok(entry.members.some(member=>member.name===name),`${tag}.${name}`);
  assert.ok(entry.cssParts.some(part=>part.name==='error'),tag);
 }
});
