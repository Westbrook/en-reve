import {test, expect, type Page, type TestInfo} from '@playwright/test';

const retainedShell = {
  sameHost: true, sameShadow: true, sameNavigation: true, samePanel: true,
  samePrevious: true, sameNext: true, samePreviousSlot: true, sameNextSlot: true,
  samePreviousContent: true, sameNextContent: true,
  previousAssigned: true, nextAssigned: true, sameNumbered: true,
};

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (['error', 'warning'].includes(message.type()) && /hydrat|mismatch/i.test(message.text())) errors.push(message.text());
  });
  return errors;
}

async function open(page: Page, mode: string) {
  await page.goto(`/ssr-${mode}-eager.html`);
  await page.waitForFunction(() => Boolean((window as any).ssrPaginationFixture));
  await expect(page.locator('[data-human-review]')).toHaveCount(0);
}

async function inspect(page: Page) {
  return page.evaluate(() => (window as any).ssrPaginationFixture.inspect());
}

async function expectHydrated(page: Page, info: TestInfo) {
  const state = await inspect(page);
  expect(state).toMatchObject({...retainedShell, state: 'ready', page: 3});
  expect(state.registryMode).toBe(state.expectedRegistryMode);
  expect(await page.evaluate(() => (window as any).ssrPaginationFixture.counts.ready)).toBe(1);
  await info.attach('packed-pagination-hydration', {body: JSON.stringify(state), contentType: 'application/json'});
  return state;
}

