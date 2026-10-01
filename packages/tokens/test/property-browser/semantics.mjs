import assert from 'node:assert/strict';

const names = { base: ['<length>', '5px'], override: ['<length>', '3px'], relative: ['<length>', '0px'], rem: ['<length>', '0px'], color: ['<color>', 'black'], animated: ['<number>', '0'], 'animated-time':['<time>','0s'] };
const registrations = mode => mode === 'unregistered' ? '' : Object.entries(names).map(([name,[syntax,initial]]) => `@property --${name} { syntax: "${mode === 'wildcard' ? '*' : syntax}"; inherits: true; ${mode === 'wildcard' ? '' : `initial-value: ${initial};`} }`).join('\n');
const fixture = mode => `<!doctype html><style>
${registrations(mode)}
html { font-size: 16px; }
body { width: 600px; margin: 0; }
.measured { height: 10px; width: var(--override, var(--base, 43px)); }
#outer { --base:20px; --override:60px; }
#full { --base:30px; --override:initial; }
#partial { --base:30px; }
#invalid { --override:not-a-length; }
#missing-var { --override:var(--missing); }
#empty { --override: ; }
#relative-outer { font-size:10px; --relative:2em; --rem:2rem; }
#relative-child { font-size:30px; width:var(--relative); height:var(--rem); }
#color-outer { color-scheme:light; --color:light-dark(rgb(255, 0, 0), rgb(0, 0, 255)); }
#color-child { color-scheme:dark; color:var(--color); }
#currentcolor-outer { color:red; --color:currentColor; }
#currentcolor-child { color:blue; background-color:var(--color); }
#shadow-host { --override:73px; }
#animate { width:calc(var(--animated) * 1px); animation:probe 1s linear both paused; }
#taint { --animated-time:3s; animation:dummy var(--animated-time) paused; }
@keyframes probe { from { --animated:0; } to { --animated:100; } }
@keyframes unused-taint { from { --animated-time:1s; } to { --animated-time:2s; } }
@keyframes dummy { from { opacity:0.2; } to { opacity:0.4; } }
</style>
<div id="absent" class="measured"></div>
<div id="outer"><div id="inherit" class="measured"></div><div id="full" class="measured"></div><div id="partial" class="measured"></div><div id="invalid" class="measured"></div><div id="missing-var" class="measured"></div><div id="empty" class="measured"></div></div>
<div id="relative-outer"><div id="relative-child"></div></div>
<div id="color-outer"><div id="color-child">color</div></div>
<div id="currentcolor-outer"><div id="currentcolor-child">color</div></div>
<div id="shadow-host"></div><div id="animate"></div><div id="taint"></div>`;

