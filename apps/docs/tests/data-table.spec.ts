import {test,expect,type Page} from '@playwright/test';
const route='/api-examples/data-table.html?progress-report';
const table=(page:Page)=>page.locator('#records-table');
async function start(page:Page){await page.goto(route);await page.waitForFunction(()=>!!customElements.get('en-data-table'));await table(page).evaluate(async(el:any)=>{await el.updateComplete;});}
async function virtual(page:Page){await page.getByRole('combobox',{name:'Delivery',exact:true}).selectOption('windowed');await expect(table(page)).toHaveAttribute('mode','windowed');}
const errors=new WeakMap<Page,string[]>();
test.beforeEach(({page})=>{const messages:string[]=[];errors.set(page,messages);page.on('pageerror',e=>messages.push(e.message));});
test.afterEach(({page})=>expect(errors.get(page)).toEqual([]));

test('records facade and composed route share sorting, selection and application cells',async({page})=>{
 await start(page);const surface=table(page);
 await expect(surface.getByRole('table')).toHaveAttribute('aria-rowcount','11');
 const firstHeight=await surface.locator('tbody tr').first().evaluate(el=>el.getBoundingClientRect().height);
 await surface.getByRole('checkbox',{name:'Select Study 0001',exact:true}).check();
 expect(await surface.locator('tbody tr').first().evaluate(el=>el.getBoundingClientRect().height)).toBe(firstHeight);await expect(surface).toHaveJSProperty('selectedKeys',['study-1']);
 await page.getByText('Compare the authored helper route',{exact:true}).click();
 await expect(page.locator('en-table[label="Composed studies"]').getByRole('checkbox',{name:'Select Study 0001',exact:true})).toBeChecked();
 await surface.getByRole('button',{name:'Sort Study descending',exact:true}).click();
 await expect(surface.locator('tbody th').first()).toContainText('Study 1000');
 await expect(surface.getByRole('columnheader',{name:/Sort Study/})).toHaveAttribute('aria-sort','descending');
 await surface.getByRole('button',{name:'Open Study 1000',exact:true}).click();await expect(page.getByRole('status').last()).toContainText('Opened Study 1000');
 await page.getByRole('checkbox',{name:'Images only',exact:true}).check();await expect(surface.locator('tbody')).not.toContainText('Document');
 expect(await surface.evaluate((el:any)=>el.selectedKeys)).toEqual(['study-1']);
});

test('cancelable selection, sorting and page events defer rendering and honor authoritative writes',async({page})=>{
 await start(page);const surface=table(page);
 await page.getByRole('checkbox',{name:'Prevent selection and sorting',exact:true}).check();
 await surface.getByRole('checkbox',{name:'Select Study 0001',exact:true}).click();await expect(surface.getByRole('checkbox',{name:'Select Study 0001',exact:true})).not.toBeChecked();
 await surface.getByRole('button',{name:'Sort Study descending',exact:true}).click();await expect(surface.locator('tbody th').first()).toContainText('Study 0001');
 await page.getByRole('checkbox',{name:'Prevent selection and sorting',exact:true}).uncheck();
 await surface.evaluate((el:any)=>{el.addEventListener('en-selection-change',(event:CustomEvent)=>{(window as any).selectionSnapshot={...event.detail,tentative:el.selectedKeys,checked:el.shadowRoot.querySelector('en-checkbox').checked};el.selectedKeys=['study-2'];event.preventDefault();},{once:true});});
 await surface.getByRole('checkbox',{name:'Select Study 0001',exact:true}).click();
 await expect(surface).toHaveJSProperty('selectedKeys',['study-2']);await expect(surface.getByRole('checkbox',{name:'Select Study 0002',exact:true})).toBeChecked();
 expect(await page.evaluate(()=>(window as any).selectionSnapshot)).toMatchObject({previous:[],proposed:['study-1'],tentative:['study-1'],reason:'checkbox'});
 await surface.evaluate((el:any)=>el.addEventListener('en-page-change',(e:Event)=>e.preventDefault(),{once:true}));
 await surface.getByRole('button',{name:'Next page',exact:true}).click();await expect(surface).toHaveJSProperty('page',1);
 await surface.getByRole('button',{name:'Next page',exact:true}).click();await expect(surface).toHaveJSProperty('page',2);
 await surface.evaluate((el:any)=>el.addEventListener('en-selection-change',()=>el.shadowRoot.querySelector('thead en-button').click(),{once:true}));
 await surface.getByRole('checkbox',{name:'Select Study 0011',exact:true}).click();
 await expect(surface).toHaveJSProperty('selectedKeys',['study-2']);
 await expect(surface.locator('tbody th').first()).toContainText('Study 1000');
});

