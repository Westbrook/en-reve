import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const fixture = (page: Page) => page.locator('#menu-expansion-fixture');
const item = (page: Page, id: string) => fixture(page).locator(`#${id}`);
const control = (page: Page, id: string) => item(page, id).locator('button');
const rootMenu = (page: Page) => item(page, 'expanded-menu');
const childMenu = (page: Page) => item(page, 'export-menu');
const rootTrigger = (page: Page) => fixture(page).getByRole('button', { name: 'Open study actions', exact: true });

async function mount(page: Page, direction: 'ltr' | 'rtl' = 'ltr') {
	await page.goto('/api-examples/command-surfaces.html');
	await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
	await expect.poll(() => page.evaluate(() => ['en-menu', 'en-menu-item'].every(tag => customElements.get(tag)))).toBe(true);
	await page.evaluate(dir => {
		const scene = document.createElement('section');
		scene.id = 'menu-expansion-fixture';
		scene.dir = dir;
		scene.setAttribute('aria-label', 'Expanded menu consumption');
		scene.style.cssText = 'padding:32px;min-height:600px;';
		scene.innerHTML = `
			<button id="expanded-trigger">Open study actions</button>
			<button id="after-expanded-trigger">Continue study</button>
			<en-menu id="expanded-menu" for="expanded-trigger" label="Study actions">
				<en-menu-item id="grid-choice" type="checkbox">Show grid</en-menu-item>
				<en-menu-item id="small-choice" type="radio" name="density" checked>Small previews</en-menu-item>
				<en-menu-item id="large-choice" type="radio" name="density">Large previews</en-menu-item>
				<en-menu-item id="disabled-choice" type="checkbox" disabled>Locked setting</en-menu-item>
				<en-menu-item id="export-trigger">Export options</en-menu-item>
				<en-menu id="export-menu" for="export-trigger" label="Export options">
					<en-menu-item id="include-notes" type="checkbox">Include notes</en-menu-item>
					<en-menu-item id="child-density" type="radio" name="density" checked>Child preview density</en-menu-item>
					<en-menu-item id="format-trigger">Choose format</en-menu-item>
					<en-menu id="format-menu" for="format-trigger" label="Formats">
						<en-menu-item id="png-command" action="export-png">Export PNG</en-menu-item>
					</en-menu>
				</en-menu>
				<en-menu-item id="save-command" action="save">Save study</en-menu-item>
			</en-menu>`;
		document.body.prepend(scene);
	}, direction);
	await expect(rootTrigger(page)).toBeVisible();
	await rootTrigger(page).click();
	await expect(rootMenu(page)).toHaveJSProperty('open', true);
	await expect(control(page, 'grid-choice')).toBeFocused();
}

const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page, browser }, info) => {
	const messages: string[] = [];
	errors.set(page, messages);
	page.on('pageerror', error => messages.push(error.message));
	info.annotations.push({ type: 'browser-version', description: browser.version() });
});
test.afterEach(async ({ page }) => { expect(errors.get(page), 'No runtime errors during menu composition').toEqual([]); });

test('checkable menu rows expose their checked state and a single tentative cancelable event', async ({ page }) => {
	await mount(page);
	const grid = item(page, 'grid-choice');
	await expect(grid.getByRole('menuitemcheckbox', { name: 'Show grid', exact: true })).toHaveAttribute('aria-checked', 'false');
	await grid.evaluate(node => {
		(window as any).menuChangeEvents = [];
		(window as any).menuActionEvents = [];
		node.addEventListener('en-change', event => {
			(window as any).menuChangeEvents.push({ checked: (node as any).checked, cancelable: event.cancelable, detail: (event as CustomEvent).detail });
		});
		node.addEventListener('en-action', event => (window as any).menuActionEvents.push((event as CustomEvent).detail));
	});
	await control(page, 'grid-choice').press('Space');
	await expect(grid).toHaveJSProperty('checked', true);
	await expect(grid.getByRole('menuitemcheckbox')).toHaveAttribute('aria-checked', 'true');
	await expect(rootMenu(page)).toHaveJSProperty('open', true);
	await expect(control(page, 'grid-choice')).toBeFocused();
	expect(await page.evaluate(() => (window as any).menuChangeEvents)).toEqual([{ checked: true, cancelable: true, detail: expect.objectContaining({ previous: false, proposed: true }) }]);
	expect(await page.evaluate(() => (window as any).menuActionEvents)).toEqual([]);
});

