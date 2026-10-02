import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/packages/elements/src/button/content-fixture.html');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
});

test('native button activates once from keyboard and blocks disabled/busy activation', async ({ page }) => {
  await page.evaluate(() => {
    const button = document.createElement('en-button');
    button.textContent = 'Export canvas';
    let count = 0;
    button.addEventListener('click', () => { button.dataset.activations = String(++count); });
    document.body.append(button);
  });
  const host = page.locator('en-button');
  const control = page.getByRole('button', { name: 'Export canvas' });
  await control.focus();
  await page.keyboard.press('Enter');
  await expect(host).toHaveAttribute('data-activations', '1');
  await host.evaluate((element) => element.setAttribute('disabled', ''));
  await expect(control).toBeDisabled();
  await control.evaluate((element) => (element as HTMLButtonElement).click());
  await expect(host).toHaveAttribute('data-activations', '1');
  await host.evaluate((element) => {
    element.removeAttribute('disabled');
    element.setAttribute('loading', '');
  });
  await expect(control).toBeDisabled();
  await expect(control).toHaveAttribute('aria-busy', 'true');
  await expect(control).toHaveAccessibleName('Export canvas');
});

test('button icons inherit action color, align with labels, and honor stroke customization', async ({ page }) => {
  await page.evaluate(() => {
    for (const size of ['small', 'medium', 'large']) {
      const button = document.createElement('en-button');
      button.setAttribute('size', size);
      const icon = document.createElement('en-icon');
      icon.setAttribute('name', 'plus');
      icon.setAttribute('size', 'inherit');
      icon.slot = 'prefix';
      const label = document.createElement('span');
      label.slot = 'label';
      label.textContent = `Add ${size}`;
      button.append(icon, label);
      document.body.append(button);
    }
  });
  const iconWidths: number[] = [];
  for (const size of ['small', 'medium', 'large']) {
    const control = page.getByRole('button', { name: `Add ${size}` });
    await expect(control).toBeVisible();
    const geometry = await page.locator(`en-button[size="${size}"]`).evaluate((host) => {
      const button = host.shadowRoot!.querySelector('button')!;
      const icon = host.querySelector('en-icon')!.shadowRoot!.querySelector('svg')!;
      const label = host.shadowRoot!.querySelector('[part="label"]')!;
      const iconRect = icon.getBoundingClientRect();
      const labelRect = label.getBoundingClientRect();
      return {
        iconCenter: iconRect.y + iconRect.height / 2,
        labelCenter: labelRect.y + labelRect.height / 2,
        iconColor: getComputedStyle(icon).color,
        buttonColor: getComputedStyle(button).color,
        stroke: Number.parseFloat(getComputedStyle(icon).strokeWidth),
        iconWidth: iconRect.width,
      };
    });
    expect(Math.abs(geometry.iconCenter - geometry.labelCenter)).toBeLessThan(1);
    expect(geometry.iconColor).toBe(geometry.buttonColor);
    expect(geometry.stroke).toBeGreaterThan(1);
    iconWidths.push(geometry.iconWidth);
  }
  expect(iconWidths[0]).toBeLessThan(iconWidths[1]!);
  expect(iconWidths[1]).toBeLessThan(iconWidths[2]!);
  const icon = page.locator('en-button[size="medium"] en-icon');
  await icon.evaluate((element) => (element as HTMLElement).style.setProperty('--en-size-icon-stroke', '2.5'));
  await expect(icon.locator('svg')).toHaveCSS('stroke-width', '2.5px');
});

test('unmarked icons retain medium sizing until inheritance is explicitly requested', async ({ page }) => {
  await page.evaluate(() => {
    for (const size of ['small', 'large']) {
      const button = document.createElement('en-button');
      button.setAttribute('size', size);
      button.textContent = `${size} action`;
      const icon = document.createElement('en-icon');
      icon.setAttribute('name', 'plus');
      icon.slot = 'prefix';
      button.append(icon);
      document.body.append(button);
    }
    const reference = document.createElement('en-icon');
    reference.setAttribute('name', 'plus');
    reference.id = 'medium-reference';
    document.body.append(reference);
  });
  const referenceWidth = await page.locator('#medium-reference svg').evaluate((element) => element.getBoundingClientRect().width);
  for (const size of ['small', 'large']) {
    const icon = page.locator(`en-button[size="${size}"] en-icon`);
    await expect(icon).toHaveJSProperty('size', 'medium');
    await expect(icon).not.toHaveAttribute('size');
    const width = await icon.locator('svg').evaluate((element) => element.getBoundingClientRect().width);
    expect(width).toBe(referenceWidth);
    await icon.evaluate((element) => element.setAttribute('size', 'inherit'));
    const inheritedWidth = await icon.locator('svg').evaluate((element) => element.getBoundingClientRect().width);
    if (size === 'small') expect(inheritedWidth).toBeLessThan(referenceWidth);
    else expect(inheritedWidth).toBeGreaterThan(referenceWidth);
  }
});

