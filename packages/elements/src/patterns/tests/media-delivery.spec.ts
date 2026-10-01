import { test, expect, type Page } from '@playwright/test';

async function fixture(page: Page) {
  await page.goto('/packages/elements/src/patterns/tests/media-delivery-fixture.html');
  await page.waitForFunction(() => !!(window as any).mediaDelivery);
}
async function mount(page: Page, open = false) {
  await fixture(page);
  await page.evaluate(async ({ open }) => {
    const api = (window as any).mediaDelivery;
    const scope = api.createElementScope({ document, registry: 'global' });
    scope.register([api.definition]);
    const trigger = document.createElement('button'); trigger.id = 'open'; trigger.textContent = 'View images';
    const viewer = scope.createElement('en-media-viewer'); viewer.id = 'viewer'; viewer.for = 'open';
    viewer.items = api.items; viewer.open = open;
    document.querySelector('#fixture')!.append(trigger, viewer); await api.settle(document);
  }, { open });
}

test('closed and initially open viewers construct and retain their gallery', async ({ page }) => {
  await fixture(page);
  const result = await page.evaluate(async () => {
    const api = (window as any).mediaDelivery, scope = api.createElementScope({ document, registry: 'global' }); scope.register([api.definition]);
    const values = [];
    for (const open of [false, true]) {
      const viewer = scope.createElement('en-media-viewer'); viewer.items = api.items; viewer.open = open;
      document.body.append(viewer); await api.settle(document);
      const carousel = viewer.shadowRoot.querySelector('en-carousel');
      const initial = !!carousel, shell = !!viewer.shadowRoot.querySelector('dialog');
      viewer.open = !open; await api.settle(document);
      viewer.open = open; await api.settle(document);
      values.push({ initial, shell, retained: carousel === viewer.shadowRoot.querySelector('en-carousel') }); viewer.remove();
    }
    return values;
  });
  expect(result).toEqual([
    { initial: true, shell: true, retained: true }, { initial: true, shell: true, retained: true },
  ]);
});

test('cancellation and nested synchronous update flushes retain the eager body', async ({ page }) => {
  await mount(page);
  const result = await page.locator('#viewer').evaluate(async (viewer: any) => {
    const api = (window as any).mediaDelivery;
    const initialBody = viewer.shadowRoot.querySelector('en-carousel');
    const hasBody = () => !!initialBody && initialBody === viewer.shadowRoot.querySelector('en-carousel');
    const during: boolean[] = [];
    const veto = (event: CustomEvent) => { viewer.requestUpdate(); viewer.performUpdate(); during.push(hasBody()); event.preventDefault(); };
    viewer.addEventListener('en-change', veto, { once: true }); const canceled = viewer.show(); await api.settle(document);
    const afterCancel = hasBody();
    viewer.addEventListener('en-change', () => { viewer.hide(); viewer.requestUpdate(); viewer.performUpdate(); during.push(hasBody()); }, { once: true });
    const superseded = viewer.show(); await api.settle(document); const afterNested = hasBody();
    const accepted = viewer.show(); const closed = viewer.hide(); await api.settle(document); const afterSameTurn = hasBody();
    viewer.open = true; viewer.open = false; await api.settle(document); const afterWrites = hasBody();
    viewer.addEventListener('en-change', (event: CustomEvent) => { viewer.open = true; viewer.performUpdate(); during.push(hasBody()); event.preventDefault(); }, { once: true });
    const authoritative = viewer.show(); await api.settle(document);
    return { canceled, afterCancel, superseded, afterNested, accepted, closed, afterSameTurn, afterWrites, authoritative, during, final: hasBody(), open: viewer.open };
  });
  expect(result).toEqual({ canceled: 'canceled', afterCancel: true, superseded: 'superseded', afterNested: true,
    accepted: 'committed', closed: 'committed', afterSameTurn: true, afterWrites: true,
    authoritative: 'superseded', during: [true, true, true], final: true, open: true });
});

