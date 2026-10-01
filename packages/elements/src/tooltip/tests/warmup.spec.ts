import { expect, test, type Page } from '@playwright/test';

const path = '/packages/elements/src/tooltip/tests/fixture.html';
const tip = (page: Page, id: string) => page.locator(`body > #tip-${id}`);
const trigger = (page: Page, id: string) => page.locator(`body > .group > #${id}`);
async function tick(page: Page, ms: number) { await page.clock.runFor(ms); }
async function shown(page: Page, id: string, expected = true) {
	await expect(tip(page, id)).toHaveJSProperty('open', expected);
	await expect.poll(() => tip(page, id).evaluate(el => Boolean(el.shadowRoot?.querySelector(':popover-open')))).toBe(expected);
}
async function hover(page: Page, id: string) { await trigger(page, id).hover(); await tick(page, 1); }
async function warm(page: Page) { await hover(page, 'one'); await tick(page, 300); await shown(page, 'one'); }
async function leave(page: Page) { await page.mouse.move(1000, 40); await tick(page, 1); }

test.beforeEach(async ({ page }) => {
	await page.goto(path);
	await page.evaluate(async () => { await customElements.whenDefined('en-tooltip'); await Promise.all([...document.querySelectorAll('en-tooltip')].map(el => (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete)); });
	await page.clock.install();
	await page.clock.pauseAt(new Date(Date.now() + 1000));
});

test('cold hover delays, then a neighboring toolbar tooltip opens without waiting', async ({ page }) => {
	await hover(page, 'one'); await tick(page, 250); await shown(page, 'one', false);
	await tick(page, 50); await shown(page, 'one');
	await hover(page, 'two'); await shown(page, 'two');
	await expect(trigger(page, 'two')).toHaveAttribute('aria-describedby', /\S+/);
});

test('a displayed warm-group successor immediately dismisses old hover-only help', async ({ page }) => {
	await tip(page, 'one').evaluate(el => el.setAttribute('hide-delay', '5000'));
	await warm(page); await hover(page, 'two');
	await shown(page, 'two'); await shown(page, 'one', false);
});

for (const action of ['cancel', 'supersede', 'equal-author-write', 'native-cancel'] as const) {
	test(`${action} successor does not dismiss previous hover help`, async ({ page }) => {
		await tip(page, 'one').evaluate(el => el.setAttribute('hide-delay', '5000'));
		await warm(page);
		await tip(page, 'two').evaluate((el, mode) => {
			if (mode === 'native-cancel') el.shadowRoot!.querySelector('[popover]')!.addEventListener('beforetoggle', event => event.preventDefault(), { once: true });
			else el.addEventListener('en-change', event => {
				if (mode === 'cancel') event.preventDefault();
				else (el as HTMLElement & { open: boolean }).open = mode === 'equal-author-write';
			}, { once: true });
		}, action);
		await hover(page, 'two'); await shown(page, 'one');
		await expect.poll(() => tip(page, 'two').evaluate(el => Boolean(el.shadowRoot?.querySelector(':popover-open')))).toBe(action === 'equal-author-write');
	});
}

test('a vetoed handoff preserves old help without a delayed duplicate close request', async ({ page }) => {
	await tip(page, 'one').evaluate(el => {
		el.setAttribute('hide-delay', '5000');
		(el as HTMLElement & { closeRequests: number }).closeRequests = 0;
		el.addEventListener('en-change', event => {
			if ((event as CustomEvent).detail.proposed) return;
			(el as HTMLElement & { closeRequests: number }).closeRequests++;
			event.preventDefault();
		});
	});
	await warm(page); await hover(page, 'two'); await shown(page, 'two'); await shown(page, 'one');
	await expect(tip(page, 'one')).toHaveJSProperty('closeRequests', 1);
	await tick(page, 5100); await shown(page, 'one');
	await expect(tip(page, 'one')).toHaveJSProperty('closeRequests', 1);
});

test('opening a tooltip in another group does not hand off previous help', async ({ page }) => {
	await tip(page, 'one').evaluate(el => el.setAttribute('hide-delay', '5000'));
	await warm(page); await hover(page, 'other'); await tick(page, 300);
	await shown(page, 'other'); await shown(page, 'one');
});

for (const mutation of ['close-successor', 'regroup-successor'] as const) {
	test(`reentrant ${mutation} stops further peer dismissal`, async ({ page }) => {
		await page.evaluate(mode => {
			const first = document.querySelector('#tip-one')!;
			const second = document.querySelector('#tip-two')!;
			const third = document.querySelector('#tip-three')! as HTMLElement & { open: boolean };
			first.setAttribute('hide-delay', '5000'); second.setAttribute('hide-delay', '5000');
			first.addEventListener('en-change', event => {
				if ((event as CustomEvent).detail.proposed) return;
				event.preventDefault();
				if (!third.open) return;
				if (mode === 'close-successor') third.open = false;
				else third.setAttribute('warmup-group', 'other-tools');
			});
		}, mutation);
		await warm(page); await hover(page, 'two'); await shown(page, 'one'); await shown(page, 'two');
		await hover(page, 'three'); await shown(page, 'one'); await shown(page, 'two');
		await shown(page, 'three', mutation === 'regroup-successor');
	});
}

test('leaving the group cools it after 500ms', async ({ page }) => {
	await warm(page); await leave(page); await tick(page, 501); await shown(page, 'one', false);
	await hover(page, 'two'); await tick(page, 250); await shown(page, 'two', false);
	await tick(page, 50); await shown(page, 'two');
});

test('returning within the cooldown keeps the group warm', async ({ page }) => {
	await warm(page); await leave(page); await tick(page, 250);
	await hover(page, 'two'); await shown(page, 'two');
});

test('another group retains its first-hover delay', async ({ page }) => {
	await warm(page); await hover(page, 'other'); await tick(page, 250); await shown(page, 'other', false);
	await tick(page, 50); await shown(page, 'other');
});

test('equal group IDs in separate shadow roots do not share warmth', async ({ page }) => {
	await warm(page);
	const shadow = page.locator('#shadow-fixture');
	await shadow.locator('#one').hover(); await tick(page, 250);
	await expect(shadow.locator('#tip-one')).toHaveJSProperty('open', false);
	await tick(page, 51); await expect(shadow.locator('#tip-one')).toHaveJSProperty('open', true);
	await shadow.locator('#two').hover(); await tick(page, 1); await expect(shadow.locator('#tip-two')).toHaveJSProperty('open', true);
});

for (const action of ['cancel', 'supersede', 'native-cancel'] as const) {
	test(`${action} opening does not warm the next tooltip`, async ({ page }) => {
		await tip(page, 'one').evaluate((el, mode) => {
			if (mode === 'native-cancel') el.shadowRoot!.querySelector('[popover]')!.addEventListener('beforetoggle', event => event.preventDefault(), { once: true });
			else el.addEventListener('en-change', event => {
				if (mode === 'cancel') event.preventDefault();
				else (el as HTMLElement & { open: boolean }).open = false;
			}, { once: true });
		}, action);
		await hover(page, 'one'); await tick(page, 300);
		await expect.poll(() => tip(page, 'one').evaluate(el => Boolean(el.shadowRoot?.querySelector(':popover-open')))).toBe(false);
		await hover(page, 'two'); await tick(page, 250); await shown(page, 'two', false);
		await tick(page, 50); await shown(page, 'two');
	});
}

test('accepted Escape dismisses, suppresses reopening, and cools the group', async ({ page }) => {
	await warm(page); await page.keyboard.press('Escape'); await tick(page, 1); await shown(page, 'one', false);
	await tick(page, 400); await shown(page, 'one', false);
	await hover(page, 'two'); await tick(page, 250); await shown(page, 'two', false);
	await tick(page, 50); await shown(page, 'two');
});

test('canceled Escape preserves the visible tooltip and warm group', async ({ page }) => {
	await warm(page);
	await tip(page, 'one').evaluate(el => el.addEventListener('en-change', event => {
		if ((event as CustomEvent).detail.reason === 'escape') event.preventDefault();
	}));
	await page.keyboard.press('Escape'); await tick(page, 1); await shown(page, 'one');
	await hover(page, 'two'); await shown(page, 'two');
});

test('keyboard focus opens immediately and suppresses competing group hover', async ({ page, browserName }) => {
	await page.locator('#before').focus(); await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab'); await tick(page, 1); await shown(page, 'one');
	await hover(page, 'two'); await tick(page, 250); await shown(page, 'two', false);
	await shown(page, 'one');
	await tick(page, 500); await shown(page, 'two', false); await shown(page, 'one');
	await page.locator('#before').focus(); await tick(page, 301); await shown(page, 'two');
});

test('real en-toolbar roving focus describes en-buttons immediately and keeps one Tab entry', async ({ page, browserName }) => {
	await page.evaluate(() => {
		document.body.insertAdjacentHTML('afterbegin', `
			<en-toolbar id="custom-tools" label="Format">
				<en-button id="bold">Bold</en-button><en-button id="italic">Italic</en-button>
			</en-toolbar>
			<en-tooltip id="tip-bold" for="bold" warmup-group="custom-tools"><span slot="content">Use bold text</span></en-tooltip>
			<en-tooltip id="tip-italic" for="italic" warmup-group="custom-tools"><span slot="content">Use italic text</span></en-tooltip>`);
	});
	await tick(page, 1);
	await page.locator('#bold').locator('button').focus(); await tick(page, 1); await shown(page, 'bold');
	await page.keyboard.press('ArrowRight'); await tick(page, 1);
	await expect(page.locator('#italic').locator('button')).toBeFocused(); await shown(page, 'italic');
	// Playwright's DOM description calculator does not follow cross-root element references.
	await expect.poll(() => page.locator('#italic').locator('button').evaluate(el =>
		(el as HTMLButtonElement).ariaDescribedByElements?.[0] === document.querySelector('#tip-italic > [slot=content]'))).toBe(true);
	await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
	await expect(page.locator('#before')).toBeFocused();
});

test('an equal author open write supersedes hover ownership and does not warm the group', async ({ page }) => {
	await tip(page, 'one').evaluate(el => el.addEventListener('en-change', () => {
		(el as HTMLElement & { open: boolean }).open = true;
	}, { once: true }));
	await hover(page, 'one'); await tick(page, 300); await shown(page, 'one');
	await hover(page, 'two'); await tick(page, 250); await shown(page, 'two', false);
	await tick(page, 50); await shown(page, 'two');
});

for (const mutation of ['group-change', 'reparent'] as const) {
	test(`native beforetoggle ${mutation} cannot warm the old group`, async ({ page }) => {
		await tip(page, 'one').evaluate((el, mode) => {
			el.shadowRoot!.querySelector('[popover]')!.addEventListener('beforetoggle', () => {
				if (mode === 'group-change') el.setAttribute('warmup-group', 'other-tools');
				else document.querySelector('#other-tools')!.append(document.querySelector('#one')!);
			}, { once: true });
		}, mutation);
		await hover(page, 'one'); await tick(page, 300);
		await hover(page, 'two'); await tick(page, 250); await shown(page, 'two', false);
		await tick(page, 50); await shown(page, 'two');
	});
}

test('standalone tooltips keep their own pointer delay', async ({ page }) => {
	await tip(page, 'two').evaluate(el => el.removeAttribute('warmup-group'));
	await warm(page); await hover(page, 'two'); await tick(page, 250); await shown(page, 'two', false);
	await tick(page, 50); await shown(page, 'two');
});

test('hovering tooltip content beyond the cooldown preserves group warmth', async ({ page }) => {
	await warm(page);
	await tip(page, 'one').locator('[popover]').hover(); await tick(page, 650); await shown(page, 'one');
	await hover(page, 'two'); await shown(page, 'two');
});

test('valid travel through the trigger-to-surface gap preserves the tooltip', async ({ page }) => {
	await warm(page);
	const anchor = await trigger(page, 'one').boundingBox();
	const surface = await tip(page, 'one').locator('[popover]').boundingBox();
	expect(anchor).not.toBeNull(); expect(surface).not.toBeNull();
	const x = anchor!.x + 20;
	await page.mouse.move(x, anchor!.y + anchor!.height - 1);
	await page.mouse.move(x, (anchor!.y + anchor!.height + surface!.y) / 2);
	await tick(page, 600); await shown(page, 'one');
	await page.mouse.move(x, surface!.y + 3); await tick(page, 600); await shown(page, 'one');
	await hover(page, 'two'); await shown(page, 'two');
});

for (const attribute of ['disabled', 'aria-disabled', 'loading']) {
	test(`${attribute} trigger does not open or warm the group`, async ({ page }) => {
		await trigger(page, 'one').evaluate((el, name) => {
			if (name === 'loading') (el as HTMLElement & { loading: boolean }).loading = true;
			else el.setAttribute(name, name === 'aria-disabled' ? 'true' : '');
		}, attribute);
		await hover(page, 'one'); await tick(page, 350); await shown(page, 'one', false);
		await hover(page, 'two'); await tick(page, 250); await shown(page, 'two', false);
	});
}

test('missing or non-containing group keeps tooltips independent', async ({ page }) => {
	await tip(page, 'two').evaluate(el => el.setAttribute('warmup-group', 'other-tools'));
	await warm(page); await hover(page, 'two'); await tick(page, 250); await shown(page, 'two', false);
	await tick(page, 50); await shown(page, 'two');
	await tip(page, 'three').evaluate(el => el.setAttribute('warmup-group', 'missing'));
	await hover(page, 'three'); await tick(page, 250); await shown(page, 'three', false);
});

for (const mutation of ['rebind', 'remove', 'replace', 'reparent', 'group-change'] as const) {
	test(`pending first hover cannot survive ${mutation}`, async ({ page }) => {
		await hover(page, 'one'); await tick(page, 100);
		await page.evaluate(mode => {
			const tooltip = document.querySelector('#tip-one')!;
			const button = document.querySelector('#one')!;
			if (mode === 'rebind') tooltip.setAttribute('for', 'three');
			if (mode === 'remove') tooltip.remove();
			if (mode === 'replace') button.replaceWith(button.cloneNode(true));
			if (mode === 'reparent') document.querySelector('#other-tools')!.append(button);
			if (mode === 'group-change') tooltip.setAttribute('warmup-group', 'other-tools');
		}, mutation);
			await tick(page, 210);
			if (mutation !== 'remove') await shown(page, 'one', false);
			// Reparenting can move a peer beneath the stationary pointer. Start the
			// next measured hover from outside so that layout cannot give it a head start.
			await leave(page);
			await hover(page, 'two'); await tick(page, 250); await shown(page, 'two', false);
	});
}

test('missing trigger never makes a group warm', async ({ page }) => {
	await tip(page, 'one').evaluate(el => el.setAttribute('for', 'absent'));
	await hover(page, 'one'); await tick(page, 350); await shown(page, 'one', false);
	await hover(page, 'two'); await tick(page, 250); await shown(page, 'two', false);
});

test('touch pointer entry does not request hover opening', async ({ browser }) => {
	const context = await browser.newContext({ hasTouch: true, viewport: { width: 390, height: 844 } });
	const mobile = await context.newPage();
	await mobile.goto(path); await mobile.evaluate(() => customElements.whenDefined('en-tooltip'));
	await mobile.clock.install(); await mobile.clock.pauseAt(new Date(Date.now() + 1000));
	await tip(mobile, 'one').evaluate(el => {
		(el as HTMLElement & { requests: string[] }).requests = [];
		el.addEventListener('en-change', event => (el as HTMLElement & { requests: string[] }).requests.push((event as CustomEvent).detail.reason));
	});
	await trigger(mobile, 'one').tap(); await tick(mobile, 400);
	const reasons = await tip(mobile, 'one').evaluate(el => (el as HTMLElement & { requests: string[] }).requests);
	expect(reasons).not.toContain('hover');
	await context.close();
});

for (const state of ['pending', 'displayed'] as const) {
 test(`focus takes priority over ${state} unattended pointer help, retaining the native description`, async ({ page }) => {
  await tip(page, 'two').evaluate(el => el.setAttribute('hide-delay', '5000'));
  await hover(page, 'two');
  await tick(page, state === 'displayed' ? 300 : 100);
  if (state === 'displayed') await leave(page);
  await trigger(page, 'one').focus(); await tick(page, 1);
  await shown(page, 'one'); await shown(page, 'two', false);
  await hover(page, 'two');
  await expect(trigger(page, 'one')).toBeFocused();
  await expect(trigger(page, 'one')).toHaveAccessibleDescription('First description');
  await tick(page, 500); await shown(page, 'two', false);
  await page.keyboard.press('Escape'); await tick(page, 301);
  await shown(page, 'one', false); await shown(page, 'two');
  await expect(trigger(page, 'one')).toBeFocused();
  await expect(trigger(page, 'one')).toHaveAccessibleDescription('First description');
  await tick(page, 1000); await shown(page, 'one', false);
 });
}

test('canceled focused Escape keeps group priority until an accepted dismissal', async ({ page }) => {
 await trigger(page, 'one').focus(); await tick(page, 1); await shown(page, 'one');
 await hover(page, 'two');
 await tip(page, 'one').evaluate(el => el.addEventListener('en-change', event => event.preventDefault(), { once: true }));
 await page.keyboard.press('Escape'); await tick(page, 400);
 await shown(page, 'one'); await shown(page, 'two', false);
 await page.keyboard.press('Escape'); await tick(page, 301);
 await shown(page, 'one', false); await shown(page, 'two');
});

test('fresh hover after focused Escape has pointer-only lifetime and blur restores focus behavior', async ({ page }) => {
	await trigger(page, 'one').focus(); await tick(page, 1); await shown(page, 'one');
	await page.keyboard.press('Escape'); await tick(page, 1); await shown(page, 'one', false);
	await hover(page, 'one'); await tick(page, 250); await shown(page, 'one', false);
	await tick(page, 50); await shown(page, 'one');
	await expect(trigger(page, 'one')).toBeFocused();
	await expect(trigger(page, 'one')).toHaveAccessibleDescription('First description');
	await leave(page); await tick(page, 151); await shown(page, 'one', false);
	await expect(trigger(page, 'one')).toBeFocused();
	await page.locator('#before').focus(); await trigger(page, 'one').focus(); await tick(page, 1);
	await shown(page, 'one');
	await hover(page, 'two'); await tick(page, 600); await shown(page, 'two', false);
	await leave(page); await tick(page, 600); await shown(page, 'one');
});

test('Escape cancels the current hover encounter without blocking a later encounter on the focused trigger', async ({ page }) => {
	await trigger(page, 'one').focus(); await hover(page, 'one'); await shown(page, 'one');
	await page.keyboard.press('Escape'); await tick(page, 1000); await shown(page, 'one', false);
	const bounds = await trigger(page, 'one').boundingBox();
	await page.mouse.move(bounds!.x + 10, bounds!.y + 10); await tick(page, 400);
	await shown(page, 'one', false);
	await leave(page); await hover(page, 'one'); await tick(page, 301); await shown(page, 'one');
	await page.keyboard.press('Escape'); await tick(page, 1000); await shown(page, 'one', false);
	await leave(page); await hover(page, 'one'); await tick(page, 301); await shown(page, 'one');
	await leave(page); await tick(page, 151); await shown(page, 'one', false);
	await expect(trigger(page, 'one')).toBeFocused();
});

test('hover reopened on an Escape-suppressed focused trigger participates in immediate group handoff', async ({ page }) => {
	await tip(page, 'one').evaluate(el => el.setAttribute('hide-delay', '5000'));
	await trigger(page, 'one').focus(); await tick(page, 1);
	await page.keyboard.press('Escape'); await tick(page, 1);
	await hover(page, 'one'); await tick(page, 301); await shown(page, 'one');
	await hover(page, 'two'); await shown(page, 'two'); await shown(page, 'one', false);
	await expect(trigger(page, 'one')).toBeFocused();
});

test('hover reopened after focused Escape retains safe transit and hoverable content without focus stickiness', async ({ page }) => {
	await trigger(page, 'one').focus(); await tick(page, 1);
	await page.keyboard.press('Escape'); await tick(page, 1);
	await hover(page, 'one'); await tick(page, 301); await shown(page, 'one');
	const anchor = await trigger(page, 'one').boundingBox();
	const surface = await tip(page, 'one').locator('[popover]').boundingBox();
	const x = anchor!.x + 20;
	await page.mouse.move(x, anchor!.y + anchor!.height - 1);
	await page.mouse.move(x, (anchor!.y + anchor!.height + surface!.y) / 2);
	await tick(page, 600); await shown(page, 'one');
	await page.mouse.move(x, surface!.y + 3); await tick(page, 650); await shown(page, 'one');
	await leave(page); await tick(page, 151); await shown(page, 'one', false);
	await expect(trigger(page, 'one')).toBeFocused();
});

for (const mode of ['cancel', 'supersede'] as const) {
	test(`${mode} focused Escape does not suppress focus persistence or group priority`, async ({ page }) => {
		await trigger(page, 'one').focus(); await hover(page, 'one'); await shown(page, 'one');
		await tip(page, 'one').evaluate((element, mode) => element.addEventListener('en-change', event => {
			if (mode === 'cancel') event.preventDefault();
			else (element as HTMLElement & { open: boolean }).open = true;
		}, { once: true }), mode);
		await page.keyboard.press('Escape'); await leave(page); await tick(page, 600); await shown(page, 'one');
		await hover(page, 'two'); await tick(page, 600); await shown(page, 'two', false);
		await expect(trigger(page, 'one')).toBeFocused();
	});
}

test('en-button retains native focus while fresh hover after Escape opens and closes normally', async ({ page }) => {
	await page.evaluate(() => document.body.insertAdjacentHTML('afterbegin', `<en-button id="custom-trigger">History</en-button><en-tooltip id="tip-custom" for="custom-trigger"><span slot="content">Review project history</span></en-tooltip>`));
	await tick(page, 1);
	const button = page.locator('#custom-trigger').locator('button');
	await button.focus(); await tick(page, 1); await shown(page, 'custom');
	await page.keyboard.press('Escape'); await tick(page, 1); await shown(page, 'custom', false);
	await button.hover(); await tick(page, 301); await shown(page, 'custom');
	await leave(page); await tick(page, 151); await shown(page, 'custom', false);
	await expect(button).toBeFocused();
	await page.locator('#before').focus(); await button.focus(); await tick(page, 1); await shown(page, 'custom');
});

for (const blurred of [false, true]) {
	test(`rebinding to an Escape-dismissed trigger ${blurred ? 'restores after actual blur' : 'preserves its suppressed focus interval'}`, async ({ page }) => {
		await trigger(page, 'one').focus(); await tick(page, 1);
		await page.keyboard.press('Escape'); await tick(page, 1);
		await tip(page, 'one').evaluate(el => el.setAttribute('for', 'three')); await tick(page, 1);
		if (blurred) { await page.locator('#before').focus(); await trigger(page, 'one').focus(); }
		await tip(page, 'one').evaluate(el => el.setAttribute('for', 'one')); await tick(page, 1);
		await shown(page, 'one', blurred); await expect(trigger(page, 'one')).toBeFocused();
		if (!blurred) { await hover(page, 'one'); await tick(page, 301); await shown(page, 'one'); }
	});
}

for (const mode of ['cancel', 'supersede', 'native-cancel'] as const) {
 test(`${mode} focused opening does not acquire group priority`, async ({ page }) => {
  await tip(page, 'one').evaluate((el, mode) => {
   if (mode === 'native-cancel') el.shadowRoot!.querySelector('[popover]')!.addEventListener('beforetoggle', event => event.preventDefault(), { once: true });
   else el.addEventListener('en-change', event => {
    if (mode === 'cancel') event.preventDefault(); else (el as HTMLElement & {open:boolean}).open = false;
   }, { once: true });
  }, mode);
  await trigger(page, 'one').focus(); await tick(page, 1);
  await hover(page, 'two'); await tick(page, 301); await shown(page, 'two');
 });
}

for (const mutation of ['remove', 'rebind', 'regroup'] as const) {
 test(`focused tooltip ${mutation} releases blocked peer hover`, async ({ page }) => {
  await trigger(page, 'one').focus(); await tick(page, 1); await shown(page, 'one');
  await hover(page, 'two'); await tick(page, 400); await shown(page, 'two', false);
  await tip(page, 'one').evaluate((el, mutation) => {
   if (mutation === 'remove') el.remove();
   else el.setAttribute(mutation === 'rebind' ? 'for' : 'warmup-group', mutation === 'rebind' ? 'three' : 'other-tools');
  }, mutation);
  await tick(page, 301); await shown(page, 'two');
 });
}

test('focus ownership is scoped to the resolved group', async ({ page }) => {
 await trigger(page, 'one').focus(); await tick(page, 1); await shown(page, 'one');
 await hover(page, 'other'); await tick(page, 301); await shown(page, 'other'); await shown(page, 'one');
});

test('application veto of pointer dismissal is respected without retry loops', async ({ page }) => {
 await tip(page, 'one').evaluate(el => el.setAttribute('hide-delay', '5000'));
 await warm(page); await leave(page);
 await tip(page, 'one').evaluate(el => {
  (el as any).closes = 0;
  el.addEventListener('en-change', event => {
   if (!(event as CustomEvent).detail.proposed) { (el as any).closes++; event.preventDefault(); }
  });
 });
 await trigger(page, 'two').focus(); await tick(page, 1); await shown(page, 'two'); await shown(page, 'one');
 await tick(page, 1000); await expect(tip(page, 'one')).toHaveJSProperty('closes', 1);
});


test('reentrant focus during a pointer opening prevents competing presentation', async ({ page }) => {
 await tip(page, 'two').evaluate(el => el.addEventListener('en-change', event => {
  if ((event as CustomEvent).detail.proposed) document.getElementById('one')!.focus();
 }, { once: true }));
 await hover(page, 'two'); await tick(page, 301);
 await shown(page, 'one'); await shown(page, 'two', false);
 await expect(trigger(page, 'one')).toBeFocused();
});

test('reentrant hover during a canceled focused dismissal cannot escape priority', async ({ page }) => {
 await trigger(page, 'one').focus(); await tick(page, 1); await shown(page, 'one');
 await tip(page, 'one').evaluate(el => el.addEventListener('en-change', event => {
  if ((event as CustomEvent).detail.proposed) return;
  (document.getElementById('tip-two') as any).show('hover');
  event.preventDefault();
 }, { once: true }));
 await page.keyboard.press('Escape'); await tick(page, 301);
 await shown(page, 'one'); await shown(page, 'two', false);
});


for (const endpoint of ['trigger', 'content'] as const) {
 test(`already displayed help hovered at its ${endpoint} persists when a peer receives focus`, async ({ page }) => {
  await warm(page);
  if (endpoint === 'content') await tip(page, 'one').locator('[popover]').hover();
  await trigger(page, 'two').focus(); await tick(page, 1);
  await shown(page, 'one'); await shown(page, 'two');
  await tick(page, 500); await shown(page, 'one');
  await expect(trigger(page, 'two')).toBeFocused();
  await leave(page); await tick(page, 150); await shown(page, 'one', false);
  await hover(page, 'one'); await tick(page, 500);
  await shown(page, 'one', false); await shown(page, 'two');
 });
}

for (const tag of ['button', 'en-button']) {
	for (const mutation of ['insert', 'reveal', 'replace', 'move']) {
		for (const warmed of [false, true]) {
			test(`${tag} ${mutation} beneath a stationary pointer waits for movement (${warmed ? 'warm' : 'cold'})`, async ({ page }) => {
				await page.evaluate(({ tag, mutation }) => {
					const group = document.querySelector('#tools')!;
					const control = document.createElement(tag);
					control.id = 'stationary'; control.textContent = 'New trigger';
					control.style.cssText = 'position:fixed;left:800px;top:200px;width:140px;height:44px';
					if (mutation === 'reveal') control.style.visibility = 'hidden';
					if (mutation === 'move') control.style.left = '600px';
					if (mutation !== 'insert') group.append(control);
					const tooltip = document.createElement('en-tooltip');
					tooltip.id = 'tip-stationary'; tooltip.setAttribute('for', 'stationary');
					tooltip.setAttribute('warmup-group', 'tools');
					tooltip.innerHTML = '<span slot="content">New help</span>';
					document.body.append(tooltip);
				}, { tag, mutation });
				await tick(page, 1);
				if (warmed) await warm(page);
				await page.mouse.move(850, 220);
				await tick(page, 1);
				// Clear any presentation belonging to the old control before replacement.
				if (mutation === 'replace') await tip(page, 'stationary').evaluate(el => {
					(el as HTMLElement & { open: boolean }).open = false;
				});
				await page.evaluate(({ tag, mutation }) => {
					let control = document.querySelector<HTMLElement>('#stationary');
					if (mutation === 'insert') {
						control = document.createElement(tag);
						control.id = 'stationary'; control.textContent = 'New trigger';
						control.style.cssText = 'position:fixed;left:800px;top:200px;width:140px;height:44px';
						document.querySelector('#tools')!.append(control);
					} else if (mutation === 'replace') control!.replaceWith(control!.cloneNode(true));
					else if (mutation === 'reveal') control!.style.visibility = 'visible';
					else control!.style.left = '800px';
				}, { tag, mutation });
				await tick(page, 350);
				await shown(page, 'stationary', false);
				await page.mouse.move(851, 220);
				await tick(page, 1);
				if (!warmed) {
					await tick(page, 250); await shown(page, 'stationary', false);
					await tick(page, 50);
				}
				await shown(page, 'stationary');
			});
		}
	}
}

test('entry alone does not establish interest and movement does not restart the delay', async ({ page }) => {
	await trigger(page, 'one').dispatchEvent('pointerenter', { pointerType: 'mouse', clientX: 50, clientY: 50 });
	await tick(page, 400); await shown(page, 'one', false);
	await trigger(page, 'one').dispatchEvent('pointermove', { pointerType: 'touch', clientX: 51, clientY: 50 });
	await tick(page, 400); await shown(page, 'one', false);
	await hover(page, 'one'); await tick(page, 200);
	const bounds = await trigger(page, 'one').boundingBox();
	await page.mouse.move(bounds!.x + bounds!.width / 2 + 1, bounds!.y + bounds!.height / 2);
	await tick(page, 100); await shown(page, 'one');
});
