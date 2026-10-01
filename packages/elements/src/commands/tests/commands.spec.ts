import { expect, test, type Page } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { actions, item, menu, menuTrigger, openPalette, option, palette, paletteTrigger, search, settle, tabKey, tool } from './helpers.js';
const errors = new WeakMap<Page, string[]>();
async function tabWithinNativeModal(page: Page, browserName: string, reverse = false) {
  await page.keyboard.press(tabKey(browserName, reverse));
  // Native dialogs can yield to browser chrome at a document boundary. That is
  // not a background-page focus stop, and the next Tab returns to the modal.
  const inChrome = await page.evaluate(() => !document.hasFocus() && document.activeElement === document.body);
  if (inChrome) await page.keyboard.press(tabKey(browserName, reverse));
}
test.beforeEach(async ({ page, browser }, info) => {
  const messages: string[] = []; errors.set(page, messages);
  page.on('pageerror', error => messages.push(error.message));
  page.on('response', response => { if (response.status() >= 400) messages.push(`${response.status()} ${response.url()}`); });
  info.annotations.push({ type: 'browser-version', description: browser.version() });
  await page.goto('/fixture'); await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
});
test.afterEach(async ({ page }, info) => {
  const messages = errors.get(page) ?? [];
  if (messages.length) await info.attach('runtime-errors', { body: JSON.stringify(messages), contentType: 'application/json' });
  expect(messages).toEqual([]);
  expect(await page.evaluate(() => (window as any).commandsFixture.submissions)).toEqual([]);
});

test('menu keyboard opening discovers disabled commands and supports endpoints, typeahead and Escape', async ({ page }) => {
  await menuTrigger(page).focus(); await page.keyboard.press('ArrowDown');
  await expect(menu(page).getByRole('menu', { name: 'Document actions' })).toBeVisible();
  await expect(item(page, 'Copy')).toBeFocused();
  await expect(menuTrigger(page)).toHaveAttribute('aria-haspopup', 'menu');
  await expect(menuTrigger(page)).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('ArrowDown'); await expect(item(page, 'Delete')).toBeFocused();
  await expect(item(page, 'Delete')).toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('Enter'); await page.keyboard.press('Space');
  expect(await actions(page)).toEqual([]); await expect(menu(page)).toHaveJSProperty('open', true);
  await page.keyboard.press('ArrowDown'); await expect(item(page, 'Download file')).toBeFocused();
  await page.keyboard.press('End'); await expect(item(page, 'Rename')).toBeFocused();
  await page.keyboard.press('Home'); await expect(item(page, 'Copy')).toBeFocused();
  await page.keyboard.press('r'); await expect(item(page, 'Rename')).toBeFocused();
  await page.keyboard.press('Escape'); await expect(menuTrigger(page)).toBeFocused();
  await expect(menuTrigger(page)).toHaveAttribute('aria-expanded', 'false');
  await page.keyboard.press('ArrowUp'); await expect(item(page, 'Rename')).toBeFocused();
});

test('native click, Enter and Space each dispatch exactly one menu action without submitting the form', async ({ page }) => {
  for (const method of ['pointer', 'Enter', 'Space']) {
    if (method === 'pointer') await menuTrigger(page).click();
    else { await menuTrigger(page).focus(); await page.keyboard.press(method); }
    await expect(item(page, 'Copy')).toBeFocused();
    if (method === 'pointer') await item(page, 'Copy').click(); else await page.keyboard.press(method);
    await expect(menu(page)).toHaveJSProperty('open', false);
    await expect(menuTrigger(page)).toBeFocused();
  }
  expect((await actions(page)).map((event: any) => [event.target, event.action, event.cancelable])).toEqual([
    ['copy', 'copy', true], ['copy', 'copy', true], ['copy', 'copy', true],
  ]);
});

test('menu Tab and Shift+Tab leave naturally; outside focus is not pulled back', async ({ page, browserName }) => {
  await menuTrigger(page).click(); await expect(item(page, 'Copy')).toBeFocused();
  await page.keyboard.press(tabKey(browserName));
  await expect(page.locator('#after-menu')).toBeFocused(); await expect(menu(page)).toHaveJSProperty('open', false);
  await menuTrigger(page).click(); await expect(item(page, 'Copy')).toBeFocused();
  await page.keyboard.press(tabKey(browserName, true));
  await expect(menuTrigger(page)).toBeFocused(); await expect(menu(page)).toHaveJSProperty('open', false);
  await menuTrigger(page).click(); await page.locator('#outside').click();
  await expect(page.locator('#outside')).toBeFocused(); await expect(menu(page)).toHaveJSProperty('open', false);
  await page.keyboard.type('!'); await expect(page.locator('#outside')).toHaveValue(/!/);
});

for (const nativeTrigger of [false, true]) test(`menu Tab follows its ${nativeTrigger ? 'native' : 'custom'} trigger when controls precede the menu host`, async ({ page, browserName }) => {
  await page.evaluate(native => {
    if (native) {
      const trigger = document.createElement('button');
      trigger.id = 'menu-trigger'; trigger.type = 'button'; trigger.textContent = 'More actions';
      document.getElementById('menu-trigger')!.replaceWith(trigger);
    }
    document.getElementById('menu')!.before(document.getElementById('after-menu')!);
  }, nativeTrigger);
  await settle(page);
  const trigger = nativeTrigger ? page.locator('button#menu-trigger') : menuTrigger(page);
  await trigger.focus(); await trigger.press('ArrowDown');
  await expect(item(page, 'Copy')).toBeFocused();
  await page.keyboard.press(tabKey(browserName));
  await expect(page.locator('#after-menu')).toBeFocused();
  await expect(menu(page)).toHaveJSProperty('open', false);
  await trigger.focus(); await trigger.press('ArrowUp');
  await expect(item(page, 'Rename')).toBeFocused();
  await page.keyboard.press(tabKey(browserName, true));
  await expect(trigger).toBeFocused();
  await expect(menu(page)).toHaveJSProperty('open', false);
});