test('empty action slots consume no gap and each present icon adds one gap', async ({ page }) => {
  await page.evaluate(() => {
    for (const decorated of [false, true]) {
      const button = document.createElement('en-button');
      button.dataset.decorated = String(decorated);
      button.textContent = 'Publish';
      if (decorated) {
        const icon = document.createElement('en-icon');
        icon.setAttribute('name', 'check');
        icon.slot = 'prefix';
        button.append(icon);
      }
      document.body.append(button);
    }
  });
  await expect(page.getByRole('button', { name: 'Publish' })).toHaveCount(2);
  const widths = await page.locator('en-button').evaluateAll((hosts) => hosts.map((host) => {
    const button = host.shadowRoot!.querySelector('button')!;
    const label = host.shadowRoot!.querySelector('[part="label"]')!;
    const css = getComputedStyle(button);
    const edges = ['paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'] as const;
    const edgeWidth = edges.reduce((sum, edge) => sum + Number.parseFloat(css[edge]), 0);
    const icon = host.querySelector('en-icon');
    const expectedContent = label.getBoundingClientRect().width +
      (icon ? icon.getBoundingClientRect().width + Number.parseFloat(css.columnGap) : 0);
    return { actual: button.getBoundingClientRect().width, expected: expectedContent + edgeWidth };
  }));
  for (const width of widths) expect(Math.abs(width.actual - width.expected)).toBeLessThan(1);
});

test('named labels support accessible icon-only actions and retain the default label fallback', async ({ page }) => {
  await page.addStyleTag({ content: '.fixture-icon-only::part(label) { position:absolute; width:1px; height:1px; padding:0; border:0; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }' });
  await page.evaluate(() => {
    const button = document.createElement('en-button');
    button.className = 'fixture-icon-only';
    button.textContent = 'Legacy label';
    const icon = document.createElement('en-icon');
    icon.slot = 'prefix';
    icon.setAttribute('name', 'plus');
    const label = document.createElement('span');
    label.slot = 'label';
    label.textContent = 'Add collaborator';
    button.append(icon, label);
    document.body.append(button);
  });
  const action = page.getByRole('button', { name: 'Add collaborator', exact: true });
  await expect(action).toBeVisible();
  await action.focus();
  await expect(action).toBeFocused();
  await expect(page.locator('en-button en-icon svg')).toBeVisible();
  await page.locator('en-button [slot="label"]').evaluate((element) => element.remove());
  await expect(page.getByRole('button', { name: 'Legacy label', exact: true })).toBeVisible();
});

