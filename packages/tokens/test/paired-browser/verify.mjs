import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

// Run from the repository after integrating/building the token draft. No build,
// checkout writes, authentication or hosted Site access occurs in this runner.
const repo = resolve(process.env.EN_PAIR_REPO ?? process.cwd());
const output = resolve(process.env.EN_PAIR_EVIDENCE ?? resolve(repo, 'node_modules/.cache/en-paired-css'));
const tokenRoot = resolve(repo, 'packages/tokens/dist');
const tokens = await import(pathToFileURL(resolve(tokenRoot, 'index.js')).href);
const {chromium, firefox, webkit} = await import(pathToFileURL(resolve(repo, 'node_modules/@playwright/test/index.mjs')).href);
const {resolveTheme, createThemePair, emitThemePairCSS, createReviewDraft, exportThemeReviewPair, colorFromHex, sha256} = tokens;
const color = hex => ({$type:'color', $value:colorFromHex(hex)});
const alias = id => ({$type:'color', $value:`{${id}}`});
const source = (dark = false) => ({pairtest:{
  leaf:color(dark ? '#ddeeff' : '#112233'),
  shared:alias('pairtest.leaf'),
  a:dark ? color('#ddeeff') : alias('pairtest.b'),
  b:dark ? alias('pairtest.a') : color('#112233'),
  surface:color(dark ? '#222222' : '#eeeeee'),
}});
const pair = createThemePair({name:'browser-pair',
  light:resolveTheme({mode:'light',source:source(),pins:{'component.button.background':colorFromHex('#abcdef'),'component.button.radius':{value:4,unit:'px'}}}),
  dark:resolveTheme({mode:'dark',source:source(true),pins:{'component.button.radius':{value:12,unit:'px'}}}),
});
const neutral = createThemePair({name:'neutral-pair',light:resolveTheme({mode:'light',source:source()}),dark:resolveTheme({mode:'dark',source:source(true)})});
const css = emitThemePairCSS(pair, {selector:'.pair'}) + emitThemePairCSS(neutral,{selector:'.neutral'})
  + emitThemePairCSS(pair,{selector:'.partial',kind:'partial',tokenIds:['component.button.radius']});
// Remove only the emitter's optional final support blocks. The fallback itself
// remains byte-for-byte generated CSS, with the same media and explicit modes.
const fallback = css.replace(/  @supports \(color: light-dark\(white, black\)\) \{\n    [\s\S]*?\n    \}\n  \}\n/g, '');
assert.equal(fallback.includes('@supports'), false);
const probeRules = '.probe{color:var(--en-pairtest-shared);background:var(--en-button-background,var(--en-pairtest-surface));border-radius:var(--en-button-radius,3px)}.a{color:var(--en-pairtest-a)}.b{color:var(--en-pairtest-b)}';
const probes = '<span class="probe">A readable native probe</span><span class="a">Alias A</span><span class="b">Alias B</span>';
const fixture = text => `<!doctype html><html lang="en"><meta charset="utf-8"><title>Paired theme platform proof</title><style>${text}</style><style>${probeRules}</style><body>
<section id="outer" class="pair">${probes}<input id="native" aria-label="Native draft" value="Accepted">
<pair-shadow id="shadow"><template shadowrootmode="open"><style>${probeRules}</style>${probes}<input aria-label="Shadow draft" value="Accepted"></template></pair-shadow>
<section id="nested" class="neutral">${probes}</section>
<section id="partial" class="partial">${probes}</section>
</section></body></html>`;
const reviewLight = createReviewDraft({mode:'light'}), reviewDark = createReviewDraft({mode:'dark'});
reviewLight.setToken('component.button.radius','{radius.pill}');
reviewDark.setToken('component.button.radius','{radius.control}');
const reviewJSON = exportThemeReviewPair({name:'cross-engine',light:reviewLight,dark:reviewDark},{title:'Browser reopen',rationale:'Validate regenerated paired bytes.'});
const server = createServer(async (req,res) => {
  try {
    const path = new URL(req.url, 'http://127.0.0.1').pathname;
    if (path === '/' || path === '/fallback') {
      res.writeHead(200, {'content-type':'text/html; charset=utf-8'}); res.end(fixture(path === '/' ? css : fallback)); return;
    }
    if (path.startsWith('/tokens/')) {
      const file = resolve(tokenRoot, decodeURIComponent(path.slice('/tokens/'.length)));
      if (!file.startsWith(tokenRoot + sep) || !file.endsWith('.js')) throw new Error('Unsupported module path');
      res.writeHead(200, {'content-type':'text/javascript; charset=utf-8'}); res.end(await readFile(file)); return;
    }
    if(path==='/favicon.ico'){res.writeHead(204);res.end();return;}
    res.writeHead(404); res.end();
  } catch(error) { res.writeHead(500); res.end('Fixture resource unavailable'); }
});
await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
await mkdir(output,{recursive:true});
const report = {createdAt:new Date().toISOString(),scope:'Installed browser CSS/DSD/native-state and paired JSON proof; no Lit hydration, physical-device or current-minus-one claim.',
  pairSourceHash:pair.sourceHash,cssSha256:sha256(css),fallbackSha256:sha256(fallback),results:[]};