test('cancellation restores a checkbox while a synchronous author assignment wins', async ({ page }) => {
	await mount(page);
	const grid = item(page, 'grid-choice');
	await grid.evaluate(node => node.addEventListener('en-change', event => event.preventDefault(), { once: true }));
	await control(page, 'grid-choice').click();
	await expect(grid).toHaveJSProperty('checked', false);
	await expect(grid.getByRole('menuitemcheckbox')).toHaveAttribute('aria-checked', 'false');
	await grid.evaluate(node => node.addEventListener('en-change', event => {
		event.preventDefault();
		(node as HTMLElement & { checked: boolean }).checked = true;
	}, { once: true }));
	await control(page, 'grid-choice').press('Enter');
	await expect(grid).toHaveJSProperty('checked', true);
	await expect(rootMenu(page)).toHaveJSProperty('open', true);
});

test('radio commits update only their owning menu group and canceled proposals preserve peers', async ({ page }) => {
	await mount(page);
	const large = item(page, 'large-choice');
	await expect(item(page, 'small-choice').getByRole('menuitemradio')).toHaveAttribute('aria-checked', 'true');
	await large.evaluate(node => node.addEventListener('en-change', event => {
		(window as any).tentativeRadioGroup = {
			proposed: (node as any).checked,
			previous: (document.getElementById('small-choice') as any).checked,
			child: (document.getElementById('child-density') as any).checked,
		};
		event.preventDefault();
	}, { once: true }));
	await control(page, 'large-choice').click();
	expect(await page.evaluate(() => (window as any).tentativeRadioGroup)).toEqual({ proposed: true, previous: false, child: true });
	await expect(large).toHaveJSProperty('checked', false);
	await expect(item(page, 'small-choice')).toHaveJSProperty('checked', true);
	await control(page, 'large-choice').click();
	await expect(large).toHaveJSProperty('checked', true);
	await expect(item(page, 'small-choice')).toHaveJSProperty('checked', false);
	await expect(item(page, 'child-density')).toHaveJSProperty('checked', true);
	await expect(rootMenu(page)).toHaveJSProperty('open', true);
});

test('author radio selections supersede a canceled proposal without restoring stale peer state', async ({ page }) => {
	await mount(page);
	await rootMenu(page).evaluate(menu => menu.insertAdjacentHTML('beforeend', '<en-menu-item id="automatic-choice" type="radio" name="density">Automatic previews</en-menu-item>'));
	const large = item(page, 'large-choice');
	await expect(item(page, 'automatic-choice').getByRole('menuitemradio')).toBeVisible();
	await large.evaluate(node => node.addEventListener('en-change', event => {
		event.preventDefault();
		(document.getElementById('automatic-choice') as HTMLElement & { checked: boolean }).checked = true;
	}, { once: true }));
	await control(page, 'large-choice').click();
	await expect(item(page, 'automatic-choice')).toHaveJSProperty('checked', true);
	await expect(item(page, 'small-choice')).toHaveJSProperty('checked', false);
	await expect(large).toHaveJSProperty('checked', false);
	// Writing the already-staged proposal is still an authoritative assignment.
	await large.evaluate(node => node.addEventListener('en-change', event => {
		event.preventDefault();
		(node as HTMLElement & { checked: boolean }).checked = true;
	}, { once: true }));
	await control(page, 'large-choice').click();
	await expect(large).toHaveJSProperty('checked', true);
	await expect(item(page, 'automatic-choice')).toHaveJSProperty('checked', false);
	await expect(item(page, 'small-choice')).toHaveJSProperty('checked', false);
	await expect(item(page, 'child-density')).toHaveJSProperty('checked', true);
	await expect(rootMenu(page)).toHaveJSProperty('open', true);
	// A nested accepted user transaction also supersedes the outer proposal.
	await item(page, 'small-choice').evaluate(node => { (node as HTMLElement & { checked: boolean }).checked = true; });
	await large.evaluate(node => node.addEventListener('en-change', event => {
		document.getElementById('automatic-choice')?.shadowRoot?.querySelector<HTMLButtonElement>('button')?.click();
		event.preventDefault();
	}, { once: true }));
	await control(page, 'large-choice').click();
	await expect(item(page, 'automatic-choice')).toHaveJSProperty('checked', true);
	await expect(item(page, 'small-choice')).toHaveJSProperty('checked', false);
	await expect(large).toHaveJSProperty('checked', false);
	await expect(rootMenu(page)).toHaveJSProperty('open', true);
});

