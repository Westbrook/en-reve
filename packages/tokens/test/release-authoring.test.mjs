import test from 'node:test';
import assert from 'node:assert/strict';
import { assertCompanionBoundary } from './companion-boundary-support.mjs';
import {resolveTheme,tokenDocument,colorFromHex,createReviewDraft,emitThemeCSS,createThemeCompanion,validateRoleProvenance,validateRenderedRelationships,customizationContracts} from '../dist/index.js';

function assertNamedBoundary(css, name, mode = 'light') {
 const marker = `--en-companion-${name}-${mode}`;
 assert.ok(css.includes(`:where([data-en-theme]) { container-name: --en-theme-companion; ${marker}: initial; }`));
 assert.ok(css.includes(`[data-en-theme="${name}"][data-en-appearance="${mode}"] { ${marker}: 1; }`));
 assert.ok(css.includes(`@container --en-theme-companion style(${marker}: 1)`));
 assert.doesNotMatch(css, /@scope|:scope/);
}

test('unknown component warnings are opt-in and preserve valid application outputs and identity',()=>{
 const source=tokenDocument({'component.button.typo':{$type:'number',$value:1}});
 const base=resolveTheme({source}); const checked=resolveTheme({source,warnUnknownComponentHooks:true});
 assert.equal(base.sourceHash,checked.sourceHash); assert.equal(base.diagnostics.length,0);
 assert.deepEqual(checked.diagnostics.map(d=>d.code),['unknown-component-hook']);
 assert.match(emitThemeCSS(checked),/--en-button-typo: 1/);
 assert.equal(resolveTheme({warnUnknownComponentHooks:true}).diagnostics.length,0);
});
test('new typed roles remain optional, editable and cleared at full boundaries',()=>{
 const draft=createReviewDraft();
 for(const id of ['component.input.radius','component.card.shadow','component.button.pressed-scale','component.button.popup-pressed-scale','component.button.popup-pressed-offset','component.tab.selected-background','component.popup.enter-duration']) {
  assert.ok(customizationContracts(draft.theme).find(c=>c.tokenId===id)?.managed.supported);
  assert.match(emitThemeCSS(draft.theme),new RegExp(draft.theme.tokens[id].cssName+': initial;'));
 }
 draft.setToken('font.heading-large.style','italic'); assert.equal(draft.theme.tokens['font.heading-large.style'].cssValue,'italic');
 assert.throws(()=>resolveTheme({pins:{'font.body.style':'url(https://example.com)'}}),/expected fontStyle/);
 draft.undo();assert.equal(draft.theme.tokens['font.heading-large.style'].cssValue,'normal');
});
test('variant companions have stable identities and reject selectors, mechanical hooks and type confusion',()=>{
 const theme=resolveTheme();const recipe={schemaVersion:1,id:'neutral-actions',rules:[{target:'button',variant:'ghost',tokens:{'--en-button-pressed-background':'color.selected'}}]};
 const a=createThemeCompanion(theme,recipe), b=createThemeCompanion(theme,structuredClone(recipe));
 assert.equal(a.identity,b.identity);assert.match(createThemeCompanion(theme,recipe,{name:'paired-theme'}).css,/data-en-theme="paired-theme"/);assert.throws(()=>createThemeCompanion(theme,recipe,{name:'bad name'}),/name/);assert.match(a.css,/variant="ghost"/);assertCompanionBoundary(a.css,theme.name,theme.mode);assertNamedBoundary(a.css,theme.name,theme.mode);
 assert.throws(()=>createThemeCompanion(theme,{...recipe,rules:[{target:'body {',tokens:{}}]}),/Unsupported target/);
 assert.throws(()=>createThemeCompanion(theme,{...recipe,rules:[{target:'button',tokens:{'--en-button-pressed-background':'size.icon'}}]}),/compatible token/);
 assert.throws(()=>createThemeCompanion(theme,{...recipe,rules:[{target:'button',tokens:{'--en-navigation-position':'color.text'}}]}),/registered typed hook/);
});
test('consumed provenance requires viewport for measurements and preserves conflicting observations',()=>{
 const theme=resolveTheme();const row={tokenId:'color.action',kind:'measured',sourceUrl:'https://example.com',sourceHash:'sha256:'+'a'.repeat(64),selector:'.button',appearance:'light',viewport:{width:1200,height:800},note:'Measured consumed declaration; different from published product guidance.'};
 assert.equal(validateRoleProvenance(theme,[row,{...row,kind:'published',viewport:null}]).length,2);
 assert.throws(()=>validateRoleProvenance(theme,[{...row,viewport:null}]),/viewport/);
 assert.throws(()=>validateRoleProvenance(theme,[{...row,appearance:'dark'}]),/matching appearance/);
});