const read = async (page, selector) => page.locator(selector).evaluate(node => {
  const root = node.shadowRoot ?? node;
  const probe = root.querySelector('.probe'), s = getComputedStyle(probe);
  return {color:s.color,background:s.backgroundColor,radius:s.borderTopLeftRadius,scheme:getComputedStyle(node).colorScheme,
    a:getComputedStyle(root.querySelector('.a')).color,b:getComputedStyle(root.querySelector('.b')).color};
});
const rgb = (r,g,b) => `rgb(${r}, ${g}, ${b})`;
const expected = mode => ({color:mode==='dark'?rgb(221,238,255):rgb(17,34,51),background:mode==='dark'?rgb(34,34,34):rgb(171,205,239),radius:mode==='dark'?'12px':'4px'});
const paint = async (page,selector,mode) => {
  const actual = await read(page,selector);
  for (const [key,value] of Object.entries(expected(mode))) assert.equal(actual[key],value,`${selector} ${mode} ${key}`);
  assert.equal(actual.a,actual.color,`${selector} alias A`); assert.equal(actual.b,actual.color,`${selector} alias B`);
  return actual;
};
const frames = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
try {
  for (const [engine,launcher] of Object.entries({chromium,firefox,webkit})) {
    let browser;
    const result = {engine,status:'failed',checks:[],errors:[]};
    try {
      const executablePath = process.env[`EN_PAIR_${engine.toUpperCase()}_EXECUTABLE`];
      browser = await launcher.launch(executablePath ? {executablePath} : {});
      result.browserVersion = browser.version();
      const page = await browser.newPage({viewport:{width:800,height:800},colorScheme:'light'});
      page.on('pageerror',error => result.errors.push(String(error)));
      page.on('console',message => {if (message.type()==='error') result.errors.push(message.text());});
      await page.goto(origin);
      result.userAgent = await page.evaluate(() => navigator.userAgent);
      result.lightDarkSupport = await page.evaluate(() => CSS.supports('color','light-dark(white, black)'));
      // Both enhanced and unsupported engines must satisfy the same contract.
      await paint(page,'#outer','light'); await paint(page,'#shadow','light');
      await page.emulateMedia({colorScheme:'dark'}); await paint(page,'#outer','dark'); await paint(page,'#shadow','dark');
      await page.locator('#outer').evaluate(node => node.setAttribute('data-en-appearance','light'));
      await paint(page,'#outer','light');
      await page.emulateMedia({colorScheme:'light'});
      await page.locator('#outer').evaluate(node => node.setAttribute('data-en-appearance','dark'));
      await paint(page,'#outer','dark');
      result.checks.push('Auto responds to preference, explicit light/dark wins, and generated values inherit into the original DSD shadow tree.');

      await page.locator('#shadow input').fill('Native query draft');
      await page.locator('#shadow input').evaluate(input => { input.setSelectionRange(2,7); window.originalShadowInput=input; window.originalShadow=input.getRootNode(); });
      await page.locator('#outer').evaluate(node => node.setAttribute('data-en-appearance','light'));
      await frames(page);
      assert.deepEqual(await page.locator('#shadow input').evaluate(input => ({same:input===window.originalShadowInput,root:input.getRootNode()===window.originalShadow,focused:input.getRootNode().activeElement===input,value:input.value,start:input.selectionStart,end:input.selectionEnd})),
        {same:true,root:true,focused:true,value:'Native query draft',start:2,end:7});
      result.checks.push('Mode change preserves native shadow input/root identity, focus, text and selection without DOM replacement.');

      await page.locator('#outer').evaluate(node => {node.setAttribute('data-en-appearance','dark');node.style.setProperty('--en-button-background','rgb(19, 20, 21)');});
      const nested = await read(page,'#nested');
      assert.equal(nested.color,rgb(17,34,51)); assert.equal(nested.background,rgb(238,238,238)); assert.equal(nested.radius,'3px');
      assert.equal(nested.scheme,'light dark');
      const partial = await read(page,'#partial');
      assert.equal(partial.radius,'4px'); // Independent auto partial appearance.
      // Unselected hooks keep normal inheritance; the partial boundary has not
      // emitted an initial mask for this independent ancestor pin.
      assert.equal(partial.background,rgb(19,20,21));
      await page.locator('#nested').evaluate(node => node.setAttribute('data-en-appearance','dark'));
      assert.equal((await read(page,'#nested')).color,rgb(221,238,255));
      await page.locator('#outer').evaluate(node => node.style.removeProperty('--en-button-background'));
      result.checks.push('A nested full boundary follows its own auto preference, masks inherited optional hooks, and a partial boundary emits only its selected property.');

      for (const mode of ['light','dark']) {
        await page.locator('#outer').evaluate((node,mode) => node.setAttribute('data-en-appearance',mode),mode);
        await paint(page,'#outer',mode);
        await page.locator('#outer').evaluate(node => node.style.setProperty('--en-pairtest-leaf','rgb(4, 5, 6)'));
        assert.equal((await read(page,'#outer')).color,rgb(4,5,6));
        await page.locator('#outer').evaluate(node => node.style.removeProperty('--en-pairtest-leaf'));
      }
      result.checks.push('Opposite branch alias graphs resolve without a CSS cycle; same-boundary public primitive overrides still feed the shared alias.');

      await page.goto(origin+'/fallback');
      for (const mode of ['light','dark']) {
        await page.emulateMedia({colorScheme:mode}); await paint(page,'#outer',mode);
        await page.locator('#outer').evaluate((node,mode) => node.setAttribute('data-en-appearance',mode),mode==='dark'?'light':'dark');
        await paint(page,'#outer',mode==='dark'?'light':'dark');
        await page.locator('#outer').evaluate(node => node.removeAttribute('data-en-appearance'));
      }
      result.checks.push('The generated fallback without its optional support blocks preserves both explicit/auto modes and one-branch pin masks.');

      const reopened = await page.evaluate(async json => {
        const {reopenThemeReviewPair,exportThemeReviewPair}=await import('/tokens/index.js');
        const pair=reopenThemeReviewPair(json);
        return {json:exportThemeReviewPair(pair,{title:pair.title,rationale:pair.rationale}),hash:pair.theme.sourceHash,light:pair.light.canUndo,dark:pair.dark.canUndo};
      },reviewJSON);
      assert.equal(reopened.json,reviewJSON); assert.equal(reopened.hash,JSON.parse(reviewJSON).pairSourceHash);
      assert.equal(reopened.light,true); assert.equal(reopened.dark,true);
      result.checks.push('Node-authored paired JSON reopens and regenerates identical paired artifacts in this engine with both editable branch histories.');
      assert.deepEqual(result.errors,[]);
      result.status='passed';
    } catch(error) {result.error=error?.stack ?? String(error);}
    finally {await browser?.close(); report.results.push(result); await writeFile(resolve(output,'report.json'),JSON.stringify(report,null,2)+'\n');}
  }
} finally {await new Promise(resolve => server.close(resolve));}
console.log(JSON.stringify({report:resolve(output,'report.json'),results:report.results.map(({engine,status,checks,error})=>({engine,status,checks:checks.length,error}))},null,2));
if(report.results.some(result=>result.status!=='passed')) process.exitCode=1;