test('pasted and removed menu items participate in grouping and live arrow navigation', async ({ page }) => {
	await mount(page);
	await rootMenu(page).evaluate(menu => menu.insertAdjacentHTML('beforeend', '<en-menu-item id="dynamic-density" type="radio" name="density">Detailed previews</en-menu-item>'));
	const added = control(page, 'dynamic-density');
	await control(page, 'grid-choice').press('End');
	await expect(added).toBeFocused();
	await added.press('Enter');
	await expect(item(page, 'dynamic-density')).toHaveJSProperty('checked', true);
	await expect(item(page, 'small-choice')).toHaveJSProperty('checked', false);
	await item(page, 'dynamic-density').evaluate(node => node.remove());
	await expect(control(page, 'save-command')).toBeFocused();
	await control(page, 'save-command').press('Home');
	await expect(control(page, 'grid-choice')).toBeFocused();
	await control(page, 'grid-choice').press('ArrowDown');
	await expect(control(page, 'small-choice')).toBeFocused();
});

test('moving a command during its event or before observers run cannot close its previous menu', async ({ page }) => {
	await mount(page);
	const command = item(page, 'save-command');
	await command.evaluate(node => node.addEventListener('en-action', () => {
		document.getElementById('export-menu')!.append(node);
	}, { once: true }));
	await control(page, 'save-command').click();
	await expect(rootMenu(page)).toHaveJSProperty('open', true);
	await expect(childMenu(page)).toHaveJSProperty('open', false);
	await expect(childMenu(page).locator('#save-command')).toHaveCount(1);
	await control(page, 'export-trigger').click();
	await expect(childMenu(page)).toHaveJSProperty('open', true);
	await control(page, 'save-command').click();
	await expect(rootMenu(page)).toHaveJSProperty('open', false);
	await expect(childMenu(page)).toHaveJSProperty('open', false);
	await rootTrigger(page).click();
	await expect(rootMenu(page)).toHaveJSProperty('open', true);
	await command.evaluate(node => document.getElementById('expanded-menu')!.append(node));
	await expect(control(page, 'save-command')).toBeVisible();
	await control(page, 'save-command').evaluate(button => {
		const root = document.getElementById('expanded-menu')!;
		const host = (button.getRootNode() as ShadowRoot).host;
		(window as any).sameTurnMovedActions = [];
		root.addEventListener('en-action', event => (window as any).sameTurnMovedActions.push((event as CustomEvent).detail.action));
		// Move an already-rendered item and activate before MutationObserver runs.
		document.getElementById('export-menu')!.append(host);
		button.click();
	});
	expect(await page.evaluate(() => (window as any).sameTurnMovedActions)).toEqual([]);
	await expect(rootMenu(page)).toHaveJSProperty('open', true);
	await expect(childMenu(page)).toHaveJSProperty('open', false);
});

test('moving a radio during its proposal restores the previous owning group', async ({ page }) => {
	await mount(page);
	await item(page, 'large-choice').evaluate(node => node.addEventListener('en-change', () => {
		document.getElementById('export-menu')!.append(node);
	}, { once: true }));
	await control(page, 'large-choice').click();
	await expect(childMenu(page).locator('#large-choice')).toHaveCount(1);
	await expect(item(page, 'large-choice')).toHaveJSProperty('checked', false);
	await expect(item(page, 'small-choice')).toHaveJSProperty('checked', true);
	await expect(item(page, 'child-density')).toHaveJSProperty('checked', true);
	await expect(rootMenu(page)).toHaveJSProperty('open', true);
});

