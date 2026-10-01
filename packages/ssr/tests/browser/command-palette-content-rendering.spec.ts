import { expect, test, type Page } from '@playwright/test';

const eager = '#palette-eager';
const closed = '#palette-closed';
const opened = '#palette-open';
const unused = '#palette-unused';
const paletteIds = [eager, closed, opened, unused];

function watchHydrationErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (['error', 'warning'].includes(message.type()) && /hydrat|mismatch/i.test(message.text())) errors.push(message.text());
  });
  return errors;
}

async function initialBodies(page: Page) {
  for (const id of paletteIds) {
    const host = page.locator(id);
    await expect(host.locator('dialog')).toHaveCount(1);
    await expect(host.locator('[part="body"]')).toHaveCount(1);
    await expect(host.locator('[part="footer"]')).toHaveCount(1);
    await expect(host.locator('en-button.en-overlay-close button')).toHaveCount(1);
    await expect(host.locator('input')).toHaveCount(1);
    await expect(host.locator('[role="listbox"]')).toHaveCount(1);
    await expect(host.locator('[role="option"]')).toHaveCount(4);
    await expect(host.locator('[role="status"]')).toHaveCount(1);
    expect(await host.evaluate(element => {
      const root = element.shadowRoot!;
      return {
        support: root.querySelector<HTMLSlotElement>('slot:not([name])')!.assignedElements()[0] === element.querySelector('[data-support]'),
        footer: root.querySelector<HTMLSlotElement>('slot[name="footer"]')!.assignedElements()[0] === element.querySelector('[data-footer]'),
      };
    })).toEqual({ support: true, footer: true });
  }
}

async function captureNodes(page: Page) {
  await page.evaluate(() => {
    const capture = (host: Element) => {
      const root = host.shadowRoot!;
      return {
        host, root, dialog: root.querySelector('dialog'), body: root.querySelector('[part="body"]'),
        footer: root.querySelector('[part="footer"]'), wrapper: root.querySelector('.en-command-palette-content'),
        slot: root.querySelector('slot:not([name])'), footerSlot: root.querySelector('slot[name="footer"]'),
        support: host.querySelector('[data-support]'), footerAction: host.querySelector('[data-footer]'),
        input: root.querySelector('input'), listbox: root.querySelector('[role="listbox"]'), status: root.querySelector('[role="status"]'),
        close: root.querySelector('en-button.en-overlay-close')?.shadowRoot?.querySelector('button'),
      };
    };
    (window as any).__commandPaletteNodes = {
      capture,
      records: [...document.querySelectorAll('#command-palette-content-fixture en-command-palette')].map(capture),
    };
  });
}

async function expectRetainedNodes(page: Page) {
  expect(await page.evaluate(() => {
    const { capture, records } = (window as any).__commandPaletteNodes;
    return records.map((previous: any) => {
      const current = capture(document.getElementById(previous.host.id));
      return { id: previous.host.id, retained: Object.keys(previous).every(key => previous[key] === current[key]) };
    });
  })).toEqual(paletteIds.map(id => ({ id: id.slice(1), retained: true })));
}

async function hydrate(page: Page) {
  await page.evaluate(() => (window as any).hydrateCommandPaletteContent());
  expect(await page.evaluate(() => (window as any).commandPaletteContentFixture.island.state)).toBe('ready');
}

// With JavaScript disabled all native modal shells intentionally remain closed.
// This checks server content and projection, not an invented no-script command UI.
test('SSR retains closed and initially open search bodies with inert native modal shells', async ({ browser, baseURL }, info) => {
  info.annotations.push({ type: 'browser-version', description: browser.version() });
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto(`${baseURL}/command-palette-content-fixture`);
    await initialBodies(page);
    await expect(page.locator(opened)).toHaveAttribute('open', '');
    for (const id of paletteIds) {
      expect(await page.locator(id).evaluate(host => ({ defined: host.matches(':defined'), open: host.shadowRoot!.querySelector('dialog')!.open }))).toEqual({ defined: false, open: false });
    }
  } finally { await context.close(); }
});

