import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { chromium, firefox, webkit } from 'playwright';
import {
  createPropertyRegistrationPlan, createThemePair, emitPropertyRegistrations,
  emitThemeCSS, emitThemePairCSS, resolveTheme,
} from '../../dist/index.js';
import { runSemanticProbe } from './semantics.mjs';

// This probe needs only the built token package and installed Playwright engines.
// It never starts a server or imports the docs/elements runtime.
const outputDirectory = process.env.PROPERTY_TEST_OUTPUT_DIR
  ? resolve(process.env.PROPERTY_TEST_OUTPUT_DIR)
  : await mkdtemp(resolve(tmpdir(), 'en-reve-property-browser-'));
await mkdir(outputDirectory, { recursive:true });
const theme = resolveTheme();
const pair = createThemePair({ name:'default', light:theme, dark:resolveTheme({mode:'dark'}) });
const registryCSS = await readFile(new URL('../../dist/properties.css', import.meta.url), 'utf8');
const defaultCSS = await readFile(new URL('../../dist/default.css', import.meta.url), 'utf8');
const compatiblePlan = createPropertyRegistrationPlan(theme);
assert.equal(registryCSS, emitPropertyRegistrations(theme), 'Built properties.css must match the default emitter.');

const profiles = [
  { name:'compatible', options:{} },
  { name:'typed', options:{mode:'typed'} },
  { name:'explicit', options:{ names:[], definitions:{
    '--probe-anything':{syntax:'*',inherits:true},
    '--probe-anything-initial':{syntax:'*',inherits:false,initialValue:'12px'},
    '--probe-color':{syntax:'<color>',inherits:true,initialValue:'oklch(60% 0.1 240)'},
    '--probe-number':{syntax:'<number>',inherits:true,initialValue:'1.25'},
    '--probe-integer':{syntax:'<integer>',inherits:false,initialValue:'2'},
    '--probe-length':{syntax:'<length>',inherits:true,initialValue:'3px'},
    '--probe-length-percentage':{syntax:'<length-percentage>',inherits:true,initialValue:'20%'},
    '--probe-percentage':{syntax:'<percentage>',inherits:true,initialValue:'25%'},
    '--probe-angle':{syntax:'<angle>',inherits:true,initialValue:'30deg'},
    '--probe-time':{syntax:'<time>',inherits:true,initialValue:'120ms'},
  }}},
];

async function readPropertyRules(page, css) {
  await page.setContent(`<!doctype html><style>${css}</style>`);
  return page.evaluate(() => {
    const collect = rules => [...rules].flatMap(rule => rule instanceof CSSPropertyRule
      ? [{name:rule.name,syntax:rule.syntax,inherits:rule.inherits,initialValue:rule.initialValue ?? null}]
      : rule.cssRules ? collect(rule.cssRules) : []);
    return [...document.styleSheets].flatMap(sheet => collect(sheet.cssRules));
  });
}