test('popup state and host-tree descriptions reach the native button', async ({ page, browserName }) => {
  await page.evaluate(() => {
    const button = document.createElement('en-button');
    button.textContent = 'Sharing options';
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-describedby', 'sharing-help sharing-tip');
    const help = document.createElement('p');
    help.id = 'sharing-help';
    help.textContent = 'Only invited people can access this project.';
    const tip = document.createElement('span');
    tip.id = 'sharing-tip';
    tip.textContent = 'Manage collaborators.';
    document.body.append(button, help, tip);
  });
  const host = page.locator('en-button');
  const control = page.getByRole('button', { name: 'Sharing options' });
  const nativeAccessibility = browserName === 'chromium' ? await page.context().newCDPSession(page) : null;
  const expectDescription = async (ids: string[], text: string) => {
    // Playwright 1.63's synthesized description ignores ariaDescribedByElements.
    // Check the real browser relationship in every engine and Chromium's native AX tree.
    await expect.poll(() => control.evaluate((element) => element.ariaDescribedByElements?.map((reference) => reference.id) ?? [])).toEqual(ids);
    if (nativeAccessibility) {
      await expect.poll(async () => {
        const { nodes } = await nativeAccessibility.send('Accessibility.getFullAXTree');
        return nodes.find((node) => node.role?.value === 'button' && node.name?.value === 'Sharing options')?.description?.value ?? '';
      }).toBe(text);
    }
  };
  await expect(control).toHaveAttribute('aria-haspopup', 'dialog');
  await expect(control).toHaveAttribute('aria-expanded', 'false');
  await expectDescription(['sharing-help', 'sharing-tip'], 'Only invited people can access this project. Manage collaborators.');
  await page.locator('#sharing-tip').evaluate((element) => { element.textContent = 'Manage collaborators and permissions.'; });
  await expectDescription(['sharing-help', 'sharing-tip'], 'Only invited people can access this project. Manage collaborators and permissions.');
  await host.evaluate((element) => {
    element.setAttribute('aria-expanded', 'true');
    element.setAttribute('aria-describedby', 'sharing-help');
  });
  await expect(control).toHaveAttribute('aria-expanded', 'true');
  await expectDescription(['sharing-help'], 'Only invited people can access this project.');
  await host.evaluate((element) => element.removeAttribute('aria-describedby'));
  await expectDescription([], '');
  await nativeAccessibility?.detach();
});

test('alert dismissal exposes a cancelable tentative value and keeps author writes silent', async ({ page }) => {
  await page.evaluate(() => {
    const alert = document.createElement('en-alert') as HTMLElement & { open: boolean; attempts: unknown[] };
    alert.textContent = 'Your changes are saved.';
    alert.setAttribute('dismissible', '');
    alert.setAttribute('dismiss-label', 'Dismiss save notice');
    alert.attempts = [];
    alert.addEventListener('en-change', (event: Event) => {
      alert.attempts.push({ open: alert.open, cancelable: event.cancelable });
      if (alert.dataset.cancel === 'true') event.preventDefault();
    });
    alert.dataset.cancel = 'true';
    document.body.append(alert);
  });
  const host = page.locator('en-alert');
  const dismiss = page.getByRole('button', { name: 'Dismiss save notice' });
  expect(await host.evaluate(element => 'controlled' in element)).toBe(false);
  await dismiss.click();
  await expect(dismiss).toBeVisible();
  await expect(host).toHaveJSProperty('open', true);
  expect(await host.evaluate((element: any) => element.attempts)).toEqual([{ open: false, cancelable: true }]);
  await host.evaluate((element: any) => { element.open = true; });
  expect(await host.evaluate((element: any) => element.attempts.length)).toBe(1);
  await host.evaluate(element => { element.dataset.cancel = 'false'; });
  await dismiss.click();
  await expect(dismiss).toBeHidden();
  await expect(host).toHaveJSProperty('open', false);
  expect(await host.evaluate((element: any) => element.attempts)).toEqual([
    { open: false, cancelable: true }, { open: false, cancelable: true },
  ]);
});

test('a synchronous application write supersedes alert default dismissal without a second event', async ({ page }) => {
  await page.evaluate(() => {
    const alert = document.createElement('en-alert') as HTMLElement & { open: boolean; attempts: number };
    alert.textContent = 'A collaborator is still editing.';
    alert.setAttribute('dismissible', '');
    alert.attempts = 0;
    alert.addEventListener('en-change', event => { alert.attempts++; event.preventDefault(); alert.open = true; });
    document.body.append(alert);
  });
  await page.getByRole('button', { name: 'Dismiss notification' }).click();
  await expect(page.getByRole('status')).toBeVisible();
  await expect(page.locator('en-alert')).toHaveJSProperty('open', true);
  expect(await page.locator('en-alert').evaluate((element: any) => element.attempts)).toBe(1);
});