for (const config of [
  { width: 1280, height: 900, dir: 'ltr', appearance: 'light' },
  { width: 1280, height: 900, dir: 'rtl', appearance: 'dark' },
  { width: 390, height: 844, dir: 'ltr', appearance: 'dark' },
  { width: 390, height: 844, dir: 'rtl', appearance: 'light' },
]) test(`first keyboard open and retained controls ${config.width}/${config.dir}/${config.appearance}`, async ({ page }) => {
  await page.setViewportSize(config); await mount(page);
  await page.locator('html').evaluate((html, config) => { html.dir = config.dir; html.dataset.enAppearance = config.appearance; }, config);
  expect(await page.locator('html').evaluate(html => getComputedStyle(html).colorScheme)).toBe(config.appearance);
  const viewer = page.locator('#viewer'), trigger = page.locator('#open');
  await expect(viewer.locator('en-carousel')).toHaveCount(1);
  await trigger.focus(); await trigger.press('Enter'); await expect(viewer.getByRole('dialog')).toBeVisible();
  const zoom = viewer.getByRole('slider', { name: 'Zoom' }); await expect(zoom).toBeVisible(); await zoom.fill('2');
  await viewer.evaluate((el: any) => { (window as any).mediaNodes = [el.shadowRoot.querySelector('en-carousel'), el.shadowRoot.querySelector('input'), el.shadowRoot.querySelector('img')]; });
  await viewer.evaluate((el: any) => el.addEventListener('en-change', (event: any) => { if (event.detail.proposed === false) event.preventDefault(); }, { once: true }));
  await page.keyboard.press('Escape'); await expect(viewer.getByRole('dialog')).toBeVisible(); await expect(zoom).toHaveValue('2');
  await page.keyboard.press('Escape'); await expect(trigger).toBeFocused(); await trigger.click(); await expect(zoom).toHaveValue('2');
  expect(await viewer.evaluate((el: any) => [el.shadowRoot.querySelector('en-carousel'), el.shadowRoot.querySelector('input'), el.shadowRoot.querySelector('img')].every((node, index) => node === (window as any).mediaNodes[index]))).toBe(true);
  await viewer.getByRole('button', { name: 'Next slide' }).click(); expect(await viewer.evaluate((el: any) => el.activeKey)).toBe('b');
  await expect(zoom).toHaveValue('1'); await viewer.getByRole('button', { name: 'Close', exact: true }).click(); await expect(trigger).toBeFocused();
});

test('latest items, silent active key writes, cancellation and empty content retain media ownership', async ({ page }) => {
  await mount(page);
  const viewer = page.locator('#viewer');
  await viewer.evaluate((el: any) => { const api = (window as any).mediaDelivery; el.items = [api.items[1], api.items[0]]; el.activeKey = 'a'; });
  await page.locator('#open').click(); await expect(viewer.locator('[data-current=true] img')).toHaveAttribute('alt', 'First image');
  await viewer.getByRole('slider', { name: 'Zoom' }).fill('2');
  await viewer.evaluate((el: any) => { el.addEventListener('en-change', (event: any) => { if (event.detail.reason === 'media') event.preventDefault(); }, { once: true }); });
  await viewer.getByRole('button', { name: 'Previous slide' }).click(); expect(await viewer.evaluate((el: any) => el.activeKey)).toBe('a');
  await expect(viewer.getByRole('slider', { name: 'Zoom' })).toHaveValue('2');
  await viewer.evaluate((el: any) => { el.items = [(window as any).mediaDelivery.items[1]]; });
  await expect(viewer.locator('[data-current=true] img')).toHaveAttribute('alt', 'Second image'); await expect(viewer.getByRole('slider', { name: 'Zoom' })).toHaveValue('1');
  await viewer.evaluate((el: any) => { el.items = []; }); await expect(viewer.getByText('No media available.')).toBeVisible();
  await viewer.evaluate((el: any) => { el.items = (window as any).mediaDelivery.items; }); await expect(viewer.getByRole('slider', { name: 'Zoom' })).toHaveValue('1');
});

