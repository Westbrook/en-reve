import { expect, test, type Locator, type Page } from '@playwright/test';
import { Buffer } from 'node:buffer';

const file = (name: string, mimeType = 'text/plain', content = 'sample') => ({ name, mimeType, buffer: Buffer.from(content) });
const upload = (page: Page) => page.locator('#test-upload');
const input = (page: Page) => upload(page).locator('input[type="file"]');
const names = (element: Locator) => element.evaluate((node: any) => Array.from(node.files as File[], file => file.name));

async function fixture(page: Page, attributes = 'multiple accept=".txt,image/*" max-file-size="20"') {
	await page.goto('/api-examples/file-upload.html');
	await page.waitForFunction(() => Boolean(customElements.get('en-file-upload')));
	await page.evaluate(attributes => {
		document.body.innerHTML = `<form id="test-form"><button type="button" id="before">Before files</button><fieldset id="test-fieldset"><en-file-upload id="test-upload" name="attachments" label="Project files" description="Choose text or image files." ${attributes}></en-file-upload></fieldset><button type="reset">Reset files</button><button type="button" id="after">After files</button></form>`;
	}, attributes);
	await expect(input(page)).toBeAttached();
}

async function drop(element: Locator, files: { name: string; type: string; content: string }[]) {
	await element.evaluate((node, files) => {
		const dataTransfer = new DataTransfer();
		for (const file of files) dataTransfer.items.add(new File([file.content], file.name, { type: file.type }));
		node.dispatchEvent(new DragEvent('drop', { dataTransfer, bubbles: true, composed: true, cancelable: true }));
	}, files);
}

const failures = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
	const errors: string[] = []; failures.set(page, errors);
	page.on('pageerror', error => errors.push(error.message));
});
test.afterEach(({ page }) => expect(failures.get(page)).toEqual([]));

test('native picker supports multiple files, accessible removal and repeated form entries', async ({ page }, info) => {
	await fixture(page);
	await expect(input(page)).toHaveAccessibleName('Project files');
	await expect(input(page)).toHaveAccessibleDescription('Choose text or image files.');
	await input(page).setInputFiles([file('brief.txt'), file('cover.png', 'image/png')]);
	await expect.poll(() => names(upload(page))).toEqual(['brief.txt', 'cover.png']);
	await expect(upload(page).getByRole('list')).toBeVisible();
	expect(await page.locator('#test-form').evaluate((form: HTMLFormElement) => new FormData(form).getAll('attachments').map(value => value instanceof File ? value.name : value))).toEqual(['brief.txt', 'cover.png']);
	await upload(page).getByRole('button', { name: 'Remove brief.txt', exact: true }).click();
	await expect.poll(() => names(upload(page))).toEqual(['cover.png']);
	await expect(upload(page).getByRole('button', { name: 'Remove brief.txt', exact: true })).toHaveCount(0);
	await info.attach('selected-files-accessibility', { body: await upload(page).ariaSnapshot(), contentType: 'text/yaml' });
});

test('picker cancellation preserves accepted files and selecting the same file remains possible', async ({ page }) => {
	await fixture(page);
	await upload(page).evaluate(node => {
		(node as any).__changes = 0;
		node.addEventListener('en-change', () => (node as any).__changes++);
	});
	await input(page).setInputFiles(file('brief.txt'));
	await input(page).dispatchEvent('cancel');
	await expect.poll(() => names(upload(page))).toEqual(['brief.txt']);
	await expect(upload(page)).toHaveJSProperty('__changes', 1);
	await input(page).setInputFiles(file('brief.txt'));
	await expect(upload(page)).toHaveJSProperty('__changes', 2);
	await expect.poll(() => names(upload(page))).toEqual(['brief.txt']);
});

