import {test,expect} from '@playwright/test';

test('tree proposals expose typed key aliases through tentative dispatch and veto',async({page})=>{
 await page.goto('/probes/api-contracts/fixture.html');
 await page.waitForFunction(()=>document.body.dataset.ready==='true');
 await page.locator('#fixture').evaluate(async container=>{
  const tree:any=document.createElement('en-tree');tree.id='subject';
  tree.items=[{key:'one',label:'One',children:[{key:'two',label:'Two'}]}];
  container.append(tree);await tree.updateComplete;
  (window as any).treeProposals=[];
  tree.addEventListener('en-change',(event:any)=>{
   const {previous,proposed,reason}=event.detail;
   (window as any).treeProposals.push({previous,proposed,reason,tentative:tree.expandedKeys,
    frozen:Object.isFrozen(previous)&&Object.isFrozen(proposed)&&Object.isFrozen(proposed.expandedKeys),
    bubbles:event.bubbles,composed:event.composed,cancelable:event.cancelable});
   event.preventDefault();
  });
 });
 const first=page.locator('#subject').getByRole('treeitem').first();
 await first.focus();await first.press('ArrowRight');
 const events=await page.evaluate(()=>(window as any).treeProposals);
 expect(events).toHaveLength(1);
 expect(events[0]).toMatchObject({reason:'expansion',previous:{selectedKey:'',selectedKeys:[],expandedKeys:[]},
  proposed:{selectedKey:'',selectedKeys:[],expandedKeys:['one']},tentative:['one'],frozen:true,bubbles:true,composed:true,cancelable:true});
 await expect(page.locator('#subject')).toHaveJSProperty('expandedKeys',[]);
});
