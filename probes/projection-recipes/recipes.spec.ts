import {test,expect} from '@playwright/test';

test.beforeEach(async({page})=>{await page.goto('/');await expect(page.locator('body')).toHaveAttribute('data-ready','true');});
for(const mode of ['manual','named']){
 test(`${mode} breadcrumb projection retains native links, listeners and explicit semantics`,async({page,browserName})=>{
  const host=page.locator('#'+mode),link=host.getByRole('link',{name:'Projects',exact:true});
  await expect(host.getByRole('listitem')).toHaveCount(3);await expect(host.locator('[aria-current]')).toHaveAttribute('aria-current','page');
  await link.evaluate(node=>{(window as any).originalLink=node;node.querySelector('strong')!.textContent='All projects';});
  await expect(link).toHaveCount(0);const renamed=host.getByRole('link',{name:'All projects',exact:true});
  await renamed.focus();await renamed.press('Enter');await expect(page).toHaveURL(/#projects$/);await expect(renamed).toHaveAttribute('data-clicks','1');
  expect(await renamed.evaluate(node=>node===(window as any).originalLink)).toBe(true);
  await page.keyboard.press(browserName==='webkit'?'Alt+Tab':'Tab');await expect(page.getByRole('button',{name:'Project action'})).toBeFocused();
  for(const separator of await host.locator('[part=separator]').all())await expect(separator).toHaveAttribute('aria-hidden','true');
 });
 test(`${mode} visibility, authored insertion and reorder keep projection identity and separators`,async({page})=>{
  const host=page.locator('#'+mode);const middle=host.getByRole('link',{name:'Studio',exact:true});
  await middle.evaluate(node=>{(window as any).originalCrumb=node;node.setAttribute('hidden','');});
  await expect(host.getByRole('listitem')).toHaveCount(2);await expect(host.locator('[part=separator]:visible')).toHaveCount(1);
  await host.evaluate(node=>{node.children[1]!.removeAttribute('hidden');const link=document.createElement('a');link.href='#review';link.textContent='Review';node.insertBefore(link,node.lastElementChild);});
  await expect(host.getByRole('listitem')).toHaveCount(4);await expect(host.getByRole('link')).toHaveText(['Projects','Studio','Review']);
  await host.evaluate(node=>node.insertBefore(node.children[2]!,node.children[1]!));
  await expect(host.getByRole('link')).toHaveText(['Projects','Review','Studio']);
  expect(await middle.evaluate(node=>node===(window as any).originalCrumb)).toBe(true);
 });
 test(`${mode} diagnostics recover and disconnect releases only owned slot metadata`,async({page})=>{
  const host=page.locator('#'+mode);
  await host.evaluate(node=>{const bad=document.createElement('button');bad.textContent='Invalid crumb';node.append(bad);});
  await expect(host.getByRole('status')).toContainText('require direct native');
  await host.evaluate(node=>node.querySelector('button')!.remove());await expect(host.getByRole('status')).not.toBeVisible();
  await host.evaluate(node=>{(window as any).detachedPath=node;node.remove();});
  expect(await page.evaluate(()=>[...(window as any).detachedPath.children].every(node=>!node.hasAttribute('slot')))).toBe(true);
  await page.evaluate(()=>{const node=(window as any).detachedPath;node.children[1].textContent='Reconnected studio';document.querySelector('main')!.prepend(node);});
  await expect(host.getByRole('link',{name:'Reconnected studio'})).toBeVisible();await expect(host.getByRole('listitem')).toHaveCount(3);
 });
}
test('slotted navigation keeps native keyboard/history and current location author-owned',async({page,browserName})=>{
 const host=page.locator('consumer-navigation');await expect(host.getByRole('navigation',{name:'Project sections'})).toBeVisible();
 const first=host.getByRole('link',{name:'Projects',exact:true});await first.focus();await first.press(browserName==='webkit'?'Alt+Tab':'Tab');
 const studio=host.getByRole('link',{name:'Studio',exact:true});await expect(studio).toBeFocused();await studio.press('Enter');await expect(page).toHaveURL(/#studio$/);
 await expect(studio).toHaveAttribute('aria-current','location');await page.goBack();await expect(page).not.toHaveURL(/#studio$/);
 await expect(studio).toHaveAttribute('aria-current','location');
 await studio.evaluate(node=>node.addEventListener('click',event=>event.preventDefault(),{once:true}));await studio.click();await expect(page).not.toHaveURL(/#studio$/);
});
test('selection descriptors drive native radio names, disabled state and synchronous veto',async({page})=>{
 const host=page.locator('#options'),final=host.getByRole('radio',{name:'Final version',exact:true});
 await expect(host.getByRole('radio',{name:'Draft version',exact:true})).toBeChecked();await expect(host.getByRole('radio',{name:'Locked version',exact:true})).toBeDisabled();
 await final.check();await expect(host.getByLabel('Selected version')).toHaveText('final');
 await host.evaluate(node=>node.addEventListener('en-change',event=>{(window as any).tentative=(node as any).value;event.preventDefault();},{once:true}));
 await host.getByRole('radio',{name:'Draft version',exact:true}).click();await expect(final).toBeChecked();expect(await page.evaluate(()=>(window as any).tentative)).toBe('draft');
 await expect(page.locator('#other').getByLabel('Selected version')).toHaveText('draft');
});
test('native radio and label nodes survive authored edits and authoritative writes stay silent',async({page})=>{
 const host=page.locator('#options'),draft=host.getByRole('radio',{name:'Draft version',exact:true});
 await draft.focus();await draft.evaluate(node=>(window as any).originalRadio=node);
 await host.evaluate(node=>{(window as any).originalLabel=node.firstElementChild;node.firstElementChild!.querySelector('strong')!.textContent='Working';const child=document.createElement('en-segmented-item');child.setAttribute('value','print');child.textContent='Print version';node.append(child);});
 const renamed=host.getByRole('radio',{name:'Working version',exact:true});await expect(renamed).toBeFocused();
 expect(await renamed.evaluate(node=>node===(window as any).originalRadio)).toBe(true);
 expect(await host.evaluate(node=>node.firstElementChild===(window as any).originalLabel)).toBe(true);
 await host.getByRole('radio',{name:'Print version',exact:true}).check();
 await host.evaluate(node=>{(window as any).events=0;node.addEventListener('en-change',()=>((window as any).events++));(node as any).value='draft';});
 await expect(renamed).toBeChecked();expect(await page.evaluate(()=>(window as any).events)).toBe(0);
});
test('invalid choice labels fail visibly and recover without fighting authored attributes',async({page})=>{
 const host=page.locator('#options');
 await host.evaluate(node=>{const button=document.createElement('button');button.textContent='Nested action';node.firstElementChild!.append(button);});
 await expect(host.getByRole('group',{name:'Output versions'}).getByRole('status')).toContainText('noninteractive');await expect(host.getByRole('radio')).toHaveCount(0);
 await host.evaluate(node=>node.querySelector('button')!.remove());await expect(host.getByRole('radio')).toHaveCount(3);
 await host.evaluate(node=>node.children[1]!.setAttribute('hidden',''));await expect(host.getByRole('radio')).toHaveCount(2);
 await host.evaluate(node=>node.children[1]!.removeAttribute('hidden'));await expect(host.getByRole('radio',{name:'Final version',exact:true})).toBeVisible();
});
test('choice disconnect/reconnect reconciles children and transfers projection ownership',async({page})=>{
 const host=page.locator('#options');await host.getByRole('radio',{name:'Final version',exact:true}).check();
 await host.evaluate(node=>{(window as any).detachedOptions=node;node.remove();});
 expect(await page.evaluate(()=>[...(window as any).detachedOptions.children].every(node=>!node.hasAttribute('slot')))).toBe(true);
 await page.evaluate(()=>{const node=(window as any).detachedOptions;node.children[1].textContent='Updated final';document.querySelector('main')!.append(node);});
 await expect(host.getByRole('radio',{name:'Updated final',exact:true})).toBeChecked();
 await page.locator('#other').evaluate(node=>{node.append((window as any).detachedOptions.lastElementChild);});
 await expect(page.locator('#other').getByRole('radio',{name:'Locked version',exact:true})).toBeDisabled();
 await expect(host.getByRole('radio',{name:'Locked version',exact:true})).toHaveCount(0);
});
test('narrow enlarged RTL projection keeps readable labels and native source order',async({page})=>{
 await page.setViewportSize({width:320,height:800});await page.evaluate(()=>{document.documentElement.dir='rtl';document.documentElement.style.fontSize='24px';document.querySelector('#manual strong')!.textContent='A long project name that remains readable';});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await expect(page.locator('#manual').getByRole('link')).toHaveText(['A long project name that remains readable','Studio']);
 await expect(page.locator('#options').getByRole('radio',{name:'Draft version',exact:true})).toBeVisible();
});
