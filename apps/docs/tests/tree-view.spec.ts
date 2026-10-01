import { expect, test, type Page } from '@playwright/test';

async function fixture(page: Page) {
	await page.goto('/api-examples/tree-view.html');
	await page.waitForFunction(() => Boolean(customElements.get('en-tree') && customElements.get('en-tree-item')));
	await page.evaluate(() => {
		document.body.innerHTML = `<button id="before">Before tree</button>
		<en-tree id="test-tree" label="Project outline" value="canvas">
			<en-tree-item value="studio" label="Studio">
				<en-tree-item slot="children" value="canvas" label="Canvas"></en-tree-item>
				<en-tree-item slot="children" value="components" label="Components">
					<en-tree-item slot="children" value="buttons" label="Buttons"></en-tree-item>
					<en-tree-item slot="children" value="icons" label="Icons"></en-tree-item>
				</en-tree-item>
			</en-tree-item>
			<en-tree-item value="archived" label="Archived" disabled></en-tree-item>
			<en-tree-item value="notes" label="Notes"></en-tree-item>
		</en-tree><button id="after">After tree</button>`;
		(document.querySelector('en-tree') as any).expanded = ['studio', 'components'];
	});
	await expect(page.getByRole('treeitem', { name: 'Icons', exact: true })).toBeVisible();
}
const item = (page: Page, name: string) => page.getByRole('treeitem', { name, exact: true });
const tree = (page: Page) => page.locator('#test-tree');

test('tree exposes ordered hierarchy and keeps arrow focus independent from selection', async ({ page }, info) => {
	await fixture(page);
	await expect(page.getByRole('tree', { name: 'Project outline', exact: true })).toBeVisible();
	await expect(item(page, 'Studio')).toHaveAttribute('aria-level', '1');
	await expect(item(page, 'Canvas')).toHaveAttribute('aria-level', '2');
	await expect(item(page, 'Buttons')).toHaveAttribute('aria-level', '3');
	await expect(item(page, 'Canvas')).toHaveAttribute('aria-selected', 'true');
	await item(page, 'Canvas').focus();
	await page.keyboard.press('ArrowDown');
	await expect(item(page, 'Components')).toBeFocused();
	await expect(tree(page)).toHaveJSProperty('value', 'canvas');
	await page.keyboard.press('ArrowRight');
	await expect(item(page, 'Buttons')).toBeFocused();
	await page.keyboard.press('Enter');
	await expect(tree(page)).toHaveJSProperty('value', 'buttons');
	await page.keyboard.press('End');
	await expect(item(page, 'Notes')).toBeFocused();
	await page.keyboard.press('ArrowUp');
	await expect(item(page, 'Archived')).toBeFocused();
	await page.keyboard.press('Space');
	await expect(tree(page)).toHaveJSProperty('value', 'buttons');
	await page.keyboard.press(info.project.name === 'webkit' ? 'Alt+Tab' : 'Tab');
	await expect(page.locator('#after')).toBeFocused();
	await info.attach('tree-hierarchy', { body: await page.getByRole('tree').ariaSnapshot(), contentType: 'text/yaml' });
});

test('cancelable selection exposes tentative state then rolls back without losing attempted focus', async ({ page }) => {
	await fixture(page);
	await tree(page).evaluate(element => element.addEventListener('en-change', (event: Event) => {
		const change = event as CustomEvent;
		(element as any).__seen = { value: (element as any).value, detail: change.detail, cancelable: event.cancelable };
		event.preventDefault();
	}, { once: true }));
	await item(page, 'Icons').focus();
	await page.keyboard.press('Enter');
	await expect(tree(page)).toHaveJSProperty('value', 'canvas');
	await expect(item(page, 'Icons')).toBeFocused();
	const seen = await tree(page).evaluate((element: any) => element.__seen);
	expect(seen.value).toBe('icons');
	expect(seen.detail.proposed.value).toBe('icons');
	expect(seen.detail.previous.value).toBe('canvas');
	expect(seen.cancelable).toBe(true);
	await expect(item(page, 'Canvas')).toHaveAttribute('aria-selected', 'true');
});