for (const tree of ['ordinary', 'shadow', 'nested'] as const) test(`shared owning registry and sibling isolation in ${tree} roots`, async ({ page, browserName }) => {
  await fixture(page);
  const result = await page.evaluate(async tree => {
    const api = (window as any).mediaDelivery, scope = api.createElementScope({ document }); scope.register([api.definition]);
    let root: Element | ShadowRoot = scope.createElement('section'); document.body.append(root);
    if (tree !== 'ordinary') root = scope.attachShadow(root);
    if (tree === 'nested') { const inside = scope.createElement('section'); root.append(inside); root = scope.attachShadow(inside); }
    const viewers = Array.from({ length: 3 }, () => { const el = scope.createElement('en-media-viewer'); el.items = api.items; root.append(el); return el; });
    await api.settle(root); const eagerBody = viewers[0].shadowRoot.querySelector('en-carousel'), siblingBody = viewers[2].shadowRoot.querySelector('en-carousel');
    viewers[1].show(); await api.settle(root);
    const carousel = viewers[1].shadowRoot.querySelector('en-carousel');
    return { mode: scope.mode, native: api.elementScopeCapabilities(document).native,
      correctConstructor: carousel instanceof scope.get('en-carousel'),
      rootRegistry: !('customElementRegistry' in carousel.shadowRoot) || carousel.shadowRoot.customElementRegistry === scope.registry,
      eagerRetained: !!eagerBody && eagerBody === viewers[0].shadowRoot.querySelector('en-carousel'),
      siblingRetained: !!siblingBody && siblingBody === viewers[2].shadowRoot.querySelector('en-carousel') && !viewers[2].open,
      globalAbsent: scope.mode === 'global' || !customElements.get('en-media-viewer') };
  }, tree);
  expect(result).toEqual({ mode: result.native ? 'scoped' : 'global', native: result.native, correctConstructor: true, rootRegistry: true, eagerRetained: true, siblingRetained: true, globalAbsent: true });
  test.info().annotations.push({ type: 'actual-registry-mode', description: `${browserName}: ${result.mode}` });
});

test('null-associated viewer stays dormant until explicit initialization', async ({ page }) => {
  await fixture(page);
  const result = await page.evaluate(async () => {
    const api = (window as any).mediaDelivery, scope = api.createElementScope({ document });
    if (!api.elementScopeCapabilities(document).dormant) return null;
    scope.register([api.definition]);
    const root = document.createElement('section', { customElementRegistry: null } as any);
    root.innerHTML = '<en-media-viewer></en-media-viewer>';
    const viewer = root.firstElementChild as any; viewer.items = api.items; document.body.append(root);
    const dormant = !viewer.shadowRoot && viewer.customElementRegistry === null;
    scope.initialize(root); scope.upgrade(root); await api.settle(root);
    const unopenedBody = viewer.shadowRoot.querySelector('en-carousel'); viewer.show(); await api.settle(root);
    return { dormant, retained: !!unopenedBody && unopenedBody === viewer.shadowRoot.querySelector('en-carousel'), owned: viewer.shadowRoot.querySelector('en-carousel') instanceof scope.get('en-carousel') };
  });
  test.skip(result === null, 'Actual engine does not support null registry association');
  expect(result).toEqual({ dormant: true, retained: true, owned: true });
});

test('remove before opening settles, reconnect and same-origin adoption preserve one retained body', async ({ page }) => {
  await mount(page);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  const result = await page.locator('#viewer').evaluate(async (viewer: any) => {
    const api = (window as any).mediaDelivery, parent = viewer.parentNode, initialCarousel = viewer.shadowRoot.querySelector('en-carousel');
    viewer.show(); viewer.remove(); await viewer.updateComplete;
    const detachedModal = viewer.shadowRoot.querySelector('dialog').open;
    const detachedBodyRetained = !!initialCarousel && initialCarousel === viewer.shadowRoot.querySelector('en-carousel');
    parent.append(viewer); await api.settle(document);
    const root = viewer.shadowRoot, carousel = root.querySelector('en-carousel'), input = root.querySelector('input');
    viewer.hide(); await viewer.updateComplete;
    const frame = document.createElement('iframe'); document.body.append(frame); const target = frame.contentDocument!;
    target.body.append(viewer); await viewer.updateComplete; viewer.show(); await viewer.updateComplete;
    const identity = root === viewer.shadowRoot && carousel === root.querySelector('en-carousel') && input === root.querySelector('input');
    const modal = root.querySelector('dialog').open; viewer.remove(); await viewer.updateComplete;
    return { detachedModal, detachedBodyRetained, identity, modal, childDocument: carousel.ownerDocument === target };
  });
  expect(errors).toEqual([]); expect(result).toEqual({ detachedModal: false, detachedBodyRetained: true, identity: true, modal: true, childDocument: true });
});

