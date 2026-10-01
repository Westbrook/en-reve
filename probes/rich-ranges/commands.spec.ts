import {test,expect} from '@playwright/test';
for(const tag of ['en-rich-text-editor','en-token-editor'])test(`${tag}: shared command matcher offers only known multiword prefixes`,async({page})=>{
 await page.goto('/probes/rich-ranges/fixture.html');const editor=page.locator(tag);await expect(editor.getByRole('textbox')).toHaveAttribute('contenteditable','true');
 await editor.evaluate(async(el:any)=>{const createEditorCommandMatcher=(window as any).commandMatcher;el.value='';el.registerExtension({id:'commands',trigger:'/',label:'Commands',match:createEditorCommandMatcher(['insert table','help']),provide:({query}:any)=>[{id:'table',label:'Insert table',insert:[{kind:'text',text:'[Table]'}]}]});});
 const box=editor.getByRole('textbox');await box.pressSequentially('/insert t');await expect(editor.getByRole('option',{name:'Insert table'})).toBeVisible();await box.press('Enter');await expect(editor).toHaveJSProperty('value','[Table]');
 await editor.evaluate((el:any)=>{el.value='';el.focus();});await box.pressSequentially('/unknown');await expect(editor.getByRole('option')).toHaveCount(0);
});
