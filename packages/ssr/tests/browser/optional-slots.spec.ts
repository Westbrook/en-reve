import { test, expect, type Page } from '@playwright/test';

const region = (page: Page, id: string, part: string) => page.locator(`#${id} > [part~="base"] > [part~="${part}"]`);
const hydrate = async (page: Page) => {
  await page.evaluate(() => (window as any).hydrateOptionalSlotsFixture());
  await expect(page.locator('html')).toHaveAttribute('data-optional-slots-hydrated', 'true');
};
async function cardPresence(page: Page, id: string, header: boolean, footer: boolean) {
  await expect(region(page, id, 'header')).toBeVisible({ visible: header });
  await expect(region(page, id, 'footer')).toBeVisible({ visible: footer });
}
async function initialPresence(page: Page) {
  for (const [id, header, footer] of [
    ['card-both', true, true], ['card-bare', false, false],
    ['card-header', true, false], ['card-footer', false, true],
    ['card-outer', false, false], ['card-inner', true, true],
  ] as const) await cardPresence(page, id, header, footer);
  await expect(region(page, 'alert-icon', 'icon')).toBeVisible();
  await expect(region(page, 'alert-plain', 'icon')).toBeHidden();
  await expect(region(page, 'alert-nested', 'icon')).toBeVisible();
  await expect(page.locator('#status-icon')).toBeVisible();
  await expect(page.locator('#nested-icon')).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Nested format', exact: true })).toHaveValue('svg');
  await expect(page.getByRole('navigation', { name: 'Nested path', exact: true })).toBeVisible();
  await expect(page.locator('#nested-path').getByRole('link', { name: 'Home', exact: true })).toBeVisible();
  for (const [id, visible] of [['forward-empty', false], ['forward-present', true], ['forward-fallback', true]] as const) {
    const host = page.locator(`#${id}`);
    for (const part of ['header', 'footer']) await expect(host.locator(`en-card > [part~="base"] > [part~="${part}"]`)).toBeVisible({ visible });
    await expect(host.locator('en-alert > [part~="base"] > [part~="icon"]')).toBeVisible({ visible });
    if (visible) await expect(host.locator('svg')).toBeVisible();
  }
}

test('optional regions have correct presence and layout before any client JavaScript', async ({ browser }, testInfo) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto(new URL('/optional-slots-fixture', testInfo.project.use.baseURL).href);
    await initialPresence(page);
    const layout = await page.evaluate(() => {
      const root = (id: string) => document.getElementById(id)!.shadowRoot!;
      const base = root('card-bare').querySelector('[part~="base"]')!;
      const body = root('card-bare').querySelector('[part~="content"]')!;
      const cardStyle = getComputedStyle(base);
      const cardExtra = base.getBoundingClientRect().height - body.getBoundingClientRect().height
        - ['paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth'].reduce((total, key) => total + parseFloat((cardStyle as any)[key]), 0);
      const alert = root('alert-plain').querySelector('[part~="base"]')!;
      const content = root('alert-plain').querySelector('[part~="content"]')!;
      const alertStyle = getComputedStyle(alert);
      const alertLeadingSpace = content.getBoundingClientRect().left - alert.getBoundingClientRect().left
        - parseFloat(alertStyle.borderLeftWidth) - parseFloat(alertStyle.paddingLeft);
      const forwardedCard = root('forward-empty').querySelector('en-card')!.shadowRoot!;
      const forwardedBase = forwardedCard.querySelector('[part~="base"]')!;
      const forwardedStyle = getComputedStyle(forwardedBase);
      const forwardedCardExtra = forwardedBase.getBoundingClientRect().height - forwardedCard.querySelector('[part~="content"]')!.getBoundingClientRect().height
        - ['paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth'].reduce((total, key) => total + parseFloat((forwardedStyle as any)[key]), 0);
      const forwardedAlert = root('forward-empty').querySelector('en-alert')!.shadowRoot!;
      const forwardedAlertBase = forwardedAlert.querySelector('[part~="base"]')!;
      const forwardedAlertStyle = getComputedStyle(forwardedAlertBase);
      const forwardedAlertLeadingSpace = forwardedAlert.querySelector('[part~="content"]')!.getBoundingClientRect().left - forwardedAlertBase.getBoundingClientRect().left
        - parseFloat(forwardedAlertStyle.borderLeftWidth) - parseFloat(forwardedAlertStyle.paddingLeft);
      return { cardExtra, alertLeadingSpace, forwardedCardExtra, forwardedAlertLeadingSpace, registered: Boolean(customElements.get('en-card') || customElements.get('en-alert')) };
    });
    expect(Math.abs(layout.cardExtra)).toBeLessThanOrEqual(1);
    expect(Math.abs(layout.alertLeadingSpace)).toBeLessThanOrEqual(1);
    expect(Math.abs(layout.forwardedCardExtra)).toBeLessThanOrEqual(1);
    expect(Math.abs(layout.forwardedAlertLeadingSpace)).toBeLessThanOrEqual(1);
    expect(layout.registered).toBe(false);
    await testInfo.attach('optional-slot-initial-layout', { contentType: 'application/json', body: JSON.stringify(layout, null, 2) });
  } finally { await context.close(); }
});

