import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
const url = '/api-examples/multi-step.html';
const root = (page: Page) => page.locator('[data-multi-step]');
const steps = (page: Page) => root(page).locator('en-progress-steps');
async function load(page: Page, path = url) {
	await page.goto(path);
	await expect(page.locator('en-api-example-app, en-workflows-app')).not.toHaveAttribute('data-ssr');
	await expect(steps(page)).toBeVisible();
	if (await steps(page).locator('summary').isVisible()) await expect(steps(page).locator('summary')).toContainText('Step 1 of 3');
	else await expect(steps(page).getByRole('button', { name: /Project details/ })).toBeVisible();
}
async function details(page: Page) {
	await root(page).getByRole('textbox', { name: 'Project name', exact: true }).fill('Autumn campaign');
	await root(page).getByRole('textbox', { name: 'Work email', exact: true }).fill('review@example.com');
	await root(page).getByRole('button', { name: 'Continue', exact: true }).click();
	await expect(root(page).getByRole('heading', { name: 'Step 2 of 3: Review date' })).toBeFocused();
}
test('server delivery and hydration retain the ordered steps and first fields', async ({ browser, page }) => {
	const context = await browser.newContext({ javaScriptEnabled: false });
	try {
		const server = await context.newPage(); await server.goto(url);
		await expect(steps(server).getByRole('listitem')).toHaveCount(3);
		await expect(steps(server).locator('[aria-current="step"]')).toContainText('Project details');
		await expect(root(server).getByRole('textbox', { name: 'Project name', exact: true })).toBeVisible();
		await expect(steps(server).getByRole('button', { name: /Review date/ })).toBeDisabled();
	} finally { await context.close(); }
	await load(page);
	await expect(steps(page).getByRole('listitem')).toHaveCount(3);
	await expect(steps(page)).not.toHaveAttribute('size');
});
test('invalid submission focuses summary and its links focus encapsulated fields', async ({ page }) => {
	await load(page);
	await root(page).getByRole('button', { name: 'Continue', exact: true }).click();
	const summary = root(page).locator('en-validation-summary');
	await expect(summary.getByRole('region', { name: 'There is a problem' })).toBeFocused();
	await expect(summary.getByRole('link')).toHaveCount(2);
	await summary.getByRole('link', { name: 'Enter a project name.' }).click();
	await expect(root(page).getByRole('textbox', { name: 'Project name', exact: true })).toBeFocused();
	await root(page).getByRole('textbox', { name: 'Project name', exact: true }).fill('Autumn campaign');
	await expect(summary.getByRole('link')).toHaveCount(1);
	await summary.getByRole('link').click();
	const email = root(page).getByRole('textbox', { name: 'Work email', exact: true });
	await expect(email).toBeFocused(); await email.fill('name@local'); await email.press('Enter');
	await expect(summary.getByRole('region')).toBeFocused();
	await expect(steps(page)).toHaveJSProperty('value', 'details');
});
test('step veto, authoritative writes, dynamic items and static delivery use one contract', async ({ page }) => {
	await load(page);
	// Independent instance avoids the application's validation policy during API probes.
	await page.evaluate(() => { const el: any = document.createElement('en-progress-steps'); el.id = 'api-step-probe'; el.items = [{value:'a',label:'Alpha'},{value:'b',label:'Beta'},{value:'c',label:'Gamma'}]; el.value='a'; document.body.append(el); });
	const el=page.locator('#api-step-probe');
	await el.evaluate((host: any) => host.addEventListener('en-change', (e: Event) => { (window as any).proposal=host.value; e.preventDefault(); }, {once:true}));
	await el.getByRole('button', {name:/Beta/}).click();
	expect(await page.evaluate(() => (window as any).proposal)).toBe('b'); await expect(el).toHaveJSProperty('value','a');
	await el.evaluate((host:any)=>host.addEventListener('en-change',(e:Event)=>{e.preventDefault();host.value='c';},{once:true}));
	await el.getByRole('button',{name:/Beta/}).press('Enter'); await expect(el).toHaveJSProperty('value','c');
	await el.getByRole('button',{name:/Beta/}).focus();
	await el.evaluate((host:any)=>host.items=[{value:'a',label:'Alpha'},{value:'c',label:'Gamma'}]);
	await expect(el.getByRole('button',{name:/Gamma/})).toBeFocused();
	await el.evaluate((host:any)=>host.readOnly=true);await expect(el.getByRole('button')).toHaveCount(0);await expect(el.locator('[aria-current="step"]')).toContainText('Gamma');
});
test('summary focus commands can be intercepted without moving focus', async ({ page }) => {
	await load(page);await root(page).getByRole('button',{name:'Continue',exact:true}).click();
	const summary=root(page).locator('en-validation-summary');const link=summary.getByRole('link').first();
	await summary.evaluate(host=>host.addEventListener('en-action',event=>event.preventDefault(),{once:true}));
	await link.focus();await link.press('Enter');await expect(link).toBeFocused();
});
test('revisits preserve data, reject forward invalid edits, and failed save can retry', async ({ page }) => {
	await load(page);await details(page);await root(page).getByRole('button',{name:'Continue',exact:true}).click();
	await expect(root(page).getByRole('heading',{name:'Step 3 of 3: Confirm brief'})).toBeFocused();
	await steps(page).getByRole('button',{name:/Project details/}).click();
	await expect(root(page).getByRole('textbox',{name:'Project name',exact:true})).toHaveValue('Autumn campaign');
	await root(page).getByRole('textbox',{name:'Project name',exact:true}).fill('');
	await steps(page).getByRole('button',{name:/Confirm brief/}).click();
	await expect(root(page).locator('en-validation-summary').getByRole('region')).toBeFocused();
	await root(page).getByRole('textbox',{name:'Project name',exact:true}).fill('Revised campaign');
	await steps(page).getByRole('button',{name:/Confirm brief/}).click();
	await root(page).getByRole('button',{name:'Create brief',exact:true}).click();
	await expect(root(page).getByRole('status')).toHaveText('Saving your brief…');
	await expect(root(page).locator('[data-save-error]')).toBeFocused();
	await root(page).getByText('Review scenarios',{exact:true}).click();
	await root(page).getByRole('checkbox',{name:'Simulate save failure',exact:true}).uncheck();
	await root(page).getByRole('button',{name:'Try again',exact:true}).click();
	await expect(root(page).getByRole('heading',{name:'Project brief created'})).toBeFocused();
	await expect(root(page).getByRole('status')).toContainText('No information was sent');
	await expect(root(page).getByRole('textbox')).toHaveCount(0);
	await expect(root(page).getByRole('button',{name:'Create brief',exact:true})).toHaveCount(0);
});
test('workflow is separately addressable and source and API guidance are available', async ({ page }) => {
	await load(page,'/workflows/multi-step.html?progress-report');await details(page);
	await page.goto(url);await expect(page.getByText('View example code',{exact:false})).toBeVisible();
	for(const component of ['en-progress-steps','en-validation-summary']) {
		await page.goto(`/api-reference.html?component=${component}`);await expect(page.locator('#api-form-navigation-guide')).toBeVisible();
		await expect(page.locator('#api-form-navigation-guide')).toContainText('preventDefault()');
	}
});
test('narrow RTL and inspired themes retain readable steps, error focus and bounds', async ({ page },info) => {
	await page.setViewportSize({width:390,height:844});await load(page);
	await root(page).getByRole('button',{name:'Continue',exact:true}).click();
	await root(page).evaluate(el=>el.setAttribute('dir','rtl'));
	for(const theme of ['spectrum-inspired','fluent-inspired','astryx-inspired','shadcn-inspired','holotable-inspired']) {
		await page.getByRole('combobox',{name:'Inspired theme',exact:true}).selectOption(theme);
		await expect(page.getByRole('status',{name:'Theme result'})).toContainText('applied');
		const summary=root(page).locator('en-validation-summary');await summary.evaluate((el:any)=>el.focus());
		await expect(summary.getByRole('region')).toBeFocused();
		expect(await root(page).evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
		for(const button of await steps(page).locator('summary').all()) {const bounds=(await button.boundingBox())!;expect(bounds.height).toBeGreaterThanOrEqual(24);expect(bounds.width).toBeGreaterThanOrEqual(24);}
	}
	if(info.project.name==='chromium')await root(page).screenshot({path:info.outputPath('form-mobile-theme.png')});
	await page.emulateMedia({forcedColors:'active'});await expect(root(page).locator('en-validation-summary').getByRole('region')).toBeVisible();
	if(info.project.name==='chromium')await root(page).screenshot({path:info.outputPath('form-mobile-rtl.png')});
});

test('reset during a pending save prevents a stale completion from changing the new form', async ({ page }) => {
	await load(page);await details(page);await root(page).getByRole('button',{name:'Continue',exact:true}).click();
	await root(page).getByRole('button',{name:'Create brief',exact:true}).click();
	await expect(root(page).getByRole('status')).toHaveText('Saving your brief…');
	await page.getByRole('button',{name:'Reset example',exact:true}).click();
	await expect(steps(page)).toHaveJSProperty('value','details');
	await expect(root(page).getByRole('textbox',{name:'Project name',exact:true})).toHaveValue('');
	// The known demo completion delay is 450ms: observe past that obsolete request.
	await page.waitForTimeout(550);
	await expect(root(page).locator('[data-save-error]')).toBeHidden();
	await expect(root(page).getByRole('status')).toBeEmpty();
});
test('an early server-rendered field edit survives hydration without duplicate controls', async ({ page }) => {
	let release!:()=>void; const gate=new Promise<void>(resolve=>{release=resolve;});
	await page.route('**/assets/*.js',async route=>{await gate;await route.continue();});
	await page.goto('/workflows/multi-step.html',{waitUntil:'commit'});
	const descriptor=steps(page).locator('en-progress-step').first();
	await expect(descriptor).toHaveCount(1); const originalDescriptor=await descriptor.elementHandle();
	const input=root(page).getByRole('textbox',{name:'Project name',exact:true});
	await expect(input).toHaveCount(1); const original=await input.elementHandle(); await input.fill('Early project draft');
	release(); await expect(page.locator('en-workflows-app')).not.toHaveAttribute('data-ssr');
	await expect(input).toHaveCount(1); expect(await input.evaluate((node,old)=>node===old,original)).toBe(true);
	await expect(input).toHaveValue('Early project draft');
	expect(await descriptor.evaluate((node,old)=>node===old,originalDescriptor)).toBe(true);
	await expect(steps(page)).not.toHaveAttribute('data-en-form-children');
	await root(page).getByRole('textbox',{name:'Work email',exact:true}).fill('early@example.com');
	await root(page).getByRole('button',{name:'Continue',exact:true}).click();
	await expect(steps(page)).toHaveJSProperty('value','delivery');
});

test('initial and invalid form accessibility has no scoped WCAG violations', async ({ page }) => {
 await load(page);
 for (const invalid of [false,true]) {
  if(invalid)await root(page).getByRole('button',{name:'Continue',exact:true}).click();
  const result=await new AxeBuilder({page}).include('[data-multi-step]').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(result.violations).toEqual([]);
 }
});


test('compact steps work before hydration, expand natively, and keep one list', async ({ browser }) => {
	const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
	try {
		const page = await context.newPage(); await page.goto(url);
		const el = steps(page); const summary = el.locator('summary');
		await expect(summary).toContainText('Step 1 of 3 · Project details');
		await expect(el.getByRole('list')).toHaveCount(0);
		await summary.click(); await expect(el.getByRole('listitem')).toHaveCount(3);
		await summary.press('Space'); await expect(el.getByRole('list')).toHaveCount(0);
		await page.setViewportSize({width:1440,height:1000});
		await expect(summary).toBeHidden(); await expect(el.getByRole('listitem')).toHaveCount(3);
	} finally { await context.close(); }
});
test('compact step selection closes after acceptance, retains veto and restores keyboard focus', async ({ page }, info) => {
	await page.setViewportSize({width:390,height:844}); await load(page); await details(page);
	const el = steps(page); const summary = el.locator('summary');
	await expect(summary).toContainText('Step 2 of 3 · Review date');
	expect((await new AxeBuilder({page}).include('[data-multi-step]').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
	await summary.click(); await el.getByRole('button',{name:/Project details/}).click();
	await expect(el.locator('details')).not.toHaveAttribute('open');
	await expect(root(page).getByRole('heading',{name:'Step 1 of 3: Project details'})).toBeFocused();
	await root(page).getByRole('textbox',{name:'Project name',exact:true}).fill('');
	await summary.click(); await el.getByRole('button',{name:/Review date/}).click();
	await expect(el.locator('details')).toHaveAttribute('open');
	await expect(root(page).locator('en-validation-summary').getByRole('region')).toBeFocused();
	await el.getByRole('button',{name:/Project details/}).focus(); await page.keyboard.press('Escape');
	await expect(summary).toBeFocused(); await expect(el.getByRole('list')).toHaveCount(0);
	if(info.project.name==='chromium') await root(page).screenshot({path:info.outputPath('compact-steps.png')});
});
test('container resizing preserves focused steps and summary label content is customizable', async ({ page }) => {
	await load(page);
	await page.evaluate(() => { const el:any=document.createElement('en-progress-steps');el.id='resize-steps';el.style.width='700px';el.items=[{value:'a',label:'Alpha'},{value:'b',label:'Beta'}];el.value='a';el.innerHTML='<strong slot="step-a">Rich Alpha</strong>';document.body.append(el); });
	const el=page.locator('#resize-steps'); const summary=el.locator('summary');
	await el.getByRole('button',{name:/Rich Alpha/}).focus(); await el.evaluate(host=>host.style.width='300px');
	await expect(el.locator('details')).toHaveAttribute('open'); await expect(el.getByRole('button',{name:/Rich Alpha/})).toBeFocused();
	await page.keyboard.press('Escape'); await expect(summary).toBeFocused();
	await el.evaluate(host=>host.style.width='700px'); await expect(el.getByRole('button',{name:/Rich Alpha/})).toBeFocused();
	await el.evaluate((host:any)=>{host.style.width='300px';host.items=host.items.map((item:any)=>({...item,status:'complete'}));});
	await expect(summary).toContainText('All 2 steps complete');
	await el.evaluate(host=>host.insertAdjacentHTML('beforeend','<span slot="summary">Custom localized progress</span>'));
	await expect(summary).toHaveAccessibleName('Custom localized progress');
});

test('child steps respond to pasted HTML, edits, reordering, transfer and array fallback', async ({page}) => {
	await load(page);
	await page.evaluate(() => {
		const host:any=document.createElement('en-progress-steps');host.id='child-probe';host.value='a';host.items=[{value:'fallback',label:'Array fallback'}];
		host.innerHTML='<en-progress-step value="a"><strong>Alpha</strong></en-progress-step><en-progress-step value="b">Beta</en-progress-step>';
		document.body.append(host);
	});
	const host=page.locator('#child-probe');
	await expect(host.getByRole('button')).toHaveCount(2);
	await host.evaluate((el:any)=>el.insertAdjacentHTML('beforeend','<en-progress-step value="c">Gamma</en-progress-step>'));
	await expect(host.getByRole('button')).toHaveCount(3);
	await host.getByRole('button',{name:/Beta/}).focus();
	await host.evaluate(el=>el.querySelector('[value="b"]')!.remove());
	await expect(host.getByRole('button',{name:/Gamma/})).toBeFocused();
	await host.evaluate((el:any)=>{const item=el.querySelector('[value="c"]');item.label='Revised';item.status='complete';item.disabled=true;});
	await expect(host.getByRole('button',{name:/Revised/})).toHaveCount(0); // Rich content stays authored; label is compact fallback.
	await expect(host.getByRole('button',{name:/Gamma.*Complete/})).toBeDisabled();
	await host.evaluate((el:any)=>{const item=el.querySelector('[value="c"]');item.disabled=false;item.textContent='Revised';el.prepend(item);});
	await expect(host.getByRole('button').first()).toContainText('Revised');
	await host.evaluate((el:any)=>el.addEventListener('en-change',(e:Event)=>{e.preventDefault();},{once:true}));
	await host.getByRole('button',{name:/Revised/}).click();await expect(host).toHaveJSProperty('value','a');
	await host.evaluate((el:any)=>el.addEventListener('en-change',(e:Event)=>{e.preventDefault();el.value='c';},{once:true}));
	await host.getByRole('button',{name:/Revised/}).click();await expect(host).toHaveJSProperty('value','c');
	await host.evaluate((el:any)=>{const second=document.createElement('en-progress-steps');second.id='received-probe';document.body.append(second);second.append(el.querySelector('[value="c"]'));});
	await expect(page.locator('#received-probe').getByRole('button')).toContainText('Revised');
	await host.evaluate(el=>el.querySelector('en-progress-step')!.remove());
	await expect(host.getByRole('button')).toContainText('Array fallback');
});

test('authored error links preserve bindings, recover removed-link focus, and update targets',async({page})=>{
	await load(page);
	await page.evaluate(()=>{
		const host:any=document.createElement('en-validation-summary');host.id='links-probe';host.items=[{target:'target-one',message:'Fallback issue'}];
		host.innerHTML='<a href="#target-one">First <strong>issue</strong></a><a href="#target-two">Second issue</a>';
		const one=document.createElement('input');one.id='target-one';const two=document.createElement('input');two.id='target-two';document.body.append(one,two,host);
		(window as any).authoredLink=host.firstElementChild;
		host.firstElementChild.addEventListener('click',()=>{(window as any).authoredClicks=((window as any).authoredClicks??0)+1;});
	});
	const host=page.locator('#links-probe');
	await expect(host.getByRole('link')).toHaveCount(2);
	await host.getByRole('link').first().click();await expect(page.locator('#target-one')).toBeFocused();
	expect(await page.evaluate(()=>(window as any).authoredClicks)).toBe(1);
	await host.evaluate(el=>el.firstElementChild!.setAttribute('href','#target-two'));
	await host.getByRole('link').first().click();await expect(page.locator('#target-two')).toBeFocused();
	await host.getByRole('link').first().focus();
	await host.evaluate(el=>el.firstElementChild!.remove());
	await expect(host.getByRole('link')).toBeFocused();
	await page.locator('#target-one').focus();
	await host.evaluate(el=>el.firstElementChild!.remove());
	await expect(host.getByRole('link')).toHaveText('Fallback issue');await expect(page.locator('#target-one')).toBeFocused();
});

test('workflow switches between child and array authoring without resetting drafts or errors',async({page})=>{
	await load(page);
	await expect(steps(page).locator('en-progress-step')).toHaveCount(3);
	await root(page).getByRole('button',{name:'Continue',exact:true}).click();
	await expect(root(page).locator('en-validation-summary > a')).toHaveCount(2);
	await root(page).getByText('Review scenarios',{exact:true}).click();
	const toggle=root(page).getByRole('checkbox',{name:'Author steps and errors with child content',exact:true});
	await toggle.uncheck();await expect(steps(page).locator('en-progress-step')).toHaveCount(0);
	await expect(root(page).locator('en-validation-summary').getByRole('link')).toHaveCount(2);
	await toggle.check();await expect(steps(page).locator('en-progress-step')).toHaveCount(3);
	await expect(root(page).locator('en-validation-summary > a')).toHaveCount(2);
});

test('invalid child edits show an error and recover when corrected, hidden children do not reveal fallback',async({page})=>{
	await load(page);
	await steps(page).evaluate((el:any)=>{el.insertAdjacentHTML('beforeend','<en-progress-step value="details">Duplicate</en-progress-step>');});
	await expect(steps(page).locator('[part~="error"]')).toContainText('unique');
	await steps(page).evaluate(el=>el.lastElementChild!.remove());
	await expect(steps(page).getByRole('button')).toHaveCount(3);
	await steps(page).evaluate(el=>el.querySelectorAll('en-progress-step').forEach(item=>item.setAttribute('hidden','')));
	await expect(steps(page).getByRole('button')).toHaveCount(0);
	await steps(page).evaluate(el=>el.querySelectorAll('en-progress-step').forEach(item=>item.removeAttribute('hidden')));
	await expect(steps(page).getByRole('button')).toHaveCount(3);
});