for (const response of ['cancel', 'author-write', 'redirect'] as const) test(`menu Tab preserves consumer ${response} ownership`, async ({ page, browserName }) => {
  await menuTrigger(page).click(); await expect(item(page, 'Copy')).toBeFocused();
  await page.evaluate(response => {
    (window as any).tabTriggerFocusCount = 0;
    document.getElementById('menu-trigger')!.addEventListener('focusin', () => { (window as any).tabTriggerFocusCount++; });
    document.getElementById('menu')!.addEventListener('en-change', event => {
      if ((event as CustomEvent).detail.reason !== 'tab') return;
      if (response === 'cancel') event.preventDefault();
      if (response === 'author-write') { (event.target as any).open = false; event.preventDefault(); }
      if (response === 'redirect') document.getElementById('outside')!.focus();
    });
  }, response);
  await page.keyboard.press(tabKey(browserName));
  await expect(menu(page)).toHaveJSProperty('open', response === 'cancel');
  expect(await page.evaluate(() => (window as any).tabTriggerFocusCount)).toBe(0);
  await expect(menuTrigger(page)).not.toBeFocused();
});

test('late ancestor action cancellation and a separately canceled close remain distinct', async ({ page }) => {
  await page.evaluate(() => {
    const fixture = (window as any).commandsFixture;
    fixture.veto = (event: Event) => event.preventDefault();
    document.addEventListener('en-action', fixture.veto);
  });
  await menuTrigger(page).click(); await item(page, 'Copy').click();
  await expect(menu(page)).toHaveJSProperty('open', true); await expect(item(page, 'Copy')).toBeFocused();
  expect((await actions(page))[0].canceled).toBe(true);
  await page.evaluate(() => {
    document.removeEventListener('en-action', (window as any).commandsFixture.veto);
    document.querySelector('#menu')!.addEventListener('en-change', event => { if (!(event as CustomEvent).detail.proposed) event.preventDefault(); });
  });
  await item(page, 'Copy').click(); await expect(menu(page)).toHaveJSProperty('open', true);
  expect((await actions(page)).map((event: any) => event.canceled)).toEqual([true, false]);
});

for (const id of ['menu', 'palette']) test(`${id} open veto rolls back, while an equal authoritative write supersedes cancellation`, async ({ page }) => {
  const target = page.locator(`#${id}`);
  const trigger = id === 'menu' ? menuTrigger(page) : paletteTrigger(page);
  await target.evaluate(element => {
    (element as any).testPolicy = 'veto';
    element.addEventListener('en-change', event => {
      const change = event as CustomEvent;
      event.preventDefault();
      if ((element as any).testPolicy === 'author') (element as any).open = change.detail.proposed;
    });
  });
  await trigger.click(); await settle(page);
  await expect(target).toHaveJSProperty('open', false); await expect(trigger).toBeFocused();
  await target.evaluate(element => { (element as any).testPolicy = 'author'; });
  await trigger.click(); await expect(target).toHaveJSProperty('open', true);
  if (id === 'menu') await expect(item(page, 'Copy')).toBeFocused(); else await expect(search(page)).toBeFocused();
  await page.keyboard.press('Escape'); await expect(target).toHaveJSProperty('open', false); await expect(trigger).toBeFocused();
  const records = await page.evaluate(id => (window as any).commandsFixture.events.filter((event: any) => event.type === 'en-change' && event.target === id), id);
  expect(records.map((event: any) => [event.openDuring, event.detail.proposed, event.cancelable])).toEqual([[true, true, true], [true, true, true], [false, false, true]]);
});

test('literal trigger rebind restores only owned ARIA and the same ID in another root stays independent', async ({ page }) => {
  await menuTrigger(page).click(); await page.keyboard.press('Escape');
  await page.evaluate(() => {
    const old = document.querySelector('#menu-trigger')!;
    old.setAttribute('aria-haspopup', 'tree');
    const next = document.createElement('button'); next.id = 'replacement'; next.type = 'button'; next.textContent = 'Replacement actions';
    document.querySelector('#after-menu')!.after(next);
    (document.querySelector('#menu') as any).for = 'replacement';
    const root = document.querySelector('#shadow-container')!.attachShadow({ mode: 'open' });
    root.innerHTML = '<button id="replacement" type="button">Scoped actions</button><en-menu id="scoped-menu" for="replacement" label="Scoped commands"><en-menu-item action="scoped">Scoped command</en-menu-item></en-menu>';
  });
  await settle(page); await expect(page.locator('#menu-trigger')).toHaveAttribute('aria-haspopup', 'tree');
  await page.locator('#form').locator('button#replacement').click(); await expect(item(page, 'Copy')).toBeFocused();
  await page.keyboard.press('Escape'); await expect(page.locator('#form').locator('button#replacement')).toBeFocused();
  const scoped = page.locator('#shadow-container');
  await scoped.getByRole('button', { name: 'Scoped actions' }).click();
  await expect(scoped.getByRole('menuitem', { name: 'Scoped command' })).toBeFocused();
  await expect(menu(page)).toHaveJSProperty('open', false);
});