test('expansion cancellation retains visible descendants and later collapse recovers their focus', async ({ page }) => {
	await fixture(page);
	await tree(page).evaluate(element => element.addEventListener('en-change', event => event.preventDefault(), { once: true }));
	await item(page, 'Components').focus();
	await page.keyboard.press('ArrowLeft');
	await expect(item(page, 'Components')).toHaveAttribute('aria-expanded', 'true');
	await expect(item(page, 'Icons')).toBeVisible();
	await item(page, 'Icons').focus();
	await tree(page).evaluate((element: any) => element.expanded = ['studio']);
	await expect(item(page, 'Icons')).not.toBeVisible();
	await expect(item(page, 'Components')).toBeFocused();
	await expect(tree(page)).toHaveJSProperty('value', 'canvas');
});

test('same-value author writes supersede canceled changes instead of rolling back newer ownership', async ({ page }) => {
	await fixture(page);
	await tree(page).evaluate(element => element.addEventListener('en-change', event => {
		event.preventDefault();
		(element as any).value = (element as any).value;
	}, { once: true }));
	await item(page, 'Notes').focus();
	await page.keyboard.press('Enter');
	await expect(tree(page)).toHaveJSProperty('value', 'notes');
	await expect(item(page, 'Notes')).toHaveAttribute('aria-selected', 'true');
});

test('dynamic removal preserves nodes, repairs focus and does not steal focus from outside', async ({ page }) => {
	await fixture(page);
	await item(page, 'Icons').focus();
	await tree(page).evaluate(element => {
		(element as any).__canvas = element.querySelector('[value="canvas"]');
		element.querySelector('[value="components"]')!.remove();
	});
	await expect.poll(() => tree(page).evaluate(element => element.matches(':focus-within'))).toBe(true);
	await expect(tree(page).locator('[value="components"]')).toHaveCount(0);
	expect(await tree(page).evaluate((element: any) => element.__canvas === element.querySelector('[value="canvas"]'))).toBe(true);
	await page.locator('#after').focus();
	await tree(page).evaluate((element: any) => element.expanded = []);
	await expect(page.locator('#after')).toBeFocused();
});

test('RTL reverses horizontal branch navigation while typeahead follows visible labels', async ({ page }) => {
	await fixture(page);
	await tree(page).evaluate(element => element.setAttribute('dir', 'rtl'));
	await item(page, 'Components').focus();
	await page.keyboard.press('ArrowRight');
	await expect(item(page, 'Components')).toHaveAttribute('aria-expanded', 'false');
	await page.keyboard.press('ArrowLeft');
	await expect(item(page, 'Components')).toHaveAttribute('aria-expanded', 'true');
	await page.keyboard.press('ArrowLeft');
	await expect(item(page, 'Buttons')).toBeFocused();
	await page.keyboard.press('n');
	await expect(item(page, 'Notes')).toBeFocused();
	await expect(tree(page)).toHaveJSProperty('value', 'canvas');
});

test('shared project demo rejects selection, permits expansion and handles removed/restored content', async ({ page }) => {
	await page.goto('/api-examples/tree-view.html?progress-report');
	const demo = page.locator('.tree-view-demo');
	await demo.getByRole('checkbox', { name: 'Keep the current selection', exact: true }).check();
	await demo.getByRole('treeitem', { name: 'Caption', exact: true }).click();
	await expect(demo.locator('#specimen-tree')).toHaveJSProperty('value', 'cover');
	await expect(demo.locator('[data-tree-details]')).toContainText('Cover');
	await demo.getByRole('checkbox', { name: 'Keep the current selection', exact: true }).uncheck();
	await demo.getByRole('treeitem', { name: 'Caption', exact: true }).click();
	await expect(demo.locator('#specimen-tree')).toHaveJSProperty('value', 'caption');
	await expect(demo.locator('[data-tree-details]')).toContainText('Caption');
	await demo.getByRole('button', { name: 'Remove or restore Caption', exact: true }).click();
	await expect(demo.getByRole('treeitem', { name: 'Caption', exact: true })).toHaveCount(0);
	await expect(demo.locator('#specimen-tree')).toHaveJSProperty('value', 'cover');
	await demo.getByRole('button', { name: 'Remove or restore Caption', exact: true }).click();
	await expect(demo.getByRole('treeitem', { name: 'Caption', exact: true })).toBeVisible();
});

