import {singlePackOutput} from '../test-pipeline/npm-pack.mjs';
import { chromium, firefox, webkit, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as fs from 'node:fs/promises';

const repository = fileURLToPath(new URL('../../', import.meta.url));
const output = resolve(process.env.EN_REVE_REGISTRATION_EVIDENCE_DIR ?? fileURLToPath(new URL('./results/', import.meta.url)));
const temporary = await fs.mkdtemp(join(tmpdir(), 'en-registration-consumer-'));
const publicRoot = join(temporary, 'public');
const tarballs = join(temporary, 'tarballs');
const imports = {};
const packages = [];
const results = [];
const digest = value => createHash('sha256').update(value).digest('hex');
let server;

async function filesBelow(directory, prefix = '') {
  const files = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    const name = prefix + entry.name;
    if (entry.isDirectory()) files.push(...await filesBelow(path, `${name}/`));
    else if (entry.isFile()) files.push(`./${name}`);
  }
  return files;
}

// Resolve the package's published browser/default exports, including wildcard
// exports, into exact import-map entries. Do not alias source directories.
function browserTarget(value) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(browserTarget).find(Boolean);
  if (!value || typeof value !== 'object') return undefined;
  for (const condition of ['browser', 'import', 'default']) {
    const target = browserTarget(value[condition]);
    if (target) return target;
  }
  return undefined;
}

async function addPackage(directory, urlRoot, archive) {
  const manifest = JSON.parse(await fs.readFile(join(directory, 'package.json'), 'utf8'));
  const entries = manifest.exports && typeof manifest.exports === 'object' && Object.keys(manifest.exports).some(key => key.startsWith('.'))
    ? manifest.exports : { '.': manifest.exports ?? manifest.module ?? manifest.main };
  const files = await filesBelow(directory);
  for (const [key, conditions] of Object.entries(entries)) {
    const target = browserTarget(conditions);
    if (!target) continue;
    const normalized = target.startsWith('./') ? target : `./${target}`;
    const star = normalized.indexOf('*');
    if (star === -1) {
      if (!files.includes(normalized)) throw new Error(`Missing published export ${manifest.name} ${key}: ${normalized}`);
      imports[key === '.' ? manifest.name : `${manifest.name}/${key.slice(2)}`] = `${urlRoot}${normalized.slice(2)}`;
    } else {
      const prefix = normalized.slice(0, star);
      const suffix = normalized.slice(star + 1);
      for (const file of files) {
        if (!file.startsWith(prefix) || !file.endsWith(suffix)) continue;
        const match = file.slice(prefix.length, suffix.length ? -suffix.length : undefined);
        imports[`${manifest.name}/${key.slice(2).replace('*', match)}`] = `${urlRoot}${file.slice(2)}`;
      }
    }
  }
  packages.push({ name: manifest.name, version: manifest.version, ...archive });
}

async function packageWorkspace(name) {
  const source = join(repository, 'packages', name);
  const packed = singlePackOutput(execFileSync('npm', ['pack', source, '--json', '--ignore-scripts', '--offline', '--workspaces=false', '--pack-destination', tarballs, '--cache', join(temporary, 'npm-cache')], { cwd: temporary, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }), '@en-reve/' + name);
  const archive = join(tarballs, packed.filename);
  const destination = join(publicRoot, 'packages', name);
  await fs.mkdir(destination, { recursive: true });
  execFileSync('tar', ['-xzf', archive, '-C', destination, '--strip-components=1']);
  const bytes = await fs.readFile(archive);
  await addPackage(destination, `/packages/${name}/`, { source: 'npm-pack', archive: packed.filename, sha256: digest(bytes), bytes: bytes.length });
}

async function openPage(browser, baseURL) {
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 }, reducedMotion: 'reduce' });
  page.setDefaultTimeout(8_000);
  const errors = [];
  const requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push(new URL(request.url()).pathname));
  await page.addInitScript(() => {
    window.registeredTags = [];
    const define = customElements.define;
    customElements.define = function (name, constructor, options) {
      const result = define.call(this, name, constructor, options);
      window.registeredTags.push(name);
      return result;
    };
  });
  await page.goto(baseURL, { waitUntil: 'load' });
  return { page, errors, requests };
}

async function registered(page) {
  return page.evaluate(() => [...window.registeredTags]);
}