test('toolbar has one native Tab stop, skips disabled/loading and preserves native click ownership', async ({ page, browserName }) => {
  await page.locator('#before-toolbar').focus(); await page.keyboard.press(tabKey(browserName));
  await expect(tool(page, 'tool-one')).toBeFocused();
  await page.keyboard.press('ArrowRight'); await expect(tool(page, 'tool-two')).toBeFocused();
  await page.keyboard.press('ArrowRight'); await expect(tool(page, 'tool-three')).toBeFocused();
  await page.keyboard.press('Space');
  expect(await page.evaluate(() => (window as any).commandsFixture.nativeClicks)).toEqual(['tool-three']);
  expect(await actions(page)).toEqual([]);
  const stops = await page.locator('#toolbar').getByRole('button').evaluateAll(nodes => nodes.filter(node => (node as HTMLButtonElement).tabIndex === 0 && !(node as HTMLButtonElement).disabled).length);
  expect(stops).toBe(1);
  await page.keyboard.press(tabKey(browserName)); await expect(page.locator('#after-toolbar')).toBeFocused();
  await page.keyboard.press(tabKey(browserName, true)); await expect(tool(page, 'tool-three')).toBeFocused();
  await page.keyboard.press('Home'); await expect(tool(page, 'tool-one')).toBeFocused();
  await page.keyboard.press('End'); await expect(tool(page, 'tool-three')).toBeFocused();
});

test('toolbar follows RTL and vertical axes with predictable wrapped DOM order', async ({ page }) => {
  await page.locator('#toolbar').evaluate(element => { element.setAttribute('dir', 'rtl'); (element as HTMLElement).style.maxInlineSize = '190px'; });
  await settle(page); await tool(page, 'tool-one').focus();
  await page.keyboard.press('ArrowLeft'); await expect(tool(page, 'tool-two')).toBeFocused();
  await page.keyboard.press('ArrowLeft'); await expect(tool(page, 'tool-three')).toBeFocused();
  await page.keyboard.press('ArrowRight'); await expect(tool(page, 'tool-two')).toBeFocused();
  await page.locator('#toolbar').evaluate(element => { (element as any).orientation = 'vertical'; });
  await settle(page); await tool(page, 'tool-one').focus();
  await page.keyboard.press('ArrowDown'); await expect(tool(page, 'tool-two')).toBeFocused();
  await page.keyboard.press('ArrowDown'); await expect(tool(page, 'tool-three')).toBeFocused();
  await page.keyboard.press('ArrowUp'); await expect(tool(page, 'tool-two')).toBeFocused();
  await expect(page.locator('#toolbar').getByRole('toolbar')).toHaveAttribute('aria-orientation', 'vertical');
  await page.locator('#toolbar').evaluate(element => { element.append(document.querySelector('#menu-trigger')!); });
  await settle(page); await menuTrigger(page).focus();
  await page.keyboard.press('ArrowDown'); await expect(tool(page, 'tool-one')).toBeFocused();
  await expect(menu(page)).toHaveJSProperty('open', false);
  await page.locator('#toolbar').evaluate(element => { (element as any).orientation = 'horizontal'; });
  await settle(page); await menuTrigger(page).focus(); await page.keyboard.press('ArrowDown');
  await expect(item(page, 'Copy')).toBeFocused();
});

test('toolbar releases native/en-button participants on reparent and respects a later author tabstop', async ({ page, browserName }) => {
  const one = tool(page, 'tool-one'); const original = await one.elementHandle();
  await one.focus(); await page.keyboard.press('ArrowRight');
  await page.evaluate(() => {
    const toolbar = document.querySelector('#toolbar')!;
    const second = document.querySelector('#tool-two')!;
    second.setAttribute('tabindex', '-1');
    toolbar.remove();
    document.querySelector('#parking')!.append(toolbar);
  });
  await settle(page);
  await page.evaluate(() => {
    const second = document.querySelector('#tool-two')!;
    second.setAttribute('tabindex', '-1');
    document.querySelector('#parking')!.before(second, document.querySelector('#tool-one')!);
  });
  await settle(page);
  await expect(page.locator('#tool-two')).toHaveAttribute('tabindex', '-1');
  expect(await one.evaluate((element, previous) => element === previous, original)).toBe(true);
  await expect(one).toHaveJSProperty('tabIndex', 0);
  await page.locator('#after-toolbar').focus(); await page.keyboard.press(tabKey(browserName)); await expect(one).toBeFocused();
  await page.locator('#toolbar').evaluate(element => { element.remove(); });
  await expect(one).toHaveJSProperty('tabIndex', 0);
});

test('menu mutations keep retained native items and exclude hidden commands', async ({ page }) => {
  await menuTrigger(page).click(); await expect(item(page, 'Copy')).toBeFocused(); await page.keyboard.press('End');
  await expect(item(page, 'Rename')).toBeFocused();
  const original = await item(page, 'Rename').elementHandle();
  await page.locator('#menu').evaluate(element => {
    const copy = element.querySelector('#copy')!; copy.setAttribute('hidden', '');
    const rename = element.querySelector('#rename')!; rename.textContent = 'Retitle';
  });
  await settle(page); await expect(item(page, 'Retitle')).toBeFocused();
  expect(await item(page, 'Retitle').evaluate((element, previous) => element === previous, original)).toBe(true);
  await page.keyboard.press('Home'); await expect(item(page, 'Delete')).toBeFocused();
  await page.keyboard.press('End'); await expect(item(page, 'Retitle')).toBeFocused();
  await page.locator('#rename').evaluate(element => element.remove()); await settle(page);
  await expect(menu(page).getByRole('menuitem', { name: 'Download file' })).toBeFocused();
});