test('Settings outline selection is useful without changing output settings or saved state', async ({ page }) => {
	await page.goto('/workflows/settings?progress-report');
	await expect(page.locator('en-workflows-app')).not.toHaveAttribute('data-ssr');
	const before = await page.locator('[data-settings-current]').textContent();
	const saved = await page.locator('[data-settings-saved]').textContent();
	const outline = page.locator('#settings-project-tree');
	await outline.getByRole('treeitem', { name: 'Accent', exact: true }).click();
	await expect(outline).toHaveJSProperty('value', 'accent');
	await expect(page.locator('[data-outline-details]')).toContainText('Accent');
	expect(await page.locator('[data-settings-current]').textContent()).toBe(before);
	expect(await page.locator('[data-settings-saved]').textContent()).toBe(saved);
	await outline.getByRole('treeitem', { name: 'Layers', exact: true }).focus();
	await page.keyboard.press('ArrowLeft');
	const opacity = page.getByRole('spinbutton', { name: 'Layer opacity Exact value', exact: true });
	await opacity.fill('42');
	await opacity.press('Enter');
	await expect(opacity).toHaveValue('42');
	await expect(outline.getByRole('treeitem', { name: 'Layers', exact: true })).toHaveAttribute('aria-expanded', 'false');
	await expect(outline).toHaveJSProperty('value', 'accent');
});

for (const component of ['en-tree', 'en-tree-item']) {
	test(`${component} API exposes hierarchy guidance, parts and the shared live example`, async ({ page }) => {
		await page.goto(`/api-reference?component=${component}&progress-report`);
		const guide = page.locator('#api-tree-guide');
		await expect(guide.getByRole('heading', { name: 'Hierarchy and selection' })).toBeVisible();
		await guide.getByRole('link', { name: 'Review the project hierarchy' }).click();
		await expect(page.getByRole('tree', { name: 'Project outline', exact: true })).toBeVisible();
		await expect(page.locator('#specimen-tree')).toHaveJSProperty('value', 'cover');
	});
}

for (const theme of ['spectrum-inspired', 'fluent-inspired', 'astryx-inspired', 'shadcn-inspired', 'holotable-inspired']) {
	test(`${theme} keeps tree selection, hierarchy and narrow RTL layout usable`, async ({ page }, info) => {
		await page.goto('/api-examples/tree-view.html?progress-report');
		await page.getByRole('combobox', { name: 'Inspired theme', exact: true }).selectOption(theme);
		await expect(page.getByRole('status', { name: 'Theme result' })).toContainText('applied');
		await page.setViewportSize({ width: 390, height: 844 });
		await page.locator('html').evaluate(element => element.dir = 'rtl');
		const demo = page.locator('.tree-view-demo');
		for (const appearance of ['light', 'dark']) {
			await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption(appearance);
			await demo.getByRole('treeitem', { name: 'Accent', exact: true }).focus();
			await page.keyboard.press('Enter');
			await expect(demo.locator('#specimen-tree')).toHaveJSProperty('value', 'accent');
			await expect(demo.getByRole('treeitem', { name: 'Accent', exact: true })).toBeFocused();
			const bounds = await demo.evaluate(element => ({ width: element.getBoundingClientRect().width, scroll: element.scrollWidth }));
			expect(bounds.scroll).toBeLessThanOrEqual(Math.ceil(bounds.width) + 1);
		}
		if (info.project.name === 'webkit') await demo.screenshot({ path: info.outputPath(`${theme}-tree.png`) });
	});
}

