import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const manifest=JSON.parse(await readFile(new URL('../../packages/elements/custom-elements.json',import.meta.url),'utf8'));
const declarations=manifest.modules.flatMap(module=>module.declarations??[]);
const element=tag=>declarations.find(declaration=>declaration.tagName===tag);

test('localization attributes and property-only message types reach the public manifest',()=>{
  for(const [tag,name,attribute] of [['en-date-picker','clearLabel','clear-label'],['en-validation-summary','description','description'],...['en-color-picker','en-color-plane','en-color-wheel'].map(tag=>[tag,'validationText','validation-text'])]) {
    const declaration=element(tag);
    assert.ok(declaration.members.some(member=>member.name===name&&member.type.text==='string'));
    assert.ok(declaration.attributes.some(attr=>attr.name===attribute&&attr.fieldName===name));
  }
  for(const tag of ['en-token-editor','en-rich-text-editor','en-editor-toolbar','en-color-picker','en-color-plane','en-color-wheel']) {
    const declaration=element(tag);
    assert.ok(declaration.members.some(member=>member.name==='messages'&&/Messages/.test(member.type.text)));
    assert.ok(!declaration.attributes?.some(attr=>attr.name==='messages'));
  }
});
