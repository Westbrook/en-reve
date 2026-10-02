import { expect, test } from '@playwright/test';
const consumers = ['html','react19','react18','vue3','vue2','svelte5','svelte4'];
test.beforeEach(async ({browser,page}, testInfo) => {
 const version=browser.version();
 testInfo.annotations.push({type:'browser-version',description:version});
 const product=testInfo.project.metadata.browserProduct;
 if(product) {
  const userAgent=await page.evaluate(()=>navigator.userAgent);
  // Protocol and app patch versions may differ; the UA can reduce patches to 0.
  // Full distribution hashes bind the independently observed app identity.
  expect(version.split('.')[0], 'Product and protocol major lines disagree').toBe(product.version.split('.')[0]);
  testInfo.annotations.push({type:'user-agent',description:userAgent});
  testInfo.annotations.push({type:'browser-product',description:JSON.stringify(product)});
 }
});
for (const consumer of consumers) {
 test.describe(consumer, () => {
  test('object and string properties render through framework bindings with authored description slots', async ({page}) => {
   const errors:string[]=[]; page.on('pageerror',error=>errors.push(error.message));
   await page.goto(`/${consumer}.html`);
   const tree = page.locator('#client-tree'), field = page.locator('#client-field');
   const input = field.getByRole('textbox',{name:'Project title',exact:true});
   await expect(input).toHaveValue('Initial brief');
   await expect(input).toHaveAccessibleDescription('Framework supplied description');
   await expect(tree.getByRole('treeitem',{name:'Project artwork',exact:true})).toBeVisible();
   await page.locator('#client-update').click();
   await expect(input).toHaveValue('Revised brief');
   await expect(tree.getByRole('treeitem',{name:'Project artwork',exact:true})).toHaveCount(0);
   await expect(tree.getByRole('treeitem',{name:'Export artwork',exact:true})).toBeVisible();
   expect(await page.evaluate(()=>(window as any).fixture.clientEvents)).toEqual([]);
   await tree.getByRole('treeitem',{name:'Export artwork',exact:true}).click();
   await expect(page.locator('#client-tree-state')).toHaveText('export');
   expect(await tree.evaluate((el:any)=>({items:el.items.map((item:any)=>({key:item.key,label:item.label})),selected:el.selectedKey,attribute:el.getAttribute('items')}))).toEqual({items:[{key:'export',label:'Export artwork'}],selected:'export',attribute:null});
   // Real native editing still works after the authoritative framework update.
   await input.fill('Locally edited'); await expect(input).toHaveValue('Locally edited');
   expect(errors).toEqual([]);
  });
  test('framework unmount/remount retains owner state and cleans up detached native event listeners', async ({page}) => {
   await page.goto(`/${consumer}.html`);
   await expect(page.locator('#client-tree')).toBeVisible();
   await page.locator('#client-toggle').click();
   await expect(page.locator('#client-checkbox').getByRole('checkbox')).toBeChecked();
   await page.locator('#client-update').click();
   await page.evaluate(()=>(window as any).detachedTree=document.querySelector('#client-tree'));
   await page.locator('#client-mount').click();
   for (const id of ['client-checkbox','client-field','client-tree']) await expect(page.locator('#'+id)).toHaveCount(0);
   // This synthetic event tests framework listener disposal, not a user interaction.
   await page.evaluate(()=>(window as any).detachedTree.dispatchEvent(new CustomEvent('en-change',{detail:{proposed:{selectedKey:'stale'}}})));
   expect(await page.evaluate(()=>(window as any).fixture.clientEvents)).toEqual([]);
   await page.locator('#client-mount').click();
   await expect(page.locator('#client-checkbox').getByRole('checkbox')).toBeChecked();
   await expect(page.locator('#client-field').getByRole('textbox')).toHaveValue('Revised brief');
   const item=page.locator('#client-tree').getByRole('treeitem',{name:'Export artwork',exact:true});
   await item.focus(); await page.keyboard.press('Enter');
   await expect(page.locator('#client-tree-state')).toHaveText('export');
   expect(await page.evaluate(()=>(window as any).fixture.clientEvents)).toEqual(['export']);
   expect(await page.evaluate(()=>document.querySelector('#client-tree')!==(window as any).detachedTree)).toBe(true);
  });
  test('SSR shell and native controls retain identity through both hydration owners', async ({page}) => {
   const errors:string[]=[];
   page.on('pageerror',error=>errors.push(error.message));
   page.on('console',message=>{if(message.type()==='error') errors.push(message.text());});
   await page.goto(`/${consumer}.html?defer`);
   const checkbox=page.locator('#island-checkbox').getByRole('checkbox');
   await expect(checkbox).toBeVisible();
   await expect(page.locator('#island-select').getByRole('combobox')).toHaveValue('svg');
   await page.evaluate(()=>{
    const host=document.querySelector('#island-checkbox')!;
    const select=document.querySelector('#island-select')!;
    (window as any).before={host,root:host.shadowRoot,input:host.shadowRoot!.querySelector('input'),select,selectInput:select.shadowRoot!.querySelector('select')};
   });
   await page.evaluate(()=>(window as any).hydrateFixture());
   await expect(page.locator('#client-checkbox')).toBeVisible();
   expect(await page.evaluate(()=>{
    const before=(window as any).before;
    return [before.host===document.querySelector('#island-checkbox'),before.root===before.host.shadowRoot,before.input===before.host.shadowRoot.querySelector('input'),before.select===document.querySelector('#island-select'),before.selectInput===before.select.shadowRoot.querySelector('select')];
   })).toEqual([true,true,true,true,true]);
   await checkbox.click();
   await expect(checkbox).toBeChecked();
   expect(errors).toEqual([]);
  });
  test('one tentative cancelable event accepts, rolls back, and yields to a property write',async({page})=>{
   await page.goto(`/${consumer}.html`);
   await expect(page.locator('#client-checkbox')).toBeVisible();
   const checkbox=page.locator('#island-checkbox').getByRole('checkbox');
   await checkbox.click();await expect(checkbox).toBeChecked();
   await page.locator('#reject-mode').click();await checkbox.click();await expect(checkbox).toBeChecked();
   await page.locator('#supersede-mode').click();await checkbox.click();await expect(checkbox).not.toBeChecked();
   expect(await page.evaluate(()=>(window as any).fixture.events)).toEqual([
    {type:'en-change',previous:false,proposed:true,observed:true,cancelable:true},
    {type:'en-change',previous:true,proposed:false,observed:false,cancelable:true},
    {type:'en-change',previous:true,proposed:false,observed:false,cancelable:true},
   ]);
  });
  test('native framework state and event bindings own the adjacent client element',async({page})=>{
   await page.goto(`/${consumer}.html`);
   const checkbox=page.locator('#client-checkbox').getByRole('checkbox');
   await expect(checkbox).toBeVisible();await expect(checkbox).not.toBeChecked();
   await page.locator('#client-toggle').click();await expect(checkbox).toBeChecked();
   await checkbox.click();await expect(checkbox).not.toBeChecked();
   await page.locator('#client-toggle').click();await expect(checkbox).toBeChecked();
   await page.locator('#reject-mode').click();await checkbox.click();await expect(checkbox).toBeChecked();
   await page.locator('#supersede-mode').click();await checkbox.click();await expect(checkbox).toBeChecked();
   await page.locator('#accept-mode').click();await checkbox.click();await expect(checkbox).not.toBeChecked();
   await checkbox.focus();await page.keyboard.press('Space');await expect(checkbox).toBeChecked();
  });
  test('framework actions update child-authored choices without replacing native select',async({page})=>{
   await page.goto(`/${consumer}.html`);
   await expect(page.locator('#client-checkbox')).toBeVisible();
   const select=page.locator('#island-select').getByRole('combobox');
   await page.evaluate(()=>(window as any).nativeSelect=document.querySelector('#island-select')!.shadowRoot!.querySelector('select'));
   await page.locator('#add-option').click();
   await expect(select.locator('option')).toHaveText(['SVG','PNG','PDF']);
   await select.selectOption('pdf');await expect(select).toHaveValue('pdf');
   await page.locator('#remove-option').click();
   await expect(select.locator('option')).toHaveText(['SVG','PNG']);
   await select.selectOption('png');await expect(select).toHaveValue('png');
   expect(await page.evaluate(()=>(window as any).nativeSelect===document.querySelector('#island-select')!.shadowRoot!.querySelector('select'))).toBe(true);
  });
 });
}
