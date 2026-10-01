import { expect, test, type Page } from '@playwright/test';

const ids = ['pagination-eager', 'pagination-secondary', 'pagination-unused', 'pagination-untouched', 'pagination-reentrant'];
const eager = '#pagination-eager';
const secondary = '#pagination-secondary';
const unused = '#pagination-unused';

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (['error', 'warning'].includes(message.type()) && /hydrat|mismatch/i.test(message.text())) errors.push(message.text());
  });
  return errors;
}

async function captureShells(page: Page) {
  await page.evaluate(() => {
    const capture = (host: Element) => {
      const root = host.shadowRoot!;
      return { host, root, nav: root.querySelector('nav'), panel: root.querySelector('[popover]'),
        previousSlot: root.querySelector('slot[name="previous"]'), nextSlot: root.querySelector('slot[name="next"]'),
        previous: host.querySelector('[data-previous]'), next: host.querySelector('[data-next]') };
    };
    (window as any).__paginationShells = {
      capture, records: [...document.querySelectorAll('#pagination-content-fixture en-pagination')].map(capture),
    };
  });
}

async function expectRetainedShells(page: Page) {
  expect(await page.evaluate(() => {
    const { capture, records } = (window as any).__paginationShells;
    return records.map((before: any) => {
      const after = capture(document.getElementById(before.host.id));
      return { id: before.host.id, retained: Object.keys(before).every(key => before[key] === after[key]),
        previous: after.previousSlot.assignedElements()[0] === before.previous,
        next: after.nextSlot.assignedElements()[0] === before.next };
    });
  })).toEqual(ids.map(id => ({ id, retained: true, previous: true, next: true })));
}

// No-script page controls retain their native semantics and authored labels.
// Existing CSS intentionally hides the unpositioned chooser even when the
// browser opens it natively; this does not claim no-JavaScript page mutation.
test('no-JavaScript navigation stays present and an unpositioned native chooser is neither visible nor exposed as a dialog', async ({ browser, baseURL }, info) => {
  info.annotations.push({ type: 'browser-version', description: browser.version() });
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto(`${baseURL}/pagination-content-fixture`);
    for (const id of ids) {
      const host = page.locator(`#${id}`);
      await expect(host.getByRole('navigation')).toBeVisible();
      await expect(host.getByRole('navigation')).toHaveAccessibleName((await host.getAttribute('label'))!);
      await expect(host.locator('[part~="status"]')).toHaveText(['Page 3 of 18', 'Page 3 of 18']);
      await expect(host.getByRole('button', { name: 'Previous page', exact: true })).toBeVisible();
      await expect(host.getByRole('button', { name: 'Next page', exact: true })).toBeVisible();
      await expect(host.locator('[aria-current="page"]')).toHaveAttribute('data-page', '3');
      await expect(host.locator('input')).toHaveCount(1);
      await expect(host.locator('[popover]')).toHaveAttribute('role', 'dialog');
      await expect(host.getByRole('dialog')).toHaveCount(0);
    }
    for (const selector of [eager, secondary]) {
      const host = page.locator(selector);
      await host.locator('button[popovertarget]:visible').first().click();
      await expect.poll(() => host.locator('[popover]').evaluate(panel => panel.matches(':popover-open'))).toBe(true);
      await expect(host.locator('[popover]')).toBeHidden();
      await expect(host.getByRole('dialog')).toHaveCount(0);
      await expect(host.getByRole('spinbutton')).toHaveCount(0);
      expect(await host.locator('[popover]').evaluate(panel => getComputedStyle(panel).visibility)).toBe('hidden');
      expect(await host.evaluate(element => element.matches(':defined'))).toBe(false);
      await page.keyboard.press('Escape');
    }
  } finally { await context.close(); }
});

