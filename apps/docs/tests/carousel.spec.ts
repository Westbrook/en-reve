import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const url = '/api-examples/carousel.html';
const media = (p: Page) => p.locator('#media-carousel');
const cards = (p: Page) => p.locator('#card-carousel');
async function load(page: Page) {
    await page.goto(url);
    await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
    await expect(media(page).getByRole('button', { name: 'Next slide' })).toBeVisible();
}
const index = async (p: Page, n: number) => expect(media(p)).toHaveJSProperty('index', n);
test('SSR keeps authored slides readable and hydration exposes a named finite carousel', async ({ page, browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    try {
        const ssr = await ctx.newPage();
        await ssr.goto(url);
        await expect(media(ssr).locator('en-carousel-slide')).toHaveCount(3);
        await expect(media(ssr).getByRole('img')).toHaveCount(3);
        await expect(media(ssr).getByRole('button')).toHaveCount(0);
        // Firefox headless may suppress every native scrollbar on this platform.
        // Preserve that browser default rather than forcing a platform-specific result.
        const nativeScrollbar = await ssr.locator('html').evaluate(el => getComputedStyle(el).scrollbarWidth);
        await expect(media(ssr).locator('.viewport')).toHaveCSS('scrollbar-width', nativeScrollbar);
        await expect(media(ssr).locator('.viewport')).not.toHaveAttribute('data-controls-ready');
        await expect(media(ssr).locator('.viewport')).toHaveCSS('overflow-x', 'auto');
    }
    finally {
        await ctx.close();
    }
    await load(page);
    await expect(media(page).getByRole('group', { name: 'Cover studies', exact: true })).toHaveAttribute('aria-roledescription', 'carousel');
    await expect.poll(async () => ((await media(page).ariaSnapshot()).match(/- img /g) ?? []).length).toBe(1);
    await expect(media(page).getByRole('status')).toBeEmpty();
    await expect(media(page).locator('.viewport')).toHaveCSS('scrollbar-width', 'none');
    await expect(media(page).locator('.viewport')).toHaveCSS('overflow-x', 'auto');
    const nativeScrollbar = await page.locator('html').evaluate(el => getComputedStyle(el).scrollbarWidth);
    await page.addStyleTag({content:'en-carousel::part(viewport) { scrollbar-width: auto; }'});
    await expect(media(page).locator('.viewport')).toHaveCSS('scrollbar-width', nativeScrollbar);
    await test.info().attach('initial-carousel-tree', { body: await media(page).ariaSnapshot(), contentType: 'text/plain' });
});
test('navigation, native scrolling, cancellation and authoritative writes keep focus and nodes', async ({ page }) => {
    await load(page);
    await media(page).evaluate(el => (window as any).firstSlide = el.children[0]);
    const next = media(page).getByRole('button', { name: 'Next slide' });
    await next.click();
    await index(page, 1);
    await expect(next).toBeFocused();
    await expect(media(page).getByRole('img', { name: /Warm terracotta/ })).toBeVisible();
    await media(page).evaluate(el => el.addEventListener('en-change', e => e.preventDefault(), { once: true }));
    await next.click();
    await index(page, 1);
    await media(page).evaluate((el: any) => el.addEventListener('en-change', () => {
        el.index = 0;
    }, { once: true }));
    await next.click();
    await index(page, 0);
    await expect(media(page).getByRole('img', { name: /Deep blue/ })).toBeVisible();
    expect(await media(page).evaluate(el => el.children[0] === (window as any).firstSlide)).toBe(true);
    await media(page).evaluate((el: any) => el.goTo(2));
    await index(page, 2);
    await next.click();
    await index(page, 0);
    await media(page).locator('.viewport').evaluate(el => {
        el.scrollLeft = el.scrollWidth;
    });
    await index(page, 2);
    await expect(media(page).getByRole('status')).toContainText('3');
});
test('viewport keyboard follows RTL while interactive content retains its own keys', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await load(page);
    const port = media(page).locator('.viewport');
    await port.focus();
    await page.keyboard.press('ArrowRight');
    await index(page, 1);
    await page.keyboard.press('End');
    await index(page, 2);
    await page.keyboard.press('Home');
    await index(page, 0);
    await media(page).evaluate(el => el.setAttribute('dir', 'rtl'));
    await port.focus();
    await page.keyboard.press('ArrowLeft');
    await index(page, 1);
    await page.keyboard.press('ArrowRight');
    await index(page, 0);
    await cards(page).locator('en-carousel-slide').first().evaluate(el => el.insertAdjacentHTML('beforeend', '<input aria-label="Slide note" value="abc">'));
    const input = cards(page).getByRole('textbox', { name: 'Slide note' });
    await input.focus();
    await page.keyboard.press('ArrowRight');
    await expect(cards(page)).toHaveJSProperty('index', 0);
});
test('responsive cards and dynamic children retain anchors and recover removed focus', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await load(page);
    await expect(cards(page).locator('[part=position]')).toHaveText('1–3 of 5');
    await cards(page).evaluate((el: any) => el.goTo(4));
    await expect(cards(page)).toHaveJSProperty('index', 2);
    await expect(cards(page).getByRole('button', { name: 'Next slide' })).toHaveAttribute('aria-disabled', 'true');
    const anchor = cards(page).locator('en-carousel-slide').nth(2);
    await anchor.evaluate(el => (window as any).anchorSlide = el);
    await cards(page).evaluate(el => el.children[0].remove());
    await expect(cards(page)).toHaveJSProperty('index', 1);
    expect(await cards(page).evaluate((el: any) => el.children[el.index] === (window as any).anchorSlide)).toBe(true);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(cards(page).locator('[part=position]')).toHaveText('2 of 4');
    const link = cards(page).getByRole('link', { name: 'Explore project 3' });
    await link.focus();
    await cards(page).evaluate(el => (window as any).anchorSlide.remove());
    await expect(cards(page).locator('.viewport')).toBeFocused();
    await cards(page).evaluate(el => {
        for (const child of Array.from(el.children))
            child.remove();
    });
    await expect(cards(page).locator('[part=position]')).toHaveText('No slides');
    await expect(cards(page).getByRole('button', { name: 'Next slide' })).toHaveAttribute('aria-disabled', 'true');
});
test('focused offscreen content is retained until blur, then excluded', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await load(page);
    const first = cards(page).getByRole('link', { name: 'Explore project 1' });
    await first.focus();
    await cards(page).locator('.viewport').evaluate(el => {
        el.scrollLeft = el.scrollWidth;
    });
    await expect(first).toBeFocused();
    await expect(first).toHaveCount(1);
    await cards(page).locator('.viewport').focus();
    await expect.poll(() => cards(page).ariaSnapshot()).not.toContain('Explore project 1');
});
test('autoplay pauses for focus/hover and reduced motion; manual restart and disconnect are bounded', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await load(page);
    // The accelerated clock cannot advance browser-native smooth scrolling. Exercise
    // timer behavior with instant scrolling; smooth movement has a separate real-time check.
    await media(page).locator('.viewport').evaluate(el => {
        const scroll = el.scrollTo.bind(el);
        el.scrollTo = (options: any) => scroll({ ...options, behavior: 'instant' });
    });
    await page.clock.install({ time: new Date('2026-09-17T08:00:00Z') });
    // Freeze elapsed time before enabling autoplay: automation overhead must not
    // consume the 100ms boundary that the first timer assertion is checking.
    await page.clock.pauseAt(new Date('2026-09-17T08:01:00Z'));
    await page.getByRole('button', { name: 'Try optional autoplay' }).click();
    await media(page).evaluate((el: any) => {
        el.interval = 1;
    });
    await page.mouse.move(0, 0);
    await page.clock.runFor(4900);
    await index(page, 0);
    await page.clock.runFor(500);
    await index(page, 1);
    const port = media(page).locator('.viewport');
    await port.focus();
    await page.clock.runFor(12000);
    await index(page, 1);
    await page.locator('body').click({ position: { x: 1, y: 1 } });
    await page.clock.runFor(6000);
    await index(page, 1);
    await media(page).evaluate((el: any) => el.play());
    await media(page).hover();
    await page.clock.runFor(6000);
    await index(page, 1);
    await page.mouse.move(0, 0);
    await page.clock.runFor(5500);
    await index(page, 2);
    await expect(media(page).getByRole('status')).toBeEmpty();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(media(page)).toHaveJSProperty('reduced', true);
    await page.clock.runFor(6000);
    await index(page, 2);
    await expect(media(page).getByRole('button', { name: 'Start slide rotation' })).toHaveAttribute('aria-disabled', 'true');
    await media(page).evaluate((el: any) => {
        el.play();
        (window as any).removedCarousel = el;
        el.remove();
    });
    await page.clock.runFor(12000);
    expect(await page.evaluate(() => (window as any).removedCarousel.index)).toBe(2);
    expect(await page.evaluate(() => (window as any).removedCarousel.querySelector('en-carousel-slide').shadowRoot.querySelector('[inert]'))).toBeNull();
});
test('six themes fit mobile, expose visible content and support Parts customization', async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 390, height: 844 });
    await load(page);
    for (const theme of ['en-reve', 'spectrum-inspired', 'fluent-inspired', 'astryx-inspired', 'shadcn-inspired', 'holotable-inspired']) {
        await page.getByRole('combobox', { name: 'Inspired theme', exact: true }).selectOption(theme);
        expect(await page.locator('[data-carousel-demo]').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
        await media(page).getByRole('button', { name: 'Next slide' }).click();
        await expect.poll(async () => ((await media(page).ariaSnapshot()).match(/- img /g) ?? []).length).toBe(1);
        const result = await new AxeBuilder({ page }).include('[data-carousel-demo]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(result.violations).toEqual([]);
    }
    await page.addStyleTag({ content: 'en-carousel::part(controls){justify-content:space-between} en-carousel-slide::part(base){border-radius:3px}' });
    expect(await media(page).locator('.controls').evaluate(el => getComputedStyle(el).justifyContent)).toBe('space-between');
    await media(page).screenshot({ path: test.info().outputPath('en-carousel-mobile-' + test.info().project.name + '.png') });
});
test('smooth navigation settles on its destination without reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await load(page);
    await media(page).getByRole('button', { name: 'Next slide' }).click();
    await expect.poll(() => media(page).evaluate((el: any) => Math.abs(el.offset(el.slides[1])))).toBeLessThan(2);
    await expect.poll(() => media(page).evaluate((el: any) => el.aligning)).toBe(false);
    await index(page, 1);
});
test('Tab reaches visible content and authoritative writes interrupt navigation', async ({ page, browserName }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await load(page);
    await cards(page).locator('.viewport').focus();
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
    await expect(cards(page).getByRole('link', { name: 'Explore project 1' })).toBeFocused();
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
    await expect(cards(page).getByRole('button', { name: 'Previous slide' })).toBeFocused();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await media(page).evaluate((el: any) => {
        el.next();
        el.index = 2;
    });
    await expect.poll(() => media(page).evaluate((el: any) => Math.abs(el.offset(el.slides[2])))).toBeLessThan(2);
    await index(page, 2);
});