test('external selection updates the next Tab entry without moving an existing tree focus', async ({ page }, info) => {
	await fixture(page);
	await page.locator('#before').focus();
	await tree(page).evaluate((element: any) => element.value = 'icons');
	await expect(page.locator('#before')).toBeFocused();
	await expect(item(page, 'Icons')).toHaveAttribute('tabindex', '0');
	await page.keyboard.press(info.project.name === 'webkit' ? 'Alt+Tab' : 'Tab');
	await expect(item(page, 'Icons')).toBeFocused();
	await tree(page).evaluate((element: any) => element.value = 'notes');
	await expect(item(page, 'Notes')).toHaveAttribute('aria-selected', 'true');
	await expect(item(page, 'Icons')).toBeFocused();
});

test('unavailable keys survive author writes and become meaningful when children arrive', async ({ page }) => {
	await fixture(page);
	await tree(page).evaluate((element: any) => {
		element.value = 'new-leaf';
		element.expanded = ['studio', 'new-folder'];
	});
	await expect(tree(page)).toHaveJSProperty('value', 'new-leaf');
	await tree(page).evaluate(element => element.querySelector('[value="studio"]')!.insertAdjacentHTML('beforeend', `<en-tree-item slot="children" value="new-folder" label="New folder"><en-tree-item slot="children" value="new-leaf" label="New leaf"></en-tree-item></en-tree-item>`));
	await expect(item(page, 'New folder')).toHaveAttribute('aria-expanded', 'true');
	await expect(item(page, 'New leaf')).toBeVisible();
	await expect(item(page, 'New leaf')).toHaveAttribute('aria-selected', 'true');
});

test('moving an owned item outside every tree releases its old navigation and selection presentation', async ({ page }) => {
	await fixture(page);
	await item(page, 'Canvas').focus();
	await page.evaluate(() => {
		const outside = document.createElement('div'); outside.id = 'outside'; document.body.append(outside);
		outside.append(document.querySelector('en-tree-item[value="canvas"]')!);
	});
	const moved = page.locator('#outside').getByRole('treeitem', { name: 'Canvas', exact: true });
	await expect(moved).toHaveAttribute('tabindex', '-1');
	await expect(moved).toHaveAttribute('aria-selected', 'false');
	await page.evaluate(() => document.querySelector('en-tree-item[value="studio"]')!.append(document.querySelector('#outside en-tree-item')!));
	await expect(tree(page).getByRole('treeitem', { name: 'Canvas', exact: true })).toHaveAttribute('aria-selected', 'true');
});

test('a synchronous hierarchy mutation during selection invalidates the proposed state', async ({ page }) => {
	await fixture(page);
	await tree(page).evaluate(element => element.addEventListener('en-change', () => {
		element.querySelector('en-tree-item[value="notes"]')!.setAttribute('hidden', '');
	}, { once: true }));
	await item(page, 'Notes').focus();
	await page.keyboard.press('Enter');
	await expect(tree(page)).toHaveJSProperty('value', 'canvas');
	await expect(item(page, 'Notes')).toHaveCount(0);
	await expect(item(page, 'Canvas')).toHaveAttribute('aria-selected', 'true');
});

test('transferring an item to another tree retains the new parent ownership', async ({ page }) => {
	await fixture(page);
	await page.evaluate(() => {
		const destination = document.createElement('en-tree') as any;
		destination.id = 'destination'; destination.label = 'Destination'; destination.value = 'notes';
		document.body.append(destination);
		destination.append(document.querySelector('en-tree-item[value="notes"]')!);
	});
	const destination = page.locator('#destination');
	await expect(destination.getByRole('treeitem', { name: 'Notes', exact: true })).toHaveAttribute('aria-selected', 'true');
	await tree(page).evaluate((element: any) => element.expanded = []);
	await expect(destination.getByRole('treeitem', { name: 'Notes', exact: true })).toHaveAttribute('tabindex', '0');
	await expect(destination.getByRole('treeitem', { name: 'Notes', exact: true })).toHaveAttribute('aria-level', '1');
	await destination.getByRole('treeitem', { name: 'Notes', exact: true }).focus();
	await page.keyboard.press('Enter');
	await expect(tree(page)).toHaveJSProperty('value', 'canvas');
});

