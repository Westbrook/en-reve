import { expect, test, type Page } from '@playwright/test';

const palette = (page: Page) => page.locator('#content-palette');
const input = (page: Page) => palette(page).locator('input[role="combobox"]');
const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page, browser }, info) => {
  const messages: string[] = []; errors.set(page, messages);
  page.on('pageerror', error => messages.push(error.message));
  page.on('response', response => { if (response.status() >= 400) messages.push(`${response.status()} ${response.url()}`); });
  info.annotations.push({ type: 'browser-version', description: browser.version() });
  await page.goto('/fixture'); await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.evaluate(async () => {
    const trigger = document.createElement('button'); trigger.id = 'content-trigger'; trigger.textContent = 'Open commands';
    const host = document.createElement('en-command-palette') as any;
    host.id = 'content-palette'; host.for = trigger.id;
    host.commands = (window as any).commandsFixture.commands;
    host.innerHTML = '<p id="content-help">Authored supporting content</p><button slot="footer" type="button">Authored footer</button>';
    document.querySelector('main')!.append(trigger, host); await host.updateComplete;
  });
});

test.afterEach(async ({ page }, info) => {
  const messages = errors.get(page) ?? [];
  if (messages.length) await info.attach('runtime-errors', { body: JSON.stringify(messages), contentType: 'application/json' });
  expect(messages).toEqual([]);
});

test('closed generated search preserves shell, populated controls and authored slots', async ({ page }) => {
  await expect(page.locator('#palette input[role="combobox"]')).toHaveCount(1);
  await expect(input(page)).toHaveCount(1);
  await expect(palette(page).locator('[role="listbox"]')).toHaveCount(1);
  await expect(palette(page).locator('[role="option"]')).toHaveCount(4);
  await expect(palette(page).locator('[role="status"]')).toHaveCount(1);
  expect(await palette(page).evaluate(element => ({
    shell: !!element.shadowRoot!.querySelector('dialog'), wrapper: !!element.shadowRoot!.querySelector('.en-command-palette-content'),
    slots: [...element.shadowRoot!.querySelectorAll('slot')].map(slot => slot.name),
    supportingSlot: (element.querySelector('#content-help') as HTMLElement).assignedSlot?.name,
    footerSlot: (element.querySelector('[slot="footer"]') as HTMLElement).assignedSlot?.name,
  }))).toMatchObject({ shell: true, wrapper: true, supportingSlot: '', footerSlot: 'footer' });
  const result = await palette(page).evaluate(async (host: any) => {
    const catalog = host.commands, input = host.shadowRoot.querySelector('input');
    let rejected = false; try { host.commands = [{ action: 'same', label: 'One' }, { action: 'same', label: 'Two' }]; } catch (error) { rejected = error instanceof TypeError; }
    await host.updateComplete;
    return { rejected, retained: catalog === host.commands, inputRetained: !!input && input === host.shadowRoot.querySelector('input') };
  });
  expect(result).toEqual({ rejected: true, retained: true, inputRetained: true });
});

test('tentative flushes, cancellations and superseding close retain the generated body', async ({ page }) => {
  const result = await palette(page).evaluate(async (host: any) => {
    const original = host.shadowRoot.querySelector('input');
    const present = () => !!original && original === host.shadowRoot.querySelector('input');
    const during: boolean[] = [];
    host.addEventListener('en-change', (event: Event) => { host.requestUpdate(); host.performUpdate(); during.push(present()); event.preventDefault(); }, { once: true });
    const canceled = host.show(); await host.updateComplete; const afterCancel = present();
    host.addEventListener('en-change', () => { host.hide(); host.performUpdate(); during.push(present()); }, { once: true });
    const nested = host.show(); await host.updateComplete; const afterNested = present();
    const accepted = host.show(); const closed = host.hide(); await host.updateComplete; const afterSameTurn = present();
    host.open = true; host.open = false; await host.updateComplete; const afterWrites = present();
    host.addEventListener('en-change', (event: Event) => { host.open = true; host.performUpdate(); during.push(present()); event.preventDefault(); }, { once: true });
    const authoritative = host.show(); await host.updateComplete;
    return { canceled, afterCancel, nested, afterNested, accepted, closed, afterSameTurn, afterWrites, authoritative, during, final: present(), modal: host.shadowRoot.querySelector('dialog').open };
  });
  expect(result).toEqual({ canceled: 'canceled', afterCancel: true, nested: 'superseded', afterNested: true, accepted: 'committed', closed: 'committed', afterSameTurn: true, afterWrites: true, authoritative: 'superseded', during: [true, true, true], final: true, modal: true });
  await expect(input(page)).toBeFocused();
});