for (const mode of ['global', 'shadow']) {
  test(`${mode}: matched packed hydration retains navigation, native shell and authored slots`, async ({page}, info) => {
    const errors = watchErrors(page);
    await open(page, mode);
    const host = page.locator('en-pagination');
    await expect(host.getByRole('navigation', {name: 'Asset pages', exact: true})).toBeVisible();
    await expect(host.locator('input')).toHaveCount(1);
    await page.evaluate(() => (window as any).ssrPaginationFixture.hydrate());
    expect(await expectHydrated(page, info)).toMatchObject({
      bodyCount: 1, inputCount: 1,
      sameSSRInput: true,
    });
    await expect(host.getByRole('button', {name: 'Page 3', exact: true})).toHaveAttribute('aria-current', 'page');
    await expect(host.locator('[part~="status"]:visible')).toHaveText('Page 3 of 12');
    expect(errors).toEqual([]);
  });

  test(`${mode}: hydration completes an already-open native server shell without replacing essential nodes`, async ({page}, info) => {
    const errors = watchErrors(page);
    await open(page, mode);
    expect(await page.evaluate(async () => {
      const f = (window as any).ssrPaginationFixture;
      // Finish the native toggle before importing/upgrading the component. This
      // cannot accidentally pass because a queued opening event reaches a newly
      // attached hydration listener.
      await new Promise<void>(resolve => {
        f.initial.panel.addEventListener('toggle', (event: ToggleEvent) => {if (event.newState === 'open') resolve();}, {once: true});
        f.initial.panel.showPopover();
      });
      return {open: f.initial.panel.matches(':popover-open'), inputs: f.initial.panel.querySelectorAll('input').length, visibility: getComputedStyle(f.initial.panel).visibility, defined: f.pagination.matches(':defined')};
    })).toEqual({open: true, inputs: 1, visibility: 'hidden', defined: false});
    await expect(page.locator('en-pagination').getByRole('dialog')).toHaveCount(0);
    await page.evaluate(() => (window as any).ssrPaginationFixture.hydrate());
    expect(await expectHydrated(page, info)).toMatchObject({bodyCount: 1, inputCount: 1, sameSSRInput: true});
    const host = page.locator('en-pagination');
    await expect(host.getByRole('spinbutton', {name: 'Page number', exact: true})).toBeFocused();
    await expect(host.getByRole('dialog', {name: 'Choose a page', exact: true})).toBeVisible();
    expect(errors).toEqual([]);
  });

  test(`${mode}: eager SSR input and dirty native draft survive hydration and later renders`, async ({page}, info) => {
    const errors = watchErrors(page);
    await open(page, mode);
    await page.evaluate(() => {
      const f = (window as any).ssrPaginationFixture;
      // This number input is intentionally CSS-hidden before positioning. A
      // native value write marks its draft dirty without inventing text selection.
      f.initial.input.value = '11';
    });
    await page.evaluate(() => (window as any).ssrPaginationFixture.hydrate());
    expect(await expectHydrated(page, info)).toMatchObject({sameSSRInput: true, inputValue: '11', inputCount: 1});
    await page.evaluate(async () => {
      const f = (window as any).ssrPaginationFixture;
      f.pagination.label = 'Updated pages'; await f.pagination.updateComplete;
      f.initial.panel.showPopover();
    });
    const field = page.locator('en-pagination').getByRole('spinbutton', {name: 'Page number', exact: true});
    await expect(field).toBeVisible();
    await expect(field).toBeFocused();
    await expect(field).toHaveValue('11');
    expect(await inspect(page)).toMatchObject({...retainedShell, sameSSRInput: true, inputValue: '11', inputCount: 1, page: 3});
    expect(errors).toEqual([]);
  });

  test(`${mode}: first native opening after hydration preserves the eager body and retains its draft`, async ({page}, info) => {
    const errors = watchErrors(page);
    await open(page, mode);
    await page.evaluate(() => (window as any).ssrPaginationFixture.hydrate());
    expect(await expectHydrated(page, info)).toMatchObject({bodyCount: 1, inputCount: 1});
    // This native call happens after the containing hydration update.
    expect(await page.evaluate(() => {
      const f = (window as any).ssrPaginationFixture;
      f.openingEvents = [];
      f.initial.panel.addEventListener('beforetoggle', (event: ToggleEvent) => {
        if (event.newState === 'open') f.openingEvents.push('beforetoggle');
      });
      f.initial.panel.showPopover();
      f.generatedInput = f.initial.panel.querySelector('input');
      return {open: f.initial.panel.matches(':popover-open'), body: Boolean(f.generatedInput), openings: f.openingEvents.length};
    })).toEqual({open: true, body: true, openings: 1});
    const host = page.locator('en-pagination');
    const field = host.getByRole('spinbutton', {name: 'Page number', exact: true});
    await expect(field).toBeVisible();
    await expect(field).toBeFocused();
    await expect(field).toHaveValue('3');
    await field.fill('11');
    await host.getByRole('button', {name: 'Cancel', exact: true}).click();
    await expect(host.locator('[popover]')).toBeHidden();
    await expect.poll(() => host.locator('[popover]').evaluate(panel => panel.hasAttribute('data-positioned'))).toBe(false);
    await expect(host.locator('input')).toHaveCount(1);
    await page.evaluate(() => (window as any).ssrPaginationFixture.initial.panel.showPopover());
    await expect(field).toBeFocused();
    await expect(field).toHaveValue('11');
    expect(await page.evaluate(() => {
      const f = (window as any).ssrPaginationFixture;
      return {sameInput: f.generatedInput === f.initial.panel.querySelector('input'), openings: f.openingEvents.length};
    })).toEqual({sameInput: true, openings: 2});
    expect(await inspect(page)).toMatchObject({...retainedShell, bodyCount: 1, inputCount: 1, inputValue: '11', page: 3});
    expect(errors).toEqual([]);
  });

  test(`${mode}: no-JavaScript navigation semantics and consumer fallback survive`, async ({browser}, info) => {
    const context = await browser.newContext({javaScriptEnabled: false, baseURL: info.project.use.baseURL});
    try {
      const page = await context.newPage();
      await page.goto(`/ssr-${mode}-eager.html`);
      const host = page.locator('en-pagination');
      await expect(host.getByRole('navigation', {name: 'Asset pages', exact: true})).toBeVisible();
      await expect(host.getByRole('button', {name: 'Previous page', exact: true})).toBeVisible();
      await expect(host.getByRole('button', {name: 'Next page', exact: true})).toBeVisible();
      await expect(host.locator('[data-authored="previous"]')).toHaveText('Previous');
      await expect(host.locator('[data-authored="next"]')).toHaveText('Next');
      await expect(host.getByRole('button', {name: 'Page 3', exact: true})).toHaveAttribute('aria-current', 'page');
      await expect(host.locator('[part~="status"]:visible')).toHaveText('Page 3 of 12');
      await expect(host.locator('input')).toHaveCount(1);
      await expect(host.getByRole('dialog')).toHaveCount(0);
      await host.locator('button[popovertarget]:visible').first().click();
      await expect.poll(() => host.locator('[popover]').evaluate(panel => panel.matches(':popover-open'))).toBe(true);
      await expect(host.locator('[popover]')).toBeHidden();
      await expect(host.getByRole('dialog')).toHaveCount(0);
      expect(await host.locator('[popover]').evaluate(panel => getComputedStyle(panel).visibility)).toBe('hidden');
      expect(await host.evaluate(element => element.matches(':defined'))).toBe(false);
      // The library intentionally requires JS for mutation and positioning;
      // this ordinary link is an application-owned usable fallback.
      await page.keyboard.press('Escape');
      await page.getByRole('link', {name: 'Continue to page 4', exact: true}).click();
      await expect(page).toHaveURL(/\/fallback-page-4\.html$/);
      await expect(page.getByRole('heading', {name: 'Asset page 4', exact: true})).toBeVisible();
    } finally { await context.close(); }
  });
}


