import {test,expect,type Page} from '@playwright/test';
const host=(page:Page)=>page.locator('#ops');
const row=(page:Page,name:string)=>host(page).getByRole('treeitem',{name,exact:true});
async function fixture(page:Page,virtualize=true) {
  await page.goto('/api-examples/tree-data.html');
  await page.waitForFunction(()=>Boolean(customElements.get('en-tree')));
  await page.evaluate(virtualize=>{
    document.body.innerHTML='<en-tree id="ops" label="Operations" multiple reorderable style="block-size:400px"></en-tree>';
    const tree=document.querySelector('#ops') as any;
    tree.items=[{value:'a',label:'A',branch:true,children:[{value:'one',label:'One'},{value:'two',label:'Two'}]},{value:'b',label:'B',branch:true},{value:'lazy',label:'Lazy',lazy:true},{value:'other',label:'Other',lazy:true},{value:'locked',label:'Locked',disabled:true,branch:true}];
    tree.expanded=['a'];tree.values=['one'];tree.virtualize=virtualize;
    (window as any).pending=[];
    tree.loadChildren=(context:any)=>new Promise((resolve,reject)=>{(window as any).pending.push({...context,resolve,reject});});
  },virtualize);
  await expect(row(page,'One')).toBeVisible();
}
for(const virtualize of [false,true]) {
 test(`${virtualize?'virtual':'finite'} concurrent lazy branches, error/retry and empty results`,async({page})=>{
  await fixture(page,virtualize);
  await host(page).evaluate((tree:any)=>{tree.expanded=['a','lazy','other'];});
  await expect(row(page,'Lazy')).toHaveAttribute('aria-busy','true');
  await expect.poll(()=>page.evaluate(()=>(window as any).pending.length)).toBe(2);
  await page.evaluate(()=>{const pending=(window as any).pending;pending.find((r:any)=>r.key==='lazy').resolve([{value:'child',label:'Child'}]);pending.find((r:any)=>r.key==='other').reject(new Error('test'));});
  await expect(row(page,'Child')).toBeVisible();
  await row(page,'Other').click();
  await host(page).getByRole('button',{name:'Retry Other'}).click();
  await expect(row(page,'Other')).toBeFocused();
  await expect.poll(()=>page.evaluate(()=>(window as any).pending.length)).toBe(3);
  await page.evaluate(()=>(window as any).pending[2].resolve([]));
  await expect(row(page,'Other')).toHaveAttribute('aria-description','Empty folder');
  await row(page,'Other').press('ArrowRight');await expect(row(page,'Other')).toBeFocused();
  await expect(row(page,'Child')).toBeVisible();
  expect(await host(page).evaluate((tree:any)=>tree.items.find((x:any)=>x.value==='lazy').children[0].value)).toBe('child');
 });
 test(`${virtualize?'virtual':'finite'} abort on collapse, replacement and disconnect ignores late children`,async({page})=>{
  await fixture(page,virtualize);
  await host(page).evaluate((tree:any)=>{tree.values=['future'];tree.expanded=['a','lazy'];});
  await expect.poll(()=>page.evaluate(()=>(window as any).pending.length)).toBe(1);
  await host(page).evaluate((tree:any)=>{tree.expanded=['a'];});
  await expect.poll(()=>page.evaluate(()=>(window as any).pending[0].signal.aborted)).toBe(true);
  await host(page).evaluate((tree:any)=>{tree.expanded=['a','lazy'];});
  await expect.poll(()=>page.evaluate(()=>(window as any).pending.length)).toBe(2);
  await page.evaluate(()=>{(window as any).pending[0].resolve([{value:'stale',label:'Stale'}]);(window as any).pending[1].resolve([{value:'future',label:'Future'}]);});
  await expect(row(page,'Stale')).toHaveCount(0);await expect(row(page,'Future')).toHaveAttribute('aria-selected','true');
  await host(page).evaluate((tree:any)=>{tree.expanded=[...tree.expanded,'other'];});
  await expect.poll(()=>page.evaluate(()=>(window as any).pending.length)).toBe(3);
  await host(page).evaluate((tree:any)=>{tree.items=[{value:'new',label:'New'}];});
  await page.evaluate(()=>(window as any).pending[2].resolve([{value:'late',label:'Late'}]));
  await expect(row(page,'New')).toBeVisible();await expect(row(page,'Late')).toHaveCount(0);
  expect(await page.evaluate(()=>(window as any).pending[2].signal.aborted)).toBe(true);
  await host(page).evaluate((tree:any)=>{tree.items=[{value:'last',label:'Last',lazy:true}];tree.expanded=['last'];});
  await expect.poll(()=>page.evaluate(()=>(window as any).pending.length)).toBe(4);
  await host(page).evaluate(tree=>tree.remove());
  expect(await page.evaluate(()=>(window as any).pending[3].signal.aborted)).toBe(true);
 });
 test(`${virtualize?'virtual':'finite'} invalid loaded children fail atomically and moves keep selected identities`,async({page})=>{
  await fixture(page,virtualize);
  await host(page).evaluate((tree:any)=>{tree.expanded=['a','lazy'];});
  await expect.poll(()=>page.evaluate(()=>(window as any).pending.length)).toBe(1);
  await page.evaluate(()=>(window as any).pending[0].resolve([{value:'one',label:'Duplicate'}]));
  await expect.poll(()=>host(page).evaluate((tree:any)=>tree.getBranchState('lazy').status)).toBe('error');
  await expect(row(page,'One')).toHaveCount(1);
  expect(await host(page).evaluate((tree:any)=>tree.moveItems(['one'],'lazy','inside'))).toBe(false);
  await host(page).evaluate((tree:any)=>{tree.values=['two','one'];});
  expect(await host(page).evaluate((tree:any)=>tree.moveItems(tree.values,'b','inside'))).toBe(true);
  await expect(row(page,'One')).toBeFocused();await expect(host(page)).toHaveJSProperty('values',['two','one']);
  expect(await host(page).evaluate((tree:any)=>tree.items.find((x:any)=>x.value==='b').children.map((x:any)=>x.value))).toEqual(['one','two']);
  await host(page).evaluate((tree:any)=>tree.addEventListener('en-reorder',(event:Event)=>event.preventDefault(),{once:true}));
  expect(await host(page).evaluate((tree:any)=>tree.moveItems(['one'],'a','inside'))).toBe(false);
  await host(page).evaluate((tree:any)=>tree.addEventListener('en-reorder',()=>{tree.items=[{value:'replacement',label:'Replacement'}];},{once:true}));
  expect(await host(page).evaluate((tree:any)=>tree.moveItems(['one'],'a','inside'))).toBe(false);
  await expect(row(page,'Replacement')).toBeVisible();
  await host(page).evaluate((tree:any)=> {tree.items=[{value:'x',label:'X'},{value:'y',label:'Y'}];tree.addEventListener('en-reorder',()=>{tree.hidden=true;},{once:true});});
  expect(await host(page).evaluate((tree:any)=>tree.moveItems(['x'],'y','after'))).toBe(false);
  expect(await host(page).evaluate((tree:any)=>tree.items.map((item:any)=>item.value))).toEqual(['x','y']);
 });
}