for (const method of ['native-trigger', 'show', 'property', 'initial-open', 'reconnect-show'] as const) {
  test(`first ${method} presents the current catalog with native search autofocus`, async ({ page }) => {
    await palette(page).evaluate(async (host: any) => { host.commands = [{ action: 'current', label: 'Current command' }]; await host.updateComplete; });
    if (method === 'native-trigger') await page.locator('#content-trigger').click();
    else await palette(page).evaluate(async (host: any, method) => {
      if (method === 'reconnect-show') { const parent = host.parentNode; host.remove(); parent.append(host); host.show(); }
      else if (method === 'show') host.show();
      else if (method === 'property') host.open = true;
      else {
        const replacement = document.createElement('en-command-palette') as any;
        replacement.id = host.id; replacement.commands = host.commands; replacement.open = true;
        host.replaceWith(replacement); host = replacement;
      }
      await host.updateComplete;
    }, method);
    await expect(input(page)).toBeFocused();
    await expect(palette(page).getByRole('option', { name: 'Current command', exact: true })).toBeVisible();
    expect(await input(page).evaluate(element => {
      const root = element.getRootNode() as ShadowRoot;
      const list = root.getElementById(element.getAttribute('aria-controls')!);
      const active = root.getElementById(element.getAttribute('aria-activedescendant')!);
      return { expanded: element.getAttribute('aria-expanded'), list: list?.getAttribute('role'), active: active?.getAttribute('role'), owned: !!active && !!list?.contains(active) };
    })).toEqual({ expanded: 'true', list: 'listbox', active: 'option', owned: true });
  });
}

test('accepted close resets the query while close/reopen retains the same native editor', async ({ page }) => {
  const original = await input(page).elementHandle();
  await expect(input(page)).toHaveCount(1);
  await page.locator('#content-trigger').click(); await input(page).fill('download');
  await palette(page).evaluate((host: any) => host.addEventListener('en-change', (event: Event) => event.preventDefault(), { once: true }));
  await input(page).press('Escape'); await expect(input(page)).toHaveValue('download');
  await input(page).press('Escape'); await expect(page.locator('#content-trigger')).toBeFocused();
  await page.locator('#content-trigger').click(); await expect(input(page)).toHaveValue(''); await expect(input(page)).toBeFocused();
  expect(await input(page).evaluate((element, before) => element === before, original)).toBe(true);
  await original?.dispose();
});

for (const tree of ['ordinary', 'shadow', 'nested'] as const) {
  test(`owning registry, eager siblings and isolated opening in ${tree} roots`, async ({ page, browserName }, info) => {
    const result = await page.evaluate(async tree => {
      const { createElementScope, elementScopeCapabilities } = await import('@en-reve/elements/element-scope.js');
      const { commandPaletteDefinition } = await import('@en-reve/elements/definitions/command-palette.js');
      const scope = createElementScope({ document }); scope.register([commandPaletteDefinition]);
      let root: Element | ShadowRoot = scope.createElement('section'); document.body.append(root);
      if (tree !== 'ordinary') root = scope.attachShadow(root);
      if (tree === 'nested') { const inside = scope.createElement('section'); root.append(inside); root = scope.attachShadow(inside); }
      const hosts = Array.from({ length: 10 }, () => {
        const host = scope.createElement('en-command-palette') as any;
        host.commands = (window as any).commandsFixture.commands; root.append(host); return host;
      });
      await Promise.all(hosts.map(host => host.updateComplete));
      const eagerInput = hosts[0].shadowRoot.querySelector('input');
      const inputs = hosts.map(host => host.shadowRoot.querySelector('input'));
      const populated = inputs.every(Boolean);
      hosts[1].show(); await hosts[1].updateComplete;
      const active = hosts[1], close = active.shadowRoot.querySelector('en-button');
      return { mode: scope.mode, native: elementScopeCapabilities(document).native, populated,
        oneOpen: hosts.filter(host => host.open).length === 1,
        retainedInputs: hosts.every((host, index) => inputs[index] === host.shadowRoot.querySelector('input')),
        eagerRetained: eagerInput === hosts[0].shadowRoot.querySelector('input'),
        ownedHost: active instanceof scope.get('en-command-palette')!, ownedChild: close instanceof scope.get('en-button')!,
        ownedRoot: !('customElementRegistry' in active.shadowRoot) || active.shadowRoot.customElementRegistry === scope.registry,
        focused: active.shadowRoot.activeElement === active.shadowRoot.querySelector('input') };
    }, tree);
    expect(result).toEqual({ mode: result.native ? 'scoped' : 'global', native: result.native, populated: true, oneOpen: true, retainedInputs: true, eagerRetained: true, ownedHost: true, ownedChild: true, ownedRoot: true, focused: true });
    info.annotations.push({ type: 'actual-registry-mode', description: `${browserName}: ${result.mode}` });
  });
}

