import {test,expect} from '@playwright/test';
import {observeCaptureStartup,type CaptureStartupFailure} from './capture-diagnostics.js';

test('startup timeout retains navigation and failed requests without replacing the error',async({browser})=>{
 const failures:CaptureStartupFailure[]=[];
 const observed=observeCaptureStartup(browser,failures);
 const context=await observed.newContext({viewport:{width:390,height:844}});
 try {
  await context.route('https://capture.test/missing.js',route=>route.abort());
  const page=await context.newPage();
  await page.setContent('<iframe srcdoc="<p>Preview document</p>"></iframe><script src="https://capture.test/missing.js"></script>');
  let original:unknown;
  try{await page.waitForFunction(()=>false,undefined,{timeout:80});}catch(error){original=error;}
  expect(original).toBeInstanceOf(Error);
  expect((original as Error).name).toBe('TimeoutError');
  expect(failures).toHaveLength(1);
  expect(failures[0]!.error).toBe(String(original));
  expect(failures[0]!.events.some(event=>event.kind==='requestfailed'&&event.text.includes('/missing.js'))).toBe(true);
  expect(failures[0]!.snapshot).toMatchObject({readyState:'complete',reply:null,frames:[{readyState:'complete',previewRoots:0}]});
  expect(failures[0]!.pendingRequests).toEqual([]);
 }finally{await context.close();}
});

test('successful waits and ordinary browser contexts are unchanged',async({browser})=>{
 const failures:CaptureStartupFailure[]=[];
 const observed=observeCaptureStartup(browser,failures);
 const context=await observed.newContext();
 try {
  const page=await context.newPage();
  await page.setContent('<p>Ready</p>');
  const value=await page.waitForFunction(()=>document.querySelector('p')?.textContent);
  expect(await value.jsonValue()).toBe('Ready');
  await value.dispose();
  expect(failures).toEqual([]);
 }finally{await context.close();}
 const ordinary=await browser.newContext();
 try {
  const page=await ordinary.newPage();
  await expect(page.waitForFunction(()=>false,undefined,{timeout:80})).rejects.toThrow('Timeout');
  expect(failures).toEqual([]);
 }finally{await ordinary.close();}
});