test('disabled choices are discoverable by keyboard but cannot change state or activate', async ({ page }) => {
	await mount(page);
	await control(page, 'grid-choice').press('ArrowDown');
	await control(page, 'small-choice').press('ArrowDown');
	await control(page, 'large-choice').press('ArrowDown');
	const disabled = control(page, 'disabled-choice');
	await expect(disabled).toBeFocused();
	await expect(disabled).toHaveAttribute('aria-disabled', 'true');
	await disabled.press('Space');
	await expect(item(page, 'disabled-choice')).toHaveJSProperty('checked', false);
	await expect(rootMenu(page)).toHaveJSProperty('open', true);
	await disabled.press('ArrowDown');
	await expect(control(page, 'export-trigger')).toBeFocused();
});

test('nested menus use owned ARIA relationships and Escape closes exactly one level', async ({ page }) => {
	await mount(page);
	const trigger = control(page, 'export-trigger');
	await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');
	await trigger.focus();
	await trigger.press('ArrowRight');
	await expect(childMenu(page)).toHaveJSProperty('open', true);
	await expect(trigger).toHaveAttribute('aria-expanded', 'true');
	await expect(control(page, 'include-notes')).toBeFocused();
	await control(page, 'format-trigger').focus();
	await control(page, 'format-trigger').press('Enter');
	await expect(item(page, 'format-menu')).toHaveJSProperty('open', true);
	await expect(control(page, 'png-command')).toBeFocused();
	await control(page, 'png-command').press('Escape');
	await expect(item(page, 'format-menu')).toHaveJSProperty('open', false);
	await expect(childMenu(page)).toHaveJSProperty('open', true);
	await expect(rootMenu(page)).toHaveJSProperty('open', true);
	await expect(control(page, 'format-trigger')).toBeFocused();
	await control(page, 'format-trigger').press('ArrowLeft');
	await expect(childMenu(page)).toHaveJSProperty('open', false);
	await expect(rootMenu(page)).toHaveJSProperty('open', true);
	await expect(trigger).toBeFocused();
	const scan = await new AxeBuilder({ page }).include('#menu-expansion-fixture').analyze();
	expect(scan.violations).toEqual([]);
});

test('Tab from a submenu closes the hierarchy and advances from the external root trigger', async ({ page, browserName }) => {
	await mount(page);
	await control(page, 'export-trigger').click();
	await expect(control(page, 'include-notes')).toBeFocused();
	await control(page, 'include-notes').press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
	await expect(childMenu(page)).toHaveJSProperty('open', false);
	await expect(rootMenu(page)).toHaveJSProperty('open', false);
	await expect(fixture(page).getByRole('button', { name: 'Continue study', exact: true })).toBeFocused();
});

test('a deepest submenu command closes every surface and returns focus to the root trigger', async ({ page }) => {
	await mount(page);
	await rootMenu(page).evaluate(node => {
		(window as any).deepMenuActions = [];
		node.addEventListener('en-action', event => (window as any).deepMenuActions.push((event as CustomEvent).detail.action));
	});
	await control(page, 'export-trigger').click();
	await expect(control(page, 'include-notes')).toBeFocused();
	await control(page, 'format-trigger').click();
	await expect(control(page, 'png-command')).toBeFocused();
	await control(page, 'png-command').press('Enter');
	await expect(item(page, 'format-menu')).toHaveJSProperty('open', false);
	await expect(childMenu(page)).toHaveJSProperty('open', false);
	await expect(rootMenu(page)).toHaveJSProperty('open', false);
	await expect(rootTrigger(page)).toBeFocused();
	expect(await page.evaluate(() => (window as any).deepMenuActions)).toEqual(['export-png']);
});

