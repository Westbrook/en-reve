import { evidenceDirectory } from '../test-pipeline/evidence-output.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium, firefox, webkit } from '@playwright/test';
import { typographyStyles } from '@en-reve/styles/typography.js';

const output = evidenceDirectory(import.meta.url, new URL('./results/', import.meta.url));
const cssPath = new URL('../../packages/styles/dist/typography.css', import.meta.url);
const css = await readFile(cssPath, 'utf8');
const hash = value => createHash('sha256').update(value).digest('hex');
const report = { createdAt: new Date().toISOString(), scope: 'Isolated typography consumers; no docs CSS, server, screen-reader or physical-device claims.',
  artifacts: { css: fileURLToPath(cssPath), cssSha256: hash(css), cssResultSha256: hash(typographyStyles.cssText) }, results: [] };
const samples = '<h2 class="en-heading-large">Reusable typography</h2><p class="en-heading-large">Reusable typography</p>'
  + '<p class="en-body">Readable body text keeps settings and creative collaboration approachable.</p>'
  + '<p class="en-metadata">Supporting information remains readable when preferences change.</p>';
const fixture = '<!doctype html><html lang="en"><meta charset="utf-8"><title>Isolated typography</title>'
  + '<style>#light,#shadow{font:italic 900 37px/3 serif;max-inline-size:620px}#shadow{display:block;margin-block-start:24px}</style>'
  + '<p id="outside-p">Outside paragraph</p><h2 id="outside-h">Outside heading</h2>'
  + '<a id="outside-a" href="#outside-p">Outside link</a><ul id="outside-list"><li>Outside list item</li></ul>'
  + '<section id="light">' + samples + '</section><div id="shadow"></div></html>';
const metrics = async locator => locator.evaluateAll(nodes => nodes.map(node => {
  const s = getComputedStyle(node);
  return { family: s.fontFamily, size: s.fontSize, weight: s.fontWeight, style: s.fontStyle, line: s.lineHeight,
    before: s.marginBlockStart, after: s.marginBlockEnd, display: s.display, marker: s.listStyleType, decoration: s.textDecorationLine };
}));
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.1, `${actual} should equal ${expected}`);
await mkdir(output, { recursive: true });