async function keyboardReleaseControl(page: Page, browserName: string, info: TestInfo) {
  const release = page.getByRole('button', {name: 'Release pagination hydration', exact: true});
  // The captured macOS WebKit preference skips native buttons on plain Tab.
  // Option+Tab includes them; preserve real traversal and every focus assertion.
  const next = browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
  info.annotations.push({type: 'native-keyboard-navigation', description: `${next}; ${browserName} on ${process.platform}; no scripted focus`});
  for (let step = 0; step < 40 && !await release.evaluate(node => node === document.activeElement); step++) {
    await page.keyboard.press(next);
  }
  await expect(release).toBeFocused();
  return release;
}

for (const mode of ['global', 'shadow']) {
  test(`${mode}: keyboard diagnostic release recovers the native opening without taking newer focus`, async ({page, browserName}, info) => {
    const errors = watchErrors(page);
    await page.goto(`/ssr-${mode}-eager.html?human-review&progress-report`);
    await page.waitForFunction(() => Boolean((window as any).ssrPaginationFixture));
    const host = page.locator('en-pagination');
    const controls = page.getByRole('region', {name: 'Pagination hydration companion diagnostic'});
    expect(await controls.evaluate(node => !(window as any).ssrPaginationFixture.root.contains(node))).toBe(true);
    await expect(controls.getByRole('link', {name: 'Progress Report', exact: true})).toHaveAttribute('href', 'http://127.0.0.1:4177');
    await host.locator('button[popovertarget]:visible').first().press('Enter');
    const release = await keyboardReleaseControl(page, browserName, info);
    await expect(controls).toHaveAttribute('data-native-toggle', 'open');
    // Failure here is an unavailable native interaction, never a cue to force it open.
    expect(await host.locator('[popover]').evaluate(panel => ({open: panel.matches(':popover-open'), hidden: getComputedStyle(panel).visibility === 'hidden'})))
      .toEqual({open: true, hidden: true});
    expect(await host.evaluate(node => node.matches(':defined'))).toBe(false);
    await release.press('Enter');
    await expect(controls.locator('[data-release-state]')).toContainText('Hydration completed.');
    expect(await expectHydrated(page, info)).toMatchObject({bodyCount: 1, inputCount: 1, sameSSRInput: true});
    await expect(host.getByRole('dialog', {name: 'Choose a page', exact: true})).toBeVisible();
    await expect(host.getByRole('spinbutton', {name: 'Page number', exact: true})).toHaveValue('3');
    await expect(release).toBeFocused();
    await release.press('Enter');
    expect(await page.evaluate(() => (window as any).ssrPaginationFixture.counts.ready)).toBe(1);
    await expect(release).toBeFocused();
    expect(errors).toEqual([]);
  });
}

test('keyboard diagnostic release does not reopen a native chooser closed before hydration', async ({page, browserName}, info) => {
  const errors = watchErrors(page);
  await page.goto('/ssr-global-eager.html?human-review');
  await page.waitForFunction(() => Boolean((window as any).ssrPaginationFixture));
  const host = page.locator('en-pagination');
  await host.locator('button[popovertarget]:visible').first().press('Enter');
  await expect.poll(() => host.locator('[popover]').evaluate(panel => panel.matches(':popover-open'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(() => host.locator('[popover]').evaluate(panel => panel.matches(':popover-open'))).toBe(false);
  const release = await keyboardReleaseControl(page, browserName, info);
  await release.press('Enter');
  await expect(page.locator('[data-release-state]')).toContainText('Hydration completed.');
  expect(await expectHydrated(page, info)).toMatchObject({bodyCount: 1, inputCount: 1});
  await expect(host.getByRole('dialog')).toHaveCount(0);
  await expect(release).toBeFocused();
  expect(errors).toEqual([]);
});
