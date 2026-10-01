import {test, expect, type Page} from '@playwright/test';
import {randomUUID} from 'node:crypto';

async function open(page: Page, mode: string, query = '') {
  await page.goto(`/ssr-${mode}.html${query}`);
  await page.waitForFunction(() => Boolean((window as any).ssrFixture));
}

async function activate(page: Page) {
  return page.evaluate(async () => {
    const f = (window as any).ssrFixture;
    if (f.creationError) return f.creationError;
    try { await f.island.activate(); return undefined; }
    catch (error) { return String(error); }
  });
}

for (const mode of ['global', 'shadow']) {
  test(`${mode}: packed SSR preserves native and managed drafts, focus, selection and identity`, async ({page}, info) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await open(page, mode, '?hold');
    const native = page.getByRole('textbox', {name: 'Native draft', exact: true});
    const managed = page.getByRole('textbox', {name: 'Managed draft', exact: true});
    await native.fill('Native before hydration');
    await native.evaluate((node: HTMLInputElement) => node.setSelectionRange(1, 5));
    await managed.fill('Managed before hydration');
    await managed.evaluate((node: HTMLInputElement) => node.setSelectionRange(2, 7));
    await page.evaluate(() => {
      const f = (window as any).ssrFixture;
      f.native = f.root.querySelector('input');
      f.managedHost = f.root.querySelector('en-text-field');
      f.managedShadow = f.managedHost.shadowRoot;
      f.managed = f.managedShadow.querySelector('input');
      f.pending = f.island.activate();
    });
    await expect.poll(() => page.evaluate(() => (window as any).ssrFixture.counters.loads)).toBe(1);
    await expect(managed).toHaveValue('Managed before hydration');
    await page.evaluate(async () => { const f = (window as any).ssrFixture; f.release(); await f.pending; });
    await expect(managed).toBeFocused();
    await expect(managed).toHaveValue('Managed before hydration');
    await expect(native).toHaveValue('Native before hydration');
    expect(await page.evaluate(() => {
      const f = (window as any).ssrFixture;
      return {
        state: f.island.state,
        sameNative: f.native === f.root.querySelector('input'),
        sameHost: f.managedHost === f.root.querySelector('en-text-field'),
        sameShadow: f.managedShadow === f.managedHost.shadowRoot,
        sameManaged: f.managed === f.managedHost.shadowRoot.querySelector('input'),
        nativeSelection: [f.native.selectionStart, f.native.selectionEnd],
        managedSelection: [f.managed.selectionStart, f.managed.selectionEnd],
        form: [...new FormData(f.root.querySelector('form')).entries()],
        delivery: f.moduleDelivery(),
        globalLeak: f.scope.mode === 'scoped' && Boolean(customElements.get('en-text-field')),
      };
    })).toEqual({
      state: 'ready', sameNative: true, sameHost: true, sameShadow: true, sameManaged: true,
      nativeSelection: [1, 5], managedSelection: [2, 7],
      form: [['native', 'Native before hydration'], ['managed', 'Managed before hydration']],
      delivery: {schemaVersion: 1, id: 'fixture/ssr', version: '1'}, globalLeak: false,
    });
    const registry = await page.evaluate(() => {
      const f = (window as any).ssrFixture;
      return {mode: f.island.mode, nativeScopes: f.nativeScopes};
    });
    expect(registry.mode).toBe(mode === 'global' || !registry.nativeScopes ? 'global' : 'scoped');
    await info.attach('registry-mode', {body: JSON.stringify({delivery: mode, ...registry}), contentType: 'application/json'});
    expect(errors).toEqual([]);
  });

  test(`${mode}: construction snapshots the manifest identity and template data`, async ({page}) => {
    await open(page, mode, '?mutation=manifest');
    expect(await activate(page)).toBeUndefined();
    await expect(page.getByRole('textbox', {name: 'Managed draft', exact: true})).toHaveValue('Initial');
    expect(await page.evaluate(() => (window as any).ssrFixture.island.state)).toBe('ready');
  });

  test(`${mode}: accepted preparation snapshots the module identity`, async ({page}) => {
    await open(page, mode);
    await page.evaluate(async () => { const f = (window as any).ssrFixture; await f.island.load(); f.mutateModuleIdentity(); });
    expect(await activate(page)).toBeUndefined();
    expect(await page.evaluate(() => (window as any).ssrFixture.island.state)).toBe('ready');
  });
}