test('keyboard Move, Escape and narrow touch controls use the same transaction',async({page})=>{
 await fixture(page);await row(page,'One').focus();await page.keyboard.press('Alt+m');
 const destination=host(page).getByRole('combobox',{name:'Destination',exact:true});await expect(destination).toBeFocused();
 await host(page).getByRole('combobox',{name:'Position',exact:true}).selectOption('inside');await destination.selectOption('b');
 await host(page).getByRole('button',{name:'Move items',exact:true}).click();await expect(row(page,'One')).toBeFocused();
 await page.keyboard.press('Alt+m');await page.keyboard.press('Escape');await expect(destination).toHaveCount(0);await expect(row(page,'One')).toBeFocused();
 await page.setViewportSize({width:375,height:780});
 await row(page,'One').focus();await page.keyboard.press('Alt+m');
 await host(page).getByRole('combobox',{name:'Position',exact:true}).selectOption('inside');await destination.selectOption('a');
 await host(page).getByRole('button',{name:'Move items',exact:true}).click();
 expect(await host(page).evaluate(tree=>tree.getBoundingClientRect().right)).toBeLessThanOrEqual(375);
});

test('pointer grip drops before/inside with cancellation and RTL',async({page})=>{
 await fixture(page,false);await host(page).evaluate(tree=>tree.setAttribute('dir','rtl'));
 const grip=row(page,'One').locator('[data-tree-drag]');const box=(await grip.boundingBox())!;
 const target=(await row(page,'B').locator('[part=option]').boundingBox())!;
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(target.x+target.width/2,target.y+target.height/2,{steps:6});
 await expect(row(page,'B').locator('[part=option]')).toHaveAttribute('data-tree-drop','inside');
 await expect(host(page).locator('[part=drop-indicator]')).toHaveCount(0);
 await page.mouse.up();await expect(row(page,'One')).toBeFocused();
 expect(await host(page).evaluate((tree:any)=>tree.items.find((x:any)=>x.value==='b').children[0].value)).toBe('one');
 const moved=(await row(page,'One').locator('[data-tree-drag]').boundingBox())!;
 await page.mouse.move(moved.x+5,moved.y+5);await page.mouse.down();await page.mouse.move(target.x+30,target.y+3,{steps:3});await page.keyboard.press('Escape');await page.mouse.up();
 expect(await host(page).evaluate((tree:any)=>tree.items.find((x:any)=>x.value==='b').children[0].value)).toBe('one');
});