test('theme updates preserve exploration while Reset restores the example', async ({ page }) => {
	await page.goto('/api-examples/tree-view.html?progress-report');
	await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
	const demo = page.locator('.tree-view-demo');
	await demo.getByRole('treeitem', { name: 'Artwork', exact: true }).focus();
	await page.keyboard.press('ArrowLeft');
	await expect(demo.getByRole('treeitem', { name: 'Artwork', exact: true })).toHaveAttribute('aria-expanded', 'false');
	await demo.getByRole('treeitem', { name: 'Project notes', exact: true }).click();
	await page.getByRole('combobox', { name: 'Inspired theme', exact: true }).selectOption('fluent-inspired');
	await expect(page.getByRole('status', { name: 'Theme result' })).toContainText('applied');
	await expect(demo.getByRole('treeitem', { name: 'Artwork', exact: true })).toHaveAttribute('aria-expanded', 'false');
	await expect(demo.locator('#specimen-tree')).toHaveJSProperty('value', 'notes');
	await page.getByRole('button', { name: 'Reset example', exact: true }).click();
	await expect(demo.getByRole('treeitem', { name: 'Artwork', exact: true })).toHaveAttribute('aria-expanded', 'true');
	await expect(demo.locator('#specimen-tree')).toHaveJSProperty('value', 'cover');
});

test('authored multiple selection supports toggle, ranges, select-all and preserves hidden selections', async ({ page }, info) => {
  await fixture(page);
  await tree(page).evaluate((host: any) => { host.multiple = true; host.values = ['future','canvas']; });
  await expect(page.getByRole('tree')).toHaveAttribute('aria-multiselectable','true');
  await item(page,'Canvas').focus();
  await page.keyboard.press('Space');
  await expect(tree(page)).toHaveJSProperty('values',['future']);
  await page.keyboard.press('Shift+ArrowDown');
  await page.keyboard.press('Shift+ArrowDown');
  await expect(tree(page)).toHaveJSProperty('values',['canvas','components','buttons']);
  await page.keyboard.press('Control+a');
  await expect(tree(page)).toHaveJSProperty('values',['canvas','components','buttons','studio','icons','notes']);
  await page.keyboard.press('Control+a');
  await expect(tree(page)).toHaveJSProperty('values',[]);
  await tree(page).evaluate((host: any) => { host.values = ['icons','archived','future']; host.expanded = []; });
  await item(page,'Studio').focus();
  await page.keyboard.press('Control+a');
  await expect(tree(page)).toHaveJSProperty('values',['icons','archived','future','studio','notes']);
  await page.keyboard.press(info.project.name === 'webkit' ? 'Alt+Tab' : 'Tab');
  await expect(page.locator('#after')).toBeFocused();
});

test('multiple selection cancellation, author overrides, and same-dispatch availability edits are atomic', async ({ page }) => {
  await fixture(page);
  await tree(page).evaluate((host: any) => {
    host.multiple = true; host.values = ['canvas'];
    host.addEventListener('en-change', (event: Event) => event.preventDefault(), {once:true});
  });
  await item(page,'Notes').focus(); await page.keyboard.press('Space');
  await expect(tree(page)).toHaveJSProperty('values',['canvas']);
  await tree(page).evaluate((host: any) => {
    host.addEventListener('en-change',(event: Event) => { host.values=['icons']; event.preventDefault(); },{once:true});
  });
  await page.keyboard.press('Space');
  await expect(tree(page)).toHaveJSProperty('values',['icons']);
  await tree(page).evaluate((host: any) => {
    host.addEventListener('en-change',() => { host.querySelector('[value="buttons"]').disabled = true; },{once:true});
  });
  await page.keyboard.press('Control+a');
  await expect(tree(page)).toHaveJSProperty('values',['icons']);
  await tree(page).evaluate((host: any) => { host.multiple = false; });
  await expect(page.getByRole('tree')).not.toHaveAttribute('aria-multiselectable');
  await page.keyboard.press('Space');
  await expect(tree(page)).toHaveJSProperty('value','notes');
});

