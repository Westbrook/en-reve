import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveTheme, emitThemeCSS} from '../dist/index.js';
import {
  customizationContracts, getCustomizationContract, styleCustomizationContracts,
  styleOverrideNames, styleStateProperties, styleConfigurationProperties, styleFamilies,
} from '../dist/customization.js';
import {styleOverrideNames as compatibilityNames} from '../dist/overrides.js';

test('contracts merge actual source tokens without silently promoting CSS-only hooks', () => {
  const theme = resolveTheme();
  const contracts = customizationContracts(theme);
  assert.equal(new Set(contracts.map(record => record.cssName)).size, contracts.length);
  for (const token of Object.values(theme.tokens)) {
    const record = contracts.find(record => record.cssName === token.cssName);
    assert.equal(record.tokenId, token.id);
    assert.equal(record.managed.supported, true);
    assert.deepEqual(record.tokenDefault.tokenIds, token.dependencies);
  }
  assert.equal(getCustomizationContract(theme, '--en-field-gap').managed.supported, false);
  assert.equal(getCustomizationContract(theme, '--en-field-gap').tokenId, undefined);
  assert.equal(getCustomizationContract(theme, '--en-unknown'), undefined);

  const custom = resolveTheme({source:{component:{surface:{radius:{$type:'dimension',$value:'{radius.dialog}'}}}}});
  const promoted = getCustomizationContract(custom, '--en-surface-radius');
  assert.equal(promoted.managed.supported, true);
  assert.equal(promoted.tokenId, 'component.surface.radius');
  assert.deepEqual(promoted.tokenDefault.tokenIds, ['radius.dialog']);
  assert.deepEqual(promoted.fallback.tokenIds, ['radius.container']);
  assert.equal(promoted.tokenDefault.fullThemeValue, 'expression');
});

test('optional resolved defaults remain distinct from actual contextual fallback', () => {
  const theme = resolveTheme();
  const shadow = getCustomizationContract(theme, '--en-toast-shadow');
  assert.deepEqual(shadow.tokenDefault.tokenIds, ['shadow.overlay']);
  assert.deepEqual(shadow.fallback.tokenIds, []);
  assert.match(shadow.fallback.description, /Rendered default is none/);
  assert.equal(shadow.tokenDefault.fullThemeValue, 'initial');
  assert.equal(getCustomizationContract(theme, '--en-color-slider-thumb-size').tokenDefault.fullThemeValue, 'expression');
  assert.match(getCustomizationContract(theme, '--en-control-inline-padding').fallback.description, /fallback beneath button and input family padding/);
  assert.equal(getCustomizationContract(theme, '--en-radius-control-small').size.behavior, 'selected-output');
  assert.equal(getCustomizationContract(theme, '--en-editor-toolbar-gap').consumerStatus, 'connected');
});

test('full resets include visual additions while preserving configuration and mechanics', () => {
  const theme = resolveTheme();
  const css = emitThemeCSS(theme);
  for (const name of ['--en-validation-summary-radius','--en-validation-summary-padding','--en-chat-background','--en-calendar-day-radius','--en-color-plane-thumb-size','--en-color-wheel-track-size','--en-editor-toolbar-background']) {
    assert.equal(getCustomizationContract(theme, name).reset, 'theme');
    assert.ok(styleOverrideNames.includes(name));
    assert.ok(css.includes(`${name}: initial;`));
  }
  for (const name of [...styleConfigurationProperties,...styleStateProperties]) {
    assert.equal(getCustomizationContract(theme, name).reset, 'preserve');
    assert.equal(getCustomizationContract(theme, name).managed.supported, false);
    assert.ok(!styleOverrideNames.includes(name));
    assert.ok(!css.includes(`${name}:`));
  }
  const partial = emitThemeCSS(theme,{kind:'partial',tokenIds:['color.action']});
  assert.ok(!partial.includes('--en-chat-background:'));
  assert.ok(partial.includes('--en-color-action:'));
  assert.strictEqual(styleOverrideNames, compatibilityNames);
});

test('registration defaults preserve unset fallback and relative-value semantics', () => {
  const theme = resolveTheme();
  for (const record of customizationContracts(theme)) {
    assert.equal(record.registration.syntax, '*');
    assert.equal(record.registration.inherits, true);
    assert.ok(!Object.hasOwn(record.registration, 'initialValue'));
    if (record.kind !== 'semantic') assert.equal(record.registration.typed.eligible, false);
  }
  assert.equal(getCustomizationContract(theme, '--en-color-action').registration.typed.syntax, '<color>');
  assert.equal(getCustomizationContract(theme, '--en-color-action').registration.typed.eligible, true);
  assert.equal(getCustomizationContract(theme, '--en-radius-control').registration.typed.eligible, false);
  assert.equal(getCustomizationContract(theme, '--en-layout-prose-max').syntax, '<length>');
});

test('theme source and explicit reset extensions cannot claim preserved inputs', () => {
  for (const [family,role] of [['progress','value'],['slider','value-percent'],['editor','max-size'],['data-table','viewport-size']]) {
    assert.throws(() => resolveTheme({source:{component:{[family]:{[role]:{$type:'number',$value:1}}}}}), {code:'reserved-customization-property'});
  }
  const theme = resolveTheme();
  for (const name of [...styleConfigurationProperties,...styleStateProperties]) {
    assert.throws(() => emitThemeCSS(theme,{componentOverrides:[name]}), {code:'reserved-customization-property'});
  }
  const injected = {...theme,tokens:{...theme.tokens,'component.progress.value':{...theme.tokens['calendar.hover-opacity'],id:'component.progress.value',cssName:'--en-progress-value'}}};
  assert.throws(() => customizationContracts(injected), {code:'reserved-customization-property'});
});

test('declared fallback roles exist, and registry inspection is immutable and pure', () => {
  const theme = resolveTheme();
  const before = JSON.stringify(theme);
  const contracts = customizationContracts(theme);
  for (const record of contracts) for (const id of record.fallback.tokenIds) assert.ok(theme.tokens[id], `${record.cssName} references ${id}`);
  assert.equal(JSON.stringify(theme), before);
  assert.ok(Object.isFrozen(contracts));
  assert.ok(Object.isFrozen(contracts[0].registration.typed));
  assert.ok(Object.isFrozen(styleCustomizationContracts));
  for (const family of ['calendar','chat','color-plane','color-wheel','editor-toolbar','form-navigation','token-editor','rich-text-editor','typography']) assert.ok(styleFamilies.includes(family));
});

test('registry inspection does not freeze dependency arrays belonging to its input', () => {
  const theme = structuredClone(resolveTheme());
  const dependencies = Object.values(theme.tokens).map(token => token.dependencies);
  assert.ok(dependencies.every(values => !Object.isFrozen(values)));
  const before = JSON.stringify(theme);
  const contracts = customizationContracts(theme);
  assert.equal(JSON.stringify(theme), before);
  assert.ok(dependencies.every(values => !Object.isFrozen(values)));
  for (const record of contracts.filter(record => record.tokenDefault)) {
    assert.ok(Object.isFrozen(record.fallback.tokenIds));
    assert.ok(Object.isFrozen(record.tokenDefault.tokenIds));
  }
});