test('palette keeps native editing separate from explicit command acceptance and searches keywords', async ({ page }) => {
  // Home differs between macOS engines. Compare the editor with an ordinary
  // input in this same browser instead of imposing a platform key binding.
  const baseline = page.locator('#outside');
  await baseline.fill('duplicate'); await baseline.press('Home'); await baseline.press('ArrowRight');
  const nativeSelection = await baseline.evaluate(element => [(element as HTMLInputElement).selectionStart, (element as HTMLInputElement).selectionEnd]);
  await openPalette(page);
  const original = await search(page).elementHandle();
  await search(page).fill('duplicate');
  await expect(option(page, 'Copy document')).toBeVisible();
  await expect(palette(page).getByRole('option')).toHaveCount(1);
  expect(await actions(page)).toEqual([]);
  const relation = await search(page).evaluate(element => {
    const root = element.getRootNode() as ShadowRoot;
    const controlled = root.getElementById(element.getAttribute('aria-controls') ?? '');
    const active = root.getElementById(element.getAttribute('aria-activedescendant') ?? '');
    return { listbox: controlled?.getAttribute('role'), active: active?.getAttribute('role'), owned: Boolean(active && controlled?.contains(active)) };
  });
  expect(relation).toEqual({ listbox: 'listbox', active: 'option', owned: true });
  await search(page).press('Home'); await search(page).press('ArrowRight');
  expect(await search(page).evaluate(element => [(element as HTMLInputElement).selectionStart, (element as HTMLInputElement).selectionEnd])).toEqual(nativeSelection);
  expect(await search(page).evaluate((element, previous) => element === previous, original)).toBe(true);
  await search(page).press('Enter'); await expect(palette(page)).toHaveJSProperty('open', false);
  expect((await actions(page)).map((event: any) => [event.target, event.action])).toEqual([['palette', 'copy']]);
  await expect(paletteTrigger(page)).toBeFocused();
});

test('palette disabled candidates are visible and inert; Tab and Close clear the query without execution', async ({ page, browserName }) => {
  await openPalette(page); await search(page).fill('document');
  await expect(option(page, 'Delete document')).toHaveAttribute('aria-disabled', 'true');
  await search(page).press('ArrowDown');
  const active = await search(page).getAttribute('aria-activedescendant');
  expect(active).not.toBe(await option(page, 'Delete document').getAttribute('id'));
  const box = await option(page, 'Delete document').boundingBox(); expect(box).not.toBeNull();
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await expect(palette(page)).toHaveJSProperty('open', true); expect(await actions(page)).toEqual([]);
  await search(page).focus(); await tabWithinNativeModal(page, browserName);
  // Firefox may return to the autofocus input at a forward modal boundary.
  // WebKit can visit the native dialog itself when returning from chrome.
  // The close control lives in en-button's shadow root; the palette's own
  // activeElement is its host, not the forwarded close Part or native button.
  const close = palette(page).getByRole('button', { name: 'Close command search' });
  expect(await search(page).evaluate(element => element.matches(':focus')) ||
    await close.evaluate(element => element.matches(':focus')) ||
    await palette(page).getByRole('dialog').evaluate(element => element.matches(':focus'))).toBe(true);
  if (await palette(page).getByRole('dialog').evaluate(element => element.matches(':focus'))) await tabWithinNativeModal(page, browserName);
  if (await search(page).evaluate(element => element.matches(':focus'))) await tabWithinNativeModal(page, browserName, true);
  await expect(palette(page).getByRole('button', { name: 'Close command search' })).toBeFocused();
  await tabWithinNativeModal(page, browserName); await expect(search(page)).toBeFocused();
  await tabWithinNativeModal(page, browserName, true); await page.keyboard.press('Space');
  await expect(palette(page)).toHaveJSProperty('open', false); await expect(paletteTrigger(page)).toBeFocused();
  await openPalette(page); await expect(search(page)).toHaveValue('');
  await search(page).fill('no matching command');
  await expect(palette(page).getByRole('option')).toHaveCount(0);
  await expect(palette(page).getByRole('status')).toContainText('No matching commands');
  await search(page).press('Enter'); expect(await actions(page)).toEqual([]);
  await search(page).press('Escape'); await expect(palette(page)).toHaveJSProperty('open', false);
  await openPalette(page); await expect(search(page)).toHaveValue('');
});

for (const dismissal of ['Escape', 'close-button', 'hide', 'assignment'] as const) test(`palette ${dismissal} restores focus before clearing combobox ARIA`, async ({ page }) => {
  await openPalette(page); await search(page).fill('duplicate');
  await search(page).evaluate(input => {
    const dialog = input.closest('dialog')!;
    const trace: unknown[] = []; (window as any).dismissalTrace = trace;
    const snapshot = () => ({ open: dialog.open, searchFocused: input.matches(':focus'),
      triggerFocused: document.querySelector('#palette-trigger')?.matches(':focus-within') });
    const set = input.setAttribute.bind(input), remove = input.removeAttribute.bind(input);
    input.setAttribute = (name, value) => {
      if (name === 'aria-expanded' && value === 'false') trace.push({ attribute: name, ...snapshot() });
      set(name, value);
    };
    input.removeAttribute = name => {
      if (name === 'aria-activedescendant') trace.push({ attribute: name, ...snapshot() });
      remove(name);
    };
  });
  if (dismissal === 'Escape') await search(page).press('Escape');
  else if (dismissal === 'close-button') await palette(page).getByRole('button', { name: 'Close command search' }).click();
  else await palette(page).evaluate((element, method) => {
    if (method === 'hide') (element as any).hide(); else (element as any).open = false;
  }, dismissal);
  await expect(paletteTrigger(page)).toBeFocused();
  expect(await page.evaluate(() => (window as any).dismissalTrace)).toEqual([
    { attribute: 'aria-expanded', open: false, searchFocused: false, triggerFocused: true },
    { attribute: 'aria-activedescendant', open: false, searchFocused: false, triggerFocused: true },
  ]);
  await openPalette(page); await expect(search(page)).toHaveValue(''); await expect(search(page)).toBeFocused();
});