test('button companions include toggle actions and preserve each omitted-variant default',()=>{
 const theme=resolveTheme();
 const compile=variant=>createThemeCompanion(theme,{schemaVersion:1,id:'button-defaults',rules:[{target:'button',variant,tokens:{'--en-button-rest-color':'color.text'}}]}).css;
 const primary=compile('primary'),secondary=compile('secondary');
 for(const variant of ['primary','secondary','ghost','danger']) {
  const css=compile(variant);
  assert.ok(css.includes(`:where(en-toggle-button[variant="${variant}"])`));
  assert.ok(css.includes(`:where(.en-button[data-variant="${variant}"])`));
 }
 assert.ok(primary.includes(':where(en-button):where(:not([variant]))'));
 assert.ok(primary.includes(':where(.en-button):where(:not([data-variant])):where(:not(.en-button--secondary, .en-button--quiet, .en-button--danger))'));
 assert.ok(!primary.includes(':where(en-toggle-button):where(:not([variant]))'));
 assert.ok(secondary.includes(':where(en-toggle-button):where(:not([variant]))'));
 assert.ok(!secondary.includes(':where(en-button):where(:not([variant]))'));
 assert.ok(!secondary.includes(':where(.en-button):where(:not([data-variant]))'));
 for(const variant of ['ghost','danger']) assert.ok(!compile(variant).includes(':where(:not([variant]))'));
});
test('relationship validation composites multiple alpha layers and reports unresolved context as unknown',()=>{
 const sample={id:'field',consumer:'input',state:'rest',appearance:'light',minimum:4.5,foreground:colorFromHex('#000000'),backgrounds:[{...colorFromHex('#ffffff'),alpha:.5},colorFromHex('#ffffff')]};
 assert.equal(validateRenderedRelationships([sample])[0].ratio,21);
 assert.equal(validateRenderedRelationships([{...sample,foreground:colorFromHex('#ffffff')}])[0].status,'fail');
 assert.equal(validateRenderedRelationships([{...sample,backgrounds:[{...colorFromHex('#ffffff'),alpha:.5}]}])[0].status,'unknown');
 assert.equal(validateRenderedRelationships([{...sample,unknownReason:'Background image'}])[0].status,'unknown');
});

test('companions scope public typography to known families without opening arbitrary semantic or CSS assignment',()=>{
 const theme=resolveTheme();const recipe={schemaVersion:1,id:'scoped-type',rules:[
  {target:'button',variant:'primary',tokens:{'--en-font-ui-weight':'font.label-strong.weight'}},
  {target:'badge',tokens:{'--en-font-metadata-size-medium':'font.metadata.size-small'}},
  {target:'tab',tokens:{'--en-font-ui-weight':'font.label-strong.weight'}},
  {target:'choice',tokens:{'--en-font-label-strong-weight':'font.body.weight'}},
 ]};
 const out=createThemeCompanion(theme,recipe,{name:'example'});
 assert.match(out.css,/en-badge/);assert.match(out.css,/\.en-badge/);assert.match(out.css,/--en-font-ui-weight: 600/);assertCompanionBoundary(out.css,'example',theme.mode);assertNamedBoundary(out.css,'example',theme.mode);
 assert.match(out.css,/en-checkbox/);assert.match(out.css,/en-switch/);assert.match(out.css,/--en-font-label-strong-weight: 400/);
 for(const [target,tokens] of [['button',{'--en-space-control-block':'space.4'}],['badge',{'--en-font-ui-weight':'color.text'}],['body',{'--en-font-ui-weight':'font.body.weight'}],['badge',{'font-size':'font.ui.size'}]]) {
  assert.throws(()=>createThemeCompanion(theme,{...recipe,rules:[{target,tokens}]}),{code:'invalid-companion'});
 }
 assert.throws(()=>createThemeCompanion(theme,{...recipe,rules:[{target:'badge',variant:'primary',tokens:{}}]}),{code:'invalid-companion'});
 const field=createThemeCompanion(theme,{...recipe,rules:[{target:'field',tokens:{'--en-font-input-weight':'font.input.weight'}}]});
 for(const tag of ['en-textarea','en-search-input','en-date-input','en-multiselect']) assert.ok(field.css.includes(`:where(${tag})`));
 assert.doesNotMatch(field.css,/en-text-area/);
});

test('presentation recipes are finite, scoped and keep action intent explicit',()=>{
 const theme=resolveTheme();
 const recipe={schemaVersion:1,id:'details',rules:[{target:'segmented-control',presentation:'joined',tokens:{}},{target:'link',presentation:'dotted-underline',tokens:{}},{target:'standalone-action',presentation:'stretch',tokens:{}}]};
 const css=createThemeCompanion(theme,recipe,{name:'example'}).css;
 assert.match(css,/::part\(option-start\)/);assert.match(css,/::part\(option-selected\)/);assert.match(css,/margin-inline-start/);assert.match(css,/forced-colors/);
 assert.match(css,/data-en-action="standalone"/);assert.match(css,/text-decoration-style: solid/);assertCompanionBoundary(css,'example',theme.mode);assertNamedBoundary(css,'example',theme.mode);
 for(const rule of [{target:'button',presentation:'stretch',tokens:{}},{target:'link',presentation:'joined',tokens:{}},{target:'segmented-control',presentation:'color:red',tokens:{}}]) assert.throws(()=>createThemeCompanion(theme,{...recipe,rules:[rule]}),{code:'invalid-companion'});
});
