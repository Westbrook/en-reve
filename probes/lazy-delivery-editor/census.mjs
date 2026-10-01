import {chromium, firefox, webkit, expect} from '@playwright/test';
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {exclusiveBrowserWork} from '../../showcases/performance/src/lock.mjs';
import {startDocsServer} from '../../apps/docs/tests/static-server.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const distribution = resolve(process.env.EN_EDITOR_CENSUS_SITE ?? resolve(root, 'dist'));
const output = process.env.EN_EDITOR_CENSUS_OUTPUT;
if (!output) throw new Error('Set EN_EDITOR_CENSUS_OUTPUT to a fresh output directory.');
const out = resolve(output);
await mkdir(out, {recursive: false});
const hash = async path => createHash('sha256').update(await readFile(path)).digest('hex');
const files = ['packages/elements/src/editor-toolbar.ts', 'apps/docs/src/rich-text-demo.ts'];
const identity = async () => ({source: Object.fromEntries(await Promise.all(files.map(async path => [path, await hash(resolve(root, path))]))), page: await hash(resolve(distribution, 'api-examples/rich-text.html'))});
const manifest = {
  schemaVersion: 1,
  source: execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim(),
  startedAt: new Date().toISOString(),
  node: process.version,
  distribution,
  route: '/api-examples/rich-text.html',
  requestedRegistry: 'existing production route; no registry override',
  sourceAndBuildBefore: await identity(),
  limits: 'Deterministic DOM census and desktop-engine pointer checks only. No timing, retention, physical touch, native picker, IME or assistive-technology acceptance.',
  cases: [],
};
const fail = error => ({message: String(error), stack: error.stack});
await writeFile(resolve(out, 'started.json'), JSON.stringify(manifest, null, 2) + '\n');