test('drop replaces selection while rejected type and size batches retain previous files', async ({ page }) => {
	await fixture(page);
	await input(page).setInputFiles(file('brief.txt'));
	await upload(page).evaluate(node => node.addEventListener('en-reject', (event: Event) => {
		(node as any).__rejection = (event as CustomEvent).detail.rejections.map((entry: any) => ({ name: entry.file.name, reason: entry.reason }));
	}));
	await drop(upload(page), [{ name: 'new.txt', type: 'text/plain', content: 'new' }]);
	await expect.poll(() => names(upload(page))).toEqual(['new.txt']);
	await drop(upload(page), [{ name: 'allowed.txt', type: 'text/plain', content: 'okay' }, { name: 'blocked.pdf', type: 'application/pdf', content: 'pdf' }]);
	await expect.poll(() => names(upload(page))).toEqual(['new.txt']);
	await expect(upload(page)).toHaveJSProperty('__rejection', [{ name: 'blocked.pdf', reason: 'accept' }]);
	await expect(upload(page).getByRole('status')).toContainText('blocked.pdf');
	await drop(upload(page), [{ name: 'large.txt', type: 'text/plain', content: 'This file contains more than twenty bytes.' }]);
	await expect(upload(page)).toHaveJSProperty('__rejection', [{ name: 'large.txt', reason: 'max-file-size' }]);
	await expect.poll(() => names(upload(page))).toEqual(['new.txt']);
});

test('native picker constraints reject unsupported files without erasing accepted files', async ({ page }) => {
	await fixture(page);
	await input(page).setInputFiles(file('brief.txt'));
	await input(page).setInputFiles(file('blocked.pdf', 'application/pdf'));
	await expect.poll(() => names(upload(page))).toEqual(['brief.txt']);
	await expect(upload(page).getByRole('status')).toContainText('blocked.pdf');
});

test('single-file control rejects a multiple-file drop atomically', async ({ page }) => {
	await fixture(page, 'accept=".txt"');
	await input(page).setInputFiles(file('brief.txt'));
	await upload(page).evaluate(node => node.addEventListener('en-reject', (event: Event) => (node as any).__reasons = (event as CustomEvent).detail.rejections.map((entry: any) => entry.reason)));
	await drop(upload(page), [{ name: 'first.txt', type: 'text/plain', content: '1' }, { name: 'second.txt', type: 'text/plain', content: '2' }]);
	await expect.poll(() => names(upload(page))).toEqual(['brief.txt']);
	expect(await upload(page).evaluate((node: any) => node.__reasons)).toContain('multiple');
});

test('cancelable change exposes provisional files and form data before rolling back', async ({ page }) => {
	await fixture(page);
	await input(page).setInputFiles(file('original.txt'));
	await upload(page).evaluate(node => node.addEventListener('en-change', (event: Event) => {
		const detail = (event as CustomEvent).detail;
		(node as any).__seen = {
			files: (node as any).files.map((file: File) => file.name), previous: detail.previous.map((file: File) => file.name), proposed: detail.proposed.map((file: File) => file.name),
			reason: detail.reason, cancelable: event.cancelable,
			form: new FormData(document.querySelector('form')!).getAll('attachments').map(value => (value as File).name),
		};
		event.preventDefault();
	}, { once: true }));
	await input(page).setInputFiles(file('proposed.txt'));
	await expect(upload(page)).toHaveJSProperty('__seen', { files: ['proposed.txt'], previous: ['original.txt'], proposed: ['proposed.txt'], reason: 'select', cancelable: true, form: ['proposed.txt'] });
	await expect.poll(() => names(upload(page))).toEqual(['original.txt']);
	await expect(upload(page).getByRole('button', { name: 'Remove original.txt', exact: true })).toBeVisible();
});

test('author writes during cancellation own the final selection, including equal-value adoption', async ({ page }) => {
	await fixture(page);
	await upload(page).evaluate(node => node.addEventListener('en-change', event => {
		event.preventDefault(); (node as any).files = (node as any).files;
	}, { once: true }));
	await input(page).setInputFiles(file('adopted.txt'));
	await expect.poll(() => names(upload(page))).toEqual(['adopted.txt']);
	await upload(page).evaluate(node => node.addEventListener('en-change', event => {
		event.preventDefault(); (node as any).files = [new File(['app'], 'application.txt', { type: 'text/plain' })];
	}, { once: true }));
	await input(page).setInputFiles(file('discarded.txt'));
	await expect.poll(() => names(upload(page))).toEqual(['application.txt']);
});