for (const dismissal of ['Escape', 'close-button'] as const) test(`palette canceled ${dismissal} preserves query and candidate until an accepted close`, async ({ page }) => {
  await openPalette(page); await search(page).fill('document'); await search(page).press('ArrowDown');
  const candidate = await search(page).getAttribute('aria-activedescendant');
  await palette(page).evaluate(element => element.addEventListener('en-change', event => event.preventDefault(), { once: true }));
  if (dismissal === 'Escape') await search(page).press('Escape');
  else await palette(page).getByRole('button', { name: 'Close command search' }).click();
  await settle(page);
  await expect(palette(page).getByRole('dialog')).toBeVisible();
  await expect(palette(page)).toHaveJSProperty('open', true);
  await expect(search(page)).toHaveValue('document');
  await expect(search(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(search(page)).toHaveAttribute('aria-activedescendant', candidate!);
  await search(page).press('Escape'); await expect(paletteTrigger(page)).toBeFocused();
  await openPalette(page); await expect(search(page)).toHaveValue('');
});

test('synthetic composition lifecycle blocks navigation, Enter and Escape until native editing finishes', async ({ page }, info) => {
  info.annotations.push({ type: 'coverage-limit', description: 'Synthetic composition lifecycle with actual keyboard events; not an operating-system IME candidate-window test.' });
  await openPalette(page); const original = await search(page).elementHandle();
  await search(page).evaluate(element => {
    element.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, composed: true, data: '' }));
    (element as HTMLInputElement).value = 'duplicate';
    element.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, data: 'duplicate', inputType: 'insertCompositionText', isComposing: true }));
  });
  await search(page).press('ArrowDown'); await search(page).press('Enter'); await search(page).press('Escape');
  await expect(palette(page)).toHaveJSProperty('open', true); await expect(search(page)).toHaveValue('duplicate');
  await expect(search(page)).toBeFocused(); expect(await actions(page)).toEqual([]);
  await search(page).evaluate(element => {
    element.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, composed: true, data: 'duplicate' }));
    element.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertFromComposition', data: 'duplicate', isComposing: false }));
  });
  await expect(option(page, 'Copy document')).toBeVisible(); expect(await actions(page)).toEqual([]);
  expect(await search(page).evaluate((element, previous) => element === previous, original)).toBe(true);
  await search(page).press('Enter');
  await expect.poll(async () => (await actions(page)).map((event: any) => event.action)).toEqual(['copy']);
});

test('canceled palette action retains query; catalog replacement never executes a stale or disabled command', async ({ page }) => {
  await palette(page).evaluate(element => {
    (element as any).vetoAction = (event: Event) => event.preventDefault();
    element.addEventListener('en-action', (element as any).vetoAction);
  });
  await openPalette(page); await search(page).fill('document'); await search(page).press('Enter');
  await expect(palette(page)).toHaveJSProperty('open', true); await expect(search(page)).toHaveValue('document');
  await expect(search(page)).toBeFocused(); expect((await actions(page))[0]).toMatchObject({ action: 'copy', canceled: true });
  const original = await search(page).elementHandle();
  await palette(page).evaluate(element => {
    element.removeEventListener('en-action', (element as any).vetoAction);
    (element as any).commands = [{ action: 'delete', label: 'Delete document', disabled: true }];
  });
  await settle(page); await expect(option(page, 'Copy document')).toHaveCount(0);
  await expect(search(page)).toHaveValue('document');
  expect(await search(page).getAttribute('aria-activedescendant')).toBeFalsy();
  await search(page).press('Enter'); expect(await actions(page)).toHaveLength(1);
  await palette(page).evaluate(element => { (element as any).commands = [{ action: 'replacement', label: '<em>Replacement document</em>' }]; });
  await expect(option(page, '<em>Replacement document</em>')).toBeVisible(); await expect(palette(page).locator('em')).toHaveCount(0);
  expect(await search(page).evaluate((element, previous) => element === previous, original)).toBe(true);
  await option(page, '<em>Replacement document</em>').click();
  expect((await actions(page)).map((event: any) => event.action)).toEqual(['copy', 'replacement']);
});

test('native palette modality contains focus and settled application focus survives dismissal', async ({ page, browserName }) => {
  await palette(page).evaluate(element => {
    element.addEventListener('en-action', event => {
      // Consumer owns task focus only after the entire veto stack and public update settle.
      queueMicrotask(async () => {
        if (event.defaultPrevented) return;
        await (element as any).updateComplete;
        if (!(element as any).open) document.querySelector<HTMLElement>('#destination')!.focus();
      });
    });
  });
  await openPalette(page);
  expect(await palette(page).getByRole('dialog').evaluate(element => element.matches(':modal'))).toBe(true);
  await page.locator('#outside').evaluate(element => (element as HTMLInputElement).focus());
  await expect(search(page)).toBeFocused();
  await page.keyboard.press(tabKey(browserName, true));
  await expect(palette(page).getByRole('button', { name: 'Close command search' })).toBeFocused();
  await page.keyboard.press(tabKey(browserName)); await expect(search(page)).toBeFocused();
  await search(page).fill('duplicate'); await search(page).press('Enter');
  await expect(page.locator('#destination')).toBeFocused();
  await expect(palette(page)).toHaveJSProperty('open', false);
  await settle(page); await expect(page.locator('#destination')).toBeFocused();
});