test('hydration retains slot nodes, focus and geometry without transient visibility changes', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/optional-slots-fixture');
  await initialPresence(page);
  const action = page.getByRole('button', { name: 'Dismiss fixture status', exact: true });
  await action.focus();
  await page.evaluate(async () => {
    await document.fonts.ready;
    const rect = (node: Element) => { const box = node.getBoundingClientRect(); return [box.x, box.y, box.width, box.height]; };
    const hosts: Element[] = [];
    const visit = (root: ParentNode) => {
      for (const host of root.querySelectorAll('*')) {
        if (!host.shadowRoot) continue;
        if (['en-card', 'en-alert', 'en-select', 'en-breadcrumbs', 'en-optional-slot-forwarder'].includes(host.localName)) hosts.push(host);
        visit(host.shadowRoot);
      }
    };
    visit(document.getElementById('optional-slots-fixture')!);
    const records = hosts.map(host => ({
      host, root: host.shadowRoot!,
      nodes: [...host.shadowRoot!.querySelectorAll('[part], slot')],
      children: [...host.children],
    }));
    const watched = records.flatMap(record => record.nodes.filter(node =>
      (record.host.localName === 'en-card' && ['header', 'footer'].includes(node.getAttribute('part')!))
      || (record.host.localName === 'en-alert' && node.getAttribute('part') === 'icon')));
    const visibilityChanges: unknown[] = [];
    const capture = (changes: MutationRecord[]) => {
      const relevant = changes.filter(change => watched.includes(change.target as Element));
      relevant.forEach((change, index) => {
        const next = relevant.slice(index + 1).find(candidate => candidate.target === change.target);
        const before = change.oldValue !== null;
        const after = next ? next.oldValue !== null : (change.target as Element).hasAttribute('hidden');
        if (before !== after) visibilityChanges.push({ part: (change.target as Element).getAttribute('part'), before, after });
      });
    };
    const observer = new MutationObserver(capture);
    for (const record of records) observer.observe(record.root, { subtree: true, attributes: true, attributeFilter: ['hidden'], attributeOldValue: true });
    const nodes = records.flatMap(record => [record.host, ...record.nodes]);
    (window as any).__optionalSlots = { records, nodes, boxes: nodes.map(rect), visibilityChanges, observer, capture, rect };
  });
  await hydrate(page);
  await initialPresence(page);
  await expect(action).toBeFocused();
  const retained = await page.evaluate(() => {
    const saved = (window as any).__optionalSlots;
    saved.capture(saved.observer.takeRecords());
    saved.observer.disconnect();
    return {
      identity: saved.records.every((record: any) => record.host.shadowRoot === record.root
        && [...record.root.querySelectorAll('[part], slot')].every((node, index) => node === record.nodes[index])
        && record.root.querySelectorAll('[part], slot').length === record.nodes.length
        && [...record.host.children].every((node, index) => node === record.children[index])
        && record.host.children.length === record.children.length),
      maxGeometryChange: Math.max(...saved.nodes.flatMap((node: Element, index: number) => saved.rect(node).map((value: number, axis: number) => Math.abs(value - saved.boxes[index][axis])))),
      visibilityChanges: saved.visibilityChanges,
    };
  });
  expect(retained.identity).toBe(true);
  expect(retained.maxGeometryChange).toBeLessThanOrEqual(1);
  expect(retained.visibilityChanges).toEqual([]);
  expect(errors).toEqual([]);
  await testInfo.attach('optional-slot-hydration-retention', { contentType: 'application/json', body: JSON.stringify(retained, null, 2) });
});