async function checkRegistrations(browser) {
  const results = {};
  for (const {name, options} of profiles) {
    const plan = createPropertyRegistrationPlan(theme, options);
    const page = await browser.newPage();
    const rules = await readPropertyRules(page, emitPropertyRegistrations(theme, options));
    await page.close();
    assert.equal(rules.length, plan.registrations.length, `${name}: browser must parse every emitted rule exactly once.`);
    assert.equal(new Set(rules.map(rule=>rule.name)).size, rules.length, `${name}: duplicate property rule.`);
    assert.deepEqual(rules.map(({name,syntax,inherits})=>({name,syntax,inherits})),
      plan.registrations.map(({name,syntax,inherits})=>({name,syntax,inherits})), `${name}: parsed rule descriptors differ.`);
    for (let index=0; index<rules.length; index++) {
      assert.equal(rules[index].initialValue === null, plan.registrations[index].initialValue === undefined,
        `${name}: omitted initial-value must remain absent for ${rules[index].name}.`);
    }
    // Fresh document for each profile: CSS.registerProperty cannot be unregistered
    // and a duplicate registration throws, even if its definition is unchanged.
    const validationPage = await browser.newPage();
    const validation = await validationPage.evaluate(registrations => {
      const accepted = [], errors = [];
      for (const {name,syntax,inherits,initialValue} of registrations) {
        try {
          CSS.registerProperty({name,syntax,inherits,...(initialValue === undefined ? {} : {initialValue})});
          accepted.push(name);
        } catch (error) { errors.push({name,error:`${error.name}: ${error.message}`}); }
      }
      return {accepted,errors};
    }, plan.registrations);
    await validationPage.close();
    assert.deepEqual(validation.errors, [], `${name}: all emitted definitions must pass native CSS.registerProperty validation.`);
    assert.deepEqual(validation.accepted, plan.registrations.map(registration=>registration.name));
    results[name] = { count:rules.length, typedCount:rules.filter(rule=>rule.syntax !== '*').length, rules, validation };
  }
  const builtPage = await browser.newPage();
  const registryRules = await readPropertyRules(builtPage, registryCSS);
  const bundledRules = await readPropertyRules(builtPage, defaultCSS);
  await builtPage.close();
  assert.deepEqual(bundledRules, registryRules, 'default.css must contain exactly the standalone compatible registry.');
  assert.equal(registryRules.length, compatiblePlan.registrations.length);
  results.builtArtifacts = { standaloneCount:registryRules.length, bundledCount:bundledRules.length };
  return results;
}

const nativeConsumerCSS = `
  html { font-size:16px; }
  body { margin:0; width:800px; }
  button, input { box-sizing:border-box; display:block; width:240px; }
  button {
    background:var(--en-button-background,var(--en-color-action));
    color:var(--en-button-color,var(--en-color-on-action));
    border:var(--en-border-width) solid var(--en-color-action);
    border-radius:var(--en-button-radius,var(--en-radius-control));
    font-family:var(--en-font-ui-family); font-size:var(--en-font-ui-size);
    line-height:var(--en-font-ui-line-height);
    padding:var(--en-space-control-block) var(--en-button-inline-padding,var(--en-space-control-inline));
    min-height:var(--en-control-min-size,var(--en-size-control-min));
  }
  input {
    background:var(--en-control-background,var(--en-input-background,var(--en-color-surface)));
    color:var(--en-control-color,var(--en-input-color,var(--en-color-text)));
    border:var(--en-border-width) solid var(--en-color-boundary);
    border-radius:var(--en-radius-control);
    font-family:var(--en-font-input-family); font-size:var(--en-font-input-size);
    line-height:var(--en-font-input-line-height);
    padding:var(--en-space-control-block) var(--en-input-inline-padding,var(--en-space-control-inline));
    min-height:var(--en-control-min-size,var(--en-size-control-min));
  }
  #outer { --en-button-background:rgb(17,34,51); --en-input-background:rgb(34,51,68); --en-control-min-size:64px; }
  #local-size button { --_en-sized-font:var(--en-font-ui-size-large); font-size:var(--_en-sized-font,var(--en-font-ui-size)); }
`;
const controls = prefix => `<button id="${prefix}-button">Action</button><input id="${prefix}-input" value="Text">`;
const roomy = resolveTheme({ name:'property-probe-roomy', density:'spacious' });
const boundariesCSS = emitThemeCSS(roomy,{selector:'#full',colorScheme:true})
  + emitThemeCSS(roomy,{selector:'#partial',kind:'partial',tokenIds:['space.control-inline']});
const consumersHTML = `${controls('root')}<div id="outer">${controls('inherited')}
  <section id="full">${controls('full')}</section><section id="partial">${controls('partial')}</section>
  <div id="shadow-host"></div></div><section id="local-size">${controls('local')}</section>`;

