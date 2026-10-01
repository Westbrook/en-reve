import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/probes/api-forms/fixture.html');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
});

const fields = [
  ['text-field', 'first', 'second', 'edited'], ['textarea', 'first', 'second', 'edited'],
  ['search-input', 'first', 'second', 'edited'], ['number-field', '20', '40', '75'],
  ['date-input', '2026-09-18', '2026-09-20', '2026-09-25'],
  ['date-picker', '2026-09-18', '2026-09-20', '2026-09-25'],
  ['time-field', '10:00', '11:00', '12:00'], ['color-field', '#112233', '#445566', '#778899'],
  ['select', 'first', 'second', 'edited'], ['combobox', 'first', 'second', 'edited'],
  ['radio-group', 'first', 'second', 'edited'], ['segmented-control', 'first', 'second', 'edited'],
  ['slider', 20, 40, 75], ['color-slider', 20, 40, 75], ['rating', 1, 2, 3],
] as const;
for (const [tag, first, second, edited] of fields) {
  test(`${tag}: defaults follow pristine state, preserve dirty state and resume after reset`, async ({ page }) => {
    const result = await page.evaluate(async ({ tag, first, second, edited }) => {
      const form = document.createElement('form');
      const el = document.createElement(`en-${tag}`) as any;
      el.name='test'; el.label='Test';
      el.items=['first','second','edited'].map(value=>({value,label:value}));
      if(tag==='radio-group') el.innerHTML='<en-radio value="first">First</en-radio><en-radio value="second">Second</en-radio><en-radio value="edited">Edited</en-radio>';
      el.setAttribute('value', String(first)); form.append(el); document.querySelector('#fixture')!.append(form);
      await el.updateComplete;
      const result: any[]=[el.value, el.defaultValue];
      el.defaultValue=second;
      result.push(el.value,el.getAttribute('value'));
      el.value=edited;
      el.setAttribute('value',String(first));
      await el.updateComplete;
      result.push(el.value,el.defaultValue);
      form.reset();await el.updateComplete;
      result.push(el.value);
      el.setAttribute('value',String(second)); await el.updateComplete;
      result.push(el.value);
      el.value=el.value; // even an equal property write dirties the value
      el.defaultValue=first; await el.updateComplete;
      result.push(el.value);
      return result;
    }, {tag,first,second,edited});
    expect(result).toEqual([first,first,second,String(second),edited,first,first,second,second]);
  });
}
for(const tag of ['checkbox','switch','radio']) {
 test(`${tag}: defaultChecked matches native checkedness and reset cancellation`,async({page})=>{
  expect(await page.evaluate(async tag=>{
   const form=document.createElement('form'); const el=document.createElement(`en-${tag}`) as any; const native=document.createElement('input'); native.type='checkbox';
   form.append(el,native);document.querySelector('#fixture')!.append(form);await el.updateComplete;
   const pairs:any[]=[];const snap=()=>pairs.push([el.checked,native.checked,el.defaultChecked,native.defaultChecked,el.hasAttribute('checked'),native.hasAttribute('checked')]);
   el.defaultChecked=native.defaultChecked=true;snap();
   el.checked=native.checked=false;el.defaultChecked=native.defaultChecked=false;el.setAttribute('checked','');native.setAttribute('checked','');snap();
   form.addEventListener('reset',e=>e.preventDefault(),{once:true});form.reset();snap();
   form.reset();snap();el.removeAttribute('checked');native.removeAttribute('checked');snap();
   el.checked=native.checked=false;el.defaultChecked=native.defaultChecked=true;snap();
   return pairs;
  },tag)).toEqual([[true,true,true,true,true,true],[false,false,true,true,true,true],[false,false,true,true,true,true],[true,true,true,true,true,true],[false,false,false,false,false,false],[false,false,true,true,true,true]]);
 });
}

