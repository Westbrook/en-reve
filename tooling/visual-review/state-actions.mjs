// Drive public native browser interaction; no component state injection.
import {validateActions,actionApplies} from './action-contract.mjs';
export async function performActions(page,frame,actions) {
 validateActions(actions);
 for (const action of actions) {
  if (!actionApplies(action,page.viewportSize())) continue;
  const element=frame.locator(action.selector),options={timeout:10000};
  if (['fill','press','select'].includes(action.kind)) await element[action.kind==='select'?'selectOption':action.kind](action.value,options);
  else if (action.kind==='files') await element.setInputFiles(action.files.map(file=>({name:file.name,mimeType:file.mimeType,buffer:Buffer.from(file.base64,'base64')})),options);
  else if (action.kind==='drag') {
   const target=action.target?frame.locator(action.target):element;
   await element.scrollIntoViewIfNeeded(options);await target.scrollIntoViewIfNeeded(options);
   const initialBox=await element.boundingBox();
   if(!initialBox?.width||!initialBox?.height)throw new Error('Drag source has no rendered geometry.');
   // Native hover performs hit-target checks and may scroll around sticky chrome.
   // Raw mouse coordinates alone can start a gesture on an overlapping navigation.
   await element.hover({...options,position:{x:initialBox.width*action.from.x,y:initialBox.height*action.from.y}});
   // Hover can scroll either frame: acquire both final boxes only afterwards.
   const sourceBox=await element.boundingBox(),targetBox=await target.boundingBox();
   if (!sourceBox?.width || !sourceBox?.height || !targetBox?.width || !targetBox?.height) throw new Error('Drag source or target has no rendered geometry.');
   const from={x:sourceBox.x+sourceBox.width*action.from.x,y:sourceBox.y+sourceBox.height*action.from.y};
   const to={x:targetBox.x+targetBox.width*action.to.x,y:targetBox.y+targetBox.height*action.to.y};
   const viewport=page.viewportSize();
   if (viewport && [from,to].some(point=>point.x<0 || point.y<0 || point.x>=viewport.width || point.y>=viewport.height)) throw new Error('Drag endpoints must both be visible in the authored viewport.');
   let held=false;
   try {
    await page.mouse.move(from.x,from.y);await page.mouse.down();
    await page.mouse.move(to.x,to.y,{steps:action.steps??5});
    if(action.end==='escape') await page.keyboard.press('Escape');
    held=action.end==='hold';
   } finally {if(!held)await page.mouse.up();}
   // A held gesture is deliberate snapshot state. Its isolated context closes
   // after capture; a subsequent explicit Escape can exercise cancellation.
  } else await element[action.kind]({...options,...(action.modifiers?{modifiers:action.modifiers}:{})});
 }
}