test('avatar keeps an accessible name when its image fails and recovers on a new source', async ({ page }) => {
  await page.route('**/failed-avatar.png', (route) => route.fulfill({ status: 404, body: '' }));
  await page.evaluate(() => {
    const avatar = document.createElement('en-avatar');
    avatar.setAttribute('name', 'Ada Lovelace');
    avatar.setAttribute('src', '/failed-avatar.png');
    document.body.append(avatar);
  });
  await expect(page.getByRole('img', { name: 'Ada Lovelace' })).toBeVisible();
  await expect(page.locator('en-avatar').getByText('AL', { exact: true })).toBeVisible();
  await page.locator('en-avatar').evaluate((element) => {
    element.setAttribute('src', 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="black"/></svg>'));
  });
  await expect(page.locator('en-avatar img')).toHaveJSProperty('complete', true);
  await expect(page.locator('en-avatar img')).toHaveJSProperty('naturalWidth', 1);
  await expect(page.getByRole('img', { name: 'Ada Lovelace' })).toBeVisible();
});

test('native progress exposes its name and switches to indeterminate when value is removed', async ({ page }) => {
  await page.evaluate(() => {
    const progress = document.createElement('en-progress-bar');
    progress.setAttribute('label', 'Uploading artwork');
    progress.setAttribute('value', '35');
    progress.setAttribute('max', '80');
    document.body.append(progress);
  });
  const progress = page.getByRole('progressbar', { name: 'Uploading artwork' });
  await expect(progress).toHaveJSProperty('position', 35 / 80);
  await page.locator('en-progress-bar').evaluate((element) => element.removeAttribute('value'));
  await expect(progress).toHaveJSProperty('position', -1);
});

test('cards hide absent regions while preserving composed heading and action semantics', async ({ page }) => {
  await page.evaluate(() => {
    const card = document.createElement('en-card');
    const heading = document.createElement('h2');
    heading.slot = 'header';
    heading.textContent = 'Shared project';
    const link = document.createElement('en-link');
    link.slot = 'footer';
    link.setAttribute('href', '#project');
    link.textContent = 'Open project';
    card.append(heading, document.createTextNode('Three collaborators'), link);
    document.body.append(card);
  });
  await expect(page.getByRole('heading', { name: 'Shared project' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open project' })).toHaveAttribute('href', '#project');
  await page.getByRole('heading', { name: 'Shared project' }).evaluate((element) => element.remove());
  await expect(page.locator('en-card [part="header"]')).toBeHidden();
  await expect(page.getByRole('link', { name: 'Open project' })).toBeVisible();
});


test.describe('trusted touch on the rendered button label', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

  test('raw and named labels activate once, preserve authored nodes, and respect unavailable states', async ({ page }, info) => {
    info.annotations.push({ type: 'coverage', description: 'Pinned desktop-engine touch emulation; no physical-device result is implied.' });
    await page.evaluate(async () => {
      const host = document.createElement('en-button') as any;
      const raw = document.createTextNode('Search commands');
      const named = document.createElement('span'); named.slot = 'label'; named.textContent = 'Find actions';
      host.append(raw); host.dataset.activations = '0'; document.body.append(host); await host.updateComplete;
      const control = host.shadowRoot.querySelector('button'), label = host.shadowRoot.querySelector('[part~=label]');
      const state = host.__touchLabel = { raw, named, control, label, slots: [...label.querySelectorAll('slot')], events: [] as { trusted: boolean; authoredTarget: boolean }[] };
      host.addEventListener('click', (event: Event) => {
        state.events.push({ trusted: event.isTrusted, authoredTarget: event.composedPath()[0] === named });
        host.dataset.activations = String(state.events.length);
      });
    });
    const host = page.locator('en-button'), control = host.getByRole('button');
    const tapLabel = async () => {
      await control.scrollIntoViewIfNeeded();
      const point = await host.evaluate((element: any) => {
        const state = element.__touchLabel, node = state.named.isConnected ? state.named : state.raw;
        const range = document.createRange(); range.selectNodeContents(node);
        const rect = range.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) throw new Error('The selected label must have a rendered text box');
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
      });
      // Tap the actual label text, never substitute the native control's padding.
      await page.touchscreen.tap(point.x, point.y);
    };
    await expect(control).toHaveAccessibleName('Search commands');
    await tapLabel(); await expect(host).toHaveAttribute('data-activations', '1');
    await host.evaluate((element: any) => element.append(element.__touchLabel.named));
    await expect(control).toHaveAccessibleName('Find actions');
    expect(await host.evaluate((element: any) => {
      const range = document.createRange(); range.selectNodeContents(element.__touchLabel.raw);
      return range.getBoundingClientRect().width;
    })).toBe(0);
    await tapLabel(); await expect(host).toHaveAttribute('data-activations', '2');
    await host.evaluate((element: any) => element.__touchLabel.named.remove());
    await expect(control).toHaveAccessibleName('Search commands');
    await tapLabel(); await expect(host).toHaveAttribute('data-activations', '3');
    for (const unavailable of ['disabled', 'loading'] as const) {
      await host.evaluate(async (element: any, property) => { element[property] = true; await element.updateComplete; }, unavailable);
      await expect(control).toBeDisabled();
      await expect(control).toHaveAccessibleName('Search commands');
      if (unavailable === 'loading') await expect(control).toHaveAttribute('aria-busy', 'true');
      await tapLabel();
      await page.evaluate(() => new Promise<void>(done => requestAnimationFrame(() => requestAnimationFrame(() => done()))));
      await expect(host).toHaveAttribute('data-activations', '3');
      await host.evaluate(async (element: any, property) => { element[property] = false; await element.updateComplete; }, unavailable);
    }
    await expect(control).toBeEnabled();
    await tapLabel(); await expect(host).toHaveAttribute('data-activations', '4');
    expect(await host.evaluate((element: any) => {
      const state = element.__touchLabel;
      return {
        events: state.events,
        rawRetained: element.firstChild === state.raw,
        controlRetained: element.shadowRoot.querySelector('button') === state.control,
        labelRetained: element.shadowRoot.querySelector('[part~=label]') === state.label,
        slotsRetained: state.label.querySelectorAll('slot').length === state.slots.length && [...state.label.querySelectorAll('slot')].every((slot, index) => slot === state.slots[index]),
        namedRetained: state.named.slot === 'label' && state.named.textContent === 'Find actions' && !state.named.isConnected,
      };
    })).toEqual({
      events: [{ trusted: true, authoredTarget: false }, { trusted: true, authoredTarget: true }, { trusted: true, authoredTarget: false }, { trusted: true, authoredTarget: false }],
      rawRetained: true, controlRetained: true, labelRetained: true, slotsRetained: true, namedRetained: true,
    });
  });
});

test('host descriptions follow late insertion, replacement and movement without rerendering the button', async ({page,browserName}) => {
  await page.evaluate(async()=>{
    const host=document.createElement('en-button') as any;host.id='dynamic-description-button';host.textContent='Dynamic help';
    host.setAttribute('aria-describedby','dynamic-help');document.body.append(host);await host.updateComplete;
    (window as any).descriptionControl=host.shadowRoot.querySelector('button');
  });
  const host=page.locator('#dynamic-description-button'),control=host.locator('button');await control.focus();
  const session=browserName==='chromium'?await page.context().newCDPSession(page):null;
  const check=async(text:string)=>{
    await expect.poll(()=>control.evaluate(node=>Array.from(node.ariaDescribedByElements??[],node=>node.textContent))).toEqual(text?[text]:[]);
    expect(await control.evaluate(node=>node===(window as any).descriptionControl)).toBe(true);
    if(session) await expect.poll(async()=>{const {nodes}=await session.send('Accessibility.getFullAXTree');return nodes.find(node=>!node.ignored&&node.role?.value==='button'&&node.name?.value==='Dynamic help')?.description?.value??'';}).toBe(text);
  };
  await check('');
  await page.evaluate(()=>{const help=document.createElement('p');help.id='dynamic-help';help.textContent='Inserted after rendering';document.body.append(help);});
  await check('Inserted after rendering');await expect(control).toBeFocused();
  await page.locator('#dynamic-help').evaluate(node=>{node.outerHTML='<p id="dynamic-help">Replacement description</p>';});
  await check('Replacement description');await expect(control).toBeFocused();
  await page.locator('#dynamic-help').evaluate(node=>node.id='different-help');await check('');
  await page.evaluate(()=>{const container=document.createElement('div');container.id='description-scope';document.body.append(container);const root=container.attachShadow({mode:'open'});root.innerHTML='<p id="dynamic-help">Scoped description</p>';root.append(document.getElementById('dynamic-description-button')!);});
  await check('Scoped description');
  await host.evaluate(host=>{(window as any).detachedDescriptionHost=host;host.remove();});
  expect(await page.evaluate(()=>((window as any).descriptionControl.ariaDescribedByElements??[]).length)).toBe(0);
  await page.evaluate(()=>document.body.append((window as any).detachedDescriptionHost));await check('');
  await host.evaluate(host=>host.setAttribute('aria-describedby','different-help'));await check('Replacement description');
  await session?.detach();
});