test('hydration reconciles slot mutations whose events already fired before registration', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/optional-slots-fixture');
  await page.evaluate(async () => {
    document.getElementById('card-heading')!.setAttribute('slot', 'footer');
    document.getElementById('card-action')!.remove();
    const header = document.createElement('span');
    header.id = 'early-header'; header.slot = 'header'; header.textContent = 'Added before hydration';
    document.getElementById('card-bare')!.append(header);
    // Leave the original SVG inside its Lit child part; mutate only its slot.
    const originalIcon = document.getElementById('status-icon')!;
    originalIcon.removeAttribute('slot');
    const icon = originalIcon.cloneNode(true) as SVGElement;
    icon.id = 'early-icon'; icon.setAttribute('slot', 'icon');
    document.getElementById('alert-plain')!.append(icon);
    // Native slotchange is delivered before client listeners are installed.
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    (window as any).__earlySlotNodes = { header, icon, heading: document.getElementById('card-heading') };
  });
  await hydrate(page);
  await cardPresence(page, 'card-both', false, true);
  await cardPresence(page, 'card-bare', true, false);
  await expect(region(page, 'alert-icon', 'icon')).toBeHidden();
  await expect(region(page, 'alert-plain', 'icon')).toBeVisible();
  await expect(page.locator('#early-header')).toBeVisible();
  await expect(page.locator('#status-icon')).toBeVisible();
  await expect(page.locator('#early-icon')).toBeVisible();
  expect(await page.evaluate(() => {
    const saved = (window as any).__earlySlotNodes;
    return saved.header === document.getElementById('early-header')
      && saved.icon === document.getElementById('early-icon')
      && saved.heading === document.getElementById('card-heading')
      && saved.heading.assignedSlot?.name === 'footer'
      && saved.icon.assignedSlot?.getRootNode() === document.getElementById('alert-plain')!.shadowRoot;
  })).toBe(true);
  expect(errors).toEqual([]);
});

for (const mode of ['hydrated', 'client'] as const) test(`${mode} surfaces respond to append, slot reassignment and removal`, async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/optional-slots-fixture');
  await hydrate(page);
  const ids = await page.evaluate(async currentMode => {
    if (currentMode === 'hydrated') return { card: 'card-bare', alert: 'alert-plain' };
    const card = document.createElement('en-card');
    card.id = 'client-card';
    const body = document.createElement('p'); body.textContent = 'Client body.'; card.append(body);
    const alert = document.createElement('en-alert');
    alert.id = 'client-alert'; alert.textContent = 'Client status.';
    document.getElementById('client-only')!.append(card, alert);
    await Promise.all([(card as any).updateComplete, (alert as any).updateComplete]);
    return { card: card.id, alert: alert.id };
  }, mode);
  await cardPresence(page, ids.card, false, false);
  await expect(region(page, ids.alert, 'icon')).toBeHidden();
  await page.evaluate(({ card, alert }) => {
    const header = document.createElement('span');
    header.id = 'late-region'; header.slot = 'header'; header.textContent = 'Dynamic region';
    document.getElementById(card)!.append(header);
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.id = 'late-icon'; icon.setAttribute('slot', 'icon'); icon.setAttribute('width', '20'); icon.setAttribute('height', '20');
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '10'); circle.setAttribute('cy', '10'); circle.setAttribute('r', '8'); icon.append(circle);
    document.getElementById(alert)!.append(icon);
  }, ids);
  await cardPresence(page, ids.card, true, false);
  await expect(region(page, ids.alert, 'icon')).toBeVisible();
  await expect(page.locator('#late-icon')).toBeVisible();
  await page.evaluate(() => {
    document.getElementById('late-region')!.setAttribute('slot', 'footer');
    document.getElementById('late-icon')!.removeAttribute('slot');
  });
  await cardPresence(page, ids.card, false, true);
  await expect(region(page, ids.alert, 'icon')).toBeHidden();
  // The same SVG now belongs to the ordinary message slot.
  await expect(page.locator('#late-icon')).toBeVisible();
  await page.locator('#late-icon').evaluate(icon => icon.setAttribute('slot', 'icon'));
  await expect(region(page, ids.alert, 'icon')).toBeVisible();
  await page.evaluate(() => { document.getElementById('late-region')!.remove(); document.getElementById('late-icon')!.remove(); });
  await cardPresence(page, ids.card, false, false);
  await expect(region(page, ids.alert, 'icon')).toBeHidden();
  expect(errors).toEqual([]);
});