test('null-associated host stays dormant through registration until explicit initialization', async ({ page }, info) => {
  const result = await page.evaluate(async () => {
    const { createElementScope, elementScopeCapabilities } = await import('@en-reve/elements/element-scope.js');
    if (!elementScopeCapabilities(document).dormant) return null;
    const { commandPaletteDefinition } = await import('@en-reve/elements/definitions/command-palette.js');
    const scope = createElementScope({ document }); scope.register([commandPaletteDefinition]);
    const root = document.createElement('section', { customElementRegistry: null } as any);
    root.innerHTML = '<en-command-palette></en-command-palette>';
    const host = root.firstElementChild as any; host.commands = (window as any).commandsFixture.commands; document.body.append(root);
    const dormant = !host.shadowRoot && host.customElementRegistry === null;
    scope.initialize(root); scope.upgrade(root); await host.updateComplete;
    const original = host.shadowRoot.querySelector('input'); host.show(); await host.updateComplete;
    return { dormant, retained: !!original && original === host.shadowRoot.querySelector('input'), opened: host.open, owned: host instanceof scope.get('en-command-palette')! };
  });
  test.skip(result === null, 'Actual engine does not support null registry association.');
  info.annotations.push({ type: 'actual-registry-mode', description: 'native null association with explicit initialization' });
  expect(result).toEqual({ dormant: true, retained: true, opened: true, owned: true });
});