test('keyed replacement, columns, filtering, empty state and page-size updates stay coherent',async({page})=>{
 await start(page);const surface=table(page);
 await surface.getByRole('checkbox',{name:'Select Study 0001',exact:true}).focus();
 await surface.getByRole('checkbox',{name:'Select Study 0001',exact:true}).evaluate(el=>(window as any).heldCheck=el);
 await surface.evaluate((el:any)=>{el.items=el.items.map((row:any)=>({...row,notes:'Updated notes'}));});
 expect(await surface.getByRole('checkbox',{name:'Select Study 0001',exact:true}).evaluate(el=>el===(window as any).heldCheck)).toBe(true);
 await expect(surface.getByRole('checkbox',{name:'Select Study 0001',exact:true})).toBeFocused();
 await surface.evaluate((el:any)=>{el.page=5;});await expect(surface).toHaveJSProperty('page',5);
 await surface.evaluate((el:any)=>{el.pageSize=15;});await expect(surface).toHaveJSProperty('page',3);
 await surface.evaluate((el:any)=>{el.columns=el.columns.filter((column:any)=>column.key!=='name');});await expect(surface).toHaveJSProperty('sort',undefined);
 await surface.evaluate((el:any)=>{el.items=[];});await expect(surface.getByText('No records.',{exact:true})).toBeVisible();await expect(surface.getByRole('table')).toHaveAttribute('aria-rowcount','2');await expect(surface.locator('en-pagination')).toBeHidden();
});

test('distant virtual reveal retains focused checkbox and native forward Tab order',async({page,browserName})=>{
 await start(page);await virtual(page);const surface=table(page),check=surface.getByRole('checkbox',{name:'Select Study 0001',exact:true});
 await check.focus();await check.evaluate(el=>(window as any).heldVirtual=el);
 expect(await surface.evaluate((el:any)=>el.scrollToKey('study-901',{container:'nearest',behavior:'instant'}))).toBe(true);
 await expect(surface.locator('[data-en-virtual-key="study-901"]')).toBeVisible();
 await expect(check).toBeFocused();expect(await check.evaluate(el=>el===(window as any).heldVirtual)).toBe(true);
 expect(await surface.locator('[data-en-virtual-key]').count()).toBeLessThan(70);
 await page.keyboard.press(browserName==='webkit'?'Alt+Tab':'Tab');await expect(surface.getByRole('button',{name:'Open Study 0001',exact:true})).toBeFocused();
 await page.keyboard.press(browserName==='webkit'?'Alt+Tab':'Tab');await expect(surface.getByRole('checkbox',{name:'Select Study 0002',exact:true})).toBeFocused();
});

test('CSSOM invalidation retains a visible key and supports a subsequent distant reveal',async({page},info)=>{
 await start(page);await virtual(page);const surface=table(page);
 await surface.evaluate((el:any)=>el.scrollToKey('study-500',{block:'start',container:'nearest',behavior:'instant'}));
 await expect(surface.locator('[data-en-virtual-key="study-500"]')).toBeVisible();
 await expect.poll(()=>surface.evaluate(async(el:any)=>{const positions=[];for(let i=0;i<12;i++){await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));positions.push(el.scrollElement.scrollTop);}return positions.slice(-6).every(value=>value===positions.at(-1));})).toBe(true);
 const anchor=()=>surface.evaluate((el:any)=>{const top=el.shadowRoot.querySelector('thead').getBoundingClientRect().bottom,bottom=el.scrollElement.getBoundingClientRect().bottom;for(const row of el.shadowRoot.querySelectorAll('[data-en-virtual-key]')){const rect=row.getBoundingClientRect();if(rect.bottom>top+1&&rect.top<bottom)return {key:row.dataset.enVirtualKey,offset:rect.top-top};}return null;});
 const before=await anchor();expect(before).not.toBeNull();
 await page.getByRole('button',{name:'Change CSSOM density',exact:true}).click();
 await expect.poll(async()=>(await anchor())?.key).toBe(before!.key);
 await expect.poll(async()=>Math.abs((await anchor())!.offset-before!.offset)).toBeLessThan(3);
 await expect(surface.locator('[data-en-virtual-key="study-500"]')).toBeVisible();
 await page.getByRole('button',{name:'Show Study 0901',exact:true}).click();await expect(surface.locator('[data-en-virtual-key="study-901"]')).toBeVisible();
 await expect.poll(()=>surface.evaluate((el:any)=>{const row=el.shadowRoot.querySelector('[data-en-virtual-key="study-901"]');const port=el.scrollElement;return row?row.getBoundingClientRect().top-port.getBoundingClientRect().top:-1000;})).toBeGreaterThan(0);
 await info.attach('data-table-wide',{body:await surface.screenshot(),contentType:'image/png'});
 await page.setViewportSize({width:390,height:844});await surface.evaluate((el:any)=>el.dir='rtl');
 await surface.evaluate((el:any)=>el.scrollToKey('study-902',{block:'center',container:'nearest',behavior:'instant'}));await expect(surface.locator('[data-en-virtual-key="study-902"]')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 expect(await surface.evaluate((el:any)=>el.scrollElement.scrollWidth>el.scrollElement.clientWidth)).toBe(true);
 expect(await surface.locator('thead th').nth(1).evaluate(el=>el.getBoundingClientRect().width)).toBeGreaterThan(170);
 await info.attach('data-table-narrow-rtl',{body:await surface.screenshot(),contentType:'image/png'});
});

