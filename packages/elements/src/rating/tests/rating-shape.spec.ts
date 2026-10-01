import { expect, test, type Page } from '@playwright/test';

type Rating = HTMLElement & { value: number; updateComplete: Promise<unknown> };

async function mount(page: Page, size = '', direction = 'ltr') {
	await page.goto('/packages/elements/src/rating/tests/fixture.html');
	await page.evaluate(async ({ size, direction }) => {
		await customElements.whenDefined('en-rating');
		const fixture = document.querySelector('#fixture')!;
		fixture.setAttribute('dir', direction);
		fixture.innerHTML = '<form><button type="button" id="before">Before</button><en-rating id="rating" name="study" label="Study rating" value="2"></en-rating><button type="button" id="after">After</button></form>';
		const rating = document.querySelector('#rating') as Rating;
		if (size) rating.setAttribute('size', size);
		await rating.updateComplete;
	}, { size, direction });
	await expect(page.getByRole('radio', { name: '2 of 5 stars', exact: true })).toBeChecked();
}

async function geometry(page: Page) {
	return page.locator('#rating [part~="star-option"]').evaluateAll(elements => elements.map(element => {
		const box = element.getBoundingClientRect();
		const style = getComputedStyle(element);
		return { width: box.width, height: box.height, left: box.left, right: box.right, top: box.top,
			radius: style.borderTopLeftRadius, outline: parseFloat(style.outlineWidth), outlineStyle: style.outlineStyle };
	}));
}

for (const size of ['small', '', 'medium', 'large']) {
	test(`${size || 'omitted medium'} stars are square and preserve pointer target floors`, async ({ page }) => {
		await mount(page, size);
		const coarse = await page.evaluate(() => matchMedia('(pointer: coarse)').matches);
		const boxes = await geometry(page);
		expect(boxes).toHaveLength(5);
		for (const box of boxes) {
			expect(Math.abs(box.width - box.height)).toBeLessThan(0.6);
			expect(box.width).toBeGreaterThanOrEqual(coarse ? 44 : 24);
		}
		await expect(page.getByRole('group', { name: 'Study rating' })).toBeVisible();
	});
}

test('scoped radius customizations shape only positive targets and retain visible focus', async ({ page }) => {
	await mount(page);
	const clear = page.locator('#rating [part~="clear-option"]');
	const before = await clear.evaluate(element => {
		const box = element.getBoundingClientRect();
		return { width: box.width, height: box.height, radius: getComputedStyle(element).borderTopLeftRadius };
	});
	for (const radius of ['0px', '6px', '50%', '9999px']) {
		await page.locator('#rating').evaluate((element, radius) => (element as HTMLElement).style.setProperty('--en-rating-star-radius', radius), radius);
		await page.getByRole('radio', { name: '3 of 5 stars', exact: true }).focus();
		const boxes = await geometry(page);
		for (const box of boxes) {
			expect(box.radius).toBe(radius);
			expect(Math.abs(box.width - box.height)).toBeLessThan(0.6);
		}
		expect(boxes[2].outline).toBeGreaterThan(0);
		expect(boxes[2].outlineStyle).not.toBe('none');
		expect(await clear.evaluate(element => {
			const box = element.getBoundingClientRect();
			return { width: box.width, height: box.height, radius: getComputedStyle(element).borderTopLeftRadius };
		})).toEqual(before);
	}
	await page.addStyleTag({ content: 'en-rating::part(star-option) { border-radius: 2px; }' });
	expect((await geometry(page)).every(box => box.radius === '2px')).toBe(true);
	expect(await clear.getAttribute('part')).not.toContain('star-option');
});

test('keyboard score changes and clear remain native, with cancelable changes exposing tentative value', async ({ page, browserName }) => {
	await mount(page);
	await page.locator('#before').focus();
	await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
	await expect(page.getByRole('radio', { name: '2 of 5 stars', exact: true })).toBeFocused();
	await page.keyboard.press('ArrowRight');
	await expect(page.getByRole('radio', { name: '3 of 5 stars', exact: true })).toBeChecked();
	await page.locator('#rating').evaluate(element => {
		element.addEventListener('en-change', event => {
			(element as HTMLElement).dataset.observedValue = String((element as Rating).value);
			(element as HTMLElement).dataset.observedFormValue = String(new FormData(document.querySelector('form')!).get('study'));
			(element as HTMLElement).dataset.eventCancelable = String(event.cancelable);
			event.preventDefault();
		}, { once: true });
	});
	await page.keyboard.press('ArrowRight');
	await expect(page.locator('#rating')).toHaveAttribute('data-observed-value', '4');
	await expect(page.locator('#rating')).toHaveAttribute('data-observed-form-value', '4');
	await expect(page.locator('#rating')).toHaveAttribute('data-event-cancelable', 'true');
	await expect(page.getByRole('radio', { name: '3 of 5 stars', exact: true })).toBeChecked();
	expect(await page.locator('#rating').evaluate(element => (element as Rating).value)).toBe(3);
	await page.locator('#rating [part~="clear-option"]').click();
	await expect(page.getByRole('radio', { name: 'No rating', exact: true })).toBeChecked();
	expect(await page.locator('#rating').evaluate(element => (element as Rating).value)).toBe(0);
});

test('narrow RTL layouts wrap whole square targets inside their available width', async ({ page }) => {
	await mount(page, 'large', 'rtl');
	await page.locator('#fixture').evaluate(element => (element as HTMLElement).style.inlineSize = '250px');
	await page.locator('#rating').evaluate(element => (element as HTMLElement).style.setProperty('--en-rating-star-radius', '50%'));
	const hostBox = (await page.locator('#rating').boundingBox())!;
	const boxes = await geometry(page);
	for (const box of boxes) {
		expect(Math.abs(box.width - box.height)).toBeLessThan(0.6);
		expect(box.left).toBeGreaterThanOrEqual(hostBox.x - 0.6);
		expect(box.right).toBeLessThanOrEqual(hostBox.x + hostBox.width + 0.6);
	}
	expect(boxes[0].left).toBeGreaterThan(boxes[1].left);
	// Keep the browser's native RTL radio behavior; engines differ on horizontal arrows.
	await page.evaluate(() => {
		const baseline = document.createElement('div');
		baseline.dir = 'rtl'; baseline.id = 'native-baseline';
		for (let value = 0; value <= 5; value++) {
			const radio = document.createElement('input');
			radio.type = 'radio'; radio.name = 'native-rating'; radio.value = String(value); radio.checked = value === 2;
			baseline.append(radio);
		}
		document.body.append(baseline);
	});
	await page.locator('#native-baseline input[value="2"]').focus();
	await page.keyboard.press('ArrowLeft');
	const nativeValue = await page.locator('#native-baseline input:checked').inputValue();
	await page.getByRole('radio', { name: '2 of 5 stars', exact: true }).focus();
	await page.keyboard.press('ArrowLeft');
	await expect(page.locator(`#rating input[value="${nativeValue}"]`)).toBeChecked();
});

test('forced colors preserve a visible circular focus outline', async ({ page }) => {
	await page.emulateMedia({ forcedColors: 'active' });
	await mount(page);
	await page.locator('#rating').evaluate(element => (element as HTMLElement).style.setProperty('--en-rating-star-radius', '50%'));
	await page.getByRole('radio', { name: '2 of 5 stars', exact: true }).focus();
	const box = (await geometry(page))[1];
	expect(box.radius).toBe('50%');
	expect(Math.abs(box.width - box.height)).toBeLessThan(0.6);
	expect(box.outline).toBeGreaterThan(0);
	expect(box.outlineStyle).not.toBe('none');
});