test('matching hydration retains shell and search input identity and dirty native text without opening the closed sibling', async ({ page }) => {
  const errors = watchHydrationErrors(page);
  await page.goto('/command-palette-content-fixture');
  await initialBodies(page);
  await captureNodes(page);
  // A closed eager control can have a dirty native value before upgrade. The
  // initial-open surface is explicitly opened by this fixture to exercise real
  // native typing/focus/selection before the component owns the modal lifecycle.
  await page.locator(eager).evaluate(host => {
    const input = host.shadowRoot!.querySelector('input')!;
    input.value = 'Save'; input.setSelectionRange(1, 3, 'backward');
  });
  await page.locator(opened).evaluate(host => {
    const dialog = host.shadowRoot!.querySelector('dialog')!;
    dialog.inert = false; dialog.showModal();
  });
  const input = page.locator(opened).getByRole('combobox', { name: 'Find project command', exact: true });
  await input.fill('Export');
  await input.evaluate(node => (node as HTMLInputElement).setSelectionRange(1, 5, 'backward'));
  await hydrate(page);
  await expectRetainedNodes(page);
  await expect(input).toHaveValue('Export');
  await expect(input).toBeFocused();
  expect(await input.evaluate(node => {
    const control = node as HTMLInputElement;
    return [control.selectionStart, control.selectionEnd, control.selectionDirection];
  })).toEqual([1, 5, 'backward']);
  expect(await page.locator(eager).locator('input').evaluate(node => {
    const control = node as HTMLInputElement;
    return { value: control.value, selection: [control.selectionStart, control.selectionEnd, control.selectionDirection] };
  })).toEqual({ value: 'Save', selection: [1, 3, 'backward'] });
  await expect(page.locator(opened).getByRole('option', { name: 'Export project', exact: true })).toHaveCount(1);
  await expect(page.locator(opened).locator('[role="option"]')).toHaveCount(1);
  await expect(page.locator(eager).locator('[role="option"]')).toHaveCount(1);
  for (const id of [closed, unused]) {
    await expect(page.locator(id).locator('input')).toHaveCount(1);
    expect(await page.locator(id).locator('dialog').evaluate(dialog => (dialog as HTMLDialogElement).open)).toBe(false);
  }
  expect(errors).toEqual([]);
});