test('enlarged RTL labels retain operable focus and semantic structure; forced colors keep a real contour', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%'; document.documentElement.dir = 'rtl';
    const menu = document.querySelector('#menu')!;
    (menu as HTMLElement).style.letterSpacing = '0.12em';
    document.querySelector('#download')!.textContent = 'Download the current document with its complete review history';
  });
  await menuTrigger(page).focus(); await page.keyboard.press('ArrowUp');
  await expect(item(page, 'Rename')).toBeFocused();
  const native = item(page, 'Rename');
  const normal = await native.evaluate(element => {
    const s = getComputedStyle(element), r = element.getBoundingClientRect();
    return { outline: parseFloat(s.outlineWidth), style: s.outlineStyle, inline: r.width, block: r.height, clippedInline: element.scrollWidth > element.clientWidth + 1 };
  });
  expect(normal.outline).toBeGreaterThan(0); expect(normal.style).not.toBe('none');
  expect(normal.clippedInline).toBe(false);
  await page.keyboard.press('Escape'); await openPalette(page);
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  await info.attach('open-palette-axe', { body: JSON.stringify({ violations: result.violations, passes: result.passes.length }), contentType: 'application/json' });
  expect(result.violations).toEqual([]);
  await search(page).press('Escape'); await page.emulateMedia({ forcedColors: 'active' });
  await menuTrigger(page).focus(); await page.keyboard.press('ArrowDown');
  await expect(item(page, 'Copy')).toBeFocused();
  const forced = await item(page, 'Copy').evaluate(element => {
    const s = getComputedStyle(element);
    return { active: matchMedia('(forced-colors: active)').matches, outline: parseFloat(s.outlineWidth), style: s.outlineStyle, color: s.color, outlineColor: s.outlineColor,
      adjustmentSupported: CSS.supports('forced-color-adjust', 'auto'), adjustment: s.getPropertyValue('forced-color-adjust') };
  });
  expect(forced.outline).toBeGreaterThan(0); expect(forced.style).not.toBe('none');
  if (forced.active && forced.adjustmentSupported) expect(forced.adjustment).toBe('auto');
  await info.attach('focus-preferences', { body: JSON.stringify({ normal, forced }), contentType: 'application/json' });
});


for (const resetBeforeDisconnect of [false, true]) test(`palette orphaned composition ${resetBeforeDisconnect ? 'honors an accepted-close reset' : 'adopts retained native text'} on reconnect`, async ({ page }, info) => {
  info.annotations.push({ type: 'coverage-limit', description: 'Synthetic orphaned composition; verifies reconnect ownership, not a physical IME candidate window.' });
  await openPalette(page);
  const original = await search(page).elementHandle();
  await search(page).evaluate(element => {
    element.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, composed: true }));
    (element as HTMLInputElement).value = 'download';
    element.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertCompositionText', data: 'download', isComposing: true }));
  });
  if (resetBeforeDisconnect) {
    await palette(page).evaluate(async element => { (element as any).hide(); await (element as any).updateComplete; });
    await expect(palette(page)).toHaveJSProperty('open', false);
  }
  await palette(page).evaluate(async element => {
    const parent = element.parentNode!;
    const next = element.nextSibling;
    element.remove(); parent.insertBefore(element, next);
    await (element as any).updateComplete;
  });
  await settle(page);
  if (resetBeforeDisconnect) await openPalette(page);
  await expect(search(page)).toHaveValue(resetBeforeDisconnect ? '' : 'download');
  expect(await search(page).evaluate((element, previous) => element === previous, original)).toBe(true);
  const expected = option(page, resetBeforeDisconnect ? 'Copy document' : 'Download document Control+S');
  await expect(expected).toBeVisible();
  expect(await search(page).getAttribute('aria-activedescendant')).toBe(await expected.getAttribute('id'));
  expect(await actions(page)).toEqual([]);
  await search(page).focus(); await search(page).press('Enter');
  await expect.poll(async () => (await actions(page)).map((event: any) => event.action)).toEqual([resetBeforeDisconnect ? 'copy' : 'download']);
});

test('palette rejects duplicate and invalid catalogs atomically, retaining native query and current candidate', async ({ page }) => {
  await openPalette(page); await search(page).fill('download');
  const originalInput = await search(page).elementHandle();
  const originalOption = await option(page, 'Download document Control+S').elementHandle();
  const results = await palette(page).evaluate(element => {
    const host = element as any;
    const original = host.commands;
    return [
      [{ action: 'same', label: 'First' }, { action: 'same', label: 'Duplicate' }],
      [{ action: 'invalid', label: 'Invalid keywords', keywords: [3] }],
    ].map(value => {
      let rejected = false;
      try { host.commands = value; } catch (error) { rejected = error instanceof TypeError; }
      return { rejected, retained: host.commands === original };
    });
  });
  expect(results).toEqual([{ rejected: true, retained: true }, { rejected: true, retained: true }]);
  await settle(page);
  await expect(search(page)).toHaveValue('download');
  expect(await search(page).evaluate((element, previous) => element === previous, originalInput)).toBe(true);
  expect(await option(page, 'Download document Control+S').evaluate((element, previous) => element === previous, originalOption)).toBe(true);
  expect(await search(page).getAttribute('aria-activedescendant')).toBe(await option(page, 'Download document Control+S').getAttribute('id'));
  expect(await actions(page)).toEqual([]);
});

// Append to commands.spec.ts; reuses its native-ESM fixture, helpers and error receipts.
async function toolbarBeforeButtonDefinition(page: Page) {
  await page.route('**/fixture.mjs', route => route.fulfill({
    contentType: 'text/javascript',
    body: `
      const toolbar = document.querySelector('#toolbar');
      toolbar.innerHTML = '<button type="button" id="early-one">Early first</button><button type="button" id="early-two">Early second</button>';
      await import('@en-reve/elements/define/toolbar.js');
      window.commandsFixture = {events:[], submissions:[], nativeClicks:[], async settle() {
        for(let turn=0;turn<4;turn++) {await Promise.resolve();await Promise.all([...document.querySelectorAll('en-toolbar,en-button')].map(item=>item.updateComplete));}
      }};
      window.defineLateButtons = async () => {await import('@en-reve/elements/define/button.js');await window.commandsFixture.settle();};
      await window.commandsFixture.settle();document.body.dataset.ready='true';
    `,
  }));
  await page.goto('/fixture');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
}

