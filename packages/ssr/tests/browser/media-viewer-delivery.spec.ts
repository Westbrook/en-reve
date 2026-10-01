import { test, expect, type Page } from '@playwright/test';

const eager = '#media-eager';
const closed = '#media-closed';
const opened = '#media-open';
const viewerIds = [eager, closed, opened];

function watchHydrationErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (['error', 'warning'].includes(message.type()) && /hydrat|mismatch/i.test(message.text())) errors.push(message.text());
  });
  return errors;
}

async function captureNodes(page: Page) {
  await page.evaluate(() => {
    const capture = (host: Element) => {
      const root = host.shadowRoot!;
      const carousel = root.querySelector('en-carousel');
      return {
        host, root, dialog: root.querySelector('dialog'), body: root.querySelector('[part="body"]'),
        close: root.querySelector('en-button.en-overlay-close')?.shadowRoot?.querySelector('button'),
        carousel, carouselRoot: carousel?.shadowRoot,
        slides: [...root.querySelectorAll('en-carousel-slide')],
        images: [...root.querySelectorAll('figure img')],
        tools: root.querySelector('.tools'), original: root.querySelector('.tools a'),
      };
    };
    (window as any).__mediaDeliveryNodes = {
      capture,
      records: [...document.querySelectorAll('#media-viewer-delivery-fixture en-media-viewer')].map(capture),
    };
  });
}

async function expectRetainedNodes(page: Page) {
  expect(await page.evaluate(() => {
    const { capture, records } = (window as any).__mediaDeliveryNodes;
    return records.map((previous: any) => {
      const current = capture(document.getElementById(previous.host.id));
      return {
        id: previous.host.id,
        retained: Object.keys(previous).every(key => Array.isArray(previous[key])
          ? previous[key].length === current[key].length && previous[key].every((node: Node, index: number) => node === current[key][index])
          : previous[key] === current[key]),
      };
    });
  })).toEqual(viewerIds.map(id => ({ id: id.slice(1), retained: true })));
}

async function expectInitialBodies(page: Page) {
  for (const id of viewerIds) {
    const host = page.locator(id);
    await expect(host.locator('dialog')).toHaveCount(1);
    await expect(host.locator('en-button.en-overlay-close button')).toHaveCount(1);
    await expect(host.locator('en-carousel')).toHaveCount(1);
    await expect(host.locator('en-carousel-slide')).toHaveCount(2);
    await expect(host.locator('figure img')).toHaveCount(2);
    await expect(host.locator('.tools')).toHaveCount(1);
    await expect(host.locator('[data-current="true"] img')).toHaveAttribute('alt', 'Second server image');
  }
}

async function hydrate(page: Page) {
  await page.evaluate(async () => {
    const fixture = await (window as any).prepareMediaViewerFixture();
    await fixture.island.activate();
  });
  expect(await page.evaluate(() => (window as any).mediaViewerDeliveryFixture.island.state)).toBe('ready');
}

test('JavaScript-disabled delivery preserves initial bodies and the inert native modal shell', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  try {
    const page = await context.newPage();
    await page.goto('/media-viewer-delivery-fixture');
    await expectInitialBodies(page);
    await expect(page.locator(opened)).toHaveAttribute('open', '');
    for (const id of viewerIds) {
      const dialog = page.locator(id).locator('dialog');
      await expect(dialog).toHaveAttribute('inert', '');
      await expect(dialog).not.toHaveAttribute('open');
    }
  } finally {
    await context.close();
  }
});