for (const previouslyOpened of [false, true]) test(`${previouslyOpened ? 'previously opened' : 'never opened'} adoption and reconnect preserve native editing and destination focus ownership`, async ({ page }, info) => {
  const results = await page.evaluate(async previouslyOpened => {
    // Run every arm in this browser with the same authored slots, source trigger,
    // destination opener, adoption and queued native-modal reopening sequence.
    // Native showModal owns focus and may adjust a retained input's selection.
    document.querySelector('#content-palette')!.remove();
    document.querySelector('#content-trigger')!.remove();
    const run = async (kind: 'native' | 'eager') => {
      const trigger = document.createElement('button'); trigger.id = 'content-trigger'; trigger.textContent = 'Open commands';
      const host = document.createElement(kind === 'native' ? 'div' : 'en-command-palette') as any;
      host.id = 'content-palette';
      host.innerHTML = '<p id="content-help">Authored supporting content</p><button slot="footer" type="button">Authored footer</button>';
      if (kind === 'native') {
        host.attachShadow({ mode: 'open' }).innerHTML = '<dialog><input type="text" autofocus value=""><slot></slot><slot name="footer"></slot></dialog>';
      } else {
        host.for = trigger.id; host.commands = (window as any).commandsFixture.commands;
      }
      const input = () => host.shadowRoot.querySelector('input') as HTMLInputElement | null;
      const dialog = () => host.shadowRoot.querySelector('dialog') as HTMLDialogElement;
      const selection = () => [input()!.selectionStart, input()!.selectionEnd, input()!.selectionDirection];
      let nativeIntent = false, nativeUpdate = Promise.resolve();
      const queueNativeOpen = () => {
        nativeUpdate = Promise.resolve().then(() => {
          if (host.isConnected && nativeIntent && !dialog().open) dialog().showModal();
        });
      };
      const append = (parent: Node) => { parent.appendChild(host); if (kind === 'native') queueNativeOpen(); };
      const remove = () => { host.remove(); if (kind === 'native') dialog().close(); };
      const update = async () => { if (kind === 'native') await nativeUpdate; else await host.updateComplete; };
      const show = () => { if (kind === 'native') { nativeIntent = true; queueNativeOpen(); } else host.show(); };
      const parent = document.querySelector('main')!;
      let frame: HTMLIFrameElement | undefined;
      parent.append(trigger); append(parent);
      try {
        await update();
        remove(); append(parent); await update();
        const initiallyConstructed = !!input();
        if (previouslyOpened) {
          show(); await update();
          input()!.value = 'download'; input()!.setSelectionRange(1, 4, 'backward');
          input()!.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true })); await update();
        }
        const before = input();
        frame = document.createElement('iframe'); document.body.append(frame);
        const target = frame.contentDocument!;
        const opener = target.createElement('button'); opener.id = 'content-trigger'; opener.textContent = 'Destination commands'; target.body.append(opener);
        remove(); target.adoptNode(host); opener.focus(); append(target.body);
        if (!previouslyOpened) show(); await update();
        const root = host.shadowRoot, nativeInput = input()!;
        const firstFocused = root.activeElement === nativeInput && target.activeElement === host;
        const queryAfterAdoption = nativeInput.value;
        const beforeReopen: { phase: string; selection: (number | string | null)[]; query: string; retainedInput: boolean }[] = [];
        const checkpoint = (phase: string) => beforeReopen.push({ phase, selection: selection(), query: input()!.value, retainedInput: input() === nativeInput });
        nativeInput.value = 'download'; nativeInput.setSelectionRange(1, 4, 'backward'); checkpoint('after-setSelectionRange');
        nativeInput.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true })); checkpoint('after-input-dispatch');
        await update(); checkpoint('after-query-update');
        remove(); checkpoint('after-removal'); opener.focus(); checkpoint('after-opener-focus'); append(target.body); checkpoint('after-reinsertion');
        await update();
        const snapshot = () => ({ retainedRoot: root === host.shadowRoot, retainedInput: nativeInput === input(),
          query: input()!.value, selection: selection(), modal: dialog().open && dialog().matches(':modal'),
          focused: root.activeElement === nativeInput && target.activeElement === host });
        const afterReconnect = snapshot();
        await new Promise<void>(resolve => target.defaultView!.requestAnimationFrame(() => target.defaultView!.requestAnimationFrame(() => resolve())));
        const afterTwoFrames = snapshot();
        const result = { initiallyConstructed, firstFocused, targetDocument: nativeInput.ownerDocument === target,
          retainedAcrossAdoption: before === nativeInput,
          queryAfterAdoption, beforeReopen, afterReconnect, afterTwoFrames, returned: false };
        if (kind === 'native') { nativeIntent = false; dialog().close(); } else host.hide();
        await update(); result.returned = target.activeElement === opener;
        return result;
      } finally { remove(); trigger.remove(); frame?.remove(); }
    };
    return { native: await run('native'), eager: await run('eager') };
  }, previouslyOpened);
  await info.attach('command-native-lifecycle-parity', { body: JSON.stringify(results, null, 2), contentType: 'application/json' });
  for (const [kind, result] of Object.entries(results)) {
    expect(result.beforeReopen, `${kind}: selection is intact until native reopening`).toEqual([
      'after-setSelectionRange', 'after-input-dispatch', 'after-query-update', 'after-removal', 'after-opener-focus', 'after-reinsertion',
    ].map(phase => ({ phase, selection: [1, 4, 'backward'], query: 'download', retainedInput: true })));
    const stable = { retainedRoot: true, retainedInput: true, query: 'download', modal: true, focused: true };
    expect(result, kind).toEqual({ initiallyConstructed: true, firstFocused: true, targetDocument: true,
      retainedAcrossAdoption: true, queryAfterAdoption: previouslyOpened ? 'download' : '', beforeReopen: result.beforeReopen,
      afterReconnect: { ...stable, selection: results.native.afterReconnect.selection },
      afterTwoFrames: { ...stable, selection: results.native.afterTwoFrames.selection }, returned: true });
  }
});

test('removal before opening settles retains the editor and resumes modality on reconnect', async ({ page }) => {
  const result = await palette(page).evaluate(async (host: any) => {
    const parent = host.parentNode, original = host.shadowRoot.querySelector('input');
    const outcome = host.show(); host.remove(); await host.updateComplete;
    const detached = { content: !!original && original === host.shadowRoot.querySelector('input'), modal: host.shadowRoot.querySelector('dialog').open, open: host.open };
    parent.append(host); await host.updateComplete;
    return { outcome, detached, content: original === host.shadowRoot.querySelector('input'), modal: host.shadowRoot.querySelector('dialog').open };
  });
  expect(result).toEqual({ outcome: 'committed', detached: { content: true, modal: false, open: true }, content: true, modal: true });
  await expect(input(page)).toBeFocused();
});