for (const mode of ['authored','data','virtual']) {
  test(`${mode} pointer selection uses exact inclusive Shift ranges and individual Command/Control toggles`, async ({ page }) => {
    await fixture(page);
    await tree(page).evaluate((host:any,mode) => {
      host.multiple=true;
      if(mode!=='authored') {
        host.replaceChildren();
        host.items=[{value:'studio',label:'Studio',children:[{value:'canvas',label:'Canvas'},{value:'components',label:'Components',children:[{value:'buttons',label:'Buttons'},{value:'icons',label:'Icons'}]}]},{value:'archived',label:'Archived',disabled:true},{value:'notes',label:'Notes'}];
        host.virtualize=mode==='virtual';
      }
      host.values=['canvas'];
      const echo=()=> { host.values=[...host.values]; };
      host.addEventListener('en-change',echo);host.testRemoveEcho=()=>host.removeEventListener('en-change',echo);
    },mode);
    // First range uses an authored initial selection. Click visual rows, not the enclosing parent/group.
    const click = async (name:string, modifiers: ('Shift'|'Meta')[] = []) => {
      const target=item(page,name).locator('[part~="option"]').first();
      await target.click({modifiers});
    };
    await click('Icons',['Shift']);
    await expect(tree(page)).toHaveJSProperty('values',['canvas','components','buttons','icons']);
    await click('Components',['Shift']);
    await expect(tree(page)).toHaveJSProperty('values',['canvas','components']);
    await click('Studio',['Shift']);
    await expect(tree(page)).toHaveJSProperty('values',['studio','canvas']);
    await click('Notes',['Meta']);
    await expect(tree(page)).toHaveJSProperty('values',['studio','canvas','notes']);
    await click('Buttons',['Shift']);
    await expect(tree(page)).toHaveJSProperty('values',['buttons','icons','notes']); // disabled Archived excluded
    await click('Canvas');
    await expect(tree(page)).toHaveJSProperty('values',['canvas']);
    await item(page,'Notes').locator('[part~="option"]').first().dispatchEvent('click',{ctrlKey:true});
    await expect(tree(page)).toHaveJSProperty('values',['canvas','notes']);
    await item(page,'Notes').locator('[part~="option"]').first().dispatchEvent('click',{ctrlKey:true});
    await expect(tree(page)).toHaveJSProperty('values',['canvas']);
    await click('Buttons',['Shift']);
    await expect(tree(page)).toHaveJSProperty('values',['canvas','components','buttons']);
    // Actual author changes rebase the range; focus exploration alone does not.
    await tree(page).evaluate((host:any)=>{host.values=['icons'];});
    await click('Notes',['Shift']);
    await expect(tree(page)).toHaveJSProperty('values',['icons','notes']);
    await tree(page).evaluate((host:any)=> {host.testRemoveEcho();host.addEventListener('en-change',(event:Event)=>event.preventDefault(),{once:true});});
    await click('Canvas');
    await click('Buttons',['Shift']);
    await expect(tree(page)).toHaveJSProperty('values',['buttons','icons']);
    // Native text selection must not compete with click/range selection, even on slotted labels.
    if(mode==='authored') await tree(page).locator('en-tree-item[value="notes"]').evaluate(host=> {
      const label=document.createElement('span');label.slot='label';label.textContent='Notes';host.append(label);
    });
    await page.evaluate(()=>getSelection()?.removeAllRanges());
    await item(page,'Notes').locator('[part~="label"]').dblclick();
    await expect.poll(()=>page.evaluate(()=>getSelection()?.toString() ?? '')).toBe('');
    await expect(item(page,'Notes')).toBeFocused();
    await click('Buttons',['Shift']);
    await expect(tree(page)).toHaveJSProperty('values',['buttons','icons','notes']);
    await expect.poll(()=>page.evaluate(()=>getSelection()?.toString() ?? '')).toBe('');
  });
}