test('nearest fallback resolves CSS math padding while preserving outer scroll position',async({page})=>{
 await page.addInitScript(()=>{const original=Element.prototype.scrollIntoView;Element.prototype.scrollIntoView=function(options){if(typeof options==='object')return original.call(this,{behavior:options.behavior,block:options.block,inline:options.inline});return original.call(this,options);};});
 await start(page);await virtual(page);const surface=table(page);await surface.scrollIntoViewIfNeeded();
 const pageTop=await page.evaluate(()=>scrollY);
 await surface.evaluate((el:any)=>{el.scrollElement.style.scrollPaddingTop='clamp(80px, calc(25% + 19px), 200px)';el.scrollElement.style.scrollPaddingBottom='min(12%, 25px)';el.scrollToKey('study-700',{block:'start',container:'nearest',behavior:'instant'});});
 await expect(surface.locator('[data-en-virtual-key="study-700"]')).toBeVisible();
 await expect.poll(()=>surface.evaluate((el:any)=>{const port=el.scrollElement,row=el.shadowRoot.querySelector('[data-en-virtual-key="study-700"]');if(!row)return 999;const expected=Math.min(200,Math.max(80,port.clientHeight*.25+19));return Math.abs(row.getBoundingClientRect().top-port.getBoundingClientRect().top-port.clientTop-expected);})).toBeLessThan(3);
 expect(await page.evaluate(()=>scrollY)).toBe(pageTop);
});

test('SSR native rows, column structure and focused DOM survive hydration',async({page,browser,baseURL})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const initial=await context.newPage();
 try{await initial.goto(baseURL+route);const surface=table(initial);await expect(surface.locator('colgroup')).toHaveCount(1);await expect(surface.locator('col')).toHaveCount(4);await expect(surface.locator('tbody tr')).toHaveCount(10);await expect(surface.getByRole('checkbox',{name:'Select Study 0001',exact:true})).toBeVisible();}finally{await context.close();}
 let release!:()=>void;const held=new Promise<void>(resolve=>release=resolve);
 await page.route('**/*.js',async route=>{await held;await route.continue();});
 await page.goto(route,{waitUntil:'commit'});await expect(table(page).locator('tbody tr')).toHaveCount(10);
 await table(page).locator('tbody tr').first().evaluate(el=>(window as any).initialRow=el);release();
 await page.waitForFunction(()=>!!customElements.get('en-data-table'));await table(page).evaluate(async(el:any)=>{await el.updateComplete;});
 expect(await table(page).locator('tbody tr').first().evaluate(el=>el===(window as any).initialRow)).toBe(true);
 await expect(table(page).locator('colgroup')).toHaveCount(1);await expect(table(page).locator('col')).toHaveCount(4);
});

