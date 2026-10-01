import {test, expect, type Page} from '@playwright/test';

const pager = (page: Page, index = 0) => page.locator(`#pagination-${index}`);
const input = (page: Page, index = 0) => pager(page, index).getByRole('spinbutton', {name: 'Page number'});
const trigger = (page: Page, index = 0) => pager(page, index).locator('[part~=direct-summary]:visible').first();
const panel = (page: Page, index = 0) => pager(page, index).locator('[part~=direct]');
async function open(page: Page, mode: string, boundary = 'ordinary') {
  await page.goto(`/index.html?boundary=${boundary}${mode === 'global' ? '&global' : ''}`);
  await page.waitForFunction(() => Boolean((window as any).paginationFixture));
  await page.evaluate(() => (window as any).paginationFixture.ready);
}
async function choose(page: Page) {
  await trigger(page).click(); await expect(input(page)).toBeFocused(); return input(page);
}
async function state(page: Page) { return page.evaluate(() => (window as any).paginationFixture.state()); }
test.beforeEach(({page}) => {
  const errors: string[] = []; (page as any).paginationErrors = errors;
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {if (['error', 'warning'].includes(message.type()) && /hydrat|template.*mismatch|mismatch.*template/i.test(message.text())) errors.push(message.text());});
});
test.afterEach(({page}) => expect((page as any).paginationErrors).toEqual([]));

test('forced unsupported scope capability: auto uses the real global registry and native chooser', async ({page}, info) => {
  await page.addInitScript(() => {
    // Model a realm without constructible scoped registries. Keep its native
    // global customElements registry and all component/DOM APIs untouched.
    window.CustomElementRegistry = new Proxy(window.CustomElementRegistry, {
      construct() { throw new TypeError('Packed fixture: scoped registry construction unavailable'); },
    });
  });
  await open(page, 'auto', 'shared');
  const before = await state(page);
  expect(before.nativeCapability).toBe(false); expect(before.actual).toEqual(['global']);
  expect(before.sharedRegistry).toBe(true); expect(before.entries.map((entry: any) => entry.bodies)).toEqual([1, 1]);
  await pager(page, 1).getByRole('button', {name: 'Page 4', exact: true}).click();
  await expect(pager(page, 1)).toHaveJSProperty('page', 4); await expect(pager(page, 1).locator('[part~=jump]')).toHaveCount(1);
  await choose(page);
  expect((await state(page)).entries.map((entry: any) => entry.bodies)).toEqual([1, 1]);
  await expect(pager(page).getByRole('button', {name: 'Page 3', exact: true})).toHaveAttribute('aria-current', 'page');
  await info.attach('forced-capability-fallback', {body: JSON.stringify({requested: 'auto', actual: before.actual, forcedUnavailableConstructor: true}), contentType: 'application/json'});
});

for (const mode of ['auto', 'global']) for (const boundary of ['ordinary', 'shadow', 'nested', 'shared']) {
  test(`${mode}/${boundary}: native opening preserves both eager siblings and preserves essential controls`, async ({page}, info) => {
    await open(page, mode, boundary);
    const before = await state(page), actual = mode === 'global' || !before.nativeCapability ? 'global' : 'scoped';
    expect(before.actual.every((value: string) => value === actual)).toBe(true);
    expect(before.sharedRegistry).toBe(boundary === 'shared' || actual === 'global');
    expect(before.globalLeak).toBe(false);
    expect(before.entries.map((entry: any) => entry.bodies)).toEqual([1, 1]);
    await expect(pager(page).getByRole('navigation', {name: 'Result pages 0'})).toBeVisible();
    await expect(pager(page).getByRole('button', {name: 'Page 3', exact: true})).toHaveAttribute('aria-current', 'page');
    await expect(pager(page).locator('[part~=expanded-status]')).toHaveText('Page 3 of 12');
    await choose(page);
    const after = await state(page);
    expect(after.entries.map((entry: any) => entry.inputs)).toEqual([1, 1]);
    expect(after.entries[0].openings).toEqual([{body: 1, input: 1, during: true}]);
    expect(after.entries.every((entry: any) => entry.sameShadow && entry.samePanel && entry.samePages && entry.sameAuthored && entry.sameSlots && entry.slotsAssigned && entry.constructorOwned && entry.nativeOnly)).toBe(true);
    expect(after.entries.every((entry: any) => entry.events.length === 0 && entry.page === 3)).toBe(true);
    await input(page).fill('8'); await page.keyboard.press('Escape');
    await expect(panel(page)).not.toBeVisible();
    await expect(pager(page).locator('[part~=direct-summary]:focus')).toHaveCount(1);
    await expect(pager(page, 1).locator('[part~=jump]')).toHaveCount(1);
    await info.attach('registry-mode', {body: JSON.stringify({requested: mode, actual, boundary, sharedRegistry: before.sharedRegistry, nativeCapability: before.nativeCapability}), contentType: 'application/json'});
  });
}

