import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const tables=JSON.parse(readFileSync(new URL('../src/tables.json',import.meta.url)));
const latest=tables.filter(t=>t.rows.some(r=>r.some(cell=>/^main-[a-f0-9]+-\d+-v\d+(?:-|$)/.test(cell))));
test('latest acquisition remains dated, sortable, pinned and readable beside historical cohorts',async({page})=>{
 test.skip(!latest.length,'No current-source campaign has been integrated');
 test.setTimeout(Math.max(120000, latest.length * 3000));
 await page.goto('/?progress-report#latest-main-refresh');
 await expect(page.locator('en-data-table')).toHaveCount(tables.length);
 const loading=latest.find(t=>t.title==='mobile cold loading');expect(loading).toBeTruthy();
 expect(loading.headers).toContain('Date (UTC)');
 const date=loading.headers.indexOf('Date (UTC)');expect(new Set(loading.rows.map(r=>r[date])).size).toBeGreaterThan(1);
 for(const definition of latest.filter(t=>t.headers[0]==='Implementation')){
  const table=page.locator(`[data-table-id="${definition.id}"] en-data-table`);
  await expect(table.locator('tbody tr')).toHaveCount(definition.rows.length);
  const index=definition.headers.findIndex((h,i)=>definition.numeric[i]&&!/ n$/.test(h));if(index<0)continue;
  for(const direction of ['ascending','descending']){
   const header=table.locator('thead th').nth(index);await header.getByRole('button').click();await expect(header).toHaveAttribute('aria-sort',direction);
   const values=await table.locator('tbody tr').evaluateAll((rows,i)=>rows.map(r=>r.children[i].textContent.trim()),index);
   const present=values.filter(v=>v!=='—'&&v!=='').map(v=>Number(v.replaceAll(',','')));
   expect(present).toEqual([...present].sort((a,b)=>direction==='ascending'?a-b:b-a));
  }
 }
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const table=page.locator(`[data-table-id="${loading.id}"] en-data-table`);
 expect(await table.evaluate(el=>{el.scrollElement.scrollLeft=el.scrollElement.scrollWidth;const cells=[...el.shadowRoot.querySelectorAll('th.implementation-column, td.implementation-column')];return cells.length>1&&cells.every(cell=>Math.abs(cell.getBoundingClientRect().left-el.scrollElement.getBoundingClientRect().left)<=2);})).toBe(true);
});
