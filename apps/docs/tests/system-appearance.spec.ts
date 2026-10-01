import {expect, test, type Page} from '@playwright/test';

const paint = (page: Page) => page.locator('body').evaluate(body => ({
	background: getComputedStyle(body).backgroundColor, color: getComputedStyle(body).color,
}));
const appearance = (page: Page, name: string) => page.locator('.theme-controls').getByRole('radio', {name, exact:true});

async function workflowReady(page: Page) {
	const app = page.locator('en-workflows-app');
	await expect(app).not.toHaveAttribute('data-ssr');
	await app.evaluate(async element => { await (element as HTMLElement & {updateComplete: Promise<unknown>}).updateComplete; });
}

test('all default page surfaces follow appearance before JavaScript', async ({browser, baseURL}) => {
	const context = await browser.newContext({baseURL, javaScriptEnabled:false, colorScheme:'dark'});
	try {
		const page = await context.newPage();
		for (const path of ['/', '/workflows', '/workflows/settings', '/workflows/chat', '/workflows/selection', '/api-reference', '/theme-review', '/api-examples/text-fields.html']) {
			await page.emulateMedia({colorScheme:'dark'});
			await page.goto(path);
			await expect(page.locator('html')).toHaveCSS('color-scheme','light dark');
			const dark = await paint(page);
			await page.emulateMedia({colorScheme:'light'});
			await expect.poll(() => paint(page), `${path} changes its rendered palette without JavaScript`).not.toEqual(dark);
			await expect(page.locator('html')).toHaveCSS('color-scheme','light dark');
		}
	} finally { await context.close(); }
});

test('sticker sheet Auto follows the system without replacing focused controls, and explicit appearance wins', async ({page}) => {
	const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
	await page.emulateMedia({colorScheme:'dark'});
	await page.goto('/');
	await expect(page.locator('en-sticker-app')).not.toHaveAttribute('data-ssr');
	await expect(appearance(page,'Auto')).toBeChecked();
	await expect(page.locator('html')).toHaveCSS('color-scheme','light dark');
	const dark = await paint(page);
	const inverse = page.locator('[data-en-theme="inverse"]').first();
	await expect(inverse).toHaveCSS('color-scheme','light');
	const input = page.locator('[data-specimen="text-fields"]').getByRole('textbox',{name:'Project name',exact:true});
	await input.fill('A retained draft');
	const original = await input.elementHandle();
	await input.evaluate(input => (input as HTMLInputElement).setSelectionRange(2,8,'backward'));
	await page.emulateMedia({colorScheme:'light'});
	await expect.poll(() => paint(page)).not.toEqual(dark);
	const light = await paint(page);
	await expect(inverse).toHaveCSS('color-scheme','dark');
	await expect(input).toHaveValue('A retained draft');
	await expect(input).toBeFocused();
	expect(await input.evaluate((input, previous) => ({same:input === previous, selection:[(input as HTMLInputElement).selectionStart,(input as HTMLInputElement).selectionEnd]}),original)).toEqual({same:true,selection:[2,8]});
	await page.locator('.theme-controls en-segmented-control').getByText('Dark',{exact:true}).click();
	await expect(page.locator('html')).toHaveCSS('color-scheme','dark');
	await expect(inverse).toHaveCSS('color-scheme','light');
	await expect.poll(() => paint(page)).toEqual(dark);
	await page.emulateMedia({colorScheme:'dark'});
	await page.emulateMedia({colorScheme:'light'});
	await expect.poll(() => paint(page)).toEqual(dark);
	await page.getByRole('button',{name:'Reset preview',exact:true}).click();
	await expect(appearance(page,'Auto')).toBeChecked();
	await expect.poll(() => paint(page)).toEqual(light);
	await expect(input).toHaveValue('A retained draft');
	expect(await input.evaluate((input,previous) => input === previous,original)).toBe(true);
	expect(errors).toEqual([]);
});