test('registration upgrades preconfigured siblings with eager bodies without opening them', async ({ page, browserName }, info) => {
  await page.goto('/fixture?skip-palette-definition');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  const result = await page.evaluate(async () => {
    const { createElementScope, elementScopeCapabilities } = await import('@en-reve/elements/element-scope.js');
    const { commandPaletteDefinition } = await import('@en-reve/elements/definitions/command-palette.js');
    const scope = createElementScope({ document });
    const root = scope.createElement('section'); document.body.append(root);
    const hosts = Array.from({ length: 3 }, () => {
      const host = scope.createElement('en-command-palette') as any;
      host.commands = (window as any).commandsFixture.commands; root.append(host); return host;
    });
    const initiallyUndefined = hosts.every(host => !host.shadowRoot && !('updateComplete' in host));
    scope.register([commandPaletteDefinition]); scope.upgrade(root);
    await Promise.all(hosts.map(host => host.updateComplete));
    const afterRegistration = hosts.map(host => !!host.shadowRoot.querySelector('input'));
    const closedAfterRegistration = hosts.every(host => !host.open && !host.shadowRoot.querySelector('dialog').open);
    const renderedCatalogs = hosts.map(host => [...host.shadowRoot.querySelectorAll('[role="option"]')].map((option: HTMLElement) => option.dataset.action));
    hosts[1].show(); await hosts[1].updateComplete;
    return { initiallyUndefined, afterRegistration, closedAfterRegistration, renderedCatalogs, openStates: hosts.map(host => host.open), afterOpen: hosts.map(host => !!host.shadowRoot.querySelector('input')),
      queryLabel: hosts[1].shadowRoot.querySelector('label').textContent, commandCount: hosts[1].commands.length,
      mode: scope.mode, native: elementScopeCapabilities(document).native };
  });
  expect(result).toEqual({ initiallyUndefined: true, afterRegistration: [true, true, true], closedAfterRegistration: true, renderedCatalogs: Array.from({ length: 3 }, () => ['copy', 'delete', 'download', 'rename']), openStates: [false, true, false], afterOpen: [true, true, true], queryLabel: 'Search commands', commandCount: 4, mode: result.native ? 'scoped' : 'global', native: result.native });
  info.annotations.push({ type: 'actual-registry-mode', description: `${browserName}: ${result.mode}; definitions registered after connected property-bearing siblings` });
});


test('automatic scope falls back before construction when its native capability probe fails', async ({ page }, info) => {
  const result = await page.evaluate(async () => {
    const { createElementScope } = await import('@en-reve/elements/element-scope.js');
    const { commandPaletteDefinition } = await import('@en-reve/elements/definitions/command-palette.js');
    const descriptor = Object.getOwnPropertyDescriptor(window, 'CustomElementRegistry')!;
    let scope;
    try {
      Object.defineProperty(window, 'CustomElementRegistry', { configurable: true, value: function () { throw new Error('Injected native capability probe failure'); } });
      scope = createElementScope({ document });
    } finally { Object.defineProperty(window, 'CustomElementRegistry', descriptor); }
    scope.register([commandPaletteDefinition]);
    const hosts = Array.from({ length: 2 }, () => {
      const host = scope.createElement('en-command-palette') as any;
      host.commands = (window as any).commandsFixture.commands; document.body.append(host); return host;
    });
    await Promise.all(hosts.map(host => host.updateComplete));
    const populated = hosts.every(host => !!host.shadowRoot.querySelector('input'));
    hosts[0].show(); await hosts[0].updateComplete;
    return { mode: scope.mode, global: scope.registry === customElements, populated, first: !!hosts[0].shadowRoot.querySelector('input'),
      sibling: !!hosts[1].shadowRoot.querySelector('input') && !hosts[1].open, focused: hosts[0].shadowRoot.activeElement === hosts[0].shadowRoot.querySelector('input') };
  });
  expect(result).toEqual({ mode: 'global', global: true, populated: true, first: true, sibling: true, focused: true });
  info.annotations.push({ type: 'registry-failure-injection', description: 'Native registry construction probe throws; automatic global fallback chosen before host creation. Distinct from the actual unsupported-engine cases.' });
});