test('property-only values are current state, resets are silent, and restoration preserves defaults',async({page})=>{
 expect(await page.evaluate(async()=>{
  const form=document.createElement('form');const input=document.createElement('en-text-field'); const slider=document.createElement('en-slider');const check=document.createElement('en-checkbox');
  input.value='current';slider.value=25;check.checked=true;form.append(input,slider,check);document.querySelector('#fixture')!.append(form);
  await Promise.all([input.updateComplete,slider.updateComplete,check.updateComplete]);
  let events=0;form.addEventListener('en-change',()=>events++);form.addEventListener('en-input',()=>events++);
  form.reset();const reset=[input.value,slider.value,check.checked];input.defaultValue='saved';input.formStateRestoreCallback('restored','restore');input.defaultValue='new default';
  return {reset,current:input.value,default:input.defaultValue,events};
 })).toEqual({reset:['',0,false],current:'restored',default:'new default',events:0});
});

for(const tag of ['text-field','checkbox','switch','radio','slider','color-slider','rating','radio-group','segmented-control','file-upload']) {
 test(`${tag}: common validation facade and accessible application errors`,async({page})=>{
  const result=await page.evaluate(async tag=>{
   const form=document.createElement('form');const el=document.createElement(`en-${tag}`) as any;el.id='control';el.label='Control';el.name='entry';
   if(tag==='radio-group')el.innerHTML='<en-radio value="one">One</en-radio>';
   if(tag==='segmented-control')el.items=[{value:'one',label:'One'},{value:'two',label:'Two'}];
   form.innerHTML='<label for="control">External label</label>';form.append(el);document.querySelector('#fixture')!.append(form);await el.updateComplete;
   el.error='Server rejected this value';await el.updateComplete;
   const error=el.shadowRoot.querySelector('[part~="error"]');const anchor=el.shadowRoot.querySelector('[aria-describedby*="error"]');
   const first={form:el.form===form,labels:el.labels.length,will:el.willValidate,valid:el.checkValidity(),custom:el.validity.customError,message:el.validationMessage,error:error?.textContent,associated:!!anchor};
   el.error='';await el.updateComplete;const cleared=el.checkValidity();
   el.disabled=true;await el.updateComplete;const disabled=el.willValidate;
   return {first,cleared,disabled};
  },tag);
  expect(result).toEqual({first:{form:true,labels:1,will:true,valid:false,custom:true,message:'Server rejected this value',error:'Server rejected this value',associated:true},cleared:true,disabled:false});
 });
}

test('application errors and localized constraint messages are independent',async({page})=>{
 expect(await page.evaluate(async()=>{
  const el=document.createElement('en-checkbox');el.required=true;el.validationText='Choose this option';document.querySelector('#fixture')!.append(el);await el.updateComplete;
  el.error='Account restriction';await el.updateComplete;
  const custom=[el.checkValidity(),el.validity?.customError,el.validity?.valueMissing,el.validationMessage];
  el.error='';await el.updateComplete;const required=[el.checkValidity(),el.validity?.customError,el.validity?.valueMissing,el.validationMessage];
  el.checked=true;await el.updateComplete;return {custom,required,valid:el.checkValidity()};
 })).toEqual({custom:[false,true,true,'Account restriction'],required:[false,false,true,'Choose this option'],valid:true});
});

test('text edits and invalid slider drafts protect current state from changed defaults',async({page})=>{
 await page.locator('#fixture').evaluate(el=>el.innerHTML='<form><en-text-field id="text" label="Text" value="Initial"></en-text-field><en-slider id="slider" label="Slider" value="20" editable></en-slider></form>');
 await page.getByRole('textbox',{name:'Text',exact:true}).fill('Edited');
 await page.locator('#slider').getByRole('spinbutton').fill('120');
 await page.evaluate(async()=>{const text=document.querySelector('#text') as any;const slider=document.querySelector('#slider') as any;text.defaultValue='New';slider.defaultValue=40;await Promise.all([text.updateComplete,slider.updateComplete]);});
 await expect(page.getByRole('textbox',{name:'Text',exact:true})).toHaveValue('Edited');
 await expect(page.locator('#slider').getByRole('spinbutton')).toHaveValue('120');
 expect(await page.locator('#slider').evaluate((e:any)=>e.value)).toBe(20);
 await page.locator('form').evaluate((form:HTMLFormElement)=>form.reset());
 await expect(page.getByRole('textbox',{name:'Text',exact:true})).toHaveValue('New');
 await expect(page.locator('#slider').getByRole('spinbutton')).toHaveValue('40');
});