async function checkThemeConsumers(browser) {
  const result = {};
  const unregisteredCSS = emitThemePairCSS(pair,{scope:'root'});
  for (const colorScheme of ['light','dark']) {
    result[colorScheme] = {};
    for (const [profile, css] of Object.entries({
      unregistered:unregisteredCSS,
      compatible:registryCSS + unregisteredCSS,
      bundled:defaultCSS,
    })) {
      const page = await browser.newPage({colorScheme});
      await page.setContent(`<!doctype html><style>${css}${boundariesCSS}${nativeConsumerCSS}</style>${consumersHTML}`);
      await page.evaluate(({css,html}) => {
        document.getElementById('shadow-host').attachShadow({mode:'open'}).innerHTML = `<style>${css}</style>${html}`;
      }, {css:nativeConsumerCSS,html:controls('shadow')});
      const snapshots = {};
      for (const fontSize of [16,20]) {
        await page.evaluate(size => {document.documentElement.style.fontSize=`${size}px`;},fontSize);
        snapshots[fontSize] = await page.evaluate(() => {
          const snapshot = node => {
            const style = getComputedStyle(node);
            return Object.fromEntries(['backgroundColor','color','borderTopWidth','borderRadius','fontSize','lineHeight','minHeight','paddingTop','paddingLeft','width','height'].map(key=>[key,style[key]]));
          };
          const nodes = [...document.querySelectorAll('button,input'),...document.getElementById('shadow-host').shadowRoot.querySelectorAll('button,input')];
          return Object.fromEntries(nodes.map(node=>[node.id,snapshot(node)]));
        });
      }
      await page.close();
      result[colorScheme][profile] = snapshots;
    }
    assert.deepEqual(result[colorScheme].compatible,result[colorScheme].unregistered, `${colorScheme}: compatible registrations changed theme consumers.`);
    assert.deepEqual(result[colorScheme].bundled,result[colorScheme].unregistered, `${colorScheme}: bundled default.css changed theme consumers.`);
    const baseline = result[colorScheme].unregistered;
    assert.equal(baseline[16]['partial-button'].backgroundColor,'rgb(17, 34, 51)','Partial themes must inherit optional paint overrides.');
    assert.notEqual(baseline[16]['full-button'].backgroundColor,'rgb(17, 34, 51)','Full themes must reset optional paint overrides.');
    assert.equal(baseline[16]['partial-button'].minHeight,'64px');
    assert.notEqual(baseline[16]['full-button'].minHeight,'64px');
    assert.equal(baseline[16]['shadow-button'].backgroundColor,'rgb(17, 34, 51)');
    assert.notEqual(baseline[16]['root-button'].fontSize,baseline[20]['root-button'].fontSize,'Root font-size changes must affect relative tokens.');
    assert.ok(parseFloat(baseline[16]['local-button'].fontSize) > parseFloat(baseline[16]['root-button'].fontSize),'A local large-size role must remain effective.');
  }
  return result;
}

const report = { date:new Date().toISOString(), profiles:profiles.map(({name,options})=>({name,options})), engines:{} };
for (const [engineName,engine] of Object.entries({chromium,firefox,webkit})) {
  let browser;
  const result = report.engines[engineName] = {};
  try {
    browser = await engine.launch({headless:true});
    result.version = browser.version();
    result.registrations = await checkRegistrations(browser);
    result.themeConsumers = await checkThemeConsumers(browser);
    result.semantics = await runSemanticProbe(browser);
    result.status = 'passed';
    console.log(`${engineName} ${result.version}: passed (${result.registrations.compatible.count} public registrations, ${result.registrations.typed.typedCount} typed registrations)`);
  } catch (error) {
    result.status = 'failed';
    result.error = error.stack ?? String(error);
    process.exitCode = 1;
    console.error(`${engineName}: ${result.error}`);
  } finally { await browser?.close(); }
  await writeFile(resolve(outputDirectory,'results.json'),JSON.stringify(report,null,2)+'\n');
}
console.log(`Property browser evidence: ${resolve(outputDirectory,'results.json')}`);