test('matching hydration retains native and authored shells, then native opening retains the eager chooser', async ({ page, browser }, info) => {
  info.annotations.push({ type: 'browser-version', description: browser.version() });
  const errors = watchErrors(page);
  await page.goto('/pagination-content-fixture');
  await captureShells(page);
  await page.evaluate(() => (window as any).hydratePaginationContent());
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
  await expectRetainedShells(page);
  for (const id of ids) await expect(page.locator(`#${id} input`)).toHaveCount(1);
  const host = page.locator(secondary);
  expect(await host.evaluate(element => {
    const panel = element.shadowRoot!.querySelector<HTMLElement>('[popover]')!;
    panel.showPopover();
    return { open: panel.matches(':popover-open'), body: Boolean(panel.querySelector('input')) };
  })).toEqual({ open: true, body: true });
  const field = host.getByRole('spinbutton', { name: 'Page number', exact: true });
  await expect(field).toBeVisible();
  await expect(field).toBeFocused();
  await expect(field).toHaveValue('3');
  await field.fill('11');
  const input = await field.elementHandle();
  await host.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(host).toHaveJSProperty('page', 3);
  await expect(host.locator('input')).toHaveCount(1);
  await host.evaluate(element => element.shadowRoot!.querySelector<HTMLElement>('[popover]')!.showPopover());
  await expect(field).toBeFocused();
  await expect(field).toHaveValue('11');
  expect(await field.evaluate((node, before) => node === before, input)).toBe(true);
  await expect(page.locator(`${unused} input`)).toHaveCount(1);
  await expectRetainedShells(page);
  expect(errors).toEqual([]);
  await input?.dispose();
});

test('hydration and later renders retain the eager server input and dirty numeric draft', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/pagination-content-fixture');
  await captureShells(page);
  await page.locator(eager).evaluate(element => {
    const input = element.shadowRoot!.querySelector('input')!;
    input.value = '11';
    (window as any).__paginationEagerInput = input;
  });
  await page.evaluate(() => (window as any).hydratePaginationContent());
  await expectRetainedShells(page);
  await expect(page.locator(`${eager} input`)).toHaveValue('11');
  await expect(page.locator('#pagination-untouched input')).toHaveValue('3');
  await page.locator(eager).evaluate(async (element: any) => {
    element.label = 'Updated pages'; await element.updateComplete;
  });
  expect(await page.locator(eager).evaluate(element => {
    const input = element.shadowRoot!.querySelector('input')!;
    return { same: input === (window as any).__paginationEagerInput, value: input.value, defaultValue: input.defaultValue };
  })).toEqual({ same: true, value: '11', defaultValue: '3' });
  await expect(page.locator(`${unused} input`)).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('native opening from the first hydration render recovers the eager SSR chooser without replay', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/pagination-content-fixture');
  await captureShells(page);
  const host = page.locator('#pagination-reentrant');
  await expect(host.locator('input')).toHaveCount(1);
  await host.evaluate(element => {
    const panel = element.shadowRoot!.querySelector('[popover]')!;
    (window as any).__paginationOpeningEvents = [];
    panel.addEventListener('beforetoggle', event => {
      if ((event as ToggleEvent).newState === 'open') (window as any).__paginationOpeningEvents.push('beforetoggle');
    });
  });
  expect(await page.evaluate(() => (window as any).hydratePaginationContent({ openDuringFirstRender: true }))).toEqual([{ open: true, body: true }]);
  const field = host.getByRole('spinbutton', { name: 'Page number', exact: true });
  await expect(field).toBeVisible();
  await expect(field).toBeFocused();
  await expect(field).toHaveValue('3');
  expect(await page.evaluate(() => (window as any).__paginationOpeningEvents)).toEqual(['beforetoggle']);
  await expectRetainedShells(page);
  await expect(page.locator(`${unused} input`)).toHaveCount(1);
  expect(errors).toEqual([]);
});

