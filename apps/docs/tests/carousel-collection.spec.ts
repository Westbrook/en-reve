import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const host = (page: Page) => page.locator('#large-carousel');
async function load(page: Page) {
    await page.goto('/api-examples/carousel.html');
    await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
    await expect(host(page).getByRole('button', { name: 'Next slide' })).toBeVisible();
    await expect(host(page)).toHaveJSProperty('currentKey', 'study-1');
}
async function key(page: Page, value: string) { await expect(host(page)).toHaveJSProperty('currentKey', value); }

test('pointer activation selects the pressed thumbnail when its bounded window expands', async ({ page }) => {
    for (const [width, direction] of [[1440, 'ltr'], [390, 'ltr'], [390, 'rtl']] as const) {
        await page.setViewportSize({ width, height: 844 });
        await load(page);
        await host(page).evaluate((el: any, dir) => { el.dir = dir; el.goToKey('study-500'); }, direction);
        await key(page, 'study-500');
        for (const edge of ['first', 'last', 'last', 'first'] as const) {
            const index = Number(await host(page).locator('.picker-button')[edge]().getAttribute('data-index'));
            const thumbnail = host(page).locator(`.picker-button[data-index="${index}"]`);
            await thumbnail.click({ delay: 60 });
            await key(page, `study-${index + 1}`);
            await expect(thumbnail).toHaveAttribute('aria-current', 'true');
        }
        await host(page).getByRole('button', { name: 'Last', exact: true }).click();
        await key(page, 'study-1000');
        await host(page).getByRole('button', { name: 'First', exact: true }).click();
        await key(page, 'study-1');
    }
});

test('pressing a bounded thumbnail keeps its geometry stable and preserves native click cancellation', async ({ page }) => {
    await load(page);
    await host(page).evaluate((el: any) => el.goToKey('study-500'));
    const thumbnail = host(page).locator('.picker-button[data-index="496"]');
    await thumbnail.scrollIntoViewIfNeeded();
    const before = await thumbnail.boundingBox();
    await page.mouse.move(before!.x + before!.width / 2, before!.y + before!.height / 2);
    await page.mouse.down();
    await host(page).evaluate(async (el: any) => { await el.updateComplete; });
    expect(await thumbnail.boundingBox()).toEqual(before);
    await key(page, 'study-500');
    await page.mouse.move(1, 1);
    await page.mouse.up();
    await key(page, 'study-500');
    await host(page).evaluate(el => el.addEventListener('en-change', event => event.preventDefault(), { once: true }));
    await thumbnail.click({ delay: 60 });
    await key(page, 'study-500');
    await thumbnail.click({ delay: 60 });
    await key(page, 'study-497');
});

test('keyed collection bounds slide and thumbnail mounting and reveals distant keys', async ({ page }) => {
    await load(page);
    await expect.poll(() => host(page).locator('.collection-slide').count()).toBeLessThan(12);
    await expect.poll(() => host(page).locator('.picker-button').count()).toBeLessThan(20);
    await page.getByRole('button', { name: 'Go to study 500', exact: true }).click();
    await key(page, 'study-500');
    await expect(host(page).getByRole('link', { name: 'Explore Study 500', exact: true })).toBeVisible();
    await expect(host(page).locator('.position')).toHaveText('500 of 1000');
    await host(page).evaluate((el: any) => { el.goToKey('study-20'); el.goToKey('study-900'); el.goToKey('study-700'); });
    await key(page, 'study-700');
    await expect(host(page).getByRole('link', { name: 'Explore Study 700', exact: true })).toBeVisible();
    expect(await host(page).evaluate((el: any) => el.goToKey('missing'))).toBe(false);
    await key(page, 'study-700');
    await expect.poll(() => host(page).locator('.collection-slide').count()).toBeLessThan(12);
    await expect.poll(() => host(page).locator('.picker-button').count()).toBeLessThan(20);
    await test.info().attach('keyed-carousel-tree', { body: await host(page).ariaSnapshot(), contentType: 'text/plain' });
});