test('theme changes, source documentation and API controls reach the data element',async({page},info)=>{
 await start(page);const surface=table(page);
 await surface.getByRole('checkbox',{name:'Select Study 0001',exact:true}).check();
 const themes=page.getByRole('combobox',{name:'Inspired theme',exact:true});
 for(const label of ['Spectrum 2-inspired','Fluent 2-inspired','Astryx-inspired','shadcn-inspired','Holotable-inspired']){
  await themes.selectOption({label});
  await expect(surface.getByRole('checkbox',{name:'Select Study 0001',exact:true})).toBeChecked();
  await surface.getByRole('button',{name:'Sort Study descending',exact:true}).focus();
  await expect(surface.getByRole('button',{name:'Sort Study descending',exact:true})).toBeFocused();
  await info.attach('theme-'+label,{body:await surface.screenshot(),contentType:'image/png'});
 }
 await info.attach('data-table-holotable',{body:await surface.screenshot(),contentType:'image/png'});
 await page.goto('/api-reference?component=en-data-table&progress-report');
 await expect(page.getByRole('heading',{name:'en-data-table',exact:true})).toBeVisible();
 await page.locator('.api-demo-frame').scrollIntoViewIfNeeded();
 await expect(page.locator('.api-demo-frame')).toHaveAttribute('data-example-ready','true');
 const label=page.locator('.api-element-controls form[data-control="label"]');
 await label.getByRole('textbox',{name:'label',exact:true}).fill('Client records');
 await label.getByRole('button',{name:'Apply label',exact:true}).click();
 await expect(page.frameLocator('.api-demo-frame').locator('#records-table')).toHaveJSProperty('label','Client records');
});

test('selection paint persists without hover or geometry changes in both table routes',async({page})=>{
 await start(page);const surface=table(page),row=surface.locator('tbody tr').first(),cell=row.locator('td').first();
 const height=await row.evaluate(el=>el.getBoundingClientRect().height),rest=await cell.evaluate(el=>getComputedStyle(el).backgroundColor);
 await surface.getByRole('checkbox',{name:'Select Study 0001',exact:true}).check();await page.mouse.move(1,1);
 await expect(row).toHaveAttribute('data-selected','');
 expect(await row.evaluate(el=>el.getBoundingClientRect().height)).toBe(height);
 expect(await cell.evaluate(el=>getComputedStyle(el).backgroundColor)).not.toBe(rest);
 expect(await cell.evaluate(el=>getComputedStyle(el,'::after').width)).toBe('3px');
 await page.getByText('Compare the authored helper route',{exact:true}).click();
 const authored=page.locator('en-table[label="Composed studies"] tbody tr').first();await expect(authored).toHaveAttribute('data-selected','');
 expect(await authored.locator('td').first().evaluate(el=>getComputedStyle(el).backgroundColor)).toBe(await cell.evaluate(el=>getComputedStyle(el).backgroundColor));
 await surface.evaluate(el=>(el as HTMLElement).style.setProperty('--en-table-row-selected-background','rgb(225, 235, 245)'));
 await expect(cell).toHaveCSS('background-color','rgb(225, 235, 245)');
 await page.emulateMedia({forcedColors:'active'});
 expect(await cell.evaluate(el=>getComputedStyle(el).backgroundColor)).not.toBe('rgb(225, 235, 245)');
});

test('selection header is localized and remains in the native accessibility tree',async({page})=>{
 await start(page);const surface=table(page);
 const heading=surface.getByRole('columnheader',{name:'Selection',exact:true});await expect(heading).toHaveAttribute('scope','col');
 expect(await heading.locator('span').evaluate(el=>getComputedStyle(el).clipPath)).toBe('inset(50%)');
 await surface.evaluate((el:any)=>el.selectionColumnLabel='Sélection');
 await expect(surface.getByRole('columnheader',{name:'Sélection',exact:true})).toBeVisible();
 await expect(surface.getByRole('checkbox',{name:'Select Study 0001',exact:true})).toHaveCount(1);
 expect(await surface.getByRole('table').ariaSnapshot()).toContain('columnheader "Sélection"');
});

test('sticky selection stays at the logical edge, layers under the header and can be disabled',async({page},info)=>{
 await start(page);await page.setViewportSize({width:390,height:844});const surface=table(page);await surface.scrollIntoViewIfNeeded();
 for(const mode of ['paginated','windowed'])for(const dir of ['ltr','rtl']){
  await surface.evaluate(async(el:any,{mode,dir})=>{el.mode=mode;el.dir=dir;await el.updateComplete;el.scrollElement.scrollTop=120;el.scrollElement.scrollLeft=dir==='rtl'?-10000:10000;},{mode,dir});
  const cells=surface.locator('tbody td.en-table-selection'),header=surface.locator('thead th.en-table-selection');
  await expect.poll(()=>surface.evaluate((el:any)=>{const port=el.scrollElement.getBoundingClientRect(),cell=el.shadowRoot.querySelector('tbody td.en-table-selection').getBoundingClientRect();return Math.abs(el.dir==='rtl'?cell.right-(port.right-el.scrollElement.clientLeft):cell.left-(port.left+el.scrollElement.clientLeft));})).toBeLessThan(2);
  await expect(cells.first()).toHaveCSS('position','sticky');await expect(header).toHaveCSS('position','sticky');
  const rect=await header.boundingBox();expect(rect).not.toBeNull();
  expect(await header.evaluate(el=>{const box=el.getBoundingClientRect();const root=el.getRootNode() as ShadowRoot;return root.elementFromPoint(box.x+box.width/2,box.y+box.height/2)?.closest('th')===el;})).toBe(true);
  await info.attach(`sticky-selection-${mode}-${dir}`,{body:await surface.screenshot(),contentType:'image/png'});
 }
 await surface.evaluate((el:any)=>el.stickySelection='none');await expect(surface.locator('tbody td.en-table-selection').first()).toHaveCSS('position','static');
 await surface.evaluate((el:any)=>el.stickySelection='start');await page.emulateMedia({media:'print'});await expect(surface.locator('tbody td.en-table-selection').first()).toHaveCSS('position','static');
});