for (const mode of ['global', 'shadow', 'template']) {
  for (const side of ['manifest', 'module']) for (const kind of ['missing', 'id', 'version', 'schema']) {
    test(`${mode}: ${side} ${kind} identity rejects before irreversible hydration`, async ({page}) => {
      await open(page, mode, `?mismatch=${side}-${kind}`);
      const essential = page.getByRole('textbox', {name: 'Essential draft', exact: true});
      await essential.fill('Fallback remains editable');
      const native = page.getByRole('textbox', {name: 'Native draft', exact: true});
      if (mode !== 'template') {
        await native.fill('Keep native draft');
        await native.evaluate((node: HTMLInputElement) => node.setSelectionRange(2, 6));
      }
      await page.evaluate(() => {
        const f = (window as any).ssrFixture;
        f.originalNodes = [...f.root.childNodes];
        f.originalNative = f.root.querySelector('input');
        f.originalManaged = f.root.querySelector('en-text-field');
        f.originalShadow = f.originalManaged?.shadowRoot;
        f.originalTemplate = f.host.querySelector('template[data-en-island-template]');
      });
      expect(await activate(page)).toMatch(/delivery|schema/i);
      expect(await page.evaluate(() => {
        const f = (window as any).ssrFixture;
        return {
          sameNodes: f.originalNodes.length === f.root.childNodes.length && f.originalNodes.every((node: Node, index: number) => node === f.root.childNodes[index]),
          sameNative: f.originalNative === f.root.querySelector('input'),
          sameManaged: f.originalManaged === f.root.querySelector('en-text-field'),
          sameShadow: f.originalShadow === f.root.querySelector('en-text-field')?.shadowRoot,
          sameTemplate: f.originalTemplate === f.host.querySelector('template[data-en-island-template]'),
          registered: Boolean(f.scope.get('en-text-field')),
          counters: {template: f.counters.template, ready: f.counters.ready, initialize: f.counters.initialize, register: f.counters.register, upgrade: f.counters.upgrade},
        };
      })).toEqual({sameNodes: true, sameNative: true, sameManaged: true, sameShadow: true, sameTemplate: true, registered: false, counters: {template: 0, ready: 0, initialize: 0, register: 0, upgrade: 0}});
      await expect(essential).toHaveValue('Fallback remains editable');
      if (mode !== 'template') {
        await expect(native).toHaveValue('Keep native draft');
        await expect(native).toBeFocused();
        expect(await native.evaluate((node: HTMLInputElement) => [node.selectionStart, node.selectionEnd])).toEqual([2, 6]);
      } else await expect(essential).toBeFocused();
      await essential.fill('Fallback still editable after rejection');
      await expect(essential).toHaveValue('Fallback still editable after rejection');
    });
  }
}

test('template: preparation retains inert content and activation consumes it once', async ({page}) => {
  await open(page, 'template');
  const essential = page.getByRole('textbox', {name: 'Essential draft', exact: true});
  await essential.fill('Native fallback draft');
  await page.evaluate(async () => { const f = (window as any).ssrFixture; await Promise.all([f.island.load(), f.island.load()]); });
  expect(await page.evaluate(() => {
    const f = (window as any).ssrFixture;
    return {loads: f.counters.loads, state: f.island.state, live: f.root.querySelectorAll('en-text-field').length, defined: Boolean(f.scope.get('en-text-field')), inert: Boolean(f.host.querySelector('template[data-en-island-template]'))};
  })).toEqual({loads: 1, state: 'dormant', live: 0, defined: false, inert: true});
  expect(await activate(page)).toBeUndefined();
  await expect(page.getByRole('textbox', {name: 'Managed draft', exact: true})).toHaveValue('Initial');
  await expect(essential).toHaveValue('Native fallback draft');
  expect(await page.evaluate(() => {
    const f = (window as any).ssrFixture;
    return {state: f.island.state, live: f.root.querySelectorAll('en-text-field').length, inert: Boolean(f.host.querySelector('template[data-en-island-template]'))};
  })).toEqual({state: 'ready', live: 1, inert: false});
});

for (const mode of ['global', 'shadow']) test(`${mode}: SSR native inputs work with JavaScript disabled`, async ({browser}, info) => {
  const context = await browser.newContext({javaScriptEnabled: false, baseURL: info.project.use.baseURL});
  try {
    const page = await context.newPage();
    await page.goto(`/ssr-${mode}.html`);
    const native = page.getByRole('textbox', {name: 'Native draft', exact: true});
    await native.fill('No JavaScript draft');
    await expect(native).toHaveValue('No JavaScript draft');
    await expect(page.getByRole('textbox', {name: 'Managed draft', exact: true})).toHaveValue('Initial');
    expect(await native.evaluate((node: HTMLInputElement) => new FormData(node.form!).get('native'))).toBe('No JavaScript draft');
  } finally { await context.close(); }
});