test('removal is cancelable and leaves focus on the retained removal control', async ({ page }) => {
	await fixture(page);
	await input(page).setInputFiles(file('brief.txt'));
	await upload(page).evaluate(node => node.addEventListener('en-change', event => event.preventDefault(), { once: true }));
	const remove = upload(page).getByRole('button', { name: 'Remove brief.txt', exact: true });
	await remove.focus(); await remove.press('Enter');
	await expect.poll(() => names(upload(page))).toEqual(['brief.txt']);
	await expect(remove).toBeFocused();
});

test('disabled controls and disabled fieldsets prevent selection, drop and removal', async ({ page }) => {
	await fixture(page);
	await input(page).setInputFiles(file('brief.txt'));
	for (const target of [upload(page), page.locator('#test-fieldset')]) {
		await target.evaluate(node => node.setAttribute('disabled', ''));
		await expect(input(page)).toBeDisabled();
		await expect(upload(page).getByRole('button', { name: 'Remove brief.txt', exact: true })).toBeDisabled();
		await drop(upload(page), [{ name: 'blocked.txt', type: 'text/plain', content: 'new' }]);
		await expect.poll(() => names(upload(page))).toEqual(['brief.txt']);
		expect(await page.locator('#test-form').evaluate((form: HTMLFormElement) => new FormData(form).getAll('attachments').length)).toBe(0);
		await target.evaluate(node => node.removeAttribute('disabled'));
		await expect(input(page)).toBeEnabled();
	}
});

test('form reset clears selection and required validity follows accepted files', async ({ page }) => {
	await fixture(page, 'required multiple');
	expect(await page.locator('#test-form').evaluate((form: HTMLFormElement) => form.checkValidity())).toBe(false);
	await input(page).setInputFiles(file('brief.txt'));
	expect(await page.locator('#test-form').evaluate((form: HTMLFormElement) => form.checkValidity())).toBe(true);
	await page.getByRole('button', { name: 'Reset files', exact: true }).click();
	await expect.poll(() => names(upload(page))).toEqual([]);
	expect(await page.locator('#test-form').evaluate((form: HTMLFormElement) => form.checkValidity())).toBe(false);
	await expect(upload(page).getByRole('button', { name: 'Remove brief.txt', exact: true })).toHaveCount(0);
});

test('slotted label and description remain associated after live content changes', async ({ page }) => {
	await fixture(page);
	await upload(page).evaluate(node => node.innerHTML = '<span slot="label">Artwork source</span><span slot="description">Use the original file.</span>');
	await expect(input(page)).toHaveAccessibleName('Artwork source');
	await expect(input(page)).toHaveAccessibleDescription('Use the original file.');
	await upload(page).locator('[slot="description"]').evaluate(node => node.textContent = 'Use the revised source.');
	await expect(input(page)).toHaveAccessibleDescription('Use the revised source.');
});

test('SSR exposes native labeled selection before scripts and preserves early files through hydration', async ({ page }, info) => {
	let release!: () => void;
	const gate = new Promise<void>(resolve => { release = resolve; });
	await page.route('**/assets/*.js', async route => { await gate; await route.continue(); });
	try {
		await page.goto('/api-examples/file-upload.html', { waitUntil: 'commit' });
		const host = page.locator('#file-upload-choice');
		const control = host.locator('input[type="file"]');
		await expect(control).toHaveAccessibleName('Study files');
		await expect(control).toBeVisible();
		const identity = await control.elementHandle();
		await control.setInputFiles(file('early.png', 'image/png'));
		await info.attach('file-upload-before-hydration', { body: await host.ariaSnapshot(), contentType: 'text/yaml' });
		release();
		await page.waitForFunction(() => Boolean(customElements.get('en-file-upload')));
		await expect.poll(() => names(host)).toEqual(['early.png']);
		expect(await control.evaluate((node, original) => node === original, identity)).toBe(true);
		await expect(host.getByRole('button', { name: 'Remove early.png', exact: true })).toBeVisible();
		await info.attach('file-upload-after-hydration', { body: await host.ariaSnapshot(), contentType: 'text/yaml' });
	} finally { release(); }
});