test('thumbnail picker separates focus from selection, preserves nodes and honors canceled changes', async ({ page, browserName }) => {
    await load(page);
    const picker = media(page).getByRole('group', { name: 'Choose a cover study' });
    const buttons = picker.getByRole('button');
    await expect(buttons).toHaveCount(3);
    await expect(buttons.nth(0)).toHaveAccessibleName('Show 1 of 3: Nightfall');
    await expect(buttons.nth(0)).toHaveAttribute('aria-current', 'true');
    await expect(picker.getByRole('img')).toHaveCount(0);
    await expect(picker.locator('img')).toHaveCount(3);
    await media(page).evaluate(el => (window as any).originalSlides = Array.from(el.children));
    await buttons.nth(0).focus();
    await page.keyboard.press('ArrowRight');
    await expect(buttons.nth(1)).toBeFocused();
    await index(page, 0);
    await expect(picker.locator('[tabindex="0"]')).toHaveCount(1);
    await page.keyboard.press('Enter');
    await index(page, 1);
    await expect(buttons.nth(1)).toHaveAttribute('aria-current', 'true');
    await expect(buttons.nth(1)).toBeFocused();
    await media(page).evaluate(el => el.addEventListener('en-change', event => {
        (window as any).pickerReason = (event as CustomEvent).detail.reason;
        event.preventDefault();
    }, { once: true }));
    await page.keyboard.press('End');
    await page.keyboard.press('Space');
    await index(page, 1);
    expect(await page.evaluate(() => (window as any).pickerReason)).toBe('picker');
    await expect(buttons.nth(1)).toHaveAttribute('aria-current', 'true');
    await expect(buttons.nth(2)).toBeFocused();
    expect(await media(page).evaluate(el => Array.from(el.children).every((node, i) => node === (window as any).originalSlides[i]))).toBe(true);
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
    await expect(page.getByRole('button', { name: 'Try optional autoplay' })).toBeFocused();
    await test.info().attach('thumbnail-picker-tree', { body: await picker.ariaSnapshot(), contentType: 'text/plain' });
});