test('workflow navigation preserves explicit appearance and removes the Auto pin', async ({page}) => {
	await page.emulateMedia({colorScheme:'dark'});
	await page.goto('/workflows?progress-report');
	await workflowReady(page);
	await expect(appearance(page,'Auto')).toBeChecked();
	const sections = page.locator('en-navigation.section-nav');
	await page.locator('.theme-controls en-segmented-control').getByText('Light',{exact:true}).click();
	await expect(page.locator('html')).toHaveCSS('color-scheme','light');
	await sections.getByRole('link',{name:'Settings',exact:true}).click();
	await workflowReady(page);
	await expect(appearance(page,'Light')).toBeChecked();
	expect(new URL(page.url()).searchParams.get('theme')).toBe('light');
	expect(new URL(page.url()).searchParams.has('progress-report')).toBe(true);
	await page.locator('.theme-controls en-segmented-control').getByText('Auto',{exact:true}).click();
	await sections.getByRole('link',{name:'Chat',exact:true}).click();
	await workflowReady(page);
	await expect(appearance(page,'Auto')).toBeChecked();
	await expect(page.locator('html')).toHaveCSS('color-scheme','light dark');
	expect(new URL(page.url()).searchParams.has('theme')).toBe(false);
	const dark = await paint(page);
	await page.emulateMedia({colorScheme:'light'});
	await expect.poll(() => paint(page)).not.toEqual(dark);
});

test('explicit workflow appearance reaches native content despite the syntax highlighter OS scheme', async ({ page }) => {
	await page.emulateMedia({ colorScheme: 'light' });
	await page.goto('/workflows/assets?progress-report');
	const app = page.locator('en-workflows-app');
	await expect(app).not.toHaveAttribute('data-ssr');
	const choice = app.getByRole('radio', { name: 'Campaign brief', exact: true });
	await choice.focus(); await choice.press('Space'); await expect(choice).toBeChecked();
	const original = await choice.elementHandle();
	const theme = page.locator('.theme-controls en-segmented-control[label="Theme"]');
	for (const scenario of [
		{ system: 'light', label: 'Dark', mode: 'dark', syntax: 'night-owl' },
		{ system: 'dark', label: 'Light', mode: 'light', syntax: 'github' },
	] as const) {
		await page.emulateMedia({ colorScheme: scenario.system });
		await theme.getByText(scenario.label, { exact: true }).click();
		await expect(theme.getByRole('radio', { name: scenario.label, exact: true })).toBeChecked();
		await expect(page.locator('html')).toHaveCSS('color-scheme', scenario.mode);
		await expect(app).toHaveAttribute('data-syntax-theme', scenario.syntax);
		// The highlighter has an unlayered light/dark declaration. The workflow
		// boundary must inherit the explicit page choice, including native fields.
		await expect(app).toHaveCSS('color-scheme', scenario.mode);
		await expect(app.getByRole('searchbox', { name: 'Find assets', exact: true })).toHaveCSS('color-scheme', scenario.mode);
		const paint = await app.locator('.wordmark').evaluate(wordmark => {
			const doc = wordmark.ownerDocument;
			const canvas = doc.createElement('canvas'); canvas.width = canvas.height = 1;
			const context = canvas.getContext('2d')!;
			const rgba = (color: string) => {
				context.clearRect(0, 0, 1, 1); context.fillStyle = color; context.fillRect(0, 0, 1, 1);
				return [...context.getImageData(0, 0, 1, 1).data];
			};
			// Resolve light-dark() in the page's actual root scheme before asking
			// canvas to normalize the concrete color. Detached canvas is not a CSS scope.
			const probe = doc.createElement('span');
			probe.style.cssText = 'position:fixed;visibility:hidden;color:var(--en-color-brand)';
			doc.documentElement.append(probe);
			try {
				return {
					brand: rgba(getComputedStyle(probe).color),
					text: rgba(getComputedStyle(wordmark.querySelector('span:last-child')!).color),
					mark: rgba(getComputedStyle(wordmark.querySelector('.mark')!).backgroundColor),
				};
			} finally { probe.remove(); }
		});
		expect(paint.text).toEqual(paint.brand); expect(paint.mark).toEqual(paint.brand);
		await expect(choice).toBeChecked();
		expect(await choice.evaluate((node, previous) => node === previous, original)).toBe(true);
	}
	await original?.dispose();
});