test.describe('phone touch and RTL menu composition', () => {
	test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
	test('tap opens a submenu and RTL arrows return or enter without losing the parent', async ({ page }) => {
		await mount(page, 'rtl');
		const trigger = control(page, 'export-trigger');
		await trigger.tap();
		await expect(childMenu(page)).toHaveJSProperty('open', true);
		await expect(childMenu(page).getByRole('menuitem', {name:'Back',exact:true})).toBeFocused();
		await control(page, 'include-notes').tap();
		await expect(item(page, 'include-notes')).toHaveJSProperty('checked', true);
		await expect(childMenu(page)).toHaveJSProperty('open', true);
		await childMenu(page).evaluate(node => node.addEventListener('en-change', event => { (window as any).backReason = (event as CustomEvent).detail.reason; }, { once: true }));
		await control(page, 'include-notes').press('ArrowRight');
		expect(await page.evaluate(() => (window as any).backReason)).toBe('back');
		await expect(childMenu(page)).toHaveJSProperty('open', false);
		await expect(trigger).toBeFocused();
		await trigger.press('ArrowLeft');
		await expect(childMenu(page)).toHaveJSProperty('open', true);
		const bounds = await childMenu(page).getByRole('menu', { name: 'Export options', exact: true }).boundingBox();
		expect(bounds).not.toBeNull();
		expect(bounds!.x).toBeGreaterThanOrEqual(0);
		expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(391);
	});
});

test('mouse hover opens nested help, preserves focus and retains it after pointer exit', async ({ page }) => {
	await mount(page);
	await control(page, 'export-trigger').hover();
	await expect(childMenu(page)).toHaveJSProperty('open', true);
	await expect(control(page, 'include-notes')).toBeVisible();
	await expect(control(page, 'grid-choice')).toBeFocused();
	await page.mouse.move(5, 5);
	await expect(childMenu(page)).toHaveJSProperty('open', true);
	await control(page, 'small-choice').hover();
	await expect(childMenu(page)).toHaveJSProperty('open', false);
	await expect(rootMenu(page)).toHaveJSProperty('open', true);
});

test.describe('touch replacement panel',()=>{
 test.use({hasTouch:true});
 test('touch nested panels replace their parent and Back preserves cancellation and focus', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await mount(page);
	const parentBox = await rootMenu(page).locator('[part="surface"]').first().boundingBox();
	await control(page, 'export-trigger').tap();
	const back = childMenu(page).getByRole('menuitem', { name: 'Back', exact: true });
	await expect(back).toBeVisible();
	await expect(back).toBeFocused();
	await expect(control(page, 'grid-choice')).not.toBeVisible();
	const box = await childMenu(page).locator('[part="surface"]').first().boundingBox();
	expect(Math.abs(box!.x-parentBox!.x)).toBeLessThan(1);
	expect(Math.abs(box!.y-parentBox!.y)).toBeLessThan(1);
	expect(Math.abs(box!.width-parentBox!.width)).toBeLessThan(1);
	await back.press('ArrowDown');
	await expect(control(page, 'include-notes')).toBeFocused();
	await control(page, 'include-notes').press('ArrowUp');
	await expect(back).toBeFocused();
	await childMenu(page).evaluate(node => node.addEventListener('en-change', event => { (window as any).backReason = (event as CustomEvent).detail.reason; event.preventDefault(); }, { once: true }));
	await back.click();
	expect(await page.evaluate(() => (window as any).backReason)).toBe('back');
	await expect(childMenu(page)).toHaveJSProperty('open', true);
	await expect(back).toBeFocused();
	await back.click();
	await expect(childMenu(page)).toHaveJSProperty('open', false);
	await expect(control(page, 'export-trigger')).toBeFocused();
	await expect(control(page, 'grid-choice')).toBeVisible();
});
});

test('safe triangle protects diagonal mouse transit across an ancestor row', async ({ page }) => {
	await mount(page);
	const trigger = await control(page, 'export-trigger').boundingBox();
	await page.mouse.move(trigger!.x + trigger!.width / 2, trigger!.y + trigger!.height / 2);
	await expect(control(page, 'include-notes')).toBeVisible();
	const panel = await childMenu(page).locator('[part="surface"]').first().boundingBox();
	const save = await control(page, 'save-command').boundingBox();
	const crossing = { x: trigger!.x + trigger!.width - 2, y: save!.y + 2 };
	await page.mouse.move(crossing.x, crossing.y);
	await expect(childMenu(page)).toHaveJSProperty('open', true);
	await page.mouse.move(panel!.x + 12, panel!.y + panel!.height / 2);
	await expect(childMenu(page)).toHaveJSProperty('open', true);
});