async function exerciseSplit(page, orientation) {
  await page.evaluate(async direction => {
    document.querySelector('en-split-view')?.remove();
    const host = document.createElement('en-split-view');
    host.value = 40;
    host.step = 5;
    host.orientation = direction;
    host.label = 'Resize work area';
    host.style.cssText = 'display:block;width:640px;height:320px;max-width:100%;';
    for (const [slot, text] of [['primary', 'Project files'], ['secondary', 'Editing canvas']]) {
      const pane = document.createElement('p');
      pane.slot = slot;
      pane.textContent = text;
      host.append(pane);
    }
    document.body.append(host);
    await host.updateComplete;
    const handle = host.shadowRoot.querySelector('en-splitter');
    await handle.updateComplete;
  }, orientation);
  const host = page.locator('en-split-view');
  const handle = page.getByRole('separator', { name: 'Resize work area', exact: true });
  await expect(handle).toBeVisible();
  await expect(handle).toHaveAttribute('aria-valuenow', '40');
  assert.equal(await handle.evaluate(element => element instanceof customElements.get('en-splitter')), true);
  const paneExtent = () => host.locator('[part="primary"]').evaluate((pane, direction) => {
    const box = pane.getBoundingClientRect();
    return direction === 'vertical' ? box.height : box.width;
  }, orientation);
  const initialExtent = await paneExtent();
  assert(initialExtent > 0);
  await handle.focus();
  await handle.press(orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight');
  await expect(host).toHaveJSProperty('value', 45);
  await expect(handle).toHaveAttribute('aria-valuenow', '45');
  assert((await paneExtent()) > initialExtent, 'The registered child must actually resize its parent panes.');
  await handle.press(orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft');
  await expect(host).toHaveJSProperty('value', 40);
  const box = await handle.boundingBox();
  assert(box && box.width > 0 && box.height > 0);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + (orientation === 'horizontal' ? 64 : 0), y + (orientation === 'vertical' ? 32 : 0), { steps: 5 });
  await page.mouse.up();
  await expect.poll(() => host.evaluate(element => element.value)).toBeGreaterThan(45);
  const value = await host.evaluate(element => element.value);
  assert(value < 60);
  assert((await paneExtent()) > initialExtent);
  return { orientation, keyboardValue: 45, pointerValue: value, initialExtent, finalExtent: await paneExtent() };
}

try {
  await fs.mkdir(publicRoot, { recursive: true });
  await fs.mkdir(tarballs, { recursive: true });
  await fs.mkdir(output, { recursive: true });
  for (const name of ['tokens', 'styles', 'primitives', 'elements']) await packageWorkspace(name);
  // Resolve the complete declared browser runtime and peer closure, including editor
  // dependencies referenced by the side-effect-free all-component catalogue.
  const installed = new Map();
  async function addInstalledDependencies(manifest, owner) {
    for (const name of Object.keys({ ...manifest.peerDependencies, ...manifest.dependencies })) {
      if (name.startsWith('@en-reve/') || name.startsWith('@types/')) continue;
      let source;
      for (let directory = owner; ; directory = dirname(directory)) {
        const candidate = join(directory, 'node_modules', name);
        if (await fs.access(join(candidate, 'package.json')).then(() => true, () => false)) { source = candidate; break; }
        if (dirname(directory) === directory) {
          if (manifest.peerDependenciesMeta?.[name]?.optional) break;
          throw new Error(`Missing installed browser dependency ${name} from ${owner}`);
        }
      }
      if (!source) continue; // An absent optional peer is outside this installed closure.
      source = await fs.realpath(source);
      if (installed.has(name)) {
        assert.equal(installed.get(name), source, `One native import map cannot alias conflicting installations of ${name}.`);
        continue;
      }
      installed.set(name, source);
      const directory = join(publicRoot, 'vendor', name);
      await fs.cp(source, directory, { recursive: true, dereference: true });
      await addPackage(directory, `/vendor/${name}/`, { source: 'installed-browser-dependency' });
      await addInstalledDependencies(JSON.parse(await fs.readFile(join(source, 'package.json'), 'utf8')), source);
    }
  }
  for (const name of ['tokens', 'styles', 'primitives', 'elements']) {
    const owner = join(repository, 'packages', name);
    await addInstalledDependencies(JSON.parse(await fs.readFile(join(owner, 'package.json'), 'utf8')), owner);
  }
  const theme = imports['@en-reve/tokens/default.css'];
  assert(theme, 'The packed token stylesheet must have a public export.');
  const document = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Selective registration consumer</title><link rel="stylesheet" href="${theme}"><script type="importmap">${JSON.stringify({ imports })}</script></head><body><h1>Selective registration consumer</h1></body></html>`;
  await fs.writeFile(join(publicRoot, 'index.html'), document);
  server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const path = resolve(publicRoot, `.${pathname === '/' ? '/index.html' : pathname}`);
      assert(path.startsWith(publicRoot + sep));
      const body = await fs.readFile(path);
      const type = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json' }[extname(path)] ?? 'application/octet-stream';
      response.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end('Not found');
    }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const baseURL = `http://127.0.0.1:${server.address().port}/`;

  for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
    const browser = await engine.launch();
    try {
      for (const scenario of ['selective', 'compatible', 'conflicting-child', 'conflicting-parent', 'catalog-subset']) {
        const { page, errors, requests } = await openPage(browser, baseURL);
        const record = { engine: name, browserVersion: browser.version(), scenario };
        try {
          if (scenario === 'selective') {
            await page.evaluate(async () => { await import('@en-reve/elements/split-view.js'); });
            assert.deepEqual(await registered(page), [], 'Class-only import must have no registration side effects.');
            await page.evaluate(async () => { await import('@en-reve/elements/define/split-view.js'); });
            assert.deepEqual(await registered(page), ['en-splitter', 'en-button', 'en-split-view']);
            record.interactions = [];
            for (const orientation of ['horizontal', 'vertical']) record.interactions.push(await exerciseSplit(page, orientation));
            assert.equal(requests.includes('/packages/elements/dist/catalog.js'), false, 'Selective use must not load the full catalog.');
          } else if (scenario === 'compatible') {
            await page.evaluate(async () => {
              const { EnSplitter } = await import('@en-reve/elements/splitter.js');
              customElements.define('en-splitter', EnSplitter);
              await import('@en-reve/elements/define/split-view.js');
              await import('@en-reve/elements/define/splitter.js');
            });
            assert.deepEqual(await registered(page), ['en-splitter', 'en-button', 'en-split-view'], 'Compatible dependencies must remain idempotent in either registration order.');
          } else if (scenario.startsWith('conflicting-')) {
            const conflict = scenario === 'conflicting-child' ? 'en-splitter' : 'en-split-view';
            const state = await page.evaluate(async conflict => {
              class ForeignElement extends HTMLElement {}
              customElements.define(conflict, ForeignElement);
              let rejected = false;
              try { await import('@en-reve/elements/define/split-view.js'); }
              catch { rejected = true; }
              return { rejected, preservesForeign: customElements.get(conflict) === ForeignElement, otherDefined: Boolean(customElements.get(conflict === 'en-splitter' ? 'en-split-view' : 'en-splitter')) };
            }, conflict);
            assert.deepEqual(state, { rejected: true, preservesForeign: true, otherDefined: false });
            assert.deepEqual(await registered(page), [conflict], 'Preflight failure must leave unrelated definitions unregistered.');
          } else {
            await page.evaluate(async () => { window.catalog = await import('@en-reve/elements/catalog.js'); });
            assert.deepEqual(await registered(page), [], 'Catalog descriptors must remain side-effect free.');
            await page.evaluate(async () => {
              const { registerDefinitions } = await import('@en-reve/primitives/interactions/registration.js');
              const definition = window.catalog.definitions.find(item => item.tagName === 'en-split-view');
              registerDefinitions(customElements, [definition]);
            });
            assert.deepEqual(await registered(page), ['en-splitter', 'en-button', 'en-split-view'], 'Selecting the catalog descriptor must retain its required dependency closure.');
          }
          assert.deepEqual(errors, []);
          record.status = 'passed';
        } catch (error) {
          record.status = 'failed';
          record.error = String(error);
        } finally {
          record.registeredTags = await registered(page);
          record.errors = errors;
          await page.close();
          results.push(record);
          console.log(JSON.stringify(record));
        }
      }
    } finally {
      await browser.close();
    }
  }
} finally {
  if (server) await new Promise(resolve => server.close(resolve));
  await fs.mkdir(output, { recursive: true });
  await fs.writeFile(join(output, 'packed.json'), JSON.stringify({
    checkedAt: new Date().toISOString(),
    scope: 'Packed local workspace artifacts consumed through native browser ESM/import maps in three Playwright engines. Selective dependency closure, class/catalog side effects, compatible registrations, collision preflight, horizontal/vertical split keyboard and mouse behavior. Not scoped-registry, SSR, all-component, current-minus-one browser/framework, or manual assistive-technology acceptance.',
    packages, results,
  }, null, 2) + '\n');
  await fs.rm(temporary, { recursive: true, force: true });
}
if (results.length !== 15 || results.some(result => result.status !== 'passed')) process.exitCode = 1;
