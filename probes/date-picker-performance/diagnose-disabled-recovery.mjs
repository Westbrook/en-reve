import {chromium} from '@playwright/test';
import {exclusiveBrowserWork} from '../../showcases/performance/src/lock.mjs';
await exclusiveBrowserWork(async()=>{
 const b=await chromium.launch();
 try{for(const port of [4234,4237]){
  const p=await b.newPage();await p.goto(`http://127.0.0.1:${port}/?fail`);await p.waitForFunction(()=>!!window.study);
  await p.locator('#picker-trigger').getByRole('button').click();await p.waitForFunction(()=>study.picker.shadowRoot.querySelector('[part="calendar-status"]').textContent.includes('could not load'));
  await p.evaluate(async()=>{const f=study.picker;const w=f.showPicker();f.disabled=true;await w;f.disabled=false;await f.updateComplete;});
  await p.waitForTimeout(100);
  console.log(port,await p.evaluate(()=>{const f=study.picker,t=f.shadowRoot.querySelector('#picker-trigger');return {disabled:f.disabled,attr:f.hasAttribute('disabled'),effective:f.isDisabled,trigger:t.disabled,native:t.shadowRoot.querySelector('button').disabled};}));await p.close();
 }}finally{await b.close();}
});