test('pointer cancellation restores the gesture origin and disconnect ends an active gesture', async ({ page }) => {
  await mount(page); await page.locator('#open').click();
  const viewer = page.locator('#viewer'), frame = viewer.locator('[data-current=true]'), image = frame.locator('img');
  await viewer.getByRole('slider', { name: 'Zoom' }).fill('2');
  const initial = await image.getAttribute('style'), box = await frame.boundingBox();
  await frame.evaluate(el => el.addEventListener('pointerdown', (event: any) => { (window as any).mediaPointerId = event.pointerId; }, { once: true }));
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2); await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2 + 70, box!.y + box!.height / 2 + 30);
  await expect(image).not.toHaveAttribute('style', initial!);
  await frame.evaluate(el => el.dispatchEvent(new PointerEvent('pointercancel', { pointerId: (window as any).mediaPointerId, bubbles: true })));
  await expect(image).toHaveAttribute('style', initial!); await page.mouse.up();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2); await page.mouse.down();
  const retained = await viewer.evaluate(async (el: any) => {
    const parent = el.parentNode; el.remove(); parent.append(el); await (window as any).mediaDelivery.settle(document);
    const active = el.shadowRoot.querySelector('[data-current=true]'), image = active.querySelector('img'), before = image.getAttribute('style');
    active.dispatchEvent(new PointerEvent('pointermove', { pointerId: (window as any).mediaPointerId, clientX: 1, clientY: 1, bubbles: true })); await el.updateComplete;
    return image.getAttribute('style') === before;
  });
  await page.mouse.up(); expect(retained).toBe(true);
});

test('authoritative closed writes and a nested canceled close preserve the eager body', async ({ page }) => {
  await mount(page);
  const result = await page.locator('#viewer').evaluate(async (viewer: any) => {
    const api = (window as any).mediaDelivery, initialBody = viewer.shadowRoot.querySelector('en-carousel');
    const body = () => !!initialBody && initialBody === viewer.shadowRoot.querySelector('en-carousel');
    let changes = 0; viewer.addEventListener('en-change', () => changes++);
    viewer.open = true; viewer.open = false; await api.settle(document); const silent = changes === 0;
    viewer.addEventListener('en-change', (event: Event) => { viewer.open = false; viewer.performUpdate(); event.preventDefault(); }, { once: true });
    const replaced = viewer.show(); await api.settle(document); const remainsPresent = body();
    let nested: string | undefined;
    viewer.addEventListener('en-change', () => {
      viewer.addEventListener('en-change', (event: Event) => event.preventDefault(), { once: true });
      nested = viewer.hide(); viewer.performUpdate();
    }, { once: true });
    const accepted = viewer.show(); await api.settle(document);
    return { silent, replaced, remainsPresent, nested, accepted, finalBody: body(), open: viewer.open };
  });
  expect(result).toEqual({ silent: true, replaced: 'superseded', remainsPresent: true, nested: 'canceled', accepted: 'committed', finalBody: true, open: true });
});

test('automatic failed-native probe selects the actual global registry for generated descendants', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).mediaNativeProbeAttempts = 0;
    Object.defineProperty(window, 'CustomElementRegistry', { configurable: true, value: class {
      constructor() { (window as any).mediaNativeProbeAttempts++; throw new Error('Native registry unavailable in fixture'); }
    } });
  });
  await fixture(page);
  const result = await page.evaluate(async () => {
    const api = (window as any).mediaDelivery, scope = api.createElementScope({ document }); scope.register([api.definition]);
    const viewer = scope.createElement('en-media-viewer'); viewer.items = api.items;
    const sibling = scope.createElement('en-media-viewer'); sibling.items = api.items;
    document.body.append(viewer, sibling); await api.settle(document);
    const initialCarousel = viewer.shadowRoot.querySelector('en-carousel'), siblingCarousel = sibling.shadowRoot.querySelector('en-carousel'); viewer.show(); await api.settle(document);
    const carousel = viewer.shadowRoot.querySelector('en-carousel');
    return { mode: scope.mode, owner: scope.registry === customElements, probed: (window as any).mediaNativeProbeAttempts > 0,
      initiallyConstructed: !!initialCarousel, retained: initialCarousel === carousel, generated: carousel instanceof customElements.get('en-carousel'),
      document: carousel.ownerDocument === document, siblingRetained: !!siblingCarousel && siblingCarousel === sibling.shadowRoot.querySelector('en-carousel') && !sibling.open };
  });
  expect(result).toEqual({ mode: 'global', owner: true, probed: true, initiallyConstructed: true, retained: true, generated: true, document: true, siblingRetained: true });
});