for (const [engine, launcher] of Object.entries({ chromium, firefox, webkit })) {
  let browser;
  const result = { engine, checks: [], status: 'failed' };
  try {
    browser = await launcher.launch();
    result.browserVersion = browser.version();
    const page = await browser.newPage({ viewport: { width: 800, height: 900 } });
    await page.setContent(fixture);
    result.userAgent = await page.evaluate(() => navigator.userAgent);
    const outside = page.locator('#outside-p,#outside-h,#outside-a,#outside-list,#outside-list li');
    const outsideBefore = await metrics(outside);
    await page.addStyleTag({ content: css });
    assert.deepEqual(await metrics(outside), outsideBefore);
    assert.equal(await page.getByRole('list').count(), 1);
    assert.equal(await page.getByRole('listitem').count(), 1);
    assert.equal(await page.getByRole('link', { name: 'Outside link', exact: true }).count(), 1);
    result.checks.push('Standalone CSS leaves outside paragraph, heading, link and list metrics/semantics intact.');

    const light = page.locator('#light');
    const visual = await metrics(light.locator('h2,p'));
    assert.deepEqual(visual[0], visual[1]);
    assert.equal(await light.getByRole('heading', { level: 2, name: 'Reusable typography', exact: true }).count(), 1);
    assert.equal(await light.getByRole('heading').count(), 1);
    for (const role of visual) {
      assert.equal(role.before, '0px'); assert.equal(role.after, '0px');
      assert.equal(role.style, 'normal'); assert.notEqual(role.family, 'serif');
      assert.notEqual(role.size, '37px'); assert.notEqual(role.weight, '900'); assert.notEqual(role.line, '111px');
    }
    result.checks.push('Heading, body and metadata roles own complete typography/margins; visual size preserves native heading level.');

    await page.locator('#shadow').evaluate((host, { text, rules }) => {
      const root = host.attachShadow({ mode: 'open' });
      root.innerHTML = text + '<span id="native-rem" style="font-size:2rem">Native rem comparison</span>';
      const sheet = new CSSStyleSheet(); sheet.replaceSync(rules); root.adoptedStyleSheets = [sheet];
    }, { text: samples, rules: typographyStyles.cssText });
    const shadow = page.locator('#shadow');
    assert.deepEqual(await metrics(shadow.locator('h2,p')), visual);
    assert.equal(await shadow.getByRole('heading', { level: 2, name: 'Reusable typography', exact: true }).count(), 1);
    result.checks.push('The CSSResult adopted into a shadow root matches standalone CSS appearance and heading semantics.');

    const nativeBefore = await shadow.locator('#native-rem').evaluate(node => getComputedStyle(node).fontSize);
    await page.addStyleTag({ content: 'html{font-size:200%}' });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const lightAfter = await metrics(light.locator('h2,p'));
    const shadowAfter = await metrics(shadow.locator('h2,p'));
    const nativeAfter = await shadow.locator('#native-rem').evaluate(node => getComputedStyle(node).fontSize);
    const rootSize = await page.evaluate(() => getComputedStyle(document.documentElement).fontSize);
    lightAfter.forEach((role, index) => near(parseFloat(role.size), 2 * parseFloat(visual[index].size)));
    try {
      shadowAfter.forEach((role, index) => near(parseFloat(role.size), 2 * parseFloat(visual[index].size)));
    } catch (error) {
      // Retain the failed expectation. Classify only when a plain native rem
      // control reproduces the same WebKit failure, without library variables.
      if (engine !== 'webkit' || rootSize !== '32px' || nativeBefore !== '32px' || nativeAfter !== nativeBefore
        || !shadowAfter.every((role, index) => role.size === visual[index].size)) throw error;
      result.knownLimitations = [{ kind: 'native-shadow-rem-invalidation', failedExpectation: String(error),
        hostFont: '37px', rootSize, nativeBefore, nativeAfter, lightAfter, shadowAfter,
        scope: 'Dynamic root-font change with a fixed-font shadow host; browser zoom is not measured by this test.' }];
    }
    await page.setViewportSize({ width: 320, height: 900 });
    const preference = ':is(.en-heading-large,.en-body,.en-metadata){line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-block-end:2em!important}';
    await page.addStyleTag({ content: '#light,#shadow{inline-size:260px;max-inline-size:100%}#light ' + preference.replace('}p', '}#light p') });
    await shadow.evaluate((host, rules) => {
      const sheet = new CSSStyleSheet(); sheet.replaceSync(rules);
      host.shadowRoot.adoptedStyleSheets = [...host.shadowRoot.adoptedStyleSheets, sheet];
    }, preference);
    for (const region of [light, shadow]) {
      const layout = await region.locator('h2,p').evaluateAll(nodes => nodes.map(node => {
        const s = getComputedStyle(node), r = node.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, width: r.width, client: node.clientWidth, scroll: node.scrollWidth,
          height: node.clientHeight, scrollHeight: node.scrollHeight, font: parseFloat(s.fontSize), line: parseFloat(s.lineHeight),
          letter: parseFloat(s.letterSpacing), word: parseFloat(s.wordSpacing), after: parseFloat(s.marginBlockEnd), paragraph: node.localName === 'p' };
      }));
      layout.forEach((box, index) => {
        near(box.line / box.font, 1.5); near(box.letter / box.font, 0.12); near(box.word / box.font, 0.16);
        if (box.paragraph) near(box.after / box.font, 2);
        assert.ok(box.width <= 261 && box.scroll <= box.client + 1 && box.scrollHeight <= box.height + 1, 'Text must fit its expanded box.');
        if (index) assert.ok(box.top >= layout[index - 1].bottom - 1, 'Text blocks must not overlap.');
      });
    }
    result.checks.push(result.knownLimitations?.length
      ? 'Both surfaces honor spacing overrides at 320px without clipping or overlap; dynamic root resizing remains a recorded native WebKit limitation.'
      : 'Both surfaces honor doubled root text and explicit spacing overrides at 320px without clipping or overlap.');
    if (process.argv.includes('--screenshots')) await page.screenshot({ path: fileURLToPath(new URL(engine + '-preferences.png', output)), fullPage: true });

    if (await page.evaluate(() => CSS.supports('forced-color-adjust', 'auto'))) {
      await page.emulateMedia({ forcedColors: 'active' });
      assert.equal(await page.evaluate(() => matchMedia('(forced-colors: active)').matches), true);
      const canvasText = await page.evaluate(() => {
        const probe = document.createElement('span'); probe.style.color = 'CanvasText'; document.body.append(probe);
        const color = getComputedStyle(probe).color; probe.remove(); return color;
      });
      for (const region of [light, shadow]) {
        const colors = await region.locator('h2,p').evaluateAll(nodes => nodes.map(node => {
          const s = getComputedStyle(node); return { adjust: s.forcedColorAdjust, color: s.color };
        }));
        colors.forEach(value => { assert.equal(value.adjust, 'auto'); assert.equal(value.color, canvasText); });
      }
      result.checks.push('Forced-colors emulation retains automatic text adaptation in both surfaces.');
      if (process.argv.includes('--screenshots')) await page.screenshot({ path: fileURLToPath(new URL(engine + '-forced-colors.png', output)), fullPage: true });
    } else {
      result.unavailableChecks = ['forced-color-adjust is unsupported by this engine; forced-colors rendering assertions were not run.'];
    }
    result.status = result.knownLimitations?.length ? 'known-platform-limitation' : 'passed';
  } catch (error) {
    result.error = error instanceof Error ? error.stack : String(error);
  } finally {
    await browser?.close();
    report.results.push(result);
  }
}
await writeFile(new URL('report.json', output), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ report: fileURLToPath(new URL('report.json', output)), engines: report.results.map(({ engine, status, checks }) => ({ engine, status, checks: checks.length })) }, null, 2));
if (report.results.some(result => result.status === 'failed')) process.exitCode = 1;