test('authored moves preserve rich label nodes and vetoed DOM stays unchanged',async({page})=>{
 await fixture(page);
 await host(page).evaluate((tree:any)=>{tree.items=undefined;tree.innerHTML='<en-tree-item value="a" label="A" branch><en-tree-item slot="children" value="one"><span slot="label">Rich <b>one</b></span></en-tree-item></en-tree-item><en-tree-item value="b" label="B" branch></en-tree-item>';tree.expanded=['a'];tree.values=['one'];(window as any).original=tree.querySelector('b');});
 await expect(row(page,'Rich one')).toBeVisible();
 expect(await host(page).evaluate((tree:any)=>tree.moveItems(['one'],'b','inside'))).toBe(true);
 await expect(row(page,'Rich one')).toBeFocused();
 expect(await host(page).evaluate(tree=>tree.querySelector('b')===(window as any).original)).toBe(true);
 expect(await host(page).locator('en-tree-item[value="b"] > en-tree-item').getAttribute('value')).toBe('one');
 await expect(row(page,'B').locator('[data-tree-drag]').first()).toBeVisible();
});

test('live lazy demo lets reviewers complete, fail and retry without replacing loaded state',async({page},info)=>{
 await page.goto('/api-examples/tree-data.html');const demo=page.locator('#tree-operations-example');const tree=demo.locator('#specimen-tree-operations');
 await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
 await tree.getByRole('treeitem',{name:'Drafts',exact:true}).focus();await page.keyboard.press('ArrowRight');
 await demo.getByRole('button',{name:'Fail drafts',exact:true}).click();
 await tree.getByRole('treeitem',{name:'Drafts',exact:true}).focus();
 await tree.getByRole('button',{name:'Retry Drafts',exact:true}).click();
 await demo.getByRole('button',{name:'Complete drafts',exact:true}).click();
 await expect(tree.getByRole('treeitem',{name:'drafts item 1',exact:true})).toBeVisible();
 await expect(tree.getByRole('treeitem',{name:'Drafts',exact:true})).not.toHaveAttribute('aria-busy');
 await info.attach('tree-operations-desktop',{body:await demo.screenshot(),contentType:'image/png'});
 await page.setViewportSize({width:390,height:844});
 await info.attach('tree-operations-mobile',{body:await demo.screenshot(),contentType:'image/png'});
});

test('loader replacement and ancestor collapse cancel outstanding child requests',async({page})=>{
 await fixture(page);
 await host(page).evaluate((tree:any)=>{tree.items=[{value:'parent',label:'Parent',children:[{value:'nested',label:'Nested',lazy:true}]}];tree.expanded=['parent','nested'];});
 await expect.poll(()=>page.evaluate(()=>(window as any).pending.length)).toBe(1);
 await host(page).evaluate((tree:any)=>{tree.expanded=['nested'];});
 await expect.poll(()=>page.evaluate(()=>(window as any).pending[0].signal.aborted)).toBe(true);
 await host(page).evaluate((tree:any)=>{tree.expanded=['parent','nested'];});
 await expect.poll(()=>page.evaluate(()=>(window as any).pending.length)).toBe(2);
 await host(page).evaluate((tree:any)=>{tree.loadChildren=()=>[{value:'fresh',label:'Fresh'}];});
 await page.evaluate(()=>(window as any).pending[1].resolve([{value:'stale',label:'Stale'}]));
 await expect(row(page,'Fresh')).toBeVisible();await expect(row(page,'Stale')).toHaveCount(0);
});