for (const warm of [false, true]) test(`native scoped ${warm ? 'previously opened' : 'never opened'} body adopts with document-owned listeners and focus`, async ({ page }) => {
  await fixture(page);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  const result = await page.evaluate(async warm => {
    const api = (window as any).mediaDelivery, scope = api.createElementScope({ document });
    if (scope.mode !== 'scoped') return null;
    scope.register([api.definition]);
    const frame = document.createElement('iframe'); document.body.append(frame); const target = frame.contentDocument!;
    const sourceListeners = new Set(), targetListeners = new Set();
    const watch = (doc: Document, listeners: Set<unknown>) => {
      const add = doc.addEventListener, remove = doc.removeEventListener;
      doc.addEventListener = function (type: any, listener: any, options: any) { if (type === 'visibilitychange') listeners.add(listener); return add.call(this, type, listener, options); } as typeof add;
      doc.removeEventListener = function (type: any, listener: any, options: any) { if (type === 'visibilitychange') listeners.delete(listener); return remove.call(this, type, listener, options); } as typeof remove;
      return () => { doc.addEventListener = add; doc.removeEventListener = remove; };
    };
    const stopSource = watch(document, sourceListeners), stopTarget = watch(target, targetListeners);
    const sourceTrigger = document.createElement('button'); sourceTrigger.textContent = 'Source'; document.body.append(sourceTrigger);
    const targetTrigger = target.createElement('button'); targetTrigger.id = 'adopt-open'; targetTrigger.textContent = 'Destination'; target.body.append(targetTrigger);
    const viewer = scope.createElement('en-media-viewer'); viewer.items = api.items; viewer.for = 'adopt-open';
    let sourceFocusEvents = 0;
    try {
      document.body.append(viewer); await api.settle(document);
      if (warm) { sourceTrigger.focus(); viewer.show(); await api.settle(document); viewer.hide(); await api.settle(document); }
      const root = viewer.shadowRoot, originalCarousel = root.querySelector('en-carousel');
      const sourceInstalled = sourceListeners.size;
      target.body.append(viewer); await api.settle(target); const retainedBeforeDestinationUse = originalCarousel === root.querySelector('en-carousel');
      sourceTrigger.addEventListener('focus', () => sourceFocusEvents++);
      targetTrigger.focus(); targetTrigger.click(); await api.settle(target);
      const carousel = root.querySelector('en-carousel'), slides = [...root.querySelectorAll('en-carousel-slide')];
      const sourceReleased = sourceListeners.size === 0, destinationInstalled = targetListeners.size;
      const nativeOpen = root.querySelector('dialog').open;
      const owned = carousel instanceof scope.get('en-carousel') && carousel.customElementRegistry === scope.registry
        && carousel.shadowRoot.customElementRegistry === scope.registry && slides.every((slide: any) => slide instanceof scope.get('en-carousel-slide') && slide.ownerDocument === target);
      viewer.hide(); await api.settle(target); const focusReturned = target.activeElement === targetTrigger;
      viewer.remove(); await api.settle(target);
      return { sourceInstalled, retainedBeforeDestinationUse, identity: root === viewer.shadowRoot && (!!originalCarousel && originalCarousel === carousel),
        owned, document: carousel.ownerDocument === target, nativeOpen, sourceReleased, destinationInstalled,
        allReleased: sourceListeners.size === 0 && targetListeners.size === 0, focusReturned, sourceFocusEvents };
    } finally { viewer.remove(); stopSource(); stopTarget(); frame.remove(); sourceTrigger.remove(); }
  }, warm);
  test.skip(result === null, 'Actual engine lacks native scoped registries; global fallback is covered separately');
  expect(errors).toEqual([]);
  expect(result).toEqual({ sourceInstalled: 1, retainedBeforeDestinationUse: true, identity: true, owned: true, document: true,
    nativeOpen: true, sourceReleased: true, destinationInstalled: 1, allReleased: true, focusReturned: true, sourceFocusEvents: 0 });
});

test('reconnect then synchronous show never presents an unconstructed modal body', async ({ page }) => {
  await mount(page);
  const result = await page.locator('#viewer').evaluate(async (viewer: any) => {
    viewer.dismissible = false; await viewer.updateComplete;
    const parent = viewer.parentNode, dialog = viewer.shadowRoot.querySelector('dialog'), showModal = dialog.showModal;
    const presentations: boolean[] = [];
    dialog.showModal = function () { presentations.push(!!viewer.shadowRoot.querySelector('en-carousel')); return showModal.call(this); };
    viewer.remove(); parent.append(viewer); const outcome = viewer.show();
    await (window as any).mediaDelivery.settle(document);
    return { outcome, presentations, open: dialog.open, bodyFocused: viewer.shadowRoot.querySelector('[part=body]').contains(viewer.shadowRoot.activeElement) };
  });
  expect(result).toEqual({ outcome: 'committed', presentations: [true], open: true, bodyFocused: true });
});
