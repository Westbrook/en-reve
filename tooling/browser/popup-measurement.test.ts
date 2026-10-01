import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calibratedOrigin,popupFit,verticalSpace} from '../../packages/elements/src/internal/popup-measurement.ts';
test('popup origin ignores rounding noise but follows visual viewport movement',()=>{
 assert.equal(calibratedOrigin('40px',20),20);assert.equal(calibratedOrigin('40.4px',20,20),20);assert.equal(calibratedOrigin('41px',20,20),21);
 assert.equal(calibratedOrigin('auto',10),0);
});
test('shared fit distinguishes opening remeasurement, no-room and offscreen suspension',()=>{
 const input={widthChanged:false,heightChanged:false,intersects:true,width:320,height:400,rowHeight:30,available:100,minimumHeight:40,popupHeight:100};
 assert.equal(popupFit(input).state,'visible');assert.equal(popupFit({...input,widthChanged:true}).state,'pending');
 assert.equal(popupFit({...input,available:20}).reason,'no-room');assert.equal(popupFit({...input,intersects:false}).reason,'offscreen');
 assert.deepEqual(verticalSpace({top:300,bottom:330},{top:20,height:400},10,100),{below:80,above:270,useAbove:true});
});