test('virtual Move can target an unmounted known item without losing focus',async({page})=>{
 await fixture(page);
 await host(page).evaluate((tree:any)=>{tree.items=Array.from({length:300},(_,i)=>({value:`i-${i}`,label:`Item ${i}`,branch:i===299}));tree.expanded=[];tree.values=['i-0'];});
 await expect(row(page,'Item 299')).toHaveCount(0);
 await row(page,'Item 0').focus();await page.keyboard.press('Alt+m');
 await host(page).getByRole('combobox',{name:'Position',exact:true}).selectOption('inside');
 await host(page).getByRole('combobox',{name:'Destination',exact:true}).selectOption('i-299');
 await host(page).getByRole('button',{name:'Move items',exact:true}).click();
 await expect(row(page,'Item 0')).toBeFocused();await expect(row(page,'Item 0')).toBeInViewport();
 expect(await host(page).getByRole('treeitem').count()).toBeLessThan(100);
});

test('Chromium touch pointer drag retains capture on the grip',async({page,context,browserName})=>{
 test.skip(browserName!=='chromium','CDP touch injection is Chromium-specific; keyboard/touch controls run in all engines.');
 await page.setViewportSize({width:390,height:840});await fixture(page,false);
 const grip=(await row(page,'One').locator('[data-tree-drag]').boundingBox())!;
 const target=(await row(page,'B').locator('[part=option]').boundingBox())!;
 const session=await context.newCDPSession(page);
 await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:grip.x+grip.width/2,y:grip.y+grip.height/2,id:1}]});
 await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:target.x+target.width/2,y:target.y+target.height/2,id:1}]});
 await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 expect(await host(page).evaluate((tree:any)=>tree.items.find((x:any)=>x.value==='b').children[0]?.value)).toBe('one');
 await session.detach();
});

for (const mode of ['finite', 'virtual', 'authored'] as const) {
 test(`${mode} direct row dragging preserves selection, previews the drop and leaves ordinary clicks intact`, async ({page}, info) => {
  await fixture(page, mode === 'virtual');
  if (mode === 'authored') await host(page).evaluate((tree:any) => {
   tree.items=undefined;
   tree.innerHTML='<en-tree-item value="a" label="A" branch><en-tree-item slot="children" value="one"><span slot="label">One</span></en-tree-item><en-tree-item slot="children" value="two" label="Two"></en-tree-item></en-tree-item><en-tree-item value="b" label="B" branch></en-tree-item>';
  });
  await expect(host(page).getByRole('button',{name:'Move selected items'})).toHaveCount(0);
  await row(page,'One').locator('[part=label]').click();
  await row(page,'Two').locator('[part=label]').click({modifiers:[process.platform === 'darwin' ? 'Meta' : 'Control']});
  await expect(host(page)).toHaveJSProperty('values',['one','two']);
  const from=(await row(page,'One').locator('[part=label]').boundingBox())!;
  const to=(await row(page,'B').locator('[part=option]').first().boundingBox())!;
  await page.mouse.move(from.x+10,from.y+from.height/2);await page.mouse.down();
  await page.mouse.move(to.x+to.width/2,to.y+to.height/2,{steps:8});
  await expect(host(page).locator('[part=drag-preview]')).toContainText('2 items');
  await expect(host(page).locator('[part=drag-preview]')).toContainText('Into B');
  if (mode === 'finite') await info.attach('direct-drag-preview',{body:await page.screenshot(),contentType:'image/png'});
  await page.mouse.up();
  await expect(host(page).locator('[part=drag-preview]')).toHaveCount(0);
  await expect(host(page)).toHaveJSProperty('values',['one','two']);
  await expect(row(page,'One')).toBeFocused();
  if (mode === 'authored') await expect(host(page).locator('en-tree-item[value="b"] > en-tree-item')).toHaveCount(2);
  else await expect(row(page,'B').getByRole('treeitem')).toHaveCount(2);
  await row(page,'Two').locator('[part=label]').click();
  await expect(host(page)).toHaveJSProperty('values',['two']);
 });
}