test('removing defaults restores pristine fallbacks but never overwrites a dirty value',async({page})=>{
 expect(await page.evaluate(async()=>{
  const form=document.createElement('form');const text=document.createElement('en-text-field');const color=document.createElement('en-color-field');const slider=document.createElement('en-slider');
  text.defaultValue='one';color.defaultValue='#112233';slider.min=10;slider.defaultValue=20;form.append(text,color,slider);document.querySelector('#fixture')!.append(form);await Promise.all([text.updateComplete,color.updateComplete,slider.updateComplete]);
  for(const el of [text,color,slider])el.removeAttribute('value');
  const pristine=[text.value,color.value,slider.value];text.value='edited';text.defaultValue='new';text.removeAttribute('value');const dirty=text.value;form.reset();
  return {pristine,dirty,reset:text.value,attr:text.getAttribute('value')};
 })).toEqual({pristine:['','#000000',10],dirty:'edited',reset:'',attr:null});
});

test('pre-upgrade property writes take precedence over defaults and remain dirty',async({page})=>{
 expect(await page.evaluate(async()=>{
  const el=document.createElement('api03-late-field') as any;el.setAttribute('value','markup');el.value='before upgrade';document.querySelector('#fixture')!.append(el);
  const Base=customElements.get('en-text-field')!;customElements.define('api03-late-field',class extends Base {});await el.updateComplete;
  el.defaultValue='new default';const current=el.value;el.formResetCallback();return [current,el.value];
 })).toEqual(['before upgrade','new default']);
});

test('application errors persist across reset, block submission, and remain independent of localized slider drafts',async({page})=>{
 await page.locator('#fixture').evaluate(el=>el.innerHTML='<form><en-slider id="volume" name="volume" label="Volume" value="20" editable></en-slider><button>Submit</button></form>');
 await page.evaluate(async()=>{const el=document.querySelector('#volume') as any;el.error='Server limit';await el.updateComplete;let submissions=0;document.querySelector('form')!.addEventListener('submit',e=>{e.preventDefault();submissions++});(window as any).submissions=()=>submissions;});
 await page.getByRole('button',{name:'Submit'}).click();
 expect(await page.evaluate(()=>(window as any).submissions())).toBe(0);
 await page.locator('form').evaluate((form:HTMLFormElement)=>form.reset());
 expect(await page.locator('#volume').evaluate((el:any)=>[el.error,el.validity.customError,el.value])).toEqual(['Server limit',true,20]);
 await page.locator('#volume').getByRole('spinbutton').fill('120');
 await page.locator('#volume').evaluate(async(el:any)=>{el.error='';el.validationText='Maximum 100';await el.updateComplete;el.reportValidity();});
 await expect(page.locator('#volume [part="error"]')).toHaveText('Maximum 100');
 expect(await page.locator('#volume').evaluate((el:any)=>[el.validity.customError,el.validity.rangeOverflow,el.checkValidity()])).toEqual([false,true,false]);
 await page.locator('#volume').getByRole('spinbutton').fill('40');
 await page.locator('#volume').getByRole('spinbutton').press('Enter');
 await page.getByRole('button',{name:'Submit'}).click();
 expect(await page.evaluate(()=>(window as any).submissions())).toBe(1);
});

test('form configuration reflects consistently; disabled fieldsets exclude invalid controls',async({page})=>{
 const results=await page.evaluate(async()=>{
  const form=document.createElement('form'), fieldset=document.createElement('fieldset');form.append(fieldset);document.querySelector('#fixture')!.append(form);
  const result=[];
  for(const tag of ['text-field','checkbox','switch','radio-group','segmented-control','slider','rating','file-upload']){
   const el=document.createElement(`en-${tag}`) as any;el.name='entry';if('required' in el)el.required=true;el.error='Error';fieldset.append(el);await el.updateComplete;
   result.push([el.getAttribute('name'),!('required' in el)||el.hasAttribute('required')]);
  }
  fieldset.disabled=true;await Promise.all([...fieldset.children].map((el:any)=>el.updateComplete));
  return {config:result,valid:[...fieldset.children].every((el:any)=>!el.willValidate && el.checkValidity()),data:[...new FormData(form)]};
 });
 expect(results).toEqual({config:Array.from({length:8},()=>['entry',true]),valid:true,data:[]});
});