test('cancellation, insertion and reorder preserve the current key and focused content', async ({ page }) => {
    await load(page);
    await host(page).evaluate((el: any) => el.goToKey('study-500'));
    await key(page, 'study-500');
    await host(page).evaluate(el => el.addEventListener('en-change', event => event.preventDefault(), { once: true }));
    await host(page).getByRole('button', { name: 'Next slide' }).click();
    await key(page, 'study-500');
    const note = host(page).getByRole('textbox', { name: 'Note for Study 500', exact: true });
    await note.fill('Retained draft');
    await note.evaluate(el => (window as any).retainedCarouselInput = el);
    await host(page).evaluate((el: any) => { el.items = [{ key: 'new-study', label: 'New study' }, ...el.items]; });
    await key(page, 'study-500');
    await expect(note).toBeFocused();
    await host(page).evaluate((el: any) => { el.items = [...el.items].reverse(); });
    await key(page, 'study-500');
    await expect(note).toBeFocused();
    expect(await note.evaluate(el => el === (window as any).retainedCarouselInput)).toBe(true);
    await expect(note).toHaveValue('Retained draft');
    await host(page).evaluate((el: any) => el.goToKey('study-900'));
    await key(page, 'study-900');
    await expect(note).toBeFocused();
    await expect(note).toBeAttached();
    await host(page).evaluate((el: any) => { el.items = el.items.filter((item: any) => item.key !== 'study-500'); });
    await expect(host(page).locator('.viewport')).toBeFocused();
    await expect(note).toHaveCount(0);
    await host(page).getByRole('textbox', { name: 'Note for Study 900', exact: true }).focus();
    await host(page).evaluate((el: any) => {
        el.items = [...el.items].reverse();
        el.shadowRoot.querySelector('[part="next"]').shadowRoot.querySelector('button').focus();
    });
    await expect(host(page).getByRole('button', { name: 'Next slide' })).toBeFocused();
});

test('bounded thumbnail picker traverses distant windows and retains key after updates', async ({ page }) => {
    await load(page);
    const first = host(page).locator('.picker-button[data-index="0"]');
    await first.focus();
    await page.keyboard.press('End');
    await expect(host(page).locator('.picker-button[data-index="999"]')).toBeFocused();
    await page.keyboard.press('Enter');
    await key(page, 'study-1000');
    await page.keyboard.press('ArrowLeft');
    await expect(host(page).locator('.picker-button[data-index="998"]')).toBeFocused();
    await page.keyboard.press('Enter');
    await key(page, 'study-999');
    await host(page).evaluate((el: any) => { el.items = [...el.items].reverse(); });
    await key(page, 'study-999');
    await expect(host(page).locator('.picker-button[data-index="1"]')).toBeFocused();
    await expect.poll(() => host(page).locator('.picker-button').count()).toBeLessThan(20);
    await host(page).evaluate((el: any) => {
        el.items = [...el.items].reverse();
        el.shadowRoot.querySelector('.viewport').focus();
    });
    await expect(host(page).locator('.viewport')).toBeFocused();
});