test('picker updates labels and metadata, localizes names and recovers focus after removal', async ({ page }) => {
    await load(page);
    const picker = media(page).locator('[part=picker]');
    await media(page).evaluate((el: any) => {
        el.pickerLabel = 'Choisir une étude';
        el.pickLabel = '{label}, {position}';
        el.children[1].label = 'Arches';
        el.children[1].thumbnail = '';
    });
    await expect(picker).toHaveAccessibleName('Choisir une étude');
    const arches = picker.getByRole('button', { name: 'Arches, 2 of 3' });
    await expect(arches.locator('img')).toHaveCount(0);
    await expect(arches).toHaveText('2');
    await arches.focus();
    await media(page).evaluate(el => el.children[1].remove());
    await expect(picker.getByRole('button')).toHaveCount(2);
    await expect(picker.getByRole('button').first()).toBeFocused();
    await media(page).evaluate(el => Array.from(el.children).forEach(child => child.remove()));
    await expect(picker).toHaveCount(0);
    await expect(media(page).locator('.viewport')).toBeFocused();
});

test('position picker follows full windows and reveals RTL and narrow keyboard targets', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await load(page);
    const picker = cards(page).locator('[part=picker]');
    await expect(picker.getByRole('button')).toHaveCount(3);
    await expect(picker.getByRole('button').last()).toHaveText('3–5');
    await picker.getByRole('button').last().click();
    await expect(cards(page)).toHaveJSProperty('index', 2);
    await expect(picker.getByRole('button').last()).toHaveAttribute('aria-current', 'true');
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(picker.getByRole('button')).toHaveCount(5);
    await cards(page).evaluate(el => {
        el.setAttribute('dir', 'rtl');
        for (let i = 6; i <= 20; i++) {
            const slide = document.createElement('en-carousel-slide');
            slide.setAttribute('label', `Project ${i}`);
            slide.textContent = `Project ${i}`;
            el.append(slide);
        }
    });
    await expect(picker.getByRole('button')).toHaveCount(20);
    await picker.getByRole('button').first().focus();
    await page.keyboard.press('ArrowLeft');
    await expect(picker.getByRole('button').nth(1)).toBeFocused();
    await page.keyboard.press('End');
    await expect(picker.getByRole('button').last()).toBeFocused();
    await expect.poll(() => picker.evaluate(el => {
        const focused = el.querySelector(':focus')!.getBoundingClientRect();
        const port = el.getBoundingClientRect();
        return focused.left >= port.left && focused.right <= port.right;
    })).toBe(true);
    await page.keyboard.press('Enter');
    await expect(cards(page)).toHaveJSProperty('index', 19);
    expect(await page.locator('[data-carousel-demo]').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(picker.getByRole('button')).toHaveCount(18);
    await expect(picker.getByRole('button').last()).toBeFocused();
    await expect(cards(page)).toHaveJSProperty('index', 17);
    await page.emulateMedia({ forcedColors: 'active' });
    expect(await picker.locator('[aria-current=true]').evaluate(el => { const style = getComputedStyle(el); return style.backgroundColor !== style.color && getComputedStyle(el, '::after').height === '3px'; })).toBe(true);
});