for (const mode of ['auto', 'global']) {
  test(`${mode}: unrelated updates preserve the eager native draft`, async ({page}) => {
    await open(page, mode, 'ordinary');
    await expect(pager(page).locator('[part~=jump]')).toHaveCount(1);
    const field = await choose(page); await field.fill('8');
    const identity = await pager(page).evaluate(async (host: any) => {
      const field = host.shadowRoot.querySelector('input'); host.label = 'Updated pages'; await host.updateComplete;
      return {same: field === host.shadowRoot.querySelector('input'), draft: field.value};
    });
    expect(identity).toEqual({same: true, draft: '8'}); await expect(field).toBeFocused();
  });

  test(`${mode}: closing retains the eager input and draft`, async ({page}) => {
    await open(page, mode);
    const identity = await pager(page).evaluate(async (host: any) => {
      const field = host.shadowRoot.querySelector('input');
      host.label = 'Updated pages'; await host.updateComplete;
      (window as any).retainedPaginationInput = field;
      return field === host.shadowRoot.querySelector('input');
    });
    expect(identity).toBe(true);
    const field = await choose(page); await field.fill('10');
    await pager(page).getByRole('button', {name: 'Cancel', exact: true}).click();
    await expect(panel(page)).not.toBeVisible(); await choose(page);
    await expect(field).toHaveValue('10');
    expect(await pager(page).evaluate((host: any) => (window as any).retainedPaginationInput === host.shadowRoot.querySelector('input'))).toBe(true);
    await expect(pager(page).locator('[part~=jump]')).toHaveCount(1);
  });

  for (const key of ['Enter', 'Space']) test(`${mode}: first ${key} activation opens the fully constructed native chooser`, async ({page}) => {
    await open(page, mode); await trigger(page).focus(); await trigger(page).press(key);
    await expect(input(page)).toBeFocused(); await expect(panel(page)).toBeVisible();
    expect((await state(page)).entries[0].openings).toEqual([{body: 1, input: 1, during: true}]);
    expect((await state(page)).entries[1].bodies).toBe(1);
  });

  test(`${mode}: direct native opening is synchronous and a canceled opening retains its constructed body`, async ({page}) => {
    await open(page, mode);
    const result = await panel(page).evaluate((element: HTMLElement) => {
      element.addEventListener('beforetoggle', event => {if ((event as ToggleEvent).newState === 'open') event.preventDefault();}, {once: true});
      element.showPopover();
      const first = {open: element.matches(':popover-open'), inputs: element.querySelectorAll('input').length};
      const field = element.querySelector('input');
      element.showPopover();
      const second = {open: element.matches(':popover-open'), sameInput: field === element.querySelector('input')};
      element.hidePopover();
      return {first, second, closed: !element.matches(':popover-open')};
    });
    expect(result).toEqual({first: {open: false, inputs: 1}, second: {open: true, sameInput: true}, closed: true});
    expect((await state(page)).entries[0].openings).toEqual([{body: 1, input: 1, during: true}, {body: 1, input: 1, during: true}]);
  });

  test(`${mode}: native validity and cancelable page selection retain drafts, authority and invoker focus`, async ({page}) => {
    await open(page, mode); const field = await choose(page);
    await field.fill('13'); await pager(page).getByRole('button', {name: 'Go to page', exact: true}).click();
    await expect(pager(page)).toHaveJSProperty('page', 3); expect((await state(page)).entries[0].events).toEqual([]);
    await pager(page).evaluate((host: any) => host.addEventListener('en-change', (event: Event) => event.preventDefault(), {once: true}));
    await field.fill('7'); await field.press('Enter');
    await expect(pager(page)).toHaveJSProperty('page', 3); await expect(panel(page)).toBeVisible(); await expect(field).toHaveValue('7');
    expect((await state(page)).entries[0].events).toEqual([{detail: {previous: 3, proposed: 7, reason: 'page'}, during: 7}]);
    await pager(page).evaluate((host: any) => host.addEventListener('en-change', (event: Event) => {host.page = 6; event.preventDefault();}, {once: true}));
    await field.fill('8'); await pager(page).getByRole('button', {name: 'Go to page', exact: true}).click();
    await expect(pager(page)).toHaveJSProperty('page', 6); await expect(panel(page)).toBeVisible();
    await field.fill('9'); await field.press('Enter');
    await expect(pager(page)).toHaveJSProperty('page', 9); await expect(panel(page)).not.toBeVisible();
    await expect(pager(page).locator('[part~=direct-summary]:focus')).toHaveCount(1);
    expect((await state(page)).entries[0].events).toEqual([
      {detail: {previous: 3, proposed: 7, reason: 'page'}, during: 7},
      {detail: {previous: 3, proposed: 8, reason: 'page'}, during: 8},
      {detail: {previous: 6, proposed: 9, reason: 'page'}, during: 9},
    ]);
    expect((await state(page)).entries[1].page).toBe(3);
  });

  test(`${mode}: disabled and known-count thresholds keep essential navigation while unknown totals remove the chooser`, async ({page}) => {
    await open(page, mode);
    await pager(page).evaluate(async (host: any) => {host.disabled = true; await host.updateComplete;});
    await expect(trigger(page)).toBeDisabled(); await trigger(page).evaluate((button: HTMLButtonElement) => button.click());
    await expect(pager(page).locator('[part~=jump]')).toHaveCount(1);
    await pager(page).evaluate(async (host: any) => {host.disabled = false; host.pageCount = 5; await host.updateComplete;});
    await expect(pager(page).locator('[part~=page]')).toHaveCount(5); await expect(pager(page).locator('[part~=jump]')).toHaveCount(1);
    await pager(page).evaluate(async (host: any) => {host.pageCount = 7; await host.updateComplete;});
    await expect(pager(page).locator('[part~=page]')).toHaveCount(7); await expect(pager(page).locator('[part~=jump]')).toHaveCount(1);
    const field = await choose(page); await expect(field).toHaveAttribute('max', '7');
    await pager(page).evaluate(async (host: any) => {host.pageCount = 12; await host.updateComplete;});
    await expect(field).toHaveAttribute('max', '12');
    await pager(page).evaluate(async (host: any) => {host.disabled = true; await host.updateComplete;});
    await expect(panel(page)).not.toBeVisible(); await expect(pager(page).locator('[part~=page-input]')).toBeDisabled();
    await pager(page).evaluate(async (host: any) => {host.disabled = false; host.pageCount = 0; host.hasNext = true; await host.updateComplete;});
    await expect(panel(page)).toHaveCount(0); await expect(pager(page).locator('[part~=page]')).toHaveCount(0);
    await expect(pager(page).getByRole('button', {name: 'Next page', exact: true})).toBeEnabled();
    await expect(pager(page).locator('[part~=expanded-status]')).toHaveText('Page 3');
    await pager(page).evaluate(async (host: any) => {host.pageCount = 12; await host.updateComplete;});
    await expect(pager(page).locator('[part~=jump]')).toHaveCount(1); await choose(page); await expect(field).toHaveAttribute('max', '12');
    expect((await state(page)).entries[0].events).toEqual([]);
  });

  test(`${mode}: cold removal and removal during native opening leave external focus intact and reconnect one body`, async ({page}) => {
    await open(page, mode, 'nested');
    await page.evaluate(async () => {
      const f = (window as any).paginationFixture, entry = f.entries[0];
      entry.host.remove(); document.querySelector<HTMLInputElement>('#essential')!.focus();
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    });
    await expect(page.locator('#essential')).toBeFocused();
    expect((await state(page)).entries[0].bodies).toBe(1);
    await page.evaluate(async () => {
      const f = (window as any).paginationFixture, entry = f.entries[0]; entry.root.append(entry.host); await entry.host.updateComplete;
      entry.host.shadowRoot.querySelector('[part~=direct]').showPopover();
      f.retainedInput = entry.host.shadowRoot.querySelector('input'); entry.host.remove();
      document.querySelector<HTMLInputElement>('#essential')!.focus();
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    });
    await expect(page.locator('#essential')).toBeFocused();
    await page.evaluate(async () => {const f = (window as any).paginationFixture, entry = f.entries[0]; entry.root.append(entry.host); await entry.host.updateComplete;});
    await choose(page); await expect(input(page)).toBeFocused();
    expect(await page.evaluate(() => {const f = (window as any).paginationFixture; return f.retainedInput === f.entries[0].host.shadowRoot.querySelector('input');})).toBe(true);
    await expect(pager(page).locator('[part~=jump]')).toHaveCount(1);
  });
}