for (const selector of [eager, secondary]) test(`${selector}: hydration initializes a native chooser whose opening toggle finished before upgrade`, async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/pagination-content-fixture');
  await captureShells(page);
  const host = page.locator(selector);
  await host.evaluate(element => new Promise<void>(resolve => {
    const panel = element.shadowRoot!.querySelector<HTMLElement>('[popover]')!;
    panel.addEventListener('toggle', event => {
      if ((event as ToggleEvent).newState === 'open') resolve();
    }, { once: true });
    panel.showPopover();
  }));
  await expect(host.locator('input')).toHaveCount(1);
  await expect(host.getByRole('dialog')).toHaveCount(0);
  expect(await host.locator('[popover]').evaluate(panel => ({ open: panel.matches(':popover-open'), visibility: getComputedStyle(panel).visibility })))
    .toEqual({ open: true, visibility: 'hidden' });
  await page.evaluate(() => (window as any).hydratePaginationContent());
  await expectRetainedShells(page);
  await expect(host.getByRole('dialog')).toBeVisible();
  await expect(host.getByRole('spinbutton', { name: 'Page number', exact: true })).toBeFocused();
  await expect(host.locator('input')).toHaveCount(1);
  await expect(page.locator(`${unused} input`)).toHaveCount(1);
  expect(errors).toEqual([]);
});

for (const nextIntent of ['focus-elsewhere', 'close'] as const) {
  test(`hydration recovery respects ${nextIntent} after an unupgraded native opening`, async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/pagination-content-fixture');
    const host = page.locator(secondary);
    await host.evaluate(element => new Promise<void>(resolve => {
      const panel = element.shadowRoot!.querySelector<HTMLElement>('[popover]')!;
      panel.addEventListener('toggle', event => { if ((event as ToggleEvent).newState === 'open') resolve(); }, { once: true });
      panel.showPopover();
    }));
    await page.evaluate(async intent => {
      const input = document.createElement('input'); input.id = 'later-pagination-focus'; input.setAttribute('aria-label', 'Continue editing');
      document.body.append(input); input.focus();
      if (intent === 'close') {
        const panel = document.querySelector('#pagination-secondary')!.shadowRoot!.querySelector<HTMLElement>('[popover]')!;
        await new Promise<void>(resolve => {
          panel.addEventListener('toggle', event => { if ((event as ToggleEvent).newState === 'closed') resolve(); }, { once: true });
          panel.hidePopover();
        });
      }
    }, nextIntent);
    await page.evaluate(() => (window as any).hydratePaginationContent());
    await expect(page.getByRole('textbox', { name: 'Continue editing', exact: true })).toBeFocused();
    await expect(host.locator('input')).toHaveCount(1);
    if (nextIntent === 'close') await expect(host.getByRole('dialog')).toHaveCount(0);
    else await expect(host.getByRole('dialog')).toBeVisible();
    expect(errors).toEqual([]);
  });
}

for (const focusTarget of ['outside', 'next-action'] as const) {
  test(`a queued opening toggle cannot take ${focusTarget} focus after hydration recovery`, async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/pagination-content-fixture');
    await page.evaluate(async target => {
      const host = document.querySelector('#pagination-reentrant')!;
      const panel = host.shadowRoot!.querySelector<HTMLElement>('[popover]')!;
      let control: HTMLElement;
      if (target === 'outside') {
        const input = document.createElement('input'); input.id = 'pagination-continued-input'; input.setAttribute('aria-label', 'Continue editing');
        document.body.append(input); control = input;
      } else control = host.shadowRoot!.querySelector<HTMLElement>('[part~="next"]')!;
      control.focus();
      const nativeToggle = new Promise<void>(resolve => {
        panel.addEventListener('toggle', event => { if ((event as ToggleEvent).newState === 'open') resolve(); }, { once: true });
      });
      await (window as any).hydratePaginationContent({ openDuringFirstRender: true });
      await nativeToggle;
    }, focusTarget);
    const host = page.locator('#pagination-reentrant');
    await expect(host.getByRole('dialog')).toBeVisible();
    await expect(host.locator('input')).toHaveCount(1);
    if (focusTarget === 'outside') await expect(page.getByRole('textbox', { name: 'Continue editing', exact: true })).toBeFocused();
    else await expect(host.getByRole('button', { name: 'Next page', exact: true })).toBeFocused();
    expect(errors).toEqual([]);
  });
}