const forwardedRegion = (page: Page, id: string, element: string, part: string) =>
  page.locator(`#${id} ${element} > [part~="base"] > [part~="${part}"]`);

async function forwardedPresence(page: Page, id: string, header: boolean, footer: boolean, icon: boolean) {
  await expect(forwardedRegion(page, id, 'en-card', 'header')).toBeVisible({ visible: header });
  await expect(forwardedRegion(page, id, 'en-card', 'footer')).toBeVisible({ visible: footer });
  await expect(forwardedRegion(page, id, 'en-alert', 'icon')).toBeVisible({ visible: icon });
}

for (const timing of ['before hydration', 'after hydration'] as const) {
  test(`forwarded optional regions reconcile content added ${timing} and subsequent reassignment`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/optional-slots-fixture');
    if (timing === 'after hydration') await hydrate(page);
    await page.locator('#forward-empty').evaluate(async host => {
      const heading = document.createElement('h2');
      heading.id = 'forwarded-late-heading'; heading.slot = 'heading'; heading.textContent = 'Live forwarded heading';
      const action = document.createElement('button');
      action.id = 'forwarded-late-action'; action.slot = 'actions'; action.textContent = 'Live forwarded action';
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      icon.id = 'forwarded-late-symbol'; icon.setAttribute('slot', 'symbol');
      icon.setAttribute('width', '20'); icon.setAttribute('height', '20');
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '10'); circle.setAttribute('cy', '10'); circle.setAttribute('r', '8');
      icon.append(circle); host.append(heading, action, icon);
      (window as any).__forwardedNodes = { heading, action, icon };
      // Deliver the forwarding slot's native events even when custom elements
      // have not registered yet; hydration must reconcile their current state.
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
    });
    if (timing === 'before hydration') await hydrate(page);
    await forwardedPresence(page, 'forward-empty', true, true, true);
    const action = page.getByRole('button', { name: 'Live forwarded action', exact: true });
    await action.focus();
    await expect(action).toBeFocused();
    await page.locator('#forwarded-late-heading').evaluate(heading => heading.setAttribute('slot', 'actions'));
    await forwardedPresence(page, 'forward-empty', false, true, true);
    await expect(page.getByRole('heading', { name: 'Live forwarded heading', exact: true })).toBeVisible();
    await expect(action).toBeFocused();
    await page.locator('#forwarded-late-symbol').evaluate(icon => icon.removeAttribute('slot'));
    await forwardedPresence(page, 'forward-empty', false, true, false);
    await page.locator('#forwarded-late-symbol').evaluate(icon => icon.setAttribute('slot', 'symbol'));
    await forwardedPresence(page, 'forward-empty', false, true, true);
    expect(await page.evaluate(() => {
      const saved = (window as any).__forwardedNodes;
      return saved.heading === document.getElementById('forwarded-late-heading')
        && saved.action === document.getElementById('forwarded-late-action')
        && saved.icon === document.getElementById('forwarded-late-symbol');
    })).toBe(true);
    await page.locator('#forward-empty').evaluate(host => host.replaceChildren());
    await forwardedPresence(page, 'forward-empty', false, false, false);
    expect(errors).toEqual([]);
  });
}

