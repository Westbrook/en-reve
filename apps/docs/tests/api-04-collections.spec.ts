import { test, expect, type Page } from '@playwright/test';
async function load(page: Page, example: string, tag: string) {
  await page.goto(`/api-examples/${example}.html`);
  await page.waitForFunction(tag => !!customElements.get(tag), tag);
}
test('canonical tree data keeps selection aliases, veto and authoritative writes', async ({page}) => {
  await load(page,'tree-data','en-tree');
  await page.evaluate(() => {
    document.body.innerHTML='<en-tree id="test" multiple label="Files"></en-tree>';
    const tree:any=document.querySelector('#test');
    tree.items=[{key:'folder',label:'Folder',children:[{key:'a',label:'A'},{key:'b',label:'B'}]}];
    tree.expandedKeys=['folder']; tree.selectedKeys=['a'];
    tree.addEventListener('en-change',(event:any)=>{(window as any).snapshot=event.detail.proposed;event.preventDefault();},{once:true});
  });
  const tree=page.locator('#test');
  await tree.getByRole('treeitem',{name:'B',exact:true}).click();
  await expect(tree).toHaveJSProperty('selectedKeys',['a']);
  expect(await page.evaluate(()=>(window as any).snapshot)).toMatchObject({selectedKey:'b',selectedKeys:['b'],expandedKeys:['folder'],value:'b',values:['b']});
  await tree.evaluate((tree:any)=>tree.addEventListener('en-change',(event:Event)=>{tree.selectedKey='b';event.preventDefault();},{once:true}));
  await tree.getByRole('treeitem',{name:'A',exact:true}).press('Space');
  await expect(tree).toHaveJSProperty('values',['b']);
  await tree.evaluate((tree:any)=>{tree.value='a';tree.expanded=[];});
  await expect(tree).toHaveJSProperty('selectedKey','a');
  await expect(tree).toHaveJSProperty('expandedKeys',[]);
});
for(const order of ['canonical-first','legacy-first']) test(`authored tree key precedence and live property aliases (${order})`, async ({page})=>{
  await load(page,'tree-view','en-tree-item');
  await page.evaluate(order=>{
    document.body.innerHTML=order==='canonical-first'
      ? '<en-tree id="test" selected-key="a" value="ignored"><en-tree-item key="a" value="ignored-item" label="A"></en-tree-item></en-tree>'
      : '<en-tree id="test" value="ignored" selected-key="a"><en-tree-item value="ignored-item" key="a" label="A"></en-tree-item></en-tree>';
  },order);
  const tree=page.locator('#test');
  await expect(tree.getByRole('treeitem',{name:'A',exact:true})).toHaveAttribute('aria-selected','true');
  await tree.evaluate((tree:any)=>{tree.querySelector('en-tree-item').value='b';tree.selectedKey='b';});
  await expect(tree.locator('en-tree-item')).toHaveJSProperty('key','b');
  await expect(tree.getByRole('treeitem',{name:'A',exact:true})).toHaveAttribute('aria-selected','true');
});
test('canonical tree lazy children and structural moves retain keys',async({page})=>{
  await load(page,'tree-data','en-tree');
  await page.evaluate(()=>{
    document.body.innerHTML='<en-tree id="test" reorderable></en-tree>';
    const tree:any=document.querySelector('#test');
    tree.items=[{key:'folder',label:'Folder',lazy:true},{key:'destination',label:'Destination',branch:true}];
    tree.loadChildren=()=>[{key:'child',label:'Child'}];tree.expandedKeys=['folder'];tree.selectedKey='child';
  });
  const tree=page.locator('#test');
  await expect(tree.getByRole('treeitem',{name:'Child',exact:true})).toBeVisible();
  expect(await tree.evaluate((tree:any)=>tree.moveItems(['child'],'destination','inside'))).toBe(true);
  await expect(tree.getByRole('treeitem',{name:'Child',exact:true})).toBeVisible();
  await expect(tree).toHaveJSProperty('selectedKey','child');
  expect(await tree.evaluate((tree:any)=>tree.items[1].children[0].key)).toBe('child');
});
test('carousel authored sentinel round trips, empty arrays stay data and invalid edits are atomic',async({page})=>{
  await load(page,'carousel','en-carousel');
  expect(await page.evaluate(async()=>{
    const carousel:any=document.createElement('en-carousel');
    carousel.innerHTML='<en-carousel-slide label="Authored">Authored</en-carousel-slide>';
    document.body.replaceChildren(carousel);await carousel.updateComplete;
    const authored=carousel.items===undefined;carousel.items=[];await carousel.updateComplete;
    const empty=Array.isArray(carousel.items)&&carousel.items.length===0;
    carousel.items=null;await carousel.updateComplete;const legacy=carousel.items===undefined;
    carousel.items=[{key:' spaced ',label:'Spaced'}];const before=carousel.items;
    let rejected=false;try{carousel.items=[{key:' ',label:'Invalid'}];}catch{rejected=true;}
    const atomic=carousel.items===before;
    carousel.items=undefined;await carousel.updateComplete;
    return {authored,empty,legacy,rejected,atomic,restored:carousel.items===undefined};
  })).toEqual({authored:true,empty:true,legacy:true,rejected:true,atomic:true,restored:true});
});
test('feed canonical all/paginated/virtual modes match legacy spellings',async({page})=>{
  await load(page,'presence-activity','en-activity-feed');
  await page.evaluate(()=>{
    document.body.innerHTML='<en-activity-feed id="test"></en-activity-feed>';
    const feed:any=document.querySelector('#test');feed.items=Array.from({length:80},(_,i)=>({key:`item-${i}`,author:'Author',body:`Entry ${i}`}));feed.pageSize=3;
  });
  const feed=page.locator('#test');
  for(const mode of ['paginated','paged','all','list','virtual']){
    await feed.evaluate(async(feed:any,mode)=>{feed.mode=mode;await feed.updateComplete;},mode);
    const count=await feed.locator('[data-en-virtual-key]').count();
    if(mode==='paginated'||mode==='paged')expect(count).toBe(3);
    else if(mode==='all'||mode==='list')expect(count).toBe(80);
    else expect(count).toBeLessThan(80);
  }
  expect(await feed.evaluate((feed:any)=>{try{feed.items=[{key:' ',body:'Invalid'}];return false;}catch{return true;}})).toBe(true);
});
test('table virtual alias windows rows and keeps paginated/full rendering',async({page})=>{
  await load(page,'data-table','en-data-table');
  const table=page.locator('#records-table');
  await table.evaluate((table:any)=>{table.mode='virtual';});
  await expect(table).toHaveAttribute('mode','virtual');
  await expect.poll(()=>table.locator('tbody [data-en-virtual-key]').count()).toBeGreaterThan(0);
  expect(await table.locator('tbody [data-en-virtual-key]').count()).toBeLessThan(1000);
  expect(await table.evaluate((table:any)=>table.scrollToKey('study-900'))).toBe(true);
  await table.evaluate((table:any)=>{table.mode='paginated';table.page=2;});
  await expect(table.locator('tbody th').first()).toContainText('Study 0011');
  expect(await table.evaluate((table:any)=>{try{table.selectedKeys=[' '];return false;}catch{return true;}})).toBe(true);
});
test('invalid progress arrays expose diagnostics and child precedence remains intact',async({page})=>{
  await page.goto('/workflows/multi-step.html');await page.waitForFunction(()=>!!customElements.get('en-progress-steps'));
  await page.evaluate(()=>{
    document.body.innerHTML='<en-progress-steps id="test"></en-progress-steps>';
    (document.querySelector('#test') as any).items=[{value:'x',label:'First'},{value:'x',label:'Duplicate'}];
  });
  const steps=page.locator('#test');
  await expect(steps.locator('[part="error"]')).toContainText('unique nonblank');
  await expect(steps.getByRole('button')).toHaveCount(0);
  await steps.evaluate((steps:any)=>{steps.innerHTML='<en-progress-step value="child">Child</en-progress-step>';});
  await expect(steps.getByRole('button',{name:/Child/})).toHaveCount(1);
  await expect(steps.locator('[part="error"]')).toHaveCount(0);
});