test('leaf half-row drops and Escape leave selection and disclosure behavior intact',async({page})=>{
 await fixture(page,false);
 const source=(await row(page,'One').locator('[part=label]').boundingBox())!;
 const target=(await row(page,'Two').locator('[part=option]').boundingBox())!;
 await page.mouse.move(source.x+10,source.y+source.height/2);await page.mouse.down();
 await page.mouse.move(target.x+target.width/2,target.y+target.height*.6,{steps:6});
 await expect(host(page).locator('[part=drop-indicator]')).toBeVisible();
 await expect(host(page).locator('[part=drag-preview]')).toContainText('At end of A, after Two');
 await page.keyboard.press('Escape');await page.mouse.up();
 await expect(host(page)).toHaveJSProperty('values',['one']);
 expect(await host(page).evaluate((tree:any)=>tree.items[0].children.map((x:any)=>x.value))).toEqual(['one','two']);
 await row(page,'A').locator('[part=indicator]').first().click();
 await expect(row(page,'One')).toHaveCount(0);
});

for (const virtualize of [false, true]) {
 test(`${virtualize ? 'virtual' : 'finite'} lazy loading occupies a child row without becoming a selectable item`, async ({page}, info) => {
  await fixture(page,virtualize);
  const parent=row(page,'Lazy');const option=parent.locator('[part=option]').first();
  const before=(await option.boundingBox())!;
  await parent.focus();await page.keyboard.press('ArrowRight');
  const loading=parent.locator('[part=branch-loading]');
  await expect(loading).toBeVisible();await expect(option).not.toContainText('Loading');
  await expect(parent).toHaveAttribute('aria-busy','true');
  await expect(loading).toHaveAttribute('aria-hidden','true');await expect(loading).toHaveAttribute('inert','');
  await expect(host(page).getByRole('treeitem',{name:/Loading/})).toHaveCount(0);
  const box=(await loading.boundingBox())!;const after=(await option.boundingBox())!;
  expect(after.height).toBeCloseTo(before.height,0);expect(box.y).toBeGreaterThanOrEqual(after.y+after.height-1);expect(box.x).toBeGreaterThan(after.x);
  const labelLeft=await loading.locator('span').last().evaluate(el=>el.getBoundingClientRect().left);
  await page.keyboard.press('ArrowDown');await expect(row(page,'Other')).toBeFocused();
  await expect(host(page)).toHaveJSProperty('values',['one']);
  await info.attach('loading-child',{body:await host(page).screenshot(),contentType:'image/png'});
  await page.evaluate(()=>(window as any).pending.find((r:any)=>r.key==='lazy').resolve([{value:'loaded',label:'Loaded child'}]));
  await expect(loading).toHaveCount(0);await expect(row(page,'Loaded child')).toBeVisible();
  expect(await row(page,'Loaded child').locator('[part=label]').evaluate(el=>el.getBoundingClientRect().left)).toBeCloseTo(labelLeft,0);
  // Failure and collapse remove the placeholder as well, without adding fake keys.
  await row(page,'Other').press('ArrowRight');await expect(row(page,'Other').locator('[part=branch-loading]')).toBeVisible();
  await page.evaluate(()=>(window as any).pending.find((r:any)=>r.key==='other').reject(new Error('failed')));
  await expect(row(page,'Other').locator('[part=branch-loading]')).toHaveCount(0);
  await host(page).getByRole('button',{name:'Retry Other',exact:true}).click();
  await expect(row(page,'Other').locator('[part=branch-loading]')).toBeVisible();
  await page.keyboard.press('ArrowLeft');await expect(row(page,'Other').locator('[part=branch-loading]')).toHaveCount(0);
 });
}