test('application-owned transfer demonstrates pending, failure, retry and completion', async ({ page }) => {
	await page.goto('/api-examples/file-upload.html');
	const host = page.locator('#file-upload-choice');
	await host.locator('input[type="file"]').setInputFiles(file('study.png', 'image/png'));
	await expect.poll(() => names(host)).toEqual(['study.png']);
	await page.getByRole('button', { name: 'Start simulated transfer', exact: true }).click();
	await expect(host.locator('input[type="file"]')).toBeDisabled();
	await expect(page.getByRole('button', { name: 'Fail transfer', exact: true })).toBeEnabled();
	await page.getByRole('button', { name: 'Fail transfer', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Retry transfer', exact: true })).toBeEnabled();
	await expect.poll(() => names(host)).toEqual(['study.png']);
	await page.getByRole('button', { name: 'Retry transfer', exact: true }).click();
	await page.getByRole('button', { name: 'Complete transfer', exact: true }).click();
	await expect(page.locator('[data-upload-receipt]')).toContainText('study.png');
	await expect.poll(() => names(host)).toEqual(['study.png']);
	await page.getByRole('button', { name: 'Reset files', exact: true }).click();
	await expect.poll(() => names(host)).toEqual([]);
});

test('canceling the app transfer retains local files for another attempt', async ({ page }) => {
	await page.goto('/api-examples/file-upload.html');
	const host = page.locator('#file-upload-choice');
	await host.locator('input[type="file"]').setInputFiles(file('study.png', 'image/png'));
	await page.getByRole('button', { name: 'Start simulated transfer', exact: true }).click();
	await page.getByRole('button', { name: 'Cancel transfer', exact: true }).click();
	await expect(host.locator('input[type="file"]')).toBeEnabled();
	await expect.poll(() => names(host)).toEqual(['study.png']);
	await expect(page.getByRole('button', { name: 'Start simulated transfer', exact: true })).toBeEnabled();
});

for (const theme of ['spectrum-inspired', 'fluent-inspired', 'astryx-inspired', 'shadcn-inspired', 'holotable-inspired']) {
	test(`${theme} keeps file selection and long filenames usable in narrow RTL delivery`, async ({ page }, info) => {
		await page.goto('/api-examples/file-upload.html');
		await page.getByRole('combobox', { name: 'Inspired theme', exact: true }).selectOption(theme);
		await expect(page.getByRole('status', { name: 'Theme result' })).toContainText('applied');
		await page.setViewportSize({ width: 390, height: 844 });
		await page.locator('html').evaluate(element => element.setAttribute('dir', 'rtl'));
		const host = page.locator('#file-upload-choice');
		const filename = 'a-very-long-artwork-filename-for-a-collaborative-study-without-truncating-its-accessible-name.png';
		await host.locator('input[type="file"]').setInputFiles(file(filename, 'image/png'));
		for (const appearance of ['light', 'dark']) {
			await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption(appearance);
			const remove = host.getByRole('button', { name: `Remove ${filename}`, exact: true });
			await remove.focus();
			await expect(remove).toBeFocused();
			const bounds = await host.evaluate(element => ({ width: element.getBoundingClientRect().width, scroll: element.scrollWidth }));
			expect(bounds.scroll).toBeLessThanOrEqual(Math.ceil(bounds.width) + 1);
			const button = await remove.boundingBox();
			expect(button!.height).toBeGreaterThanOrEqual(24);
			expect(button!.width).toBeGreaterThanOrEqual(24);
		}
		if (info.project.name === 'webkit') await host.screenshot({ path: info.outputPath(`${theme}-upload.png`) });
	});
}

test('file-upload API includes the live selection demo and application ownership guidance', async ({ page }) => {
	await page.goto('/api-reference?component=en-file-upload&progress-report');
	await expect(page.locator('#api-file-upload-guide')).toBeVisible();
	await page.locator('.api-demo-frame').scrollIntoViewIfNeeded();
	await expect(page.locator('.api-demo-frame')).toHaveAttribute('data-example-ready', 'true');
	const frame = page.frameLocator('.api-demo-frame');
	await frame.locator('input[type="file"]').setInputFiles(file('api.png', 'image/png'));
	await expect(frame.getByRole('button', { name: 'Remove api.png', exact: true })).toBeVisible();
});

test('keyboard Tab reaches the native chooser and Space opens file selection without dragging', async ({ page }, info) => {
	await fixture(page);
	await page.locator('#before').focus();
	await page.keyboard.press(info.project.name === 'webkit' ? 'Alt+Tab' : 'Tab');
	await expect(input(page)).toBeFocused();
	const chooser = page.waitForEvent('filechooser');
	await page.keyboard.press('Space');
	await (await chooser).setFiles(file('keyboard.txt'));
	await expect.poll(() => names(upload(page))).toEqual(['keyboard.txt']);
});

test('Assets intake keeps local selection through simulated transfer and its reset clears it', async ({ page }) => {
	await page.goto('/workflows/assets?progress-report');
	await page.getByText('Bring your own study files', { exact: true }).click();
	const intake = page.locator('#assets-file-intake');
	const host = intake.locator('en-file-upload');
	await host.locator('input[type="file"]').setInputFiles(file('asset.png', 'image/png'));
	await intake.getByRole('button', { name: 'Start simulated transfer', exact: true }).click();
	await intake.getByRole('button', { name: 'Complete transfer', exact: true }).click();
	await expect(intake.locator('[data-upload-receipt]')).toContainText('asset.png');
	await intake.getByRole('button', { name: 'Reset files', exact: true }).click();
	await expect.poll(() => names(host)).toEqual([]);
});

test('compound extension accept matching is case-insensitive and empty drops retain selection', async ({ page }) => {
	await fixture(page, 'accept=".tar.gz"');
	await input(page).setInputFiles(file('Project.TAR.GZ', 'application/gzip'));
	await expect.poll(() => names(upload(page))).toEqual(['Project.TAR.GZ']);
	await drop(upload(page), []);
	await expect.poll(() => names(upload(page))).toEqual(['Project.TAR.GZ']);
	await input(page).setInputFiles(file('Project.gz', 'application/gzip'));
	await expect.poll(() => names(upload(page))).toEqual(['Project.TAR.GZ']);
	await expect(upload(page).getByRole('status')).toContainText('Project.gz');
});

test('parent form validation reveals associated required feedback and selection clears invalid state', async ({ page }) => {
	await fixture(page, 'required');
	expect(await page.locator('#test-form').evaluate((form: HTMLFormElement) => form.reportValidity())).toBe(false);
	await expect(upload(page).getByRole('status')).toHaveText('Please choose a file.');
	await expect(input(page)).toHaveAttribute('aria-invalid', 'true');
	await input(page).setInputFiles(file('brief.txt'));
	await expect(input(page)).not.toHaveAttribute('aria-invalid');
	await expect(upload(page).getByRole('status')).not.toBeVisible();
	expect(await page.locator('#test-form').evaluate((form: HTMLFormElement) => form.reportValidity())).toBe(true);
});

test('external targets retarget, use picker constraints and release on disconnect', async ({ page }) => {
  await fixture(page);
  await upload(page).evaluate((host:any) => { host.insertAdjacentHTML('afterend','<section id="drop-a">Drop A</section><section id="drop-b">Drop B</section>'); host.for='drop-a'; });
  await drop(page.locator('#drop-a'),[{name:'outside.txt',type:'text/plain',content:'one'}]);
  await expect.poll(() => names(upload(page))).toEqual(['outside.txt']);
  await drop(page.locator('#drop-a'),[{name:'bad.pdf',type:'application/pdf',content:'two'}]);
  await expect.poll(() => names(upload(page))).toEqual(['outside.txt']);
  await upload(page).evaluate((host:any) => { host.for='drop-b'; });
  await drop(page.locator('#drop-a'),[{name:'old.txt',type:'text/plain',content:'one'}]);
  await expect.poll(() => names(upload(page))).toEqual(['outside.txt']);
  await drop(page.locator('#drop-b'),[{name:'new.txt',type:'text/plain',content:'one'}]);
  await expect.poll(() => names(upload(page))).toEqual(['new.txt']);
  await upload(page).evaluate((host:any) => { (window as any).removedUpload=host; host.remove(); });
  await drop(page.locator('#drop-b'),[{name:'removed.txt',type:'text/plain',content:'one'}]);
  expect(await page.evaluate(() => (window as any).removedUpload.files[0].name)).toBe('new.txt');
});

test('nested and ambiguous targets never deliver a file to two uploaders', async ({ page }) => {
  await fixture(page);
  await upload(page).evaluate((host:any) => {
    const outer=document.createElement('section');outer.id='outer';host.before(outer);outer.append(host);
    outer.insertAdjacentHTML('beforeend','<section id="inner"><span id="drop-here">Files</span></section><en-file-upload id="inner-upload" for="inner"></en-file-upload>');host.for='outer';
  });
  const second=page.locator('#inner-upload');
  await drop(page.locator('#drop-here'),[{name:'inner.txt',type:'text/plain',content:'one'}]);
  await expect.poll(() => names(second)).toEqual(['inner.txt']);
  await expect.poll(() => names(upload(page))).toEqual([]);
  await second.evaluate((host:any) => { host.disabled=true; });
  await drop(page.locator('#drop-here'),[{name:'disabled.txt',type:'text/plain',content:'one'}]);
  await expect.poll(() => names(second)).toEqual(['inner.txt']);
  await expect.poll(() => names(upload(page))).toEqual([]);
  await second.evaluate((host:any) => { host.disabled=false;host.for='outer'; });
  await drop(page.locator('#outer'),[{name:'ambiguous.txt',type:'text/plain',content:'one'}]);
  await expect.poll(() => names(upload(page))).toEqual([]);
  await expect.poll(() => names(second)).toEqual(['inner.txt']);
});

test('explicit shadow target takes precedence; non-file and canceled drags are untouched', async ({ page }) => {
  await fixture(page);
  await upload(page).evaluate(async (host:any) => {
    const wrapper=document.createElement('div');host.after(wrapper);
    wrapper.attachShadow({mode:'open'}).innerHTML='<section id="shadow-drop">Drop</section>';
    host.dropTarget=wrapper.shadowRoot!.firstElementChild;await host.updateComplete;
  });
  await drop(page.locator('#shadow-drop'),[{name:'shadow.txt',type:'text/plain',content:'one'}]);
  await expect.poll(() => names(upload(page))).toEqual(['shadow.txt']);
  expect(await page.locator('#shadow-drop').evaluate(node => {
    const dataTransfer=new DataTransfer();dataTransfer.setData('text/plain','hello');
    return node.dispatchEvent(new DragEvent('drop',{dataTransfer,bubbles:true,cancelable:true,composed:true}));
  })).toBe(true);
  await page.locator('#shadow-drop').evaluate(node => node.addEventListener('drop',event=>event.preventDefault(),{capture:true,once:true}));
  await drop(page.locator('#shadow-drop'),[{name:'canceled.txt',type:'text/plain',content:'one'}]);
  await expect.poll(() => names(upload(page))).toEqual(['shadow.txt']);
});

test('transfer progress increases, cancellation stops it and retry starts fresh', async ({ page }) => {
  await page.goto('/api-examples/file-upload.html');
  await page.waitForFunction(() => Boolean(customElements.get('en-file-upload')));
  const demo=page.locator('.file-upload-demo');
  await demo.locator('input[type="file"]').setInputFiles(file('progress.png','image/png'));
  await demo.getByRole('button',{name:'Start simulated transfer',exact:true}).click();
  await expect.poll(() => demo.locator('en-progress-bar').evaluate((node:any)=>node.value)).toBeGreaterThan(0);
  await demo.getByRole('button',{name:'Fail transfer',exact:true}).click();
  await expect(demo.locator('en-progress-bar')).toHaveCount(0);
  await demo.getByRole('button',{name:'Retry transfer',exact:true}).click();
  await expect(demo.locator('en-progress-bar')).toHaveJSProperty('value',0);
  await demo.getByRole('button',{name:'Cancel transfer',exact:true}).click();
  await expect(demo.locator('[data-upload-status]')).toContainText('canceled');
  await expect(demo.locator('en-progress-bar')).toHaveCount(0);
});

test('late ID targets, shadow replacement, and reflected drag state track live associations', async ({ page }) => {
  await fixture(page);
  await upload(page).evaluate(async (host:any) => {
    host.for='late-target'; await host.updateComplete;
    host.insertAdjacentHTML('afterend','<section id="late-target">Late</section>');
  });
  await drop(page.locator('#late-target'),[{name:'late.txt',type:'text/plain',content:'one'}]);
  await expect.poll(() => names(upload(page))).toEqual(['late.txt']);
  await page.locator('#late-target').evaluate(node => {
    const dataTransfer=new DataTransfer();dataTransfer.items.add(new File(['a'],'a.txt'));
    node.dispatchEvent(new DragEvent('dragenter',{dataTransfer,bubbles:true,cancelable:true,composed:true}));
  });
  await expect(upload(page)).toHaveAttribute('dragging');
  await page.evaluate(() => document.dispatchEvent(new Event('dragend')));
  await expect(upload(page)).not.toHaveAttribute('dragging');
  await upload(page).evaluate(async (host:any) => {
    const wrapper=document.createElement('div');host.after(wrapper);
    const root=wrapper.attachShadow({mode:'open'});const target=document.createElement('section');target.id='reconnected-drop';root.append(target);
    host.dropTarget=target;await host.updateComplete;
    target.remove();await new Promise(resolve=>setTimeout(resolve,0));
    root.append(target);
  });
  await drop(page.locator('#reconnected-drop'),[{name:'reconnected.txt',type:'text/plain',content:'one'}]);
  await expect.poll(() => names(upload(page))).toEqual(['reconnected.txt']);
});

test('simulation automatically completes and a reset prevents an old timer completing the next attempt', async ({ page }) => {
  await page.goto('/api-examples/file-upload.html');
  await page.waitForFunction(() => Boolean(customElements.get('en-file-upload')));
  await page.clock.install();
  const demo=page.locator('.file-upload-demo');
  await demo.locator('input[type="file"]').setInputFiles(file('progress.png','image/png'));
  await demo.getByRole('button',{name:'Start simulated transfer',exact:true}).click();
  await page.clock.runFor(2000);
  await expect(demo.locator('en-progress-bar')).toHaveJSProperty('value',20);
  await demo.getByRole('button',{name:'Reset files',exact:true}).click();
  await page.clock.runFor(12000);
  await expect(demo.locator('[data-upload-receipt]')).toHaveCount(0);
  await demo.locator('input[type="file"]').setInputFiles(file('next.png','image/png'));
  await demo.getByRole('button',{name:'Start simulated transfer',exact:true}).click();
  await page.clock.runFor(10000);
  await expect(demo.locator('[data-upload-receipt]')).toContainText('next.png');
  await expect(demo.locator('en-progress-bar')).toHaveCount(0);
});
