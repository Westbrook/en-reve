import {test,expect,type Locator} from '@playwright/test';
const item=(host:Locator,key:string)=>host.locator(`[role=treeitem][data-key="${key}"]`);
const option=(host:Locator,key:string)=>item(host,key).locator(':scope > .en-tree-option');
const configure=(host:Locator,values:Record<string,unknown>)=>host.evaluate((n,v)=>(n as any).configure(v),values);
const selected=(host:Locator)=>host.locator('[role=treeitem][aria-selected=true]').evaluateAll(nodes=>nodes.map(n=>(n as HTMLElement).dataset.key));
const keys=(host:Locator)=>host.getByRole('treeitem').evaluateAll(nodes=>nodes.map(n=>(n as HTMLElement).dataset.key));
const move=(host:Locator,keys:string[],target:string,position='before')=>host.evaluate((n,v)=>(n as any).move(v.keys,v.target,v.position),{keys,target,position});
const finish=(host:Locator,id:number,items?:unknown[],fail=false)=>host.evaluate((n,v)=>(n as any).finish(v.id,v.items,v.fail),{id,items,fail});
for(const delivery of ['lit','css'])test.describe(delivery,()=>{
 test.beforeEach(async({page})=>{await page.goto('/?delivery='+delivery);await expect(page.locator('body')).toHaveAttribute('data-ready','true');});
 test('native tree exposes hierarchy, ordered set metadata and one keyboard entry',async({page})=>{
  const h=page.locator('consumer-tree').first();await expect(h.getByRole('tree',{name:'Project files'})).toHaveCount(1);await expect(h.getByRole('tree')).toHaveAttribute('aria-multiselectable','true');expect(await keys(h)).toEqual(['projects','brief','draft','locked','notes','archive','remote','final']);
  await expect(item(h,'projects')).toHaveAttribute('aria-expanded','true');await expect(item(h,'notes')).toHaveAttribute('aria-level','2');await expect(item(h,'notes')).toHaveAttribute('aria-posinset','4');await expect(item(h,'notes')).toHaveAttribute('aria-setsize','4');await expect(item(h,'brief')).not.toHaveAttribute('aria-expanded');await expect(h.locator('[role=treeitem][tabindex="0"]')).toHaveCount(1);
  const snapshot=await h.getByRole('tree').ariaSnapshot();expect(snapshot).toContain('treeitem "Brief"');expect(snapshot).toContain('treeitem "Locked" [disabled]');
 });
 test('click replaces, platform modifier toggles single keys and Shift ranges shrink exactly',async({page})=>{
  const h=page.locator('consumer-tree').first();await option(h,'brief').click();await option(h,'final').click({modifiers:['ControlOrMeta']});expect(await selected(h)).toEqual(['brief','final']);await option(h,'archive').click({modifiers:['ControlOrMeta']});expect(await selected(h)).toEqual(['brief','archive','final']);
  await option(h,'brief').click();await option(h,'notes').click({modifiers:['Shift']});expect(await selected(h)).toEqual(['brief','draft','notes']);await option(h,'draft').click({modifiers:['Shift']});expect(await selected(h)).toEqual(['brief','draft']);await option(h,'final').click();expect(await selected(h)).toEqual(['final']);expect(await page.evaluate(()=>getSelection()?.toString())).toBe('');
 });
 test('keyboard focus moves independently, Space toggles and select-all excludes disabled',async({page})=>{
  const h=page.locator('consumer-tree').first();await item(h,'brief').focus();await item(h,'brief').press('ArrowDown');await expect(item(h,'draft')).toBeFocused();expect(await selected(h)).toEqual([]);await item(h,'draft').press('Space');expect(await selected(h)).toEqual(['draft']);await item(h,'draft').press('Control+a');expect(await selected(h)).toEqual(['projects','brief','draft','notes','archive','remote','final']);await item(h,'draft').press('Control+a');expect(await selected(h)).toEqual([]);
 });
 test('disabled rows remain discoverable but cannot select, expand or move',async({page})=>{
  const h=page.locator('consumer-tree').first();await item(h,'locked').focus();await item(h,'locked').press('Enter');expect(await selected(h)).toEqual([]);await expect(item(h,'locked')).toBeFocused();expect(await move(h,['locked'],'archive','inside')).toBe(false);expect(await move(h,['brief'],'locked')).toBe(false);
 });
 test('collapse retains descendant selection and recovers descendant focus to its branch',async({page})=>{
  const h=page.locator('consumer-tree').first();await option(h,'brief').click();await item(h,'brief').press('ArrowLeft');await expect(item(h,'projects')).toBeFocused();await item(h,'projects').press('ArrowLeft');await expect(item(h,'brief')).toHaveCount(0);await item(h,'projects').press('ArrowRight');await expect(item(h,'brief')).toHaveAttribute('aria-selected','true');await item(h,'projects').press('ArrowRight');await expect(item(h,'brief')).toBeFocused();
 });
 test('RTL swaps branch navigation while Home and End retain preorder',async({page})=>{
  const h=page.locator('consumer-tree').first();await h.evaluate(n=>n.setAttribute('dir','rtl'));await item(h,'projects').focus();await item(h,'projects').press('ArrowRight');await expect(item(h,'projects')).toHaveAttribute('aria-expanded','false');await item(h,'projects').press('ArrowLeft');await item(h,'projects').press('ArrowLeft');await expect(item(h,'brief')).toBeFocused();await item(h,'brief').press('End');await expect(item(h,'final')).toBeFocused();await item(h,'final').press('Home');await expect(item(h,'projects')).toBeFocused();
 });
 test('selection survives collapse in native form data and sibling instances stay independent',async({page})=>{
  const h=page.locator('consumer-tree').first(),other=page.locator('consumer-tree').nth(1);await configure(h,{selected:['brief','remote-child'],expanded:[]});await h.getByRole('button',{name:'Submit selection'}).click();await expect(h.getByRole('status',{name:'Submitted selection'})).toHaveText('["brief","remote-child"]');expect(await selected(other)).toEqual([]);await expect(item(other,'brief')).toBeVisible();
 });
 test('invalid replacement is atomic and canonical keys win over legacy aliases',async({page})=>{
  const h=page.locator('consumer-tree').first();expect(await h.evaluate(async n=>{try{await(n as any).configure({items:[{key:'x',label:'X',children:[{key:'x',label:'Y'}]}]});return false;}catch{return true;}})).toBe(true);await expect(item(h,'brief')).toBeVisible();await configure(h,{items:[{key:'canonical',value:'legacy',label:'<img src=x onerror=alert(1)>'}],expanded:[]});expect(await keys(h)).toEqual(['canonical']);await expect(h.locator('img')).toHaveCount(0);await expect(item(h,'canonical')).toHaveAccessibleName('<img src=x onerror=alert(1)>');
 });
 test('move proposals preserve source order and selected ancestors subsume descendants',async({page})=>{
  const h=page.locator('consumer-tree').first();expect(await move(h,['notes','brief'],'archive','inside')).toBe(true);await item(h,'archive').focus();await item(h,'archive').press('ArrowRight');expect(await keys(h)).toEqual(['projects','draft','locked','archive','brief','notes','remote','final']);expect(await move(h,['draft','projects'],'final','after')).toBe(true);expect(await keys(h)).toEqual(['archive','brief','notes','remote','final','projects','draft','locked']);
 });
 test('cycles, lazy destinations and no-op moves do not mutate the hierarchy',async({page})=>{
  const h=page.locator('consumer-tree').first();const before=await keys(h);for(const [sources,target,position] of [[['projects'],'brief','inside'],[['brief'],'remote','inside'],[['brief'],'draft','before']] as const)expect(await move(h,[...sources],target,position)).toBe(false);expect(await keys(h)).toEqual(before);
 });
 test('application veto rejects a valid proposal without changing selection or hierarchy',async({page})=>{
  const h=page.locator('consumer-tree').first();await configure(h,{selected:['brief'],veto:true});const before=await keys(h);expect(await move(h,['brief'],'archive','inside')).toBe(false);expect(await keys(h)).toEqual(before);expect(await selected(h)).toEqual(['brief']);await expect(h.getByRole('status',{name:'Tree feedback'})).toHaveText('Move canceled.');
 });
 test('keyboard reordering moves one sibling and restores focus',async({page})=>{
  const h=page.locator('consumer-tree').first();await item(h,'brief').focus();await item(h,'brief').press('Alt+ArrowDown');expect(await keys(h)).toEqual(['projects','draft','brief','locked','notes','archive','remote','final']);await expect(item(h,'brief')).toBeFocused();await item(h,'brief').press('Alt+ArrowUp');expect((await keys(h)).slice(1,3)).toEqual(['brief','draft']);
 });
 test('native desktop drag drops inside a loaded branch',async({page})=>{
  const h=page.locator('consumer-tree').first();await item(h,'brief').locator(':scope > .en-tree-option .en-tree-drag').dragTo(option(h,'archive'));await item(h,'archive').focus();await item(h,'archive').press('ArrowRight');await expect(item(h,'brief')).toHaveAttribute('aria-level','2');await expect(item(h,'brief').locator('..')).toHaveAttribute('role','group');expect(await keys(h)).toEqual(['projects','draft','locked','notes','archive','brief','remote','final']);
 });
 test('loading presents a child placeholder with one separate status announcement',async({page})=>{
  const h=page.locator('consumer-tree').first();await item(h,'remote').focus();await item(h,'remote').press('ArrowRight');await expect(item(h,'remote').locator('.en-tree-loading')).toBeVisible();await expect(item(h,'remote').locator('.en-tree-loading')).toHaveAttribute('aria-hidden','true');await expect(h.getByRole('status',{name:'Tree feedback'})).toHaveText('Loading Remote files.');expect(await keys(h)).not.toContain('remote-a');await finish(h,1);await expect(item(h,'remote-a')).toBeVisible();await expect(item(h,'remote-a')).toHaveAttribute('aria-setsize','2');await expect(item(h,'remote-a')).toHaveAttribute('aria-level','2');await expect(item(h,'remote')).toBeFocused();
 });
 test('failure offers retry and a later successful response populates the branch',async({page})=>{
  const h=page.locator('consumer-tree').first();await item(h,'remote').focus();await item(h,'remote').press('ArrowRight');await finish(h,1,undefined,true);await h.getByRole('button',{name:'Retry loading Remote files'}).click();await finish(h,2);await expect(item(h,'remote-a')).toBeVisible();await expect(h.getByRole('button',{name:'Retry loading Remote files'})).toHaveCount(0);
 });
 test('collapsed or replaced requests are aborted and late completion cannot overwrite current data',async({page})=>{
  const h=page.locator('consumer-tree').first();await item(h,'remote').focus();await item(h,'remote').press('ArrowRight');await item(h,'remote').press('ArrowLeft');await item(h,'remote').press('ArrowRight');expect(await h.evaluate(n=>(n as any).pendingRequests)).toEqual([{id:1,key:'remote',aborted:true},{id:2,key:'remote',aborted:false}]);await finish(h,2,[{key:'fresh',label:'Fresh data'}]);await finish(h,1,[{key:'stale',label:'Stale data'}]);await expect(item(h,'fresh')).toBeVisible();await expect(item(h,'stale')).toHaveCount(0);await h.getByRole('button',{name:'Reset tree'}).click();await item(h,'remote').focus();await item(h,'remote').press('ArrowRight');await configure(h,{items:[{key:'new',label:'New model'}]});await finish(h,3);expect(await keys(h)).toEqual(['new']);
 });
 test('invalid lazy data rolls back to the existing hierarchy and permits retry',async({page})=>{
  const h=page.locator('consumer-tree').first();await item(h,'remote').focus();await item(h,'remote').press('ArrowRight');await finish(h,1,[{key:'brief',label:'Duplicate'}]);await expect(h.getByRole('button',{name:'Retry loading Remote files'})).toBeVisible();await expect(item(h,'brief')).toHaveCount(1);await expect(item(h,'remote').locator('[role=treeitem]')).toHaveCount(0);
 });
 test('empty loaded branches retain their branch identity without repeat requests',async({page})=>{
  const h=page.locator('consumer-tree').first();await item(h,'remote').focus();await item(h,'remote').press('ArrowRight');await finish(h,1,[]);await expect(h.getByRole('status',{name:'Tree feedback'})).toHaveText('Loaded 0 children.');await item(h,'remote').press('ArrowLeft');await item(h,'remote').press('ArrowRight');expect(await h.evaluate(n=>(n as any).pendingRequests)).toEqual([]);await expect(item(h,'remote')).toHaveAttribute('aria-expanded','true');
 });
 test('local style pins affect only one consumer without changing row geometry on selection',async({page})=>{
  const h=page.locator('consumer-tree').first(),other=page.locator('consumer-tree').nth(1);await h.evaluate(n=>(n as HTMLElement).style.setProperty('--en-option-radius','19px'));await expect(option(h,'brief')).toHaveCSS('border-radius','19px');expect(await option(other,'brief').evaluate(n=>getComputedStyle(n).borderRadius)).not.toBe('19px');const before=await option(h,'brief').boundingBox();await option(h,'brief').click();expect(await option(h,'brief').boundingBox()).toEqual(before);await expect(option(h,'brief')).toHaveCSS('user-select','none');
 });
 test('narrow and forced-color layouts keep content and keyboard focus discoverable',async({page})=>{
  await page.setViewportSize({width:360,height:640});await page.emulateMedia({forcedColors:'active'});const h=page.locator('consumer-tree').first();await item(h,'brief').focus();await item(h,'brief').press('ArrowDown');await expect(item(h,'draft')).toBeFocused();await expect(option(h,'draft')).toHaveCSS('outline-style','solid');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await option(h,'draft').click();expect(await selected(h)).toEqual(['draft']);
 });
});