test('native scroll, resize and RTL agree on the leading item', async ({ page }) => {
    await load(page);
    await host(page).locator('.viewport').evaluate(el => { const track = el.querySelector<HTMLElement>('.collection-track')!; el.scrollLeft = (track.getBoundingClientRect().width + parseFloat(getComputedStyle(el).columnGap)) / 1000 * 39; });
    await key(page, 'study-40');
    await host(page).evaluate((el: any) => { el.style.setProperty('--en-carousel-slides-per-view', '3'); el.goToKey('study-1000'); });
    // Trigger resize to measure the changed container delivery.
    await page.setViewportSize({ width: 1000, height: 800 });
    await key(page, 'study-998');
    await expect(host(page).locator('.position')).toHaveText('998–1000 of 1000');
    await page.setViewportSize({ width: 390, height: 844 });
    await host(page).evaluate((el: any) => { el.style.setProperty('--en-carousel-slides-per-view', '1'); el.setAttribute('dir', 'rtl'); });
    await expect(host(page).locator('.position')).toHaveText('998 of 1000');
    await host(page).evaluate((el: any) => el.goToKey('study-500'));
    await key(page, 'study-500');
    const slide = host(page).locator('.collection-slide[data-key="study-500"]');
    await expect(slide).toBeVisible();
    await expect.poll(async () => host(page).evaluate(el => {
        const port = el.shadowRoot!.querySelector<HTMLElement>('.viewport')!, item = el.shadowRoot!.querySelector<HTMLElement>('[data-key="study-500"]')!;
        return Math.abs(port.getBoundingClientRect().right - parseFloat(getComputedStyle(port).paddingRight) - item.getBoundingClientRect().right);
    })).toBeLessThan(2);
    await host(page).locator('.viewport').focus();
    await page.keyboard.press('ArrowLeft');
    await key(page, 'study-501');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('paginated reading alternative exposes ordinary list entries and recovers focus on page changes', async ({ page }) => {
    await load(page);
    await page.getByRole('button', { name: 'Use reading list', exact: true }).click();
    await expect(host(page).getByRole('listitem')).toHaveCount(10);
    await expect(host(page).locator('.collection-slide')).toHaveCount(0);
    await expect(host(page).locator('.picker')).toHaveCount(0);
    await host(page).getByRole('button', { name: 'Next page', exact: true }).click();
    await key(page, 'study-11');
    await expect(host(page).getByRole('listitem').first()).toHaveAttribute('aria-posinset', '11');
    await expect(host(page).getByRole('listitem').last()).toHaveAttribute('aria-setsize', '1000');
    await host(page).getByRole('textbox', { name: 'Note for Study 11', exact: true }).focus();
    await host(page).evaluate((el: any) => el.goToKey('study-500'));
    await key(page, 'study-491');
    await expect(host(page).locator('.viewport')).toBeFocused();
    await expect(host(page).getByRole('link', { name: 'Explore Study 500', exact: true })).toBeVisible();
    const results = await new AxeBuilder({ page }).include('#large-carousel').analyze();
    expect(results.violations).toEqual([]);
    await test.info().attach('carousel-reading-list-tree', { body: await host(page).ariaSnapshot(), contentType: 'text/plain' });
});

test('preconnection data, key validation, empty state and authored fallback are safe', async ({ page }) => {
    await load(page);
    expect(await page.evaluate(async () => {
        const carousel = document.createElement('en-carousel') as any;
        carousel.items = [{ key: 'one', label: 'One' }];
        carousel.index = 900;
        const clampedBeforeConnection = carousel.index === 0 && carousel.currentKey === 'one';
        const errors: boolean[] = [];
        for (const items of [[{ key: 'same', label: 'A' }, { key: 'same', label: 'B' }], [{ key: 2, label: 'Bad' }]]) {
            try { carousel.items = items; errors.push(false); } catch { errors.push(true); }
        }
        document.body.append(carousel);
        await carousel.updateComplete;
        const retained = carousel.currentKey === 'one';
        carousel.items = [];
        await carousel.updateComplete;
        const empty = carousel.currentKey === undefined && !carousel.shadowRoot.querySelector('en-carousel-slide');
        carousel.items = undefined;
        await carousel.updateComplete;
        const authored = !!carousel.shadowRoot.querySelector('slot:not([name])');
        carousel.remove();
        return { errors, retained, empty, authored, clampedBeforeConnection };
    })).toEqual({ errors: [true, true], retained: true, empty: true, authored: true, clampedBeforeConnection: true });
});


test('thumbnail windows stay contiguous and full at the beginning, middle and end', async ({ page }) => {
    for (const [width, count] of [[1440, 7], [700, 5], [390, 3]] as const) {
        await page.setViewportSize({ width, height: 844 });
        await load(page);
        for (const destination of ['study-1', 'study-2', 'study-500', 'study-999', 'study-1000']) {
            await host(page).evaluate((el: any, k) => el.goToKey(k), destination);
            await key(page, destination);
            const buttons = host(page).locator('.picker-button');
            await expect(buttons).toHaveCount(count);
            const indexes = await buttons.evaluateAll(nodes => nodes.map(n => Number((n as HTMLElement).dataset.index)));
            expect(indexes).toEqual(Array.from({ length: count }, (_, i) => indexes[0] + i));
            expect(indexes).toContain(Number(destination.slice(6)) - 1);
            await expect(host(page).locator('[part="picker-range"]')).toHaveText(`Thumbnails ${indexes[0] + 1}–${indexes.at(-1)! + 1} of 1000`);
            await expect(buttons.first().locator('[part="picker-number"]')).toHaveText(String(indexes[0] + 1));
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        const first = await host(page).locator('[part="first"]').boundingBox();
        const last = await host(page).locator('[part="last"]').boundingBox();
        expect(Math.abs(first!.y - last!.y)).toBeLessThan(1);
        expect(await host(page).locator('en-tooltip').first().evaluate(el => getComputedStyle(el).position)).toBe('absolute');
    }
    await host(page).evaluate((el: any) => { el.items = el.items.slice(0, 2); });
    await expect(host(page).locator('.picker-button')).toHaveCount(2);
});

test('keyboard moves one thumbnail window without selection; tooltip supports focus, Escape and hover', async ({ page }) => {
    await load(page);
    const buttons = host(page).locator('.picker-button');
    await buttons.first().focus();
    await expect(host(page).locator('en-tooltip[for="picker-0"]')).toHaveJSProperty('open', true);
    await expect(host(page).locator('en-tooltip[for="picker-0"] [slot="content"]')).toHaveText('1 of 1000: Study 1');
    await page.keyboard.press('Escape');
    await expect(host(page).locator('en-tooltip[for="picker-0"]')).toHaveJSProperty('open', false);
    for (let i = 0; i < 12; i++) await page.keyboard.press('ArrowRight');
    await expect(host(page).locator('.picker-button[data-index="12"]')).toBeFocused();
    await expect(buttons).toHaveCount(7);
    await key(page, 'study-1');
    await page.keyboard.press('Enter');
    await key(page, 'study-13');
    await expect(host(page).locator('.picker-button[data-index="12"]')).toBeFocused();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(buttons).toHaveCount(3);
    await expect(host(page).locator('.picker-button[data-index="12"]')).toBeFocused();
    await page.keyboard.press('End');
    await expect(host(page).locator('.picker-button[data-index="999"]')).toBeFocused();
    await key(page, 'study-13');
    await page.keyboard.press('Enter');
    await key(page, 'study-1000');
    await host(page).locator('.viewport').focus();
    await host(page).locator('.picker-button[data-index="998"]').hover();
    await expect(host(page).locator('en-tooltip[for="picker-998"]')).toHaveJSProperty('open', true);
    await test.info().attach('bounded-picker-with-labels', { body: await host(page).ariaSnapshot(), contentType: 'text/plain' });
});

test('new carousels omit controls and pickers by default and retain native navigation', async ({ page }) => {
    await load(page);
    await page.evaluate(async () => {
        const el = document.createElement('en-carousel') as any;
        el.id = 'default-carousel'; el.items = [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }];
        document.body.append(el); await el.updateComplete;
    });
    const el = page.locator('#default-carousel');
    await expect(el).toHaveJSProperty('controls', 'none');
    await expect(el).toHaveJSProperty('navigation', 'none');
    await expect(el.locator('[part="controls"], [part="picker"], [part="picker-range"]')).toHaveCount(0);
    await expect(el.locator('.viewport')).not.toHaveAttribute('data-controls-ready');
    const nativeScrollbar = await page.locator('html').evaluate(node => getComputedStyle(node).scrollbarWidth);
    await expect(el.locator('.viewport')).toHaveCSS('scrollbar-width', nativeScrollbar);
    await el.locator('.viewport').focus(); await page.keyboard.press('ArrowRight');
    await expect(el).toHaveJSProperty('currentKey', 'b');
    await el.evaluate((node: any) => { node.boundaryControls = true; });
    await expect(el.locator('[part="controls"], [part="first"], [part="last"]')).toHaveCount(0);
});

test('controls, boundary buttons and picker are independent and recover removed focus', async ({ page }) => {
    await load(page);
    await expect(host(page).locator('[part="controls"]')).toHaveCount(1);
    await expect(host(page).locator('[part="controls"] en-button')).toHaveCount(4);
    await expect(host(page).locator('[part="picker-navigation"]')).toHaveCount(0);
    await host(page).getByRole('button', { name: 'Last', exact: true }).focus();
    await host(page).evaluate((el: any) => { el.boundaryControls = false; });
    await expect(host(page).locator('.viewport')).toBeFocused();
    await expect(host(page).locator('[part="controls"] en-button')).toHaveCount(2);
    await host(page).getByRole('button', { name: 'Next slide' }).focus();
    await host(page).evaluate((el: any) => { el.controls = 'none'; });
    await expect(host(page).locator('.viewport')).toBeFocused();
    await expect(host(page).locator('[part="controls"]')).toHaveCount(0);
    await expect(host(page).locator('[part="picker"]')).toHaveCount(1);
    await host(page).locator('.picker-button').first().focus();
    await host(page).evaluate((el: any) => { el.navigation = 'none'; });
    await expect(host(page).locator('.viewport')).toBeFocused();
    await expect(host(page).locator('[part="picker"], [part="picker-range"], en-tooltip')).toHaveCount(0);
    await expect(host(page).locator('.viewport')).not.toHaveAttribute('data-controls-ready');
    await key(page, 'study-1');
    await host(page).evaluate((el: any) => { el.controls = 'always'; el.boundaryControls = true; el.loop = true; el.items = el.items.slice(0, 1); });
    await expect(host(page).locator('[part="controls"] en-button')).toHaveCount(4);
    for (const button of await host(page).locator('[part="controls"] en-button').all()) await expect(button).toHaveAttribute('aria-disabled', 'true');
    await host(page).evaluate((el: any) => { el.controls = 'auto'; });
    await expect(host(page).locator('[part="controls"]')).toHaveCount(0);
    await host(page).evaluate((el: any) => { el.controls = 'always'; el.items = []; });
    await expect(host(page).locator('[part="position"]')).toHaveText('No slides');
    for (const button of await host(page).locator('[part="controls"] en-button').all()) await expect(button).toHaveAttribute('aria-disabled', 'true');
});

test('demo options expose each combination and list paging honors explicit controls', async ({ page }) => {
    await load(page);
    await page.getByText('Navigation options', { exact: true }).click();
    await page.getByLabel('Carousel controls', { exact: true }).selectOption('none');
    await page.getByLabel('Carousel navigation', { exact: true }).selectOption('none');
    await expect(host(page).locator('[part="controls"], [part="picker"]')).toHaveCount(0);
    await page.getByLabel('Carousel controls', { exact: true }).selectOption('auto');
    await expect(host(page).locator('[part="controls"]')).toHaveCount(1);
    await expect(host(page).locator('[part="picker"]')).toHaveCount(0);
    await page.getByLabel('Carousel navigation', { exact: true }).selectOption('positions');
    await expect(host(page).locator('[part="picker"]')).toHaveCount(1);
    await page.getByRole('button', { name: 'Use reading list', exact: true }).click();
    await expect(host(page).getByRole('button', { name: 'Next page', exact: true })).toBeVisible();
    await expect(host(page).locator('[part="picker"], [part="picker-range"]')).toHaveCount(0);
    await page.getByLabel('Carousel controls', { exact: true }).selectOption('none');
    await host(page).locator('.viewport').focus(); await page.keyboard.press('ArrowRight');
    await key(page, 'study-11');
    await expect(host(page).locator('[part="controls"]')).toHaveCount(0);
});


for (const direction of ['ltr', 'rtl'] as const) test(`hidden keyed carousel retains the latest index through settlement and reveal (${direction})`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    // Install before navigation, then pause after readiness: every settlement uses the documented clock.
    await page.clock.install({ time: new Date('2026-09-29T08:00:00Z') });
    await load(page);
    const carousel = host(page);
    const geometry = () => carousel.evaluate((el: any) => {
        const port = el.shadowRoot!.querySelector('[part="viewport"]') as HTMLElement;
        const style = getComputedStyle(port), rect = port.getBoundingClientRect();
        const slide = Array.from((el.shadowRoot as ShadowRoot).querySelectorAll('en-carousel-slide')).find(slide => slide.querySelector('a')?.textContent === `Explore Study ${el.index + 1}`) as HTMLElement | undefined;
        const slideRect = slide?.getBoundingClientRect();
        const width = port.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
        const offset = slideRect ? style.direction === 'rtl'
            ? slideRect.right - (rect.right - parseFloat(style.paddingRight))
            : slideRect.left - (rect.left + parseFloat(style.paddingLeft)) : null;
        return {
            index: el.index, currentKey: el.currentKey, direction: style.direction,
            measured: Number.isFinite(width) && width > 0 && rect.width > 0,
            aligned: offset !== null && !!slideRect?.width && Math.abs(offset) < 2,
            nativeOffsetNonzero: Math.abs(port.scrollLeft) > 1,
        };
    });
    await carousel.evaluate(async (el: any, direction) => { el.dir = direction; el.index = 499; await el.updateComplete; }, direction);
    await expect.poll(geometry).toMatchObject({ index: 499, currentKey: 'study-500', direction, measured: true, aligned: true });
    await page.clock.pauseAt(new Date('2026-09-29T09:00:00Z'));
    await page.clock.runFor(300);
    await expect.poll(geometry).toMatchObject({ index: 499, currentKey: 'study-500', measured: true, aligned: true });
    await carousel.evaluate((el: any) => {
        const ancestor = el.closest('#large-carousel-example')! as HTMLElement;
        const state = {
            host: el, root: el.shadowRoot, ancestor,
            display: ancestor.style.getPropertyValue('display'), priority: ancestor.style.getPropertyPriority('display'),
            changes: [] as { previous: number; proposed: number; reason: string }[],
            observers: new Set<ResizeObserver>(), cleanups: new Set<() => void>(),
        };
        const changed = (event: Event) => {
            if (event.target !== el) return;
            const { previous, proposed, reason } = (event as CustomEvent).detail;
            state.changes.push({ previous, proposed, reason });
        };
        el.addEventListener('en-change', changed);
        state.cleanups.add(() => el.removeEventListener('en-change', changed));
        (window as any).__hiddenCarouselRegression = state;
    });
    const retained = () => carousel.evaluate((el: any) => {
        const state = (window as any).__hiddenCarouselRegression;
        return { connected: el.isConnected, host: el === state.host, root: el.shadowRoot === state.root,
            changes: state.changes };
    });
    try {
        await carousel.evaluate(async (el: any) => {
            const state = (window as any).__hiddenCarouselRegression;
            const port = el.shadowRoot!.querySelector('[part="viewport"]') as HTMLElement;
            // Queue a normal alignment while measurable, then hide its ancestor before the timer advances.
            el.index = 500;
            await el.updateComplete;
            if (port.clientWidth <= 0) throw new Error('The pending alignment must start with measured layout');
            let hidden!: () => void;
            const resized = new Promise<void>(resolve => { hidden = resolve; });
            // Establish this observer's nonzero baseline before asking it to report a transition to zero.
            await new Promise<void>(resolve => {
                let measured = false;
                const observer = new ResizeObserver(entries => {
                    const entry = entries.find(entry => entry.target === port);
                    if (!entry) return;
                    if (!measured && entry.contentRect.width > 0) { measured = true; resolve(); return; }
                    if (!measured || entry.contentRect.width !== 0) return;
                    observer.disconnect(); state.observers.delete(observer); hidden();
                });
                state.observers.add(observer); observer.observe(port);
            });
            state.ancestor.style.setProperty('display', 'none', 'important');
            await resized;
            await el.updateComplete;
        });
        expect(await carousel.locator('[part="viewport"]').evaluate(el => ({ width: el.clientWidth, boxes: el.getClientRects().length }))).toEqual({ width: 0, boxes: 0 });
        // runFor executes callbacks through the 140 ms settlement window, rather than skipping directly over it.
        await page.clock.runFor(300);
        expect(await geometry()).toMatchObject({ index: 500, currentKey: 'study-501', measured: false });
        expect(await retained()).toEqual({ connected: true, host: true, root: true, changes: [] });
        await carousel.evaluate(async (el: any) => { el.index = 501; await el.updateComplete; });
        await page.clock.runFor(300);
        expect(await geometry()).toMatchObject({ index: 501, currentKey: 'study-502', measured: false });
        expect(await retained()).toEqual({ connected: true, host: true, root: true, changes: [] });
        await carousel.evaluate(async (el: any) => {
            const state = (window as any).__hiddenCarouselRegression;
            const port = el.shadowRoot!.querySelector('[part="viewport"]') as HTMLElement;
            const resized = new Promise<void>(resolve => {
                const observer = new ResizeObserver(entries => {
                    if (!entries.some(entry => entry.target === port && entry.contentRect.width > 0)) return;
                    observer.disconnect(); state.observers.delete(observer); resolve();
                });
                state.observers.add(observer); observer.observe(port);
            });
            if (state.display) state.ancestor.style.setProperty('display', state.display, state.priority);
            else state.ancestor.style.removeProperty('display');
            await resized;
            await el.updateComplete;
        });
        await page.clock.runFor(300);
        await expect.poll(geometry).toMatchObject({ index: 501, currentKey: 'study-502', direction, measured: true, aligned: true, nativeOffsetNonzero: true });
        await expect(carousel.locator('[part="position"]')).toHaveText('502 of 1000');
        await expect(carousel.locator('[part~="picker-current"]')).toHaveAccessibleName('Show 502 of 1000: Study 502');
        expect(await retained()).toEqual({ connected: true, host: true, root: true, changes: [] });
        // A real native scroll after reveal must still produce its normal semantic proposal.
        await carousel.evaluate((el: any) => new Promise<void>(resolve => {
            const state = (window as any).__hiddenCarouselRegression;
            const port = el.shadowRoot!.querySelector('[part="viewport"]') as HTMLElement;
            const cleanup = () => port.removeEventListener('scroll', scrolled);
            const scrolled = () => {
                if (port.scrollLeft !== 0) return;
                cleanup(); state.cleanups.delete(cleanup); resolve();
            };
            state.cleanups.add(cleanup); port.addEventListener('scroll', scrolled);
            port.scrollTo({ left: 0, behavior: 'instant' });
        }));
        await page.clock.runFor(300);
        await expect.poll(geometry).toMatchObject({ index: 0, currentKey: 'study-1', measured: true, aligned: true });
        expect(await retained()).toEqual({ connected: true, host: true, root: true,
            changes: [{ previous: 501, proposed: 0, reason: 'scroll' }] });
    } finally {
        await carousel.evaluate(() => {
            const state = (window as any).__hiddenCarouselRegression;
            for (const observer of state.observers) observer.disconnect();
            for (const cleanup of state.cleanups) cleanup();
            if (state.display) state.ancestor.style.setProperty('display', state.display, state.priority);
            else state.ancestor.style.removeProperty('display');
        });
        await page.clock.resume();
    }
});