test('an established toolbar keeps a yielded author tabstop through later child definition', async ({page}) => {
  await toolbarBeforeButtonDefinition(page);
  const first=page.locator('#early-one');
  await expect(first).toHaveAttribute('tabindex','0');
  await first.evaluate(element=>element.setAttribute('tabindex','3'));
  await page.locator('#toolbar').evaluate(element=>{(element as any).label='Updated early tools';});
  await settle(page);
  await expect(first).toHaveAttribute('tabindex','3');
  await page.locator('#toolbar').evaluate(element=>{
    const late=document.createElement('en-button');late.id='late-button';late.textContent='Late action';element.append(late);
  });
  await settle(page);
  await expect(first).toHaveAttribute('tabindex','3');
  await expect(page.locator('#late-button')).not.toHaveAttribute('tabindex');
  await page.evaluate(()=>(window as any).defineLateButtons());
  await expect(page.locator('#late-button').getByRole('button',{name:'Late action'})).toBeVisible();
  await expect(first).toHaveAttribute('tabindex','3');
  await expect(page.locator('#late-button')).not.toHaveAttribute('tabindex');
  await first.evaluate(element=>document.querySelector('#parking')!.append(element));
  await settle(page);
  await expect(first).toHaveAttribute('tabindex','3');
  await page.locator('#toolbar').evaluate(element=>element.remove());
  await expect(first).toHaveAttribute('tabindex','3');
});

test('scoped delayed controls use their own registry and preserve the first authored Tab entry', async ({page,browserName},info) => {
  const supported=await page.evaluate(()=>{
    try {
      const registry=new CustomElementRegistry();
      const host=document.createElement('div');
      const root=host.attachShadow({mode:'open',customElementRegistry:registry} as ShadowRootInit);
      return (root as any).customElementRegistry===registry;
    } catch { return false; }
  });
  test.skip(!supported,'This browser does not implement native scoped custom element registries.');
  info.annotations.push({type:'platform-capability',description:'Native scoped registry; no registry polyfill or manual upgrade.'});
  await page.evaluate(async()=>{
    const path='/packages/elements/dist/toolbar.js';
    const {EnToolbar}=await import(path);
    const registry=new CustomElementRegistry();
    registry.define('en-toolbar',class extends EnToolbar {});
    const container=document.querySelector('#shadow-container')!;
    const root=container.attachShadow({mode:'open',customElementRegistry:registry} as ShadowRootInit);
    root.innerHTML='<button id="scope-before" type="button">Before scoped tools</button><en-toolbar id="scope-toolbar" label="Scoped tools"><en-button id="scope-first">Scoped first</en-button><button type="button" id="scope-native">Scoped native</button><en-button id="scope-last">Scoped last</en-button></en-toolbar><button id="scope-after" type="button">After scoped tools</button>';
    (window as any).finishScopedButtons=async()=>{
      const buttonPath='/packages/elements/dist/button.js';
      const {EnButton}=await import(buttonPath);
      registry.define('en-button',class extends EnButton {});
      for(let turn=0;turn<4;turn++){await Promise.resolve();await Promise.all([...root.querySelectorAll('en-toolbar,en-button')].map(item=>(item as any).updateComplete));}
    };
  });
  // A globally resolved name must not make the scoped wait spin in microtasks.
  await page.evaluate(()=>new Promise<void>(resolve=>setTimeout(resolve,0)));
  const scoped=page.locator('#shadow-container');
  await expect(scoped.locator('#scope-first')).not.toHaveAttribute('tabindex');
  await expect(scoped.locator('#scope-native')).toHaveJSProperty('tabIndex',0);
  await page.evaluate(()=>(window as any).finishScopedButtons());
  await scoped.getByRole('button',{name:'Before scoped tools'}).focus();
  await page.keyboard.press(tabKey(browserName));
  await expect(scoped.getByRole('button',{name:'Scoped first',exact:true})).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(scoped.getByRole('button',{name:'Scoped native',exact:true})).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(scoped.getByRole('button',{name:'Scoped last',exact:true})).toBeFocused();
  await page.keyboard.press(tabKey(browserName));
  await expect(scoped.getByRole('button',{name:'After scoped tools'})).toBeFocused();
  await expect(scoped.locator('#scope-first')).not.toHaveAttribute('tabindex');
  await expect(scoped.locator('#scope-last')).not.toHaveAttribute('tabindex');
});

test('reparenting a native participant transfers its original tabstop across competing toolbar lifetimes', async ({page}) => {
  const second=page.locator('#tool-two');
  const original=await second.elementHandle();
  await expect(second).toHaveAttribute('tabindex','-1');
  await page.evaluate(()=>{
    const next=document.createElement('en-toolbar');next.id='second-toolbar';next.setAttribute('label','Second toolbar');
    const first=document.createElement('button');first.type='button';first.textContent='Other entry';next.append(first);
    // Connect the new toolbar before the old MutationObserver cleanup runs.
    next.append(document.querySelector('#tool-two')!);
    document.querySelector('#parking')!.append(next);
  });
  await settle(page);
  await expect(second).toHaveAttribute('tabindex','-1');
  expect(await second.evaluate((element,node)=>element===node,original)).toBe(true);
  await page.locator('#second-toolbar').evaluate(element=>{
    const moved=element.querySelector('#tool-two')!;
    document.querySelector('#parking')!.before(moved);
    element.remove();
  });
  await settle(page);
  await expect(second).not.toHaveAttribute('tabindex');
  await expect(second).toHaveJSProperty('tabIndex',0);
});

test('focused command disable, CSS hiding and removal recover adjacent focus without changing native identity', async ({page}) => {
  await page.evaluate(()=>{
    const style=document.createElement('style');style.textContent='.command-hidden-for-review { display:none; }';document.head.append(style);
    document.querySelector('#tool-two')!.addEventListener('click',event=>{(event.currentTarget as HTMLButtonElement).disabled=true;},{once:true});
    document.querySelector('#tool-three')!.addEventListener('click',event=>(event.currentTarget as HTMLElement).classList.add('command-hidden-for-review'),{once:true});
  });
  const first=tool(page,'tool-one');const original=await first.elementHandle();
  await first.focus();await page.keyboard.press('ArrowRight');await expect(tool(page,'tool-two')).toBeFocused();
  await page.keyboard.press('Enter');await expect(tool(page,'tool-three')).toBeFocused();
  await page.keyboard.press('Enter');await expect(first).toBeFocused();
  expect(await first.evaluate((element,node)=>element===node,original)).toBe(true);
  await page.evaluate(()=>{
    const last=document.createElement('button');last.id='recovery-last';last.type='button';last.textContent='Last recovery command';
    last.addEventListener('click',()=>last.remove());document.querySelector('#toolbar')!.append(last);
  });
  await settle(page);await page.keyboard.press('End');await expect(page.locator('#recovery-last')).toBeFocused();
  await page.keyboard.press('Enter');await expect(first).toBeFocused();
  await expect(page.locator('#recovery-last')).toHaveCount(0);
  await expect(first).toHaveJSProperty('tabIndex',0);
});