export async function runSemanticProbe(browser) {
  const result = {};
  for (const mode of ['unregistered', 'wildcard', 'typed']) {
    const page = await browser.newPage();
    await page.setContent(fixture(mode));
    result[mode] = await page.evaluate(async () => {
      const measure = id => { const style = getComputedStyle(document.getElementById(id)); return { width:style.width, override:style.getPropertyValue('--override'), base:style.getPropertyValue('--base') }; };
      const host = document.getElementById('shadow-host');
      host.attachShadow({ mode:'open' }).innerHTML = '<style>div { width:var(--override,var(--base,43px)); height:10px }</style><div id="shadow-child"></div>';
      const relative = getComputedStyle(document.getElementById('relative-child'));
      const childColor = getComputedStyle(document.getElementById('color-child'));
      const animation = document.getElementById('animate').getAnimations()[0];
      animation.currentTime = 250;
      const quarter = getComputedStyle(document.getElementById('animate')).width;
      animation.currentTime = 750;
      const threeQuarter = getComputedStyle(document.getElementById('animate')).width;
      return {
        cssPropertyRule: 'CSSPropertyRule' in window,
        cases: Object.fromEntries(['absent','inherit','full','partial','invalid','missing-var','empty'].map(id=>[id,measure(id)])),
        relative: { width:relative.width, height:relative.height, raw:relative.getPropertyValue('--relative'), rawRem:relative.getPropertyValue('--rem') },
        nestedColorScheme: { color: childColor.color, raw: childColor.getPropertyValue('--color') },
        currentColor: { background:getComputedStyle(document.getElementById('currentcolor-child')).backgroundColor, raw:getComputedStyle(document.getElementById('currentcolor-child')).getPropertyValue('--color') },
        taintedAnimationDuration: getComputedStyle(document.getElementById('taint')).animationDuration,
        shadowWidth: getComputedStyle(host.shadowRoot.getElementById('shadow-child')).width,
        animation: { quarter, threeQuarter },
      };
    });
    await page.close();
  }
  const page = await browser.newPage();
  await page.setContent(`<!doctype html><style>
    @property --no-inherit { syntax:"*"; inherits:false; }
    @property --bad-rem-initial { syntax:"<length>"; inherits:true; initial-value:1rem; }
    @property --bad-missing-initial { syntax:"<length>"; inherits:true; }
    #outer { --no-inherit:80px; }
    #child { width:var(--no-inherit,43px); }
    #bad-rem { width:var(--bad-rem-initial,43px); }
    #bad-missing { width:var(--bad-missing-initial,43px); }
    #host { --shadow-wild:73px; --shadow-typed:71px; }
  </style><div id="outer"><div id="child"></div></div><div id="bad-rem"></div><div id="bad-missing"></div><div id="host"></div><div id="outside-shadow"></div>`);
  result.extra = await page.evaluate(() => {
    const width = id => getComputedStyle(document.getElementById(id)).width;
    const host = document.getElementById('host');
    host.attachShadow({mode:'open'}).innerHTML = `<style>
      @property --shadow-wild { syntax:"*"; inherits:false; }
      @property --shadow-typed { syntax:"<length>"; inherits:false; initial-value:9px; }
      #wild { width:var(--shadow-wild,43px); }
      #typed { width:var(--shadow-typed,43px); }
    </style><div id="wild"></div><div id="typed"></div>`;
    const validations = {};
    for (const [name, syntax, initial] of [['rem','<length>','1rem'],['em','<length>','1em'],['px','<length>','1px'],['missing','<length>',undefined],['wild','*',undefined],['current','<color>','currentColor'],['light-dark','<color>','light-dark(white, black)'],['system','<color>','Canvas']]) {
      try { CSS.registerProperty({name:`--validate-${name}`,syntax,inherits:true,...(initial === undefined ? {} : {initialValue:initial})}); validations[name] = 'accepted'; }
      catch (error) { validations[name] = `${error.name}: ${error.message}`; }
    }
    return { noInheritWidth:width('child'), invalidRemInitialWidth:width('bad-rem'), missingInitialWidth:width('bad-missing'), jsValidation: validations,
      registrationInsideShadow: { wildcard:getComputedStyle(host.shadowRoot.getElementById('wild')).width, typed:getComputedStyle(host.shadowRoot.getElementById('typed')).width },
    };
  });
  await page.close();
  assert.deepEqual(result.wildcard.cases, result.unregistered.cases, `semantic probe: wildcard fallback semantics differ`);
  assert.deepEqual(result.wildcard.relative, result.unregistered.relative, `semantic probe: wildcard relative units differ`);
  assert.deepEqual(result.wildcard.nestedColorScheme, result.unregistered.nestedColorScheme, `semantic probe: wildcard colors differ`);
  assert.equal(result.typed.cases.full.width, '3px');
  assert.equal(result.wildcard.cases.full.width, '30px');
  assert.equal(result.wildcard.cases.absent.width, '43px');
  assert.equal(result.typed.cases.absent.width, '3px');
  assert.equal(result.wildcard.cases['missing-var'].width, '20px');
  assert.equal(result.typed.cases['missing-var'].width, '60px');
  assert.equal(result.typed.cases.invalid.width, '60px');
  assert.equal(result.wildcard.relative.width, '60px');
  assert.equal(result.typed.relative.width, '20px');
  assert.equal(result.wildcard.nestedColorScheme.color, 'rgb(0, 0, 255)');
  assert.equal(result.typed.nestedColorScheme.color, 'rgb(255, 0, 0)');
  assert.equal(result.typed.currentColor.background, 'rgb(0, 0, 255)');
  assert.deepEqual(result.wildcard.animation, {quarter:'0px',threeQuarter:'100px'});
  assert.deepEqual(result.typed.animation, {quarter:'25px',threeQuarter:'75px'});
  assert.equal(result.wildcard.shadowWidth, '73px');
  assert.equal(result.extra.noInheritWidth,'43px');
  assert.equal(result.extra.invalidRemInitialWidth,'43px');
  assert.equal(result.extra.missingInitialWidth,'43px');
  for (const name of ['rem','em','missing']) assert.match(result.extra.jsValidation[name],/^SyntaxError:/);
  assert.equal(result.extra.jsValidation.px,'accepted');
  assert.equal(result.extra.jsValidation.wild,'accepted');
  return result;
}
