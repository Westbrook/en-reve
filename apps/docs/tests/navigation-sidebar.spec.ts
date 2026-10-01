import { test, expect } from '@playwright/test';
const route = '/api-examples/navigation-sidebar.html?progress-report';
const navSelector = '#workspace-navigation';
async function start(page: import('@playwright/test').Page, width = 1100) {
  await page.setViewportSize({ width, height: 850 });
  await page.goto(route);
  await page.waitForFunction(() => !!customElements.get('en-navigation-group'));
  await page.locator(navSelector).evaluate(async (el: any) => { await el.updateComplete; });
}
test('native groups, current branch recovery and dynamic authored links', async ({ page, browserName }) => {
  await start(page);
  const nav = page.locator(navSelector), group = page.locator('#library-group');
  await expect(nav.locator('nav')).toHaveAttribute('aria-label', 'Project navigation');
  await expect(group.getByRole('link', { name: 'Archive', exact: true })).toBeHidden();
  await group.locator('summary').click();
  await expect(group.getByRole('link', { name: 'Archive', exact: true })).toBeVisible();
  await expect(page).not.toHaveURL(/#workspace-archive$/);
  await group.locator('summary').focus();
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
  await expect(group.getByRole('link').first()).toBeFocused();
  await group.getByRole('link', { name: 'Archive', exact: true }).click();
  await expect(page).toHaveURL(/#workspace-archive$/);
  await expect(group.getByRole('link', { name: 'Archive', exact: true })).toHaveAttribute('aria-current', 'location');
  await group.locator('summary').click();
  await expect(group).not.toHaveAttribute('open');
  await nav.evaluate((el: any) => el.revealCurrent());
  await expect(group).toHaveAttribute('open', '');
  await page.getByText('Dynamic content and review scenarios', { exact: true }).click();
  await page.getByRole('button', { name: 'Toggle archive availability' }).click();
  await group.locator('summary').click();
  await nav.evaluate((el: any) => el.revealCurrent());
  await expect(group).not.toHaveAttribute('open');
  await page.getByRole('button', { name: 'Toggle archive availability' }).click();
  await expect(group).toHaveAttribute('open', '');
  await page.getByRole('button', { name: 'Add or remove a link' }).click();
  await expect(nav.getByRole('link', { name: 'Recently added study' })).toBeVisible();
  await page.getByRole('button', { name: 'Add or remove a link' }).click();
  await expect(nav.getByRole('link', { name: 'Recently added study' })).toHaveCount(0);
  expect(await nav.locator('[role="menu"], [role="menuitem"]').count()).toBe(0);
});
test('responsive disclosure, Escape and focus continuity across resize', async ({ page }) => {
  await start(page, 390);
  const nav = page.locator(navSelector), summary = nav.locator(':scope > details > summary');
  await expect(nav.getByRole('link', { name: 'Overview', exact: true })).toBeHidden();
  await summary.click();
  const link = nav.getByRole('link', { name: 'Artwork', exact: true });
  await link.focus();
  await page.keyboard.press('Escape');
  await expect(summary).toBeFocused();
  await expect(link).toBeHidden();
  await page.setViewportSize({ width: 1100, height: 850 });
  await expect(nav.getByRole('link', { name: 'Overview', exact: true })).toBeFocused();
  await link.focus();
  await link.evaluate(el => (window as any).originalNavLink = el);
  await page.setViewportSize({ width: 390, height: 850 });
  await expect(link).toBeFocused();
  await expect(link).toBeVisible();
  expect(await link.evaluate(el => (window as any).originalNavLink === el)).toBe(true);
  await summary.click();
  await page.setViewportSize({ width: 1100, height: 850 });
  await page.locator('#workspace-overview').getByRole('heading', { name: 'Project overview', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 850 });
  await expect(link).toBeHidden();
});
test('programmatic group collapse recovers descendant focus', async ({ page }) => {
  await start(page);
  const group=page.locator('#project-group');
  await page.locator(navSelector).getByRole('link', {name:'Artwork', exact:true}).focus();
  await group.evaluate((el:any)=>el.open=false);
  await expect(group.locator(':scope > details > summary')).toBeFocused();
});
test('SSR native disclosure links work without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 850 } });
  const page = await context.newPage();
  try {
    await page.goto(baseURL + route);
    const nav = page.locator(navSelector);
    await expect(nav.getByRole('link', { name: 'Overview', exact: true })).toBeVisible();
    await page.locator('#library-group summary').click();
    await nav.getByRole('link', { name: 'Archive', exact: true }).click();
    await expect(page).toHaveURL(/#workspace-archive$/);
    await nav.locator(':scope > details > summary').click();
    await expect(nav.getByRole('link', { name: 'Overview', exact: true })).toBeHidden();
  } finally { await context.close(); }
});
test('RTL long labels and compact visual presentation', async ({ page }, info) => {
  await start(page);
  await page.locator('[data-sidebar-demo]').evaluate(el => el.setAttribute('dir', 'rtl'));
  await page.locator('#library-group summary').click();
  const nav=page.locator(navSelector);
  expect(await nav.evaluate(el => el.scrollWidth <= el.clientWidth+1)).toBe(true);
  await info.attach('sidebar-wide-rtl', {body:await page.locator('[data-sidebar-demo] .workspace').screenshot(),contentType:'image/png'});
  await page.setViewportSize({width:390,height:850});
  await nav.locator(':scope > details > summary').click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await info.attach('sidebar-mobile-rtl', {body:await page.locator('[data-sidebar-demo] .sidebar').screenshot(),contentType:'image/png'});
});
test('early group interaction and authored nodes survive hydration', async ({ page }) => {
  await page.setViewportSize({width:1100,height:850});
  let release!:()=>void;
  const gate=new Promise<void>(resolve=>release=resolve);
  await page.route('**/assets/*.js',async route=>{await gate;await route.continue();});
  await page.goto(route,{waitUntil:'commit'});
  const group=page.locator('#library-group');
  await group.locator('summary').click();
  const link=group.getByRole('link',{name:'Archive',exact:true});
  await link.focus();
  await link.evaluate(el=>(window as any).earlyArchive=el);
  release();
  await page.waitForFunction(()=>!!customElements.get('en-navigation-group'));
  await expect(link).toBeVisible();
  await expect(link).toBeFocused();
  expect(await link.evaluate(el=>(window as any).earlyArchive===el)).toBe(true);
});
test('sidebar API describes groups, state, Parts and the live example',async({page})=>{
 await page.goto('/api-reference.html?component=en-navigation&progress-report');
 const guide=page.locator('#api-navigation-guide');
 await expect(guide).toHaveCount(1);
 await expect(guide).toContainText('revealCurrent()');
 await expect(guide).toContainText('collapse-at');
 await expect(guide).toContainText('disclosure');
 await expect(guide.getByRole('link',{name:'responsive workspace and complete source'})).toHaveAttribute('href',/navigation-sidebar.*progress-report/);
});
test('inspired themes preserve focus and mobile bounds', async ({page}, info)=>{
 await start(page,390);
 const nav=page.locator(navSelector);
 await nav.locator(':scope > details > summary').click();
 for(const theme of ['spectrum-inspired','fluent-inspired','astryx-inspired','shadcn-inspired','holotable-inspired']){
  await page.getByRole('combobox',{name:'Inspired theme',exact:true}).selectOption(theme);
  await expect(page.getByRole('status',{name:'Theme result'})).toContainText('applied');
  const summary=page.locator('#project-group').locator(':scope > details > summary');
  await summary.focus(); await expect(summary).toBeFocused();
  const box=await summary.boundingBox();expect(box!.height).toBeGreaterThanOrEqual(24);
  expect(await nav.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
 }
 await info.attach('sidebar-holotable-mobile',{body:await page.locator('[data-sidebar-demo] .sidebar').screenshot(),contentType:'image/png'});
});

test('Drawer comparison keeps one navigation and closes only for accepted destinations',async({page},info)=>{
 await start(page,1100);
 const demo=page.locator('en-sidebar-drawer-demo'),nav=demo.locator('#drawer-workspace-navigation');
 await expect(nav.getByRole('link',{name:'Overview',exact:true})).toBeVisible();
 await nav.evaluate(el=>(window as any).drawerNav=el);
 await demo.getByRole('button',{name:'Preview mobile Drawer',exact:true}).click();
 const opener=demo.getByRole('button',{name:'Open project navigation',exact:true});
 await expect(opener).toBeVisible();await expect(nav).toBeHidden();
 await opener.click();
 const dialog=demo.getByRole('dialog',{name:'Project navigation',exact:true});await expect(dialog).toBeVisible();
 await nav.locator('summary').filter({hasText:'Library'}).click();
 await expect(dialog).toBeVisible();
 await info.attach('drawer-sidebar-mobile',{body:await dialog.screenshot(),contentType:'image/png'});
 const archive=nav.getByRole('link',{name:'Archive',exact:true});
 await archive.evaluate(el=>el.addEventListener('click',e=>e.preventDefault(),{once:true}));await archive.click();await expect(dialog).toBeVisible();
 await archive.click();await expect(dialog).toBeHidden();await expect(page).toHaveURL(/#drawer-archive$/);
 await expect(demo.locator('#drawer-archive')).toBeFocused();
 await opener.click();await expect(archive).toBeVisible();await archive.focus();await page.keyboard.press('Escape');
 await expect(dialog).toBeHidden();await expect(opener).toBeFocused();
 expect(await nav.evaluate(el=>el===(window as any).drawerNav)).toBe(true);
 await demo.getByRole('button',{name:'Use viewport layout',exact:true}).click();
 await expect(archive).toBeVisible();
});
test('Drawer layout responds to resize and retains focused nested links',async({page})=>{
 await start(page,1100);
 const demo=page.locator('en-sidebar-drawer-demo'),nav=demo.locator('#drawer-workspace-navigation');
 await nav.locator('summary').filter({hasText:'Library'}).click();
 const link=nav.getByRole('link',{name:'Archive',exact:true});await link.focus();
 await page.setViewportSize({width:390,height:850});
 const dialog=demo.getByRole('dialog',{name:'Project navigation',exact:true});
 await expect(dialog).toBeVisible();await expect(link).toBeFocused();
 await page.setViewportSize({width:1100,height:850});
 await expect(dialog).toBeHidden();await expect(link).toBeFocused();await expect(link).toBeVisible();
 await demo.locator('#drawer-overview').focus();
 await page.setViewportSize({width:390,height:850});await expect(dialog).toBeHidden();
 const opener=demo.getByRole('button',{name:'Open project navigation',exact:true});await opener.click();
 await demo.getByRole('button',{name:'Close',exact:true}).click();await expect(opener).toBeFocused();
});