test('the first accepted hydrated opening presents current commands, focuses search and retains the eager body on reuse', async ({ page }) => {
  const errors = watchHydrationErrors(page);
  await page.goto('/command-palette-content-fixture');
  await hydrate(page);
  await page.evaluate(async () => {
    const fixture = (window as any).commandPaletteContentFixture;
    for (const host of fixture.root.querySelectorAll('en-command-palette')) host.open = false;
    const host = document.querySelector('#palette-closed') as any;
    host.commands = [{ action: 'new', label: 'New current command' }, { action: 'blocked', label: 'Unavailable current command', disabled: true }];
    (window as any).__closedPaletteShell = {
      dialog: host.shadowRoot.querySelector('dialog'), body: host.shadowRoot.querySelector('[part="body"]'),
      slot: host.shadowRoot.querySelector('slot:not([name])'), input: host.shadowRoot.querySelector('input'), listbox: host.shadowRoot.querySelector('[role="listbox"]'),
    };
    await fixture.settle();
  });
  const host = page.locator(closed);
  await expect(host.locator('input')).toHaveCount(1);
  expect(await host.evaluate((element: any) => element.show())).toBe('committed');
  const search = host.getByRole('combobox', { name: 'Find project command', exact: true });
  await expect(search).toBeFocused();
  await expect(search).toHaveAttribute('aria-expanded', 'true');
  await expect(host.getByRole('option', { name: 'New current command', exact: true })).toBeVisible();
  await expect(host.locator('[role="option"]')).toHaveCount(2);
  await expect(host.getByRole('option', { name: 'Unavailable current command', exact: true })).toHaveAttribute('aria-disabled', 'true');
  await expect(host.locator('[role="option"][data-action="save"]')).toHaveCount(0);
  expect(await host.evaluate((element: any) => {
    const before = (window as any).__closedPaletteShell;
    (window as any).__paletteActivatedInput = element.shadowRoot.querySelector('input');
    (window as any).__paletteActivatedList = element.shadowRoot.querySelector('[role="listbox"]');
    return { dialog: element.shadowRoot.querySelector('dialog') === before.dialog,
      body: element.shadowRoot.querySelector('[part="body"]') === before.body,
      slot: element.shadowRoot.querySelector('slot:not([name])') === before.slot,
      input: element.shadowRoot.querySelector('input') === before.input, listbox: element.shadowRoot.querySelector('[role="listbox"]') === before.listbox };
  })).toEqual({ dialog: true, body: true, slot: true, input: true, listbox: true });
  await search.press('Escape');
  await expect(host).toHaveJSProperty('open', false);
  await expect(host.locator('input')).toHaveCount(1);
  expect(await host.evaluate((element: any) => element.show())).toBe('committed');
  await expect(search).toBeFocused();
  expect(await host.evaluate(element => ({
    input: element.shadowRoot!.querySelector('input') === (window as any).__paletteActivatedInput,
    listbox: element.shadowRoot!.querySelector('[role="listbox"]') === (window as any).__paletteActivatedList,
  }))).toEqual({ input: true, listbox: true });
  await expect(page.locator(unused).locator('input')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('staged buffered delivery has one hydration owner and preparation changes no native or authored server nodes', async ({ page }, info) => {
  const errors = watchHydrationErrors(page);
  const imports: string[] = [];
  page.on('request', request => {
    if (request.url().includes('/fixtures/command-palette-content-template.mjs')) imports.push(request.url());
  });
  const streamId = `${info.project.name}-${info.workerIndex}-${info.retry}-${Date.now()}`;
  let released = false;
  try {
    await page.goto(`/command-palette-content-stream?id=${streamId}`, { waitUntil: 'commit' });
    await page.waitForFunction(() => typeof (window as any).prepareCommandPaletteContent === 'function');
    await expect(page.locator('#command-palette-stream-complete')).toHaveCount(0);
    await initialBodies(page);
    await captureNodes(page);
    const markup = await page.locator('#command-palette-content-fixture').evaluate(root => root.innerHTML);
    expect(await page.evaluate(async () => {
      const fixture = await (window as any).prepareCommandPaletteContent();
      let duplicate = '';
      try { fixture.claimAgain(); } catch (error) { duplicate = (error as Error).message; }
      await Promise.all([fixture.island.load(), fixture.island.load()]);
      return { duplicate, state: fixture.island.state, mode: fixture.island.mode,
        registered: Boolean(customElements.get('en-command-palette')),
        upgraded: [...fixture.root.querySelectorAll('en-command-palette')].some((host: Element) => host.matches(':defined')) };
    })).toEqual({ duplicate: 'Hydration boundary already has an owner.', state: 'dormant', mode: 'global', registered: false, upgraded: false });
    expect(imports.length).toBe(1);
    expect(await page.locator('#command-palette-content-fixture').evaluate(root => root.innerHTML)).toBe(markup);
    await expectRetainedNodes(page);
    await expect(page.locator('#command-palette-stream-complete')).toHaveCount(0);
    expect((await page.request.post(`/command-palette-content-release?id=${streamId}`)).status()).toBe(204);
    released = true;
    await expect(page.locator('#command-palette-stream-complete')).toHaveCount(1);
    await page.evaluate(async () => {
      const { island } = (window as any).commandPaletteContentFixture;
      await Promise.all([island.activate(), island.activate()]);
    });
    expect(await page.evaluate(() => (window as any).commandPaletteContentFixture.island.state)).toBe('ready');
    await initialBodies(page);
    await expectRetainedNodes(page);
    expect(errors).toEqual([]);
  } finally {
    if (!released) await page.request.post(`/command-palette-content-release?id=${streamId}`).catch(() => undefined);
  }
});


for (const method of ['show', 'property', 'canceled', 'superseded', 'hide', 'closed-property'] as const) {
  test(`direct containing Lit hydration preserves an eager SSR child through early ${method} intent`, async ({ page }, info) => {
    info.annotations.push({ type: 'hydration-owner', description: 'Direct containing Lit hydrate; no createHydrationIsland owner is created for this regression.' });
    const errors = watchHydrationErrors(page);
    await page.goto('/command-palette-content-fixture');
    await initialBodies(page);
    await captureNodes(page);
    const accepted = method === 'show' || method === 'property';
    const closing = method === 'hide' || method === 'closed-property';
    const result = await page.evaluate(async method => {
      const path = '/packages/ssr/tests/fixtures/command-palette-content-hydrate.mjs';
      return (await import(path)).hydrateWithEarlyIntent(method);
    }, method);
    expect(result).toEqual({
      beforeRelease: {
        defined: true, hasUpdated: false, deferred: true, open: accepted,
        inputPresent: true, nativeOpen: false,
        outcome: method === 'show' || method === 'hide' ? 'committed' : method === 'property' || method === 'closed-property' ? null : method,
      },
      afterInitialHydration: { open: accepted, expanded: String(accepted), activeAction: accepted ? 'save' : null, nativeOpen: accepted, inputFocused: accepted },
      focusEvents: accepted ? [{ expanded: 'true', activeAction: 'save', nativeOpen: true }] : [],
      hydratedInitialActions: ['save', 'publish', 'export', 'archive'],
      duplicate: 'Command palette fixture already has a direct hydration owner.',
    });
    const host = page.locator(closing ? opened : closed);
    await expect(host).not.toHaveAttribute('defer-hydration');
    await expect(host).toHaveJSProperty('open', accepted);
    expect(await host.locator('dialog').evaluate(dialog => (dialog as HTMLDialogElement).open)).toBe(accepted);
    if (accepted) {
      const search = host.getByRole('combobox', { name: 'Find project command', exact: true });
      await expect(search).toBeFocused();
      await expect(search).toHaveAttribute('aria-expanded', 'true');
      await expect(host.getByRole('option', { name: 'Early current command', exact: true })).toBeVisible();
      await expect(host.getByRole('option', { name: 'Early unavailable command', exact: true })).toHaveAttribute('aria-disabled', 'true');
      await expect(host.locator('[role="option"]')).toHaveCount(2);
      await expect(host.locator('[role="option"][data-action="save"]')).toHaveCount(0);
    } else {
      await expect(host.locator('input')).toHaveCount(1);
      await expect(host.locator('input')).toHaveAttribute('aria-expanded', 'false');
      await expect(host.locator('input')).not.toHaveAttribute('aria-activedescendant');
      await expect(host.locator('[role="option"]')).toHaveCount(2);
      await expect(host.locator('[role="option"][data-action="current"]')).toHaveCount(1);
    }
    await expect(page.locator(unused).locator('input')).toHaveCount(1);
    expect(await page.evaluate(() => {
      const { capture, records } = (window as any).__commandPaletteNodes;
      return records.map((previous: any) => {
        const current = capture(document.getElementById(previous.host.id));
        // Every native editor, shell and authored node survives matching hydration.
        const keys = Object.keys(previous);
        return { id: previous.host.id, retained: keys.every(key => previous[key] === current[key]) };
      });
    })).toEqual(paletteIds.map(id => ({ id: id.slice(1), retained: true })));
    expect(errors).toEqual([]);
  });
}