test('closed and initial-open bodies hydrate in place', async ({ page }) => {
  const errors = watchHydrationErrors(page);
  await page.goto('/media-viewer-delivery-fixture');
  await expectInitialBodies(page);
  expect(await page.locator(opened).evaluate(host => host.hasAttribute('open'))).toBe(true);
  for (const id of viewerIds) {
    expect(await page.locator(id).evaluate(host => host.matches(':defined'))).toBe(false);
    expect(await page.locator(id).locator('dialog').evaluate(dialog => (dialog as HTMLDialogElement).open)).toBe(false);
  }
  await captureNodes(page);
  await hydrate(page);
  await expectInitialBodies(page);
  await expectRetainedNodes(page);
  expect(await page.locator(opened).locator('dialog').evaluate(dialog => (dialog as HTMLDialogElement).open)).toBe(true);
  expect(await page.locator(closed).locator('dialog').evaluate(dialog => (dialog as HTMLDialogElement).open)).toBe(false);
  expect(await page.locator(eager).locator('dialog').evaluate(dialog => (dialog as HTMLDialogElement).open)).toBe(false);
  expect(errors).toEqual([]);
});

test('fresh application items update hydrated media and remain current at the first opening', async ({ page }) => {
  const errors = watchHydrationErrors(page);
  await page.goto('/media-viewer-delivery-fixture');
  await hydrate(page);
  await page.evaluate(async () => {
    const fixture = (window as any).mediaViewerDeliveryFixture;
    const hosts = [...fixture.root.querySelectorAll('en-media-viewer')] as any[];
    const snapshot = (host: any) => ({
      carousel: host.shadowRoot.querySelector('en-carousel'),
      secondImage: host.shadowRoot.querySelectorAll('figure img')[1],
      dialog: host.shadowRoot.querySelector('dialog'),
    });
    (window as any).__mediaBeforeItems = hosts.map(snapshot);
    for (const host of hosts) {
      host.open = false;
      host.items = [
        { ...host.items[0] },
        { ...host.items[1], src: `${host.items[1].src}#updated`, alt: 'Updated second image', caption: 'Updated second caption' },
        { key: 'third', src: host.items[0].src, alt: 'New third image', caption: 'New third caption' },
      ];
    }
    await fixture.settle();
  });
  await expect(page.locator(closed).locator('en-carousel')).toHaveCount(1);
  for (const id of viewerIds) {
    await expect(page.locator(id).locator('figure img')).toHaveCount(3);
    await expect(page.locator(id).locator('[data-current="true"] img')).toHaveAttribute('alt', 'Updated second image');
    await expect(page.locator(id).locator('.tools a')).toHaveAttribute('href', /#updated$/);
  }
  expect(await page.locator(closed).evaluate((host: any) => host.show())).toBe('committed');
  await page.evaluate(() => (window as any).mediaViewerDeliveryFixture.settle());
  await expect(page.locator(closed).locator('figure img')).toHaveCount(3);
  await expect(page.locator(closed).locator('[data-current="true"] img')).toHaveAttribute('alt', 'Updated second image');
  await expect(page.locator(closed).locator('.tools a')).toHaveAttribute('href', /#updated$/);
  expect(await page.evaluate(() => {
    const root = (window as any).mediaViewerDeliveryFixture.root;
    const hosts = [...root.querySelectorAll('en-media-viewer')] as any[];
    const previous = (window as any).__mediaBeforeItems;
    return hosts.map((host, index) => ({
      dialog: host.shadowRoot.querySelector('dialog') === previous[index].dialog,
      retainedExisting: !!previous[index].carousel && (
        host.shadowRoot.querySelector('en-carousel') === previous[index].carousel
        && host.shadowRoot.querySelectorAll('figure img')[1] === previous[index].secondImage
      ),
      activeKey: host.activeKey,
    }));
  })).toEqual(viewerIds.map(() => ({ dialog: true, retainedExisting: true, activeKey: 'second' })));
  expect(errors).toEqual([]);
});

test('staged SSR keeps one containing owner and load-only preparation leaves every server node untouched', async ({ page }, info) => {
  const errors = watchHydrationErrors(page);
  const imports: string[] = [];
  page.on('request', request => {
    if (request.url().includes('/fixtures/media-viewer-delivery-template.mjs')) imports.push(request.url());
  });
  const streamId = `${info.project.name}-${info.workerIndex}-${info.retry}-${Date.now()}`;
  let released = false;
  try {
    await page.goto(`/media-viewer-delivery-stream?id=${streamId}`, { waitUntil: 'commit' });
    await page.waitForFunction(() => typeof (window as any).prepareMediaViewerFixture === 'function');
    await expect(page.locator('#media-viewer-stream-complete')).toHaveCount(0);
    await expectInitialBodies(page);
    await captureNodes(page);
    const before = await page.locator('#media-viewer-delivery-fixture').evaluate(root => root.innerHTML);
    const preparation = await page.evaluate(async () => {
      const fixture = await (window as any).prepareMediaViewerFixture();
      let duplicate = '';
      try { fixture.claimAgain(); } catch (error) { duplicate = (error as Error).message; }
      await Promise.all([fixture.island.load(), fixture.island.load()]);
      return {
        duplicate, state: fixture.island.state, mode: fixture.island.mode,
        defined: customElements.get('en-media-viewer') !== undefined,
        upgraded: [...fixture.root.querySelectorAll('en-media-viewer')].some((host: Element) => host.matches(':defined')),
      };
    });
    expect(preparation).toEqual({
      duplicate: 'Hydration boundary already has an owner.', state: 'dormant', mode: 'global', defined: false, upgraded: false,
    });
    expect(imports.length).toBe(1);
    expect(await page.locator('#media-viewer-delivery-fixture').evaluate(root => root.innerHTML)).toBe(before);
    await expectRetainedNodes(page);
    await expect(page.locator('#media-viewer-stream-complete')).toHaveCount(0);
    const response = await page.request.post(`/media-viewer-delivery-release?id=${streamId}`);
    expect(response.status()).toBe(204);
    released = true;
    await expect(page.locator('#media-viewer-stream-complete')).toHaveCount(1);
    await page.evaluate(async () => {
      const { island } = (window as any).mediaViewerDeliveryFixture;
      await Promise.all([island.activate(), island.activate()]);
    });
    expect(await page.evaluate(() => (window as any).mediaViewerDeliveryFixture.island.state)).toBe('ready');
    await expectInitialBodies(page);
    await expectRetainedNodes(page);
    expect(errors).toEqual([]);
  } finally {
    if (!released) await page.request.post(`/media-viewer-delivery-release?id=${streamId}`).catch(() => undefined);
  }
});

for (const mode of ['show', 'property', 'canceled', 'close-populated']) test(`early ${mode} preserves the first server branch before settled rendering`, async ({ page }) => {
  const errors = watchHydrationErrors(page);
  await page.goto('/media-viewer-delivery-fixture');
  await expectInitialBodies(page); await captureNodes(page);
  const result = await page.evaluate(async mode => {
    const module = await import('/packages/ssr/tests/fixtures/media-viewer-delivery-hydrate.mjs');
    return module.startEarly(mode);
  }, mode);
  const acceptsOpen = mode === 'show' || mode === 'property';
  expect(result.open).toBe(acceptsOpen);
  if (mode === 'show') expect(result.outcome).toBe('committed');
  if (mode === 'canceled') expect(result.outcome).toBe('canceled');
  await expect(page.locator(closed).locator('en-carousel')).toHaveCount(1);
  expect(await page.locator(closed).locator('dialog').evaluate((dialog: HTMLDialogElement) => dialog.open)).toBe(acceptsOpen);
  expect(await page.locator(opened).locator('dialog').evaluate((dialog: HTMLDialogElement) => dialog.open)).toBe(mode !== 'close-populated');
  expect(await page.evaluate(() => {
    const { capture, records } = (window as any).__mediaDeliveryNodes;
    return records.map((previous: any) => {
      const current = capture(document.getElementById(previous.host.id));
      const retained = ['host', 'root', 'dialog', 'body', 'close'].every(key => previous[key] === current[key]);
      const populatedRetained = !!previous.carousel && (previous.carousel === current.carousel && previous.carouselRoot === current.carouselRoot
        && previous.images.every((node: Node, index: number) => node === current.images[index]));
      return { retained, populatedRetained };
    });
  })).toEqual(viewerIds.map(() => ({ retained: true, populatedRetained: true })));
  expect(errors).toEqual([]);
});