test('date range defaults are explicit, copied, and independent of current range state',async({page})=>{
 expect(await page.evaluate(async()=>{
  const form=document.createElement('form');const el=document.createElement('en-date-picker');el.selection='range';el.startName='start';el.endName='end';form.append(el);document.querySelector('#fixture')!.append(form);await el.updateComplete;
  const saved={start:'2026-09-18',end:'2026-09-20'};el.defaultRangeValue=saved;saved.start='2026-09-01';const initial=el.rangeValue;
  el.rangeValue={start:'2026-09-21',end:'2026-09-23'};el.defaultRangeValue={start:'2026-09-24',end:'2026-09-26'};const current=el.rangeValue;
  form.reset();const reset=el.rangeValue;el.defaultRangeValue={start:'2026-10-01',end:'2026-10-03'};return {initial,current,reset,pristine:el.rangeValue};
 })).toEqual({initial:{start:'2026-09-18',end:'2026-09-20'},current:{start:'2026-09-21',end:'2026-09-23'},reset:{start:'2026-09-24',end:'2026-09-26'},pristine:{start:'2026-10-01',end:'2026-10-03'}});
});

test('native input defaults remain distinct from property-only current values and constraint step bases',async({page})=>{
 expect(await page.evaluate(async()=>{
  const form=document.createElement('form');const el=document.createElement('en-number-field');el.step=5;el.value='12';form.append(el);document.querySelector('#fixture')!.append(form);await el.updateComplete;
  const input=el.shadowRoot!.querySelector('input')!;
  const initial=[el.value,el.defaultValue,input.value,input.defaultValue,el.validity?.stepMismatch];
  el.defaultValue='2';await el.updateComplete;const changed=[el.value,input.defaultValue,el.validity?.stepMismatch];
  return {initial,changed};
 })).toEqual({initial:['12','','12','',true],changed:['12','2',false]});
});

test('default changes during a canceled proposal preserve rollback and only affect the next reset',async({page})=>{
 await page.locator('#fixture').evaluate(el=>el.innerHTML='<form><en-checkbox id="choice" label="Choice"></en-checkbox></form>');
 await page.locator('#choice').evaluate((el:any)=>el.addEventListener('en-change',(event:Event)=>{el.defaultChecked=true;event.preventDefault();}));
 await page.getByRole('checkbox',{name:'Choice'}).click(); // the application deliberately vetoes activation
 expect(await page.locator('#choice').evaluate((el:any)=>[el.checked,el.defaultChecked])).toEqual([false,true]);
 await page.locator('form').evaluate((form:HTMLFormElement)=>form.reset());
 await expect(page.getByRole('checkbox',{name:'Choice'})).toBeChecked();
});

for (const tag of ['slider','color-slider','rating']) test(`${tag}: reporting an application error focuses a real control`,async({page})=>{
 await page.locator('#fixture').evaluate((el,tag)=>el.innerHTML=`<form><en-${tag} id="subject" label="Setting" value="2" error="Application error"></en-${tag}></form>`,tag);
 expect(await page.locator('#subject').evaluate(async(el:any)=>{await el.updateComplete;return el.reportValidity();})).toBe(false);
 await expect(page.locator('#subject').locator('input:focus')).toHaveCount(1);
});

test('rating re-enables every score after its value changes while disabled',async({page})=>{
 await page.locator('#fixture').evaluate(el=>el.innerHTML='<en-rating id="subject" label="Score" value="2"></en-rating>');
 await page.locator('#subject').evaluate(async(el:any)=>{await el.updateComplete;el.disabled=true;await el.updateComplete;el.value=3;await el.updateComplete;el.disabled=false;await el.updateComplete;});
 for(const radio of await page.locator('#subject').getByRole('radio').all())await expect(radio).toBeEnabled();
 await page.locator('#subject').locator('label').filter({has:page.getByRole('radio',{name:'2 of 5 stars',exact:true})}).click();
 expect(await page.locator('#subject').evaluate((el:any)=>el.value)).toBe(2);
});