try {
  await exclusiveBrowserWork(async () => {
    const server = await startDocsServer({distribution, port: 0});
    manifest.origin = server.url;
    try {
      for (const [engine, type] of Object.entries({chromium, firefox, webkit})) {
        const browser = await type.launch();
        try {
          for (const viewport of [{width: 1280, height: 900}, {width: 390, height: 844}]) {
            const context = await browser.newContext({viewport, reducedMotion: 'reduce', serviceWorkers: 'block'});
            const page = await context.newPage();
            const row = {engine, version: browser.version(), viewport, pageErrors: [], requests: [], actions: []};
            manifest.cases.push(row);
            page.on('pageerror', error => row.pageErrors.push(String(error)));
            page.on('request', request => row.requests.push(new URL(request.url()).pathname));
            const action = async (name, run) => {
              const record = {name}; row.actions.push(record);
              try { await run(); record.status = 'pass'; }
              catch (error) {
                record.status = 'fail'; record.error = fail(error);
                record.screenshot = `${engine}-${viewport.width}-${row.actions.length}-failure.png`;
                await page.screenshot({path: resolve(out, record.screenshot), fullPage: true}).catch(screenshotError => {record.screenshotError = String(screenshotError);});
              }
            };
            try {
              await page.goto(server.url + manifest.route);
              const editor = page.locator('#rich-brief');
              const textbox = editor.getByRole('textbox');
              const contextual = page.locator('#selection-toolbar');
              const persistent = page.locator('#brief-toolbar');
              await expect(textbox).toHaveAttribute('contenteditable', 'true');
              await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
              await page.waitForFunction(() => document.documentElement.hasAttribute('data-example-standalone'));
              await page.evaluate(async () => {
                const roots = [document];
                const complete = [];
                while (roots.length) {
                  for (const element of roots.pop().querySelectorAll('*')) {
                    if (element.updateComplete) complete.push(element.updateComplete);
                    if (element.shadowRoot) roots.push(element.shadowRoot);
                  }
                }
                await Promise.all(complete);
                await new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)));
              });
              row.initial = await page.evaluate(() => {
                const census = root => {
                  const result = {nodes: 0, elements: 0, texts: 0, comments: 0, shadowRoots: 0};
                  const visit = node => {
                    result.nodes++;
                    if (node.nodeType === 1) result.elements++;
                    if (node.nodeType === 3) result.texts++;
                    if (node.nodeType === 8) result.comments++;
                    for (const child of node.childNodes) visit(child);
                    if (node.shadowRoot) { result.shadowRoots++; visit(node.shadowRoot); }
                  };
                  visit(root); return result;
                };
                const toolbar = document.querySelector('#selection-toolbar');
                const base = toolbar.shadowRoot.querySelector('.base');
                const generated = toolbar.shadowRoot.querySelector('en-toolbar');
                const whole = census(document);
                const toolbarCount = census(toolbar);
                const generatedCount = census(generated);
                return {
                  document: whole, toolbar: toolbarCount, generated: generatedCount,
                  routeMaximumSavingPercent: toolbarCount.nodes / whole.nodes * 100,
                  generatedSavingPercent: generatedCount.nodes / whole.nodes * 100,
                  toolbarGeneratedSavingPercent: generatedCount.nodes / toolbarCount.nodes * 100,
                  contextualVisible: base.matches(':popover-open'),
                  generatedPresent: !!generated,
                  contentRendering: toolbar.contentRendering ?? 'not implemented',
                  owningRegistry: toolbar.shadowRoot.customElementRegistry === window.customElements ? 'global' : toolbar.shadowRoot.customElementRegistry ? 'scoped' : 'not exposed by engine',
                };
              });
              await action('initial persistent Bold receives normal pointer hit test', async () => {
                await persistent.getByRole('button', {name: 'Bold', exact: true}).click({trial: true, timeout: 5000});
              });
              const select = async backwards => {
                await editor.evaluate(element => {element.value = 'Alpha beta'; element.focus();});
                await textbox.scrollIntoViewIfNeeded();
                await textbox.evaluate((element, backwards) => {
                  const node = element.querySelector('p').firstChild;
                  const length = node.textContent.length;
                  document.getSelection().setBaseAndExtent(node, backwards ? length : 0, node, backwards ? 0 : length);
                }, backwards);
                await expect(editor).toHaveJSProperty('hasSelection', true);
                await expect(contextual.locator('.base')).toBeVisible();
                await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
              };
              row.selectionGeometry = [];
              for (const backwards of [false, true]) {
                await action(`${backwards ? 'backward' : 'forward'} selection opens contextual Bold`, async () => {
                  await select(backwards);
                  row.selectionGeometry.push(await page.evaluate(() => {
                    const toolbar = document.querySelector('#selection-toolbar').shadowRoot.querySelector('.base');
                    const persistent = document.querySelector('#brief-toolbar');
                    const target = persistent.shadowRoot.querySelector('en-button');
                    const button = target.shadowRoot.querySelector('button');
                    const rect = button.getBoundingClientRect();
                    const top = toolbar.getBoundingClientRect();
                    return {
                      contextual: top.toJSON(), persistent: persistent.getBoundingClientRect().toJSON(),
                      target: rect.toJSON(), placement: toolbar.dataset.placement,
                      intersectsPersistent: top.left < rect.right && top.right > rect.left && top.top < rect.bottom && top.bottom > rect.top,
                      hitStack: document.elementsFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2).map(element => ({tag: element.localName, id: element.id})),
                    };
                  }));
                  await contextual.getByRole('button', {name: 'Bold', exact: true}).click({timeout: 5000});
                  await expect(editor.locator('strong')).toHaveText('Alpha beta');
                  await editor.evaluate(element => element.undo());
                  await expect(editor.locator('strong')).toHaveCount(0);
                });
              }
              await action('persistent Bold reachable while contextual controls are visible', async () => {
                await select(false);
                await persistent.getByRole('button', {name: 'Bold', exact: true}).click({timeout: 5000});
                await expect(editor.locator('strong')).toHaveText('Alpha beta');
              });
              await action('Escape dismisses contextual controls before persistent formatting', async () => {
                await select(false);
                await contextual.getByRole('button', {name: 'Bold', exact: true}).focus();
                await page.keyboard.press('Escape');
                await expect(contextual.locator('.base')).not.toBeVisible();
                await expect(textbox).toBeFocused();
                await persistent.getByRole('button', {name: 'Bold', exact: true}).click({timeout: 5000});
                await expect(editor.locator('strong')).toHaveText('Alpha beta');
              });
              await action('contextual link draft dismisses outside and commits only current selection', async () => {
                await select(false);
                await contextual.getByRole('button', {name: 'Link', exact: true}).click({timeout: 5000});
                await contextual.getByRole('textbox', {name: 'Link URL'}).fill('https://example.com/canceled');
                await page.getByRole('heading', {name: 'Project brief', exact: true}).click({timeout: 5000});
                await expect(contextual.locator('.base')).not.toBeVisible();
                await expect(editor.locator('a')).toHaveCount(0);
                await select(true);
                await contextual.getByRole('button', {name: 'Link', exact: true}).click({timeout: 5000});
                await contextual.getByRole('textbox', {name: 'Link URL'}).fill('https://example.com/accepted');
                await contextual.getByRole('button', {name: 'Apply link', exact: true}).click({timeout: 5000});
                await expect(editor.locator('a')).toHaveAttribute('href', 'https://example.com/accepted');
              });
              await page.screenshot({path: resolve(out, `${engine}-${viewport.width}.png`), fullPage: true});
            } catch (error) { row.error = fail(error); }
            finally { await context.close(); }
          }
        } finally { await browser.close(); }
      }
    } finally { await server.close(); }
  });
} catch (error) { manifest.error = fail(error); }
finally {
  manifest.finishedAt = new Date().toISOString();
  manifest.sourceAndBuildAfter = await identity();
  manifest.sourceAndBuildUnchanged = JSON.stringify(manifest.sourceAndBuildBefore) === JSON.stringify(manifest.sourceAndBuildAfter);
  manifest.deterministicRouteGate = manifest.cases.length === 6 && manifest.cases.every(row => row.initial)
    ? (manifest.cases.every(row => row.initial.routeMaximumSavingPercent < 5) ? 'rejected: even deleting the entire contextual toolbar cannot meet 5% whole-route gate' : 'requires candidate census')
    : 'incomplete';
  manifest.failedActions = manifest.cases.flatMap(row => row.actions.filter(action => action.status === 'fail').map(action => ({engine: row.engine, viewport: row.viewport, name: action.name})));
  await writeFile(resolve(out, 'census.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(JSON.stringify({output: out, cases: manifest.cases.length, gate: manifest.deterministicRouteGate, failedActions: manifest.failedActions, error: manifest.error}, null, 2));
  if (manifest.error || !manifest.sourceAndBuildUnchanged || manifest.cases.some(row => row.error || row.pageErrors.length) || manifest.failedActions.length) process.exitCode = 1;
}