for (const direction of ['ltr', 'rtl'] as const) test(`hidden authored carousel retains the latest index through settlement and reveal (${direction})`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    // Install before navigation, then pause after readiness: every settlement uses the documented clock.
    await page.clock.install({ time: new Date('2026-09-29T08:00:00Z') });
    await load(page);
    const carousel = media(page);
    const geometry = () => carousel.evaluate((el: any) => {
        const port = el.shadowRoot!.querySelector('[part="viewport"]') as HTMLElement;
        const style = getComputedStyle(port), rect = port.getBoundingClientRect();
        const slide = el.querySelectorAll(':scope > en-carousel-slide')[el.index] as HTMLElement | undefined;
        const slideRect = slide?.getBoundingClientRect();
        const width = port.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
        const offset = slideRect ? style.direction === 'rtl'
            ? slideRect.right - (rect.right - parseFloat(style.paddingRight))
            : slideRect.left - (rect.left + parseFloat(style.paddingLeft)) : null;
        return {
            index: el.index, currentKey: undefined, direction: style.direction,
            measured: Number.isFinite(width) && width > 0 && rect.width > 0,
            aligned: offset !== null && !!slideRect?.width && Math.abs(offset) < 2,
            nativeOffsetNonzero: Math.abs(port.scrollLeft) > 1,
        };
    });
    await carousel.evaluate(async (el: any, direction) => { el.dir = direction; el.index = 1; await el.updateComplete; }, direction);
    await expect.poll(geometry).toMatchObject({ index: 1, direction, measured: true, aligned: true });
    await page.clock.pauseAt(new Date('2026-09-29T09:00:00Z'));
    await page.clock.runFor(300);
    await expect.poll(geometry).toMatchObject({ index: 1, measured: true, aligned: true });
    await carousel.evaluate((el: any) => {
        const ancestor = el.closest('.demo-section')! as HTMLElement;
        const state = {
            host: el, root: el.shadowRoot, ancestor,
            display: ancestor.style.getPropertyValue('display'), priority: ancestor.style.getPropertyPriority('display'),
            slides: Array.from((el as Element).querySelectorAll(':scope > en-carousel-slide')), changes: [] as { previous: number; proposed: number; reason: string }[],
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
            slides: state.slides.length === el.children.length && state.slides.every((slide: Element, index: number) => el.children[index] === slide), changes: state.changes };
    });
    try {
        await carousel.evaluate(async (el: any) => {
            const state = (window as any).__hiddenCarouselRegression;
            const port = el.shadowRoot!.querySelector('[part="viewport"]') as HTMLElement;
            // Queue a normal alignment while measurable, then hide its ancestor before the timer advances.
            el.index = 2;
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
        expect(await geometry()).toMatchObject({ index: 2, measured: false });
        expect(await retained()).toEqual({ connected: true, host: true, root: true, slides: true, changes: [] });
        await carousel.evaluate(async (el: any) => { el.index = 1; await el.updateComplete; });
        await page.clock.runFor(300);
        expect(await geometry()).toMatchObject({ index: 1, measured: false });
        expect(await retained()).toEqual({ connected: true, host: true, root: true, slides: true, changes: [] });
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
        await expect.poll(geometry).toMatchObject({ index: 1, direction, measured: true, aligned: true, nativeOffsetNonzero: true });
        await expect(carousel.locator('[part="position"]')).toHaveText('2 of 3');
        await expect(carousel.locator('[part~="picker-current"]')).toHaveAccessibleName('Show 2 of 3: Terracotta');
        expect(await retained()).toEqual({ connected: true, host: true, root: true, slides: true, changes: [] });
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
        await expect.poll(geometry).toMatchObject({ index: 0, measured: true, aligned: true });
        expect(await retained()).toEqual({ connected: true, host: true, root: true,
            slides: true, changes: [{ previous: 1, proposed: 0, reason: 'scroll' }] });
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

for (const order of ['index-before-children', 'children-before-index'] as const) {
    for (const duplicate of [false, true]) test(`authoritative authored index wins ${order}${duplicate ? ' with duplicate same-value writes' : ''}`, async ({ page }) => {
        await load(page);
        const carousel = media(page);
        await carousel.evaluate(async (el: any, duplicate) => {
            el.loop = false;
            el.index = duplicate ? 1 : 0;
            await el.updateComplete;
            (window as any).authorIndexSlides = [...el.children];
            (window as any).authorIndexChanges = [];
            el.addEventListener('en-change', (event: any) => {
                if (event.target === el) (window as any).authorIndexChanges.push(event.detail);
            });
        }, duplicate);
        await carousel.evaluate(async (el: any, { order, duplicate }) => {
            const write = () => { el.index = 1; if (duplicate) el.index = 1; };
            if (order === 'index-before-children') write();
            el.append(el.children[0]);
            if (order === 'children-before-index') write();
            await el.updateComplete;
        }, { order, duplicate });
        await expect(carousel).toHaveJSProperty('index', 1);
        await expect(carousel.locator('[part=position]')).toHaveText('2 of 3');
        await expect(carousel.getByRole('button', { name: 'Previous slide' })).toBeEnabled();
        await expect(carousel.locator('en-carousel-slide').nth(1).locator('[part=base]')).not.toHaveAttribute('aria-hidden', 'true');
        expect(await carousel.evaluate((el: any) => el.children[el.index] === (window as any).authorIndexSlides[2])).toBe(true);
        expect(await page.evaluate(() => (window as any).authorIndexChanges)).toEqual([]);

        // Once that update settled, a new independent reorder keeps the selected node.
        await carousel.evaluate(async (el: any) => { el.append(el.children[0]); await el.updateComplete; });
        await expect(carousel).toHaveJSProperty('index', 0);
        await expect(carousel.locator('[part=position]')).toHaveText('1 of 3');
        expect(await carousel.evaluate((el: any) => el.children[el.index] === (window as any).authorIndexSlides[2])).toBe(true);
        expect(await carousel.evaluate((el: any) => [...el.children].every(child => (window as any).authorIndexSlides.includes(child)))).toBe(true);
        expect(await page.evaluate(() => (window as any).authorIndexChanges)).toEqual([]);
    });
}

test('authored index before readiness and through disconnect is consumed against current children', async ({ page }) => {
    await load(page);
    await page.evaluate(async () => {
        const carousel = document.createElement('en-carousel') as any;
        carousel.id = 'author-index-lifecycle'; carousel.controls = 'always';
        carousel.style.display = 'block'; carousel.style.width = '600px';
        const slides = ['one', 'two', 'three'].map(label => {
            const slide = document.createElement('en-carousel-slide'); slide.setAttribute('label', label); slide.textContent = label; return slide;
        });
        carousel.index = 2;
        carousel.index = 2;
        carousel.append(...slides);
        (window as any).lifecycleIndexSlides = slides;
        (window as any).lifecycleIndexChanges = [];
        carousel.addEventListener('en-change', (event: any) => { if (event.target === carousel) (window as any).lifecycleIndexChanges.push(event.detail); });
        document.body.append(carousel);
        await carousel.updateComplete;
    });
    const carousel = page.locator('#author-index-lifecycle');
    await expect(carousel).toHaveJSProperty('index', 2);
    await expect(carousel.locator('[part=position]')).toHaveText('3 of 3');
    await carousel.evaluate(async (el: any) => {
        el.index = 1;
        el.remove();
        await el.updateComplete;
        el.append(el.children[0]);
        el.index = 1;
        document.body.append(el);
        await el.updateComplete;
    });
    await expect(carousel).toHaveJSProperty('index', 1);
    await expect(carousel.locator('[part=position]')).toHaveText('2 of 3');
    expect(await carousel.evaluate((el: any) => el.children[el.index] === (window as any).lifecycleIndexSlides[2])).toBe(true);
    await carousel.evaluate(async (el: any) => { el.append(el.children[0]); await el.updateComplete; });
    await expect(carousel).toHaveJSProperty('index', 0);
    expect(await carousel.evaluate((el: any) => el.children[el.index] === (window as any).lifecycleIndexSlides[2])).toBe(true);
    expect(await page.evaluate(() => (window as any).lifecycleIndexChanges)).toEqual([]);
});

for (const outcome of ['committed', 'canceled', 'superseded'] as const) test(`semantic navigation after an authored index remains ${outcome}`, async ({ page }) => {
    await load(page);
    const carousel = media(page);
    await carousel.evaluate(async (el: any, outcome) => {
        el.loop = false;
        el.index = 1;
        if (outcome !== 'committed') el.addEventListener('en-change', (event: Event) => {
            if (outcome === 'superseded') el.index = 0;
            event.preventDefault();
        }, { once: true });
        el.goTo(2);
        await el.updateComplete;
    }, outcome);
    const expected = outcome === 'committed' ? 2 : outcome === 'canceled' ? 1 : 0;
    await expect(carousel).toHaveJSProperty('index', expected);
    await expect(carousel.locator('[part=position]')).toHaveText(`${expected + 1} of 3`);
});
