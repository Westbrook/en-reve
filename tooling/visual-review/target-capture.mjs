import {waitForRenderedElements} from './readiness.mjs';

/** Capture an embedded case without resizing its viewport or losing clipped pixels. */
export async function captureTarget(page, frame, target, options) {
 const viewport=await frame.evaluate(()=>({width:innerWidth,height:innerHeight}));
 const bounds=await target.boundingBox();
 if(!bounds||bounds.width*bounds.height>32_000_000)throw new Error('Capture target is absent or exceeds32 million pixels.');
 const safe=await target.evaluate(root=>{
  const safe={left:0,top:0,right:innerWidth,bottom:innerHeight};
  const contains=(ancestor,node)=>{for(let current=node;current;current=current.parentElement??current.getRootNode().host)if(current===ancestor)return true;return false;};
  const visit=element=>{
   if(contains(root,element))return;
   const style=getComputedStyle(element),r=element.getBoundingClientRect();
   if(['fixed','sticky'].includes(style.position)&&!contains(element,root)&&element.checkVisibility()&&style.opacity!=='0'&&r.width>0&&r.height>0&&r.right>0&&r.bottom>0&&r.left<innerWidth&&r.top<innerHeight){
    if(r.width>innerWidth/2){if(r.top<innerHeight/2)safe.top=Math.max(safe.top,Math.ceil(r.bottom));else safe.bottom=Math.min(safe.bottom,Math.floor(r.top));}
    else if(r.height>innerHeight/2){if(r.left<innerWidth/2)safe.left=Math.max(safe.left,Math.ceil(r.right));else safe.right=Math.min(safe.right,Math.floor(r.left));}
   }
   for(const child of element.children)visit(child);if(element.shadowRoot)for(const child of element.shadowRoot.children)visit(child);
  };visit(document.documentElement);return safe;
 });
 // Reserve one CSS pixel for engines that round fractional scroll positions down.
 const tileWidth=safe.right-safe.left-1,tileHeight=safe.bottom-safe.top-1;
 if(bounds.x>=safe.left&&bounds.y>=safe.top&&bounds.x+bounds.width<=safe.right&&bounds.y+bounds.height<=safe.bottom)return {bytes:await target.screenshot(options),coverage:{method:'element',viewport,safeViewport:safe,tiles:1}};
 if(tileWidth<=0||tileHeight<=0)throw new Error('Fixed page chrome obscures the capture viewport.');
 // Bounding boxes can contain float noise (e.g. 970.000015 in Firefox).
 const pixelSize=value=>Math.ceil(Math.round(value*1024)/1024);
 const width=pixelSize(bounds.width),height=pixelSize(bounds.height),tiles=[];
 const origin=await target.evaluate(element=>{const r=element.getBoundingClientRect();return {x:r.left+scrollX,y:r.top+scrollY};});
 for(let y=0;y<height;y+=tileHeight)for(let x=0;x<width;x+=tileWidth){
  await frame.evaluate(async({x,y})=>{scrollTo({left:x,top:y,behavior:'instant'});await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));},{x:origin.x+x-safe.left,y:origin.y+y-safe.top});
  await target.evaluate(waitForRenderedElements);
  await frame.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(image=>image.currentSrc).map(image=>image.decode()));await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
  const box=await target.boundingBox();
  if(!box||Math.abs(box.width-bounds.width)>0.5||Math.abs(box.height-bounds.height)>0.5)throw new Error('Capture target changed size while tiling.');
  const clip={x:Math.round(box.x)+x,y:Math.round(box.y)+y,width:Math.min(tileWidth,width-x),height:Math.min(tileHeight,height-y)};
  if(clip.x<0||clip.y<0||clip.x+clip.width>viewport.width||clip.y+clip.height>viewport.height)throw new Error('Capture tile is clipped by its frame: '+JSON.stringify(clip));
  const bytes=await page.screenshot({...options,clip});
  tiles.push({x,y,width:clip.width,height:clip.height,base64:bytes.toString('base64')});
 }
 const encoded=await page.evaluate(async({width,height,tiles})=>{
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const context=canvas.getContext('2d');
  for(const tile of tiles){
   const image=await createImageBitmap(new Blob([Uint8Array.from(atob(tile.base64),c=>c.charCodeAt(0))],{type:'image/png'}));
   if(image.width!==tile.width||image.height!==tile.height)throw new Error('Capture tile dimensions changed.');
   context.drawImage(image,tile.x,tile.y);image.close();
  }
  return canvas.toDataURL('image/png').split(',')[1];
 },{width,height,tiles});
 return {bytes:Buffer.from(encoded,'base64'),coverage:{method:'scroll-tiles',viewport,safeViewport:safe,width,height,tiles:tiles.map(({base64,...tile})=>tile),limitations:'Scrolling preserves viewport dimensions and excludes external sticky/fixed page chrome. In-case sticky/fixed content follows its real scroll behavior; nested scrolling and virtualized content retain their authored visible state.'}};
}