for (const mode of ['auto', 'global']) for (const warm of [false, true]) {
  test(`${mode}: ${warm ? 'used' : 'cold'} adoption into another document opens one destination chooser and restores destination focus`, async ({page}, info) => {
    await open(page, mode, 'shadow');
    if (warm) {const field = await choose(page); await field.fill('10'); await field.press('Escape');}
    await page.evaluate(mode => {
      const iframe = document.createElement('iframe'); iframe.id = 'adoption-frame'; iframe.src = `/index.html?boundary=shadow${mode === 'global' ? '&global' : ''}`; document.body.append(iframe);
    }, mode);
    const frame = page.frameLocator('#adoption-frame');
    await expect(frame.locator('#pagination-0')).toHaveJSProperty('pageCount', 12);
    const before = await page.evaluate(async () => {
      const f = (window as any).paginationFixture, iframe = document.querySelector<HTMLIFrameElement>('#adoption-frame')!, target = (iframe.contentWindow as any).paginationFixture;
      await target.ready;
      const host = f.entries[0].host, oldInput = host.shadowRoot.querySelector('input'), oldShell = host.shadowRoot.querySelector('[part~=direct]');
      const oldNumbered = [...host.shadowRoot.querySelectorAll('[part~=page]')], oldCurrent = host.shadowRoot.querySelector('[aria-current=page]');
      target.entries[0].host.remove(); host.id = 'adopted-pagination'; iframe.contentDocument!.adoptNode(host); target.entries[0].root.append(host); await host.updateComplete;
      target.adopted = {host, oldInput, oldShell, oldNumbered, oldCurrent}; document.querySelector<HTMLInputElement>('#essential')!.focus();
      return {requested: f.requested, sourceModes: f.scopes.map((scope: any) => scope.mode), destinationModes: target.scopes.map((scope: any) => scope.mode), sameShell: oldShell === host.shadowRoot.querySelector('[part~=direct]'), sameDocument: host.ownerDocument === iframe.contentDocument};
    });
    expect(before.sameShell).toBe(true); expect(before.sameDocument).toBe(true); await expect(page.locator('#essential')).toBeFocused();
    const adopted = frame.locator('#adopted-pagination'), field = adopted.getByRole('spinbutton', {name: 'Page number'});
    await expect(adopted.locator('[part~=jump]')).toHaveCount(1);
    await adopted.locator('[part~=direct-summary]:visible').first().click(); await expect(field).toBeFocused();
    await expect(field).toHaveValue(warm ? '10' : '3');
    const after = await adopted.evaluate((host: any) => {
      const target = (host.ownerDocument.defaultView as any).paginationFixture;
      const numbered = [...host.shadowRoot.querySelectorAll('[part~=page]')];
      return {sameInput: target.adopted.oldInput === host.shadowRoot.querySelector('input'), bodies: host.shadowRoot.querySelectorAll('[part~=jump]').length, focused: host.shadowRoot.activeElement === host.shadowRoot.querySelector('input'), siblingBodies: target.entries[1].host.shadowRoot.querySelectorAll('[part~=jump]').length,
        sameNumbered: numbered.length === target.adopted.oldNumbered.length && numbered.every((node, index) => node === target.adopted.oldNumbered[index]), sameCurrent: target.adopted.oldCurrent === host.shadowRoot.querySelector('[aria-current=page]')};
    });
    expect(after).toEqual({sameInput: true, bodies: 1, focused: true, siblingBodies: 1, sameNumbered: true, sameCurrent: true});
    await field.press('Escape'); await expect(adopted.locator('[part~=direct-summary]:focus')).toHaveCount(1);
    await expect(adopted.getByRole('button', {name: 'Page 3', exact: true})).toHaveAttribute('aria-current', 'page');
    await info.attach('adoption-registry-modes', {body: JSON.stringify({...before, warm, after}), contentType: 'application/json'});
  });
}