test.describe('touch multi level',()=>{
 test.use({hasTouch:true});
 test('a low touch parent bounds a long replacement and scrolls the last command into view', async ({page})=>{
   await page.setViewportSize({width:390,height:640});
   await mount(page);
   await rootMenu(page).evaluate(node=>{
     for(const child of [...node.children])if(child.localName==='en-menu-item' && child.id!=='export-trigger')child.remove();
     document.querySelector<HTMLElement>('#expanded-trigger')!.style.marginBlockStart='320px';
     const child=node.querySelector('#export-menu')!;
     for(let index=0;index<25;index++){const item=document.createElement('en-menu-item');item.textContent=`Extra command ${index+1}`;child.append(item);}
   });
   await expect.poll(async()=> (await rootMenu(page).locator('[part="surface"]').first().boundingBox())!.y).toBeGreaterThan(300);
   await control(page,'export-trigger').tap();
   const back=childMenu(page).getByRole('menuitem',{name:'Back',exact:true});
   await expect(back).toBeFocused();
   const bounds=await childMenu(page).locator('[part="surface"]').first().boundingBox();
   expect(bounds!.y+bounds!.height).toBeLessThanOrEqual(641);
   await back.press('End');
   const last=childMenu(page).getByRole('menuitem',{name:'Extra command 25',exact:true});
   await expect(last).toBeFocused();
   const row=await last.boundingBox();
   expect(row!.y+row!.height).toBeLessThanOrEqual(641);
 });
 test('author writes and removal keep the replacement parent recoverable', async ({ page }) => {
   await page.setViewportSize({width:390,height:640});
   await mount(page);
   await childMenu(page).evaluate(node => { (node as HTMLElement & {open:boolean}).open=true; });
   await expect(childMenu(page).getByRole('menuitem',{name:'Back',exact:true})).toBeVisible();
   await expect(control(page,'grid-choice')).not.toBeVisible();
   await childMenu(page).evaluate(node => node.remove());
   await expect(control(page,'grid-choice')).toBeVisible();
   await expect(rootMenu(page)).toHaveJSProperty('open',true);
 });

 test('touch Back traverses two levels with only the current panel exposed to accessibility', async ({ page, browserName }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await mount(page);
	await control(page, 'export-trigger').tap();
	await expect(childMenu(page).getByRole('menuitem', { name: 'Back', exact: true })).toBeVisible();
	await control(page, 'format-trigger').tap();
	const nested = item(page, 'format-menu');
	await expect(nested.getByRole('menuitem', { name: 'Back', exact: true })).toBeFocused();
	await expect(fixture(page).getByRole('menu')).toHaveCount(1);
	await expect(fixture(page).getByRole('menuitemcheckbox')).toHaveCount(0);
	await expect(fixture(page)).toMatchAriaSnapshot(`
		- region "Expanded menu consumption":
		  - button "Open study actions" [expanded]
		  - button "Continue study"
		  - menu "Formats":
		    - menuitem "Back"
		    - menuitem "Export PNG"
	`);
	if(browserName==='chromium'){
		const session=await page.context().newCDPSession(page);
		const {nodes}=await session.send('Accessibility.getFullAXTree');
		const target=nodes.find(node=>!node.ignored && node.role?.value==='menu' && node.name?.value==='Formats');
		expect(target).toBeDefined();
		const visited=new Set<string>();
		const visit=(id:string)=>{if(visited.has(id))return;visited.add(id);for(const child of nodes.find(node=>node.nodeId===id)?.childIds??[])visit(child);};
		visit(nodes.find(node=>node.role?.value==='RootWebArea')!.nodeId);
		expect(visited.has(target!.nodeId)).toBe(true);
		expect(nodes.filter(node=>!node.ignored && ['Show grid','Small previews','Include notes','Choose format'].includes(String(node.name?.value)))).toEqual([]);
		await session.detach();
	}
	expect((await new AxeBuilder({ page }).include('#menu-expansion-fixture').analyze()).violations).toEqual([]);
	await nested.getByRole('menuitem', { name: 'Back', exact: true }).press('Escape');
	await expect(control(page, 'format-trigger')).toBeFocused();
	await expect(control(page, 'include-notes')).toBeVisible();
	await expect(control(page, 'grid-choice')).not.toBeVisible();
	await control(page, 'format-trigger').press(browserName==='webkit'?'Alt+Tab':'Tab');
	await expect(fixture(page).getByRole('button', { name: 'Continue study' })).toBeFocused();
	await expect(rootMenu(page)).toHaveJSProperty('open', false);
});

});

