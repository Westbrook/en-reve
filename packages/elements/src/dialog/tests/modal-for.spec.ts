import { test, expect, type Page } from '@playwright/test';

const kinds = ['dialog', 'drawer', 'command-palette'] as const;

async function fixture(page: Page, kind: string, button = 'button') {
	await page.goto('/');
	await page.waitForFunction(() => (window as any).overlaysReady);
	await page.evaluate(({ kind, button }) => {
		const fixture = document.createElement('section');
		fixture.id = 'modal-for-fixture';
		fixture.innerHTML = `<button id="outside-focus">Outside focus</button><form id="opener-form"><${button} id="modal-opener" type="submit">Open associated modal</${button}></form><en-${kind} id="associated-modal" for="modal-opener" label="Associated modal"><input aria-label="Modal editor"></en-${kind}>`;
		document.body.prepend(fixture);
		(window as any).modalSubmits = 0;
		fixture.querySelector('form')!.addEventListener('submit', event => { event.preventDefault(); (window as any).modalSubmits++; });
		(window as any).overlayEvents = [];
	}, { kind, button });
	await expect(page.locator('#modal-opener')).toHaveAttribute('aria-haspopup', 'dialog');
}

for (const kind of kinds) {
	for (const button of ['button', 'en-button']) {
		test(`${kind} for ${button}: mouse, Enter and Space open once, suppress submit, and restore the opener`, async ({ page }) => {
			await fixture(page, kind, button);
			const host = page.locator('#associated-modal');
			const opener = page.getByRole('button', { name: 'Open associated modal', exact: true });
			const surface = host.getByRole('dialog');
			for (const activation of ['pointer', 'Enter', 'Space']) {
				await page.locator('#outside-focus').focus();
				await page.evaluate(() => { (window as any).overlayEvents = []; });
				if (activation === 'pointer') await opener.click();
				else { await opener.focus(); await opener.press(activation); }
				await expect(surface).toBeVisible();
				await expect(opener).toHaveAttribute('aria-expanded', 'true');
				expect(await page.evaluate(() => (window as any).modalSubmits)).toBe(0);
				expect(await page.evaluate(() => (window as any).overlayEvents)).toEqual([
					expect.objectContaining({ target: 'associated-modal', reason: 'trigger', previous: false, proposed: true, open: true, cancelable: true }),
				]);
				await page.keyboard.press('Escape');
				await expect(surface).not.toBeVisible();
				await expect(opener).toBeFocused();
				await expect(opener).toHaveAttribute('aria-expanded', 'false');
			}
		});
	}

	test(`${kind}: cancellation rolls back while authoritative writes win`, async ({ page }) => {
		await fixture(page, kind);
		const host = page.locator('#associated-modal');
		const opener = page.locator('#modal-opener');
		await page.evaluate(() => { (window as any).cancelOverlayChanges = true; });
		await opener.click();
		await expect(host).toHaveJSProperty('open', false);
		await expect(host.getByRole('dialog')).not.toBeVisible();
		await expect(opener).toHaveAttribute('aria-expanded', 'false');
		expect(await page.evaluate(() => (window as any).modalSubmits)).toBe(0);
		expect(await page.evaluate(() => (window as any).overlayEvents)).toEqual([
			expect.objectContaining({ reason: 'trigger', proposed: true, open: true }),
		]);
		await host.evaluate((element: any) => {
			element.addEventListener('en-change', (event: any) => { if (event.detail.proposed) { event.preventDefault(); element.open = true; } }, { once: true });
		});
		await opener.click();
		await expect(host.getByRole('dialog')).toBeVisible();
		await expect(opener).toHaveAttribute('aria-expanded', 'true');
	});

	test(`${kind}: programmatic opening keeps its actual invoking focus and silent state writes remain silent`, async ({ page }) => {
		await fixture(page, kind);
		const host = page.locator('#associated-modal');
		const outside = page.locator('#outside-focus');
		await outside.focus();
		await host.evaluate((element: any) => element.show());
		await expect(host.getByRole('dialog')).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(outside).toBeFocused();
		await page.evaluate(() => { (window as any).overlayEvents = []; });
		await host.evaluate((element: any) => { element.open = true; });
		await expect(host.getByRole('dialog')).toBeVisible();
		await expect(page.locator('#modal-opener')).toHaveAttribute('aria-expanded', 'true');
		expect(await page.evaluate(() => (window as any).overlayEvents)).toEqual([]);
	});

	test(`${kind}: disabled and loading custom triggers and fieldset-disabled native triggers do not open`, async ({ page }) => {
		await fixture(page, kind, 'en-button');
		const host = page.locator('#associated-modal');
		for (const property of ['disabled', 'loading']) {
			await page.locator('#modal-opener').evaluate((element: any, property) => { element[property] = true; element.click(); }, property);
			await expect(host).toHaveJSProperty('open', false);
			await page.locator('#modal-opener').evaluate((element: any, property) => { element[property] = false; }, property);
		}
		await page.locator('#modal-opener').evaluate(element => { element.outerHTML = '<fieldset disabled><button id="modal-opener" type="button">Disabled native</button></fieldset>'; });
		await expect(page.locator('#modal-opener')).toHaveAttribute('aria-haspopup', 'dialog');
		await page.locator('#modal-opener').evaluate(element => element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
		await expect(host).toHaveJSProperty('open', false);
		expect(await page.evaluate(() => (window as any).overlayEvents)).toEqual([]);
	});

	test(`${kind}: ID/property changes, late replacement and teardown release the previous binding`, async ({ page }) => {
		await fixture(page, kind);
		const host = page.locator('#associated-modal');
		await host.evaluate((element: any) => { element.for = 'late-opener'; });
		await expect(page.locator('#modal-opener')).not.toHaveAttribute('aria-haspopup');
		await page.locator('#modal-opener').click();
		await expect(host).toHaveJSProperty('open', false);
		await page.evaluate(() => {
			const late = document.createElement('button'); late.id = 'late-opener'; late.textContent = 'Late opener';
			document.querySelector('#modal-for-fixture')!.prepend(late);
		});
		await expect(page.locator('#late-opener')).toHaveAttribute('aria-haspopup', 'dialog');
		await page.locator('#late-opener').click();
		await expect(host.getByRole('dialog')).toBeVisible();
		await page.keyboard.press('Escape');
		await page.locator('#late-opener').evaluate(element => {
			(window as any).retiredModalOpener = element;
			const replacement = element.cloneNode(true) as HTMLElement;
			replacement.removeAttribute('aria-haspopup'); replacement.removeAttribute('aria-expanded');
			element.replaceWith(replacement);
		});
		await expect(page.locator('#late-opener')).toHaveAttribute('aria-haspopup', 'dialog');
		await expect.poll(() => page.evaluate(() => (window as any).retiredModalOpener.hasAttribute('aria-haspopup'))).toBe(false);
		await page.evaluate(() => (window as any).retiredModalOpener.click());
		await expect(host).toHaveJSProperty('open', false);
		await host.evaluate(element => element.remove());
		await expect(page.locator('#late-opener')).not.toHaveAttribute('aria-haspopup');
		await expect(page.locator('#late-opener')).not.toHaveAttribute('aria-expanded');
	});
}

test('dialog for: same-root lookup and root migration never bind a document-level decoy', async ({ page }) => {
	await fixture(page, 'dialog');
	await page.evaluate(() => {
		for (const name of ['a', 'b']) {
			const container = document.createElement('section'); container.id = `modal-root-${name}`;
			container.attachShadow({ mode: 'open' }).innerHTML = `<button id="modal-opener">Scope ${name}</button>`;
			document.body.prepend(container);
		}
		document.querySelector('#modal-root-a')!.shadowRoot!.append(document.querySelector('#associated-modal')!);
	});
	const a = page.locator('#modal-root-a'); const b = page.locator('#modal-root-b');
	await expect(a.getByRole('button', { name: 'Scope a' })).toHaveAttribute('aria-haspopup', 'dialog');
	await expect(page.locator('#opener-form #modal-opener')).not.toHaveAttribute('aria-haspopup');
	await a.getByRole('button', { name: 'Scope a' }).click();
	await expect(a.getByRole('dialog')).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(a.getByRole('button', { name: 'Scope a' })).toBeFocused();
	await page.evaluate(() => document.querySelector('#modal-root-b')!.shadowRoot!.append(document.querySelector('#modal-root-a')!.shadowRoot!.querySelector('#associated-modal')!));
	await expect(a.getByRole('button', { name: 'Scope a' })).not.toHaveAttribute('aria-haspopup');
	await expect(b.getByRole('button', { name: 'Scope b' })).toHaveAttribute('aria-haspopup', 'dialog');
	await b.getByRole('button', { name: 'Scope b' }).press('Enter');
	await expect(b.getByRole('dialog')).toBeVisible();
});

test('dialog for: authored ARIA is restored on detach and consumer changes are preserved', async ({ page }) => {
	await fixture(page, 'dialog');
	await page.locator('#associated-modal').evaluate((element: any) => { element.for = ''; });
	const opener = page.locator('#modal-opener');
	await expect(opener).not.toHaveAttribute('aria-haspopup');
	await opener.evaluate(element => { element.setAttribute('aria-haspopup', 'menu'); element.setAttribute('aria-expanded', 'true'); element.setAttribute('aria-controls', 'author-panel'); });
	await page.locator('#associated-modal').evaluate(element => element.setAttribute('for', 'modal-opener'));
	await expect(opener).toHaveAttribute('aria-haspopup', 'dialog');
	await expect(opener).toHaveAttribute('aria-expanded', 'false');
	await expect(opener).toHaveAttribute('aria-controls', 'author-panel');
	await page.locator('#associated-modal').evaluate(element => element.removeAttribute('for'));
	await expect(opener).toHaveAttribute('aria-haspopup', 'menu');
	await expect(opener).toHaveAttribute('aria-expanded', 'true');
	await page.locator('#associated-modal').evaluate(element => element.setAttribute('for', 'modal-opener'));
	await expect(opener).toHaveAttribute('aria-haspopup', 'dialog');
	await opener.evaluate(element => { element.setAttribute('aria-haspopup', 'tree'); });
	await page.locator('#associated-modal').evaluate(element => element.remove());
	await expect(opener).toHaveAttribute('aria-haspopup', 'tree');
});

for (const kind of kinds) {
	test(`${kind}: a canceled click does not activate and pointer opening restores an opener that never received focus`, async ({ page }) => {
		await fixture(page, kind);
		const host = page.locator('#associated-modal');
		const opener = page.locator('#modal-opener');
		await host.evaluate((element: any) => { element.for = ''; });
		await expect(opener).not.toHaveAttribute('aria-haspopup');
		await opener.evaluate(element => {
			element.addEventListener('click', event => event.preventDefault(), { once: true });
			element.addEventListener('mousedown', event => event.preventDefault());
		});
		await host.evaluate((element: any) => { element.for = 'modal-opener'; });
		await expect(opener).toHaveAttribute('aria-haspopup', 'dialog');
		await page.locator('#outside-focus').focus();
		await opener.click();
		await expect(host).toHaveJSProperty('open', false);
		await expect(page.locator('#outside-focus')).toBeFocused();
		expect(await page.evaluate(() => (window as any).overlayEvents)).toEqual([]);
		await opener.click();
		await expect(host.getByRole('dialog')).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(opener).toBeFocused();
	});
}

test('repeated associated activation preserves dialog/drawer opening and the existing palette toggle contract', async ({ page }) => {
	for (const kind of kinds) {
		await fixture(page, kind);
		const host = page.locator('#associated-modal');
		await page.locator('#modal-opener').click();
		await expect(host).toHaveJSProperty('open', true);
		// A modal makes its outside opener inert to real input. Synthetic activation
		// checks the established imperative behavior without pretending it is reachable.
		await page.locator('#modal-opener').evaluate((element: HTMLElement) => element.click());
		await expect(host).toHaveJSProperty('open', kind !== 'command-palette');
		expect(await page.evaluate(() => (window as any).overlayEvents.filter((event: any) => event.reason === 'trigger').length)).toBe(kind === 'command-palette' ? 2 : 1);
	}
});

for (const kind of kinds) {
	test(`${kind}: native terminal close restores the clicked opener without stealing author-set focus`, async ({ page }) => {
		await fixture(page, kind);
		const host = page.locator('#associated-modal');
		const opener = page.locator('#modal-opener');
		const outside = page.locator('#outside-focus');
		await opener.evaluate(element => element.addEventListener('mousedown', event => event.preventDefault()));
		await outside.focus();
		await opener.click();
		await expect(host.getByRole('dialog')).toBeVisible();
		await host.evaluate(element => element.shadowRoot!.querySelector('dialog')!.close());
		await expect(host).toHaveJSProperty('open', false);
		await expect(opener).toBeFocused();
		await opener.click();
		await expect(host.getByRole('dialog')).toBeVisible();
		await host.evaluate(element => {
			element.shadowRoot!.querySelector('dialog')!.close();
			document.getElementById('open-dialog')!.focus();
		});
		await expect(host).toHaveJSProperty('open', false);
		await expect(page.locator('#open-dialog')).toBeFocused();
	});
}