test('forwarded fallback regions restore their original content after assigned children are removed', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/optional-slots-fixture');
  await hydrate(page);
  const host = page.locator('#forward-fallback');
  const fallbackHeading = host.getByRole('heading', { name: 'Fallback heading', exact: true });
  const fallbackAction = host.getByRole('button', { name: 'Fallback action', exact: true });
  await expect(fallbackHeading).toBeVisible();
  await expect(fallbackAction).toBeVisible();
  await host.evaluate(element => {
    (window as any).__fallbackNodes = [...element.shadowRoot!.querySelectorAll('slot')].flatMap(slot => [...slot.children]);
    const heading = document.createElement('h2'); heading.slot = 'heading'; heading.textContent = 'Assigned heading';
    const action = document.createElement('button'); action.slot = 'actions'; action.textContent = 'Assigned action';
    const symbol = document.createElement('span'); symbol.slot = 'symbol'; symbol.textContent = 'Assigned symbol';
    element.append(heading, action, symbol);
  });
  await expect(fallbackHeading).toBeHidden();
  await expect(fallbackAction).toBeHidden();
  await expect(host.getByRole('heading', { name: 'Assigned heading', exact: true })).toBeVisible();
  const assignedAction = host.getByRole('button', { name: 'Assigned action', exact: true });
  await assignedAction.focus();
  await expect(assignedAction).toBeFocused();
  await forwardedPresence(page, 'forward-fallback', true, true, true);
  await host.evaluate(element => element.replaceChildren());
  await forwardedPresence(page, 'forward-fallback', true, true, true);
  await expect(fallbackHeading).toBeVisible();
  await expect(fallbackAction).toBeVisible();
  await fallbackAction.focus();
  await expect(fallbackAction).toBeFocused();
  expect(await host.evaluate(element => {
    const current = [...element.shadowRoot!.querySelectorAll('slot')].flatMap(slot => [...slot.children]);
    const original = (window as any).__fallbackNodes as Element[];
    return current.length === original.length && current.every((node, index) => node === original[index]);
  })).toBe(true);
  expect(errors).toEqual([]);
});


test('API-06 preserves authored slots through SSR, hydration and fallback writes', async ({page}) => {
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/optional-slots-fixture');
  const summary=page.locator('#api06-summary'), activity=page.locator('#api06-activity');
  await expect(summary.locator('strong')).toBeVisible();
  await expect(summary.getByText('Server fallback',{exact:true})).not.toBeVisible();
  await expect(activity.locator(':scope > time')).toBeVisible();await expect(activity.locator('[part=time]')).not.toBeVisible();
  await page.evaluate(()=>{(window as any).api06Nodes=[document.querySelector('#api06-summary strong'),document.querySelector('#api06-activity > time')];});
  await hydrate(page);
  expect(await page.evaluate(()=>(window as any).api06Nodes[0]===document.querySelector('#api06-summary strong')&&(window as any).api06Nodes[1]===document.querySelector('#api06-activity > time'))).toBe(true);
  await summary.evaluate((el:any)=>el.description='Hydrated fallback');await expect(summary.locator('strong')).toBeVisible();
  await expect(summary.getByText('Hydrated fallback',{exact:true})).not.toBeVisible();
  await summary.locator('strong').evaluate(el=>el.remove());await expect(summary.getByText('Hydrated fallback',{exact:true})).toBeVisible();
  await page.locator('#api06-empty').evaluate((el:any)=>el.description='Late fallback');await expect(page.locator('#api06-empty').getByText('Late fallback',{exact:true})).toBeVisible();
  await activity.evaluate((el:any)=>el.timeLabel='Hydrated timestamp');await expect(activity.locator(':scope > time')).toHaveText('Authored timestamp');
  await activity.locator(':scope > time').evaluate(el=>el.remove());await expect(activity.locator('[part=time]')).toHaveText('Hydrated timestamp');await expect(activity.locator('[part=time]')).toBeVisible();
  expect(errors).toEqual([]);
});