test('keyboard focus remains visible beside the sticky selection column',async({page,browserName})=>{
 await start(page);await page.setViewportSize({width:390,height:844});const surface=table(page);
 for(const dir of ['ltr','rtl']){
  await surface.evaluate(async(el:any,dir)=>{el.dir=dir;const action=el.columns.find((c:any)=>c.key==='open');el.columns=el.columns.map((c:any)=>c.key==='name'?{...c,renderCell:action.renderCell}:c);await el.updateComplete;el.scrollElement.scrollLeft=dir==='rtl'?-10000:10000;},dir);
  const checkbox=surface.getByRole('checkbox',{name:'Select Study 0001',exact:true});await checkbox.focus();
  await page.keyboard.press(browserName==='webkit'?'Alt+Tab':'Tab');
  const button=surface.locator('tbody tr').first().getByRole('button',{name:'Open Study 0001',exact:true}).first();await expect(button).toBeFocused();
  await expect.poll(()=>button.evaluate(el=>{let root:Node=el;while(root.getRootNode() instanceof ShadowRoot){const host=(root.getRootNode() as ShadowRoot).host;if(host.localName==='en-data-table'){const cell=host.shadowRoot!.querySelector('tbody td.en-table-selection')!.getBoundingClientRect(),rect=el.getBoundingClientRect();return host.getAttribute('dir')==='rtl'?rect.right<=cell.left+1:rect.left>=cell.right-1;}root=host;}return false;})).toBe(true);
 }
});

test('compact selection width preserves its centered hit target and tracks theme overrides',async({page})=>{
 await start(page);const surface=table(page),cell=surface.locator('tbody td.en-table-selection').first();
 const metrics=()=>cell.evaluate(el=>{const box=el.getBoundingClientRect(),host=el.querySelector('en-checkbox')!,label=host.shadowRoot!.querySelector('label')!,input=host.shadowRoot!.querySelector('input')!;const hit=label.getBoundingClientRect(),mark=input.getBoundingClientRect();return {width:box.width,hitWidth:hit.width,center:Math.abs(mark.x+mark.width/2-box.x-box.width/2)};});
 expect((await metrics()).width).toBeCloseTo(52,0);expect((await metrics()).hitWidth).toBeGreaterThanOrEqual(44);expect((await metrics()).center).toBeLessThan(1);
 await surface.evaluate((el:any)=>el.style.setProperty('--en-data-table-selection-width','4rem'));
 expect((await metrics()).width).toBeCloseTo(64,0);
 expect(await surface.evaluate((el:any)=>parseFloat(getComputedStyle(el.scrollElement).scrollPaddingInlineStart))).toBeGreaterThanOrEqual(64);
 await surface.getByRole('checkbox',{name:'Select Study 0001',exact:true}).check();await expect(surface).toHaveJSProperty('selectedKeys',['study-1']);
});

test('compact selection keeps the theme touch target even with a smaller width override',async({browser,browserName,baseURL})=>{
 test.skip(browserName==='firefox','Firefox does not emulate touch contexts.');
 const context=await browser.newContext({baseURL,hasTouch:true,viewport:{width:390,height:844}}),page=await context.newPage();
 await start(page);const surface=table(page);await surface.evaluate((el:any)=>el.style.setProperty('--en-data-table-selection-width','1rem'));
 const label=surface.locator('tbody en-checkbox').first().locator('label'),box=await label.boundingBox();expect(box!.width).toBeGreaterThanOrEqual(44);expect(box!.height).toBeGreaterThanOrEqual(44);
 await label.tap();await expect(surface).toHaveJSProperty('selectedKeys',['study-1']);await context.close();
});