// These cases exercise real incremental HTTP delivery of already-rendered packed
// HTML. They make no claim that createScopedRenderer itself streams its output.
for (const mode of ['global', 'shadow']) for (const mismatch of ['', 'manifest-schema', 'module-version']) {
  test(`${mode}: incremental HTTP ${mismatch || 'matching identity'} preserves edits made before manifest delivery`, async ({page}, info) => {
    const errors: string[] = [];
    const bootstrapRequests: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (new URL(request.url()).pathname.endsWith('/ssr-boot.js')) bootstrapRequests.push(request.url()); });
    const token = randomUUID();
    const response = await page.goto(`/stream-ssr-${mode}.html?stream=${token}${mismatch ? `&mismatch=${mismatch}` : ''}`, {waitUntil: 'commit'});
    expect(response!.headers()['x-en-fixture-stream']).toBe('buffered-ssr-shell-then-manifest');
    const native = page.getByRole('textbox', {name: 'Native draft', exact: true});
    const managed = page.getByRole('textbox', {name: 'Managed draft', exact: true});
    const essential = page.getByRole('textbox', {name: 'Essential draft', exact: true});
    await essential.fill('Shell draft before manifest');
    await managed.fill('Managed draft before manifest');
    await managed.evaluate((node: HTMLInputElement) => node.setSelectionRange(1, 6));
    await native.fill('Native draft before manifest');
    await native.evaluate((node: HTMLInputElement) => node.setSelectionRange(2, 8));
    const shell = await page.evaluate(() => {
      const host = document.getElementById('ssr-island')!, root = host.shadowRoot ?? host;
      const native = root.querySelector<HTMLInputElement>('input')!;
      const managedHost = root.querySelector('en-text-field')!;
      const managed = managedHost.shadowRoot!.querySelector('input')!;
      (window as any).streamBeforeManifest = {host, root, native, managedHost, managed, managedShadow: managedHost.shadowRoot, children: [...root.childNodes]};
      return {
        readyState: document.readyState,
        manifestPresent: Boolean(document.getElementById('ssr-manifest')),
        bootstrapPresent: Boolean((window as any).ssrFixture),
        customHostDefined: managedHost.matches(':defined'),
        nativeValue: new FormData(native.form!).get('native'),
      };
    });
    expect(shell).toEqual({readyState: 'loading', manifestPresent: false, bootstrapPresent: false, customHostDefined: false, nativeValue: 'Native draft before manifest'});
    expect(bootstrapRequests).toEqual([]);
    const release = await page.request.post(`/__fixture/stream-release?token=${token}`);
    expect(release.status()).toBe(204);
    await page.waitForFunction(() => Boolean((window as any).ssrFixture));
    expect(await page.evaluate(() => {
      const f = (window as any).ssrFixture;
      return {source: f.deliverySource, receivedSchema: f.receivedManifest.delivery.schemaVersion};
    })).toEqual({source: 'incremental-http-fixture', receivedSchema: mismatch === 'manifest-schema' ? 2 : 1});
    const result = await activate(page);
    if (mismatch) expect(result).toMatch(/delivery|schema/i);
    else expect(result).toBeUndefined();
    const final = await page.evaluate(() => {
      const f = (window as any).ssrFixture, before = (window as any).streamBeforeManifest;
      return {
        sameRoot: before.root === f.root,
        sameNative: before.native === f.root.querySelector('input'),
        sameManagedHost: before.managedHost === f.root.querySelector('en-text-field'),
        sameManagedShadow: before.managedShadow === before.managedHost.shadowRoot,
        sameManaged: before.managed === before.managedHost.shadowRoot.querySelector('input'),
        sameChildren: before.children.length === f.root.childNodes.length && before.children.every((node: Node, index: number) => node === f.root.childNodes[index]),
        nativeSelection: [before.native.selectionStart, before.native.selectionEnd],
        managedSelection: [before.managed.selectionStart, before.managed.selectionEnd],
        registered: Boolean(f.scope.get('en-text-field')),
        mode: f.scope.mode, nativeScopes: f.nativeScopes,
        state: f.island?.state ?? 'construction-rejected',
        counters: f.counters,
      };
    });
    expect(final).toMatchObject({sameRoot: true, sameNative: true, sameManagedHost: true, sameManagedShadow: true, sameManaged: true, sameChildren: true, nativeSelection: [2, 8], managedSelection: [1, 6]});
    expect(final.mode).toBe(mode === 'global' || !final.nativeScopes ? 'global' : 'scoped');
    if (mismatch) {
      expect(final.registered).toBe(false);
      expect(final.state).toBe(mismatch === 'manifest-schema' ? 'construction-rejected' : 'error');
      expect(final.counters).toEqual({loads: mismatch === 'manifest-schema' ? 0 : 1, template: 0, ready: 0, initialize: 0, register: 0, upgrade: 0});
    } else {
      expect(final.registered).toBe(true);
      expect(final.state).toBe('ready');
      expect(final.counters).toMatchObject({loads: 1, template: 1, ready: 1, register: 1, upgrade: 1});
      expect(await page.evaluate(() => new FormData((window as any).ssrFixture.root.querySelector('form')).get('managed'))).toBe('Managed draft before manifest');
    }
    await expect(native).toBeFocused();
    await expect(native).toHaveValue('Native draft before manifest');
    await expect(managed).toHaveValue('Managed draft before manifest');
    await expect(essential).toHaveValue('Shell draft before manifest');
    await info.attach('incremental-http-ownership', {body: JSON.stringify({mode, mismatch: mismatch || 'none', transport: 'buffered renderer output split before manifest/bootstrap; explicit HTTP suffix release', shell, final}), contentType: 'application/json'});
    expect(errors).toEqual([]);
  });
}
