import assert from 'node:assert/strict';

const twoFrames = locator => locator.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

/** Scroll explicitly before opening a popup; the target is usually its editor. */
export async function positionFramedTarget(page, iframe, target) {
  await iframe.evaluate(frame => frame.scrollIntoView({block:'center',inline:'center',behavior:'instant'}));
  await twoFrames(iframe);
  const metrics = await target.evaluate(element => {
    const view=element.ownerDocument.defaultView;
    const navigation=element.ownerDocument.querySelector('en-navigation.section-nav');
    const style=navigation&&view.getComputedStyle(navigation);
    const inset=style&&style.position==='sticky'
      ? navigation.getBoundingClientRect().height+(parseFloat(style.top)||0) : 0;
    const desiredTop=inset+16;
    view.scrollBy({top:element.getBoundingClientRect().top-desiredTop,behavior:'instant'});
    return {navigationHeight:navigation?.getBoundingClientRect().height??0,desiredTop};
  });
  await twoFrames(target);
  return metrics;
}

/** No target/ancestor scroll is performed here. The prepared content must fit. */
export async function captureVisibleFramed(page, iframe, target, path, { padding = 0 } = {}) {
  assert.ok(Number.isFinite(padding) && padding >= 0, 'Capture padding must be nonnegative.');
  // The controller may need another frame after keyboard/popup positioning.
  // Require stable geometry before collecting the final visible crop.
  let previous, stable=false;
  for(let attempt=0;attempt<8;attempt++) {
    await twoFrames(target);
    const box=await target.boundingBox();
    assert.ok(box,'Capture target has no visible box.');
    if(previous&&['x','y','width','height'].every(key=>Math.abs(box[key]-previous[key])<.1)){stable=true;break;}
    previous=box;
  }
  assert.ok(stable,'Capture target did not settle.');
  const box=await target.boundingBox(),frameBox=await iframe.boundingBox();
  assert.ok(box&&frameBox,'Capture target or iframe is detached.');
  const frameMetrics=await iframe.evaluate(frame=>({left:frame.clientLeft,top:frame.clientTop,width:frame.clientWidth,height:frame.clientHeight}));
  const visibleFrame={x:frameBox.x+frameMetrics.left,y:frameBox.y+frameMetrics.top,width:frameMetrics.width,height:frameMetrics.height};
  const viewport=page.viewportSize();assert.ok(viewport);
  const clip={x:box.x-padding,y:box.y-padding,width:box.width+2*padding,height:box.height+2*padding};
  for(const bounds of [visibleFrame,{x:0,y:0,...viewport}]) {
    assert.ok(clip.x>=bounds.x-.1&&clip.y>=bounds.y-.1&&clip.x+clip.width<=bounds.x+bounds.width+.1&&clip.y+clip.height<=bounds.y+bounds.height+.1,
      'Capture target is clipped. Choose a smaller specimen/control target; do not silently crop offscreen content.');
  }
  const points=[{x:box.x+box.width/2,y:box.y+Math.min(8,box.height/2)},
    {x:box.x+box.width/2,y:box.y+box.height/2},
    {x:box.x+box.width/2,y:box.y+box.height-Math.min(8,box.height/2)}];
  for(const point of points) {
    assert.equal(await iframe.evaluate((frame,point)=>frame.ownerDocument.elementFromPoint(point.x,point.y)===frame,point),true,
      'Parent-page content covers the candidate iframe crop.');
    const childPoint={x:point.x-visibleFrame.x,y:point.y-visibleFrame.y};
    const hit=await target.evaluate((target,point)=>{
      let hit=target.ownerDocument.elementFromPoint(point.x,point.y);
      for(let depth=0;depth<20&&hit?.shadowRoot;depth++){
        const next=hit.shadowRoot.elementFromPoint(point.x,point.y);if(!next||next===hit)break;hit=next;
      }
      const describe=element=>element?`${element.localName}${element.id?'#'+element.id:''}${element.getAttribute('part')?'[part='+element.getAttribute('part')+']':''}`:null;
      const found=describe(hit);
      for(let node=hit;node;node=node.assignedSlot??node.parentElement??node.getRootNode().host){if(node===target)return {inside:true,hit:found};}
      return {inside:false,hit:found};
    },childPoint);
    assert.equal(hit.inside,true,`Child sticky navigation or another element covers the capture (${hit.hit}).`);
  }
  // Page screenshot does not run locator screenshot's nested scroll-into-view.
  // boundingBox coordinates already refer to the top-level viewport.
  await page.screenshot({path,clip,animations:'disabled'});
  return {path,box,clip,padding,iframe:visibleFrame,hitPoints:points,wholeTarget:true};
}