for (const direction of ['ltr', 'rtl'] as const) test(`viewport resize changes mouse submenu presentation without losing focus (${direction})`, async ({ page }, info) => {
	await page.setViewportSize({ width: 1280, height: 900 }); await mount(page, direction);
	await control(page, 'export-trigger').click();
	const child = childMenu(page);
	const back = child.getByRole('menuitem', { name: 'Back', exact: true });
	await expect(back).toHaveCount(0);
	const row = control(page, 'include-notes');
	await expect(row).toBeVisible(); await row.focus(); await expect(row).toBeFocused();
	const original = await row.evaluateHandle(node => node);
	await child.evaluate(node => { (window as any).resizeMenuChanges = []; node.addEventListener('en-change', e => { if (e.target === node) (window as any).resizeMenuChanges.push((e as CustomEvent).detail); }); });
	try {
		await page.setViewportSize({ width: 390, height: 844 });
		await expect(back).toBeVisible(); await expect(row).toBeFocused();
		await expect(control(page, 'grid-choice')).not.toBeVisible();
		expect(await row.evaluate((node, saved) => node === saved, original)).toBe(true);
		await expect(child).toHaveJSProperty('open', true);
		const parentBox = (await rootMenu(page).locator('[part="surface"]').first().boundingBox())!;
		const childBox = (await child.locator('[part="surface"]').first().boundingBox())!;
		expect(childBox.x).toBeCloseTo(parentBox.x, 0); expect(childBox.width).toBeCloseTo(parentBox.width, 0);
		await page.screenshot({ path: info.outputPath(`menu-narrow-${direction}.png`) });
		await page.setViewportSize({ width: 1280, height: 900 });
		await expect(back).toHaveCount(0); await expect(row).toBeFocused();
		await expect(control(page, 'grid-choice')).toBeVisible();
		expect(await row.evaluate((node, saved) => node === saved, original)).toBe(true);
		expect(await page.evaluate(() => (window as any).resizeMenuChanges)).toEqual([]);
		await page.setViewportSize({ width: 390, height: 844 });
		await expect(back).toBeVisible(); await back.focus();
		await page.setViewportSize({ width: 1280, height: 900 });
		await expect(back).toHaveCount(0); await expect(row).toBeFocused();
		await row.press('Escape'); await expect(control(page, 'export-trigger')).toBeFocused();
	} finally { await original.dispose(); }
});

test('narrow keyboard nested branches expose Back and remain navigable after expansion', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 }); await mount(page);
	await control(page, 'export-trigger').focus(); await control(page, 'export-trigger').press('ArrowRight');
	await expect(childMenu(page).getByRole('menuitem', { name: 'Back', exact: true })).toBeFocused();
	await control(page, 'format-trigger').focus(); await control(page, 'format-trigger').press('ArrowRight');
	const nested = item(page, 'format-menu');
	await expect(nested.getByRole('menuitem', { name: 'Back', exact: true })).toBeFocused();
	await page.setViewportSize({ width: 1280, height: 900 });
	await expect(nested.getByRole('menuitem', { name: 'Back', exact: true })).toHaveCount(0);
	await expect(control(page, 'png-command')).toBeFocused();
	await expect(childMenu(page)).toHaveJSProperty('open', true); await expect(nested).toHaveJSProperty('open', true);
	await control(page, 'png-command').press('Escape'); await expect(control(page, 'format-trigger')).toBeFocused();
	await control(page, 'format-trigger').press('Escape'); await expect(control(page, 'export-trigger')).toBeFocused();
});