test('virtual loading placeholders contribute to measured geometry across distant windows',async({page})=>{
 await fixture(page,true);
 await host(page).evaluate((tree:any)=>{tree.items=[...tree.items,...Array.from({length:150},(_,i)=>({value:`extra-${i}`,label:`Extra ${i}`}))];tree.expanded=['a','lazy','other'];});
 await expect(row(page,'Lazy').locator('[part=branch-loading]')).toBeVisible();
 const geometry=()=>host(page).evaluate((tree:any)=>{
  const content=tree.shadowRoot.querySelector('[role=tree]');
  const sum=Array.from(content.querySelectorAll('[data-en-virtual-key],[data-en-virtual-gap]')).reduce((n:number,el:any)=>n+el.getBoundingClientRect().height,0);
  return Math.abs(sum-content.getBoundingClientRect().height);
 });
 await expect.poll(geometry).toBeLessThan(2);
 await host(page).evaluate((tree:any)=>tree.scrollToKey('extra-140',{block:'center'}));await expect(row(page,'Extra 140')).toBeInViewport();
 await expect.poll(geometry).toBeLessThan(2);
 await host(page).evaluate((tree:any)=>tree.scrollToKey('lazy',{block:'start'}));
 await expect(row(page,'Lazy').locator('[part=branch-loading]')).toBeInViewport();
 await expect.poll(geometry).toBeLessThan(2);
});

for (const mode of ['finite','virtual','authored'] as const) for (const direction of ['ltr','rtl']) {
 test(`${mode} ${direction} equivalent sibling drops share one insertion gap and label`,async({page},info)=>{
  await fixture(page,mode==='virtual');
  await host(page).evaluate((tree:any,{mode,direction})=>{
   tree.dir=direction;tree.values=['mover'];tree.expanded=['two'];
   if(mode==='authored') {tree.items=undefined;tree.innerHTML='<en-tree-item value="one" label="One"></en-tree-item><en-tree-item value="two" label="Two" branch><en-tree-item value="child" label="Nested child" slot="children"></en-tree-item></en-tree-item><en-tree-item value="three" label="Three"></en-tree-item><en-tree-item value="mover" label="Mover"></en-tree-item>';}
   else tree.items=[{value:'one',label:'One'},{value:'two',label:'Two',children:[{value:'child',label:'Nested child'}]},{value:'three',label:'Three'},{value:'mover',label:'Mover'}];
   (window as any).lastMove=undefined;tree.addEventListener('en-reorder',(e:any)=>(window as any).lastMove=e.detail);
  },{mode,direction});
  await expect(row(page,'Nested child')).toBeVisible();
  const source=(await row(page,'Mover').locator('[part=label]').boundingBox())!;
  const previous=(await row(page,'Two').locator('[part=option]').first().boundingBox())!;
  const following=(await row(page,'Three').locator('[part=option]').boundingBox())!;
  await page.mouse.move(source.x+source.width/2,source.y+source.height/2);await page.mouse.down();
  await page.mouse.move(previous.x+previous.width/2,previous.y+previous.height*.9,{steps:6});
  const line=host(page).locator('[part=drop-indicator]');const preview=host(page).locator('[part=drag-preview]');
  await expect(line).toBeVisible();await expect(preview).toContainText('Between Two and Three');
  const first=(await line.boundingBox())!;const gap=await line.getAttribute('data-tree-gap');
  expect(Math.abs(first.y+first.height/2-following.y)).toBeLessThan(8);
  await page.mouse.move(following.x+following.width/2,following.y+following.height*.1,{steps:6});
  await expect(line).toHaveAttribute('data-tree-gap',gap!);await expect(preview).toContainText('Between Two and Three');
  expect(await line.boundingBox()).toEqual(first);
  // Crossing the actual authored gap must retain the same marker too.
  await page.mouse.move(following.x+following.width/2,first.y+first.height/2);
  await expect(line).toHaveAttribute('data-tree-gap',gap!);expect(await line.boundingBox()).toEqual(first);
  if(mode==='finite'&&direction==='ltr') await info.attach('stable-insertion-gap',{body:await host(page).screenshot(),contentType:'image/png'});
  // Finish from the following sibling's upper zone.
  await page.mouse.move(following.x+following.width/2,following.y+3);await page.mouse.up();
  await expect(line).toHaveCount(0);await expect(row(page,'Mover')).toBeFocused();
  expect(await page.evaluate(()=>(window as any).lastMove.proposed.map((item:any)=>item.value))).toEqual(['one','two','mover','three']);
 });
}