test('disabling a remembered toolbar item never takes focus or text selection from an external editor', async ({page}) => {
  await tool(page,'tool-two').focus();
  const outside=page.locator('#outside');await outside.fill('Keep the unfinished note');
  await outside.evaluate(element=>(element as HTMLInputElement).setSelectionRange(5,15));
  const original=await outside.elementHandle();
  await page.locator('#tool-two').evaluate(element=>(element as HTMLButtonElement).disabled=true);
  await settle(page);
  await expect(outside).toBeFocused();await expect(outside).toHaveValue('Keep the unfinished note');
  expect(await outside.evaluate((element,node)=>({same:element===node,start:(element as HTMLInputElement).selectionStart,end:(element as HTMLInputElement).selectionEnd}),original)).toEqual({same:true,start:5,end:15});
});

test('an empty menu retained by its application keeps a keyboard Escape route', async ({page}) => {
  await menu(page).evaluate(element=>element.addEventListener('en-change',event=>{
    const detail=(event as CustomEvent).detail;
    if(detail.reason==='layout' && detail.proposed===false)event.preventDefault();
  }));
  await menuTrigger(page).focus();await page.keyboard.press('ArrowDown');await expect(item(page,'Copy')).toBeFocused();
  await menu(page).evaluate(element=>{for(const child of element.querySelectorAll<HTMLElement>('en-menu-item'))child.hidden=true;});
  const surface=menu(page).getByRole('menu',{name:'Document actions'});
  await expect(surface).toBeFocused();await expect(surface).toBeVisible();
  await expect(menu(page)).toHaveJSProperty('open',true);
  await expect(menu(page).getByRole('menuitem')).toHaveCount(0);
  await page.keyboard.press('Home');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
  expect(await actions(page)).toEqual([]);await expect(surface).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu(page)).toHaveJSProperty('open',false);await expect(menuTrigger(page)).toBeFocused();
});

async function holdCommandPlacementFrames(page: Page) {
  await page.evaluate(()=>{
    const originalRequest=window.requestAnimationFrame.bind(window);
    const originalCancel=window.cancelAnimationFrame.bind(window);
    const pending=new Map<number,FrameRequestCallback>();let sequence=-1;
    window.requestAnimationFrame=callback=>{const id=sequence--;pending.set(id,callback);return id;};
    window.cancelAnimationFrame=id=>{if(!pending.delete(id))originalCancel(id);};
    (window as any).releaseCommandPlacement=()=>{
      window.requestAnimationFrame=originalRequest;window.cancelAnimationFrame=originalCancel;
      for(const callback of pending.values())originalRequest(callback);pending.clear();
    };
  });
}

test('delayed menu placement cannot replace an application-selected focus destination', async ({page}) => {
  await menuTrigger(page).focus();await holdCommandPlacementFrames(page);
  await page.keyboard.press('ArrowDown');await settle(page);
  await expect(menu(page)).toHaveJSProperty('open',true);
  const destination=page.locator('#destination');await destination.evaluate(element=>(element as HTMLElement).focus({preventScroll:true}));await expect(destination).toBeFocused();
  await page.evaluate(()=>(window as any).releaseCommandPlacement());
  await expect(menu(page).getByRole('menu',{name:'Document actions'})).toBeVisible();
  await settle(page);
  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
  await expect(destination).toBeFocused();expect(await actions(page)).toEqual([]);
});

test('Tab during pending menu placement exits without a later scheduled focus return', async ({page,browserName}) => {
  await menuTrigger(page).focus();await holdCommandPlacementFrames(page);
  await page.keyboard.press('ArrowDown');await settle(page);
  await expect(menu(page)).toHaveJSProperty('open',true);
  await page.keyboard.press(tabKey(browserName));await expect(page.locator('#after-menu')).toBeFocused();
  await expect(menu(page)).toHaveJSProperty('open',false);
  await page.evaluate(()=>(window as any).releaseCommandPlacement());
  await settle(page);
  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
  await expect(page.locator('#after-menu')).toBeFocused();expect(await actions(page)).toEqual([]);
});

test('a toolbar in a closed ancestor cannot reclaim focus from outside that root', async ({page}) => {
  await page.evaluate(async()=>{
    const container=document.querySelector('#shadow-container')!;
    const root=container.attachShadow({mode:'closed'});
    root.innerHTML='<en-toolbar label="Private tools"><button type="button" id="private-one">Private first</button><button type="button" id="private-two">Private second</button></en-toolbar>';
    const toolbar=root.querySelector('en-toolbar') as HTMLElement & {updateComplete:Promise<unknown>};
    await toolbar.updateComplete;
    const first=root.querySelector<HTMLButtonElement>('#private-one')!;
    first.focus();
    (window as any).mutatePrivateTool=()=>{first.disabled=true;};
  });
  const outside=page.locator('#outside');await outside.fill('Focus belongs to this editor');
  await page.evaluate(()=>(window as any).mutatePrivateTool());
  await settle(page);
  await expect(outside).toBeFocused();await expect(outside).toHaveValue('Focus belongs to this editor');
  await page.keyboard.type('!');await expect(outside).toHaveValue('Focus belongs to this editor!');
});
