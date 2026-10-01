import {test} from 'node:test';
import assert from 'node:assert/strict';
import {toHSV,fromHSV} from '../../../dist/color-picker/hsv.js';
import {parseColor} from '../../../dist/color-picker/color-value.js';
const near=(actual,expected)=>actual.forEach((value,index)=>assert.ok(Math.abs(value-expected[index])<1e-12,`${value} != ${expected[index]}`));
test('HSV is calculated in the active encoded space and round trips without P3 clipping',()=>{
  for(const space of ['srgb','display-p3'])for(let r=0;r<=1;r+=.2)for(let g=0;g<=1;g+=.2)for(let b=0;b<=1;b+=.2){const color={space,channels:[r,g,b],alpha:.3456789},roundtrip=fromHSV(color,toHSV(color));near(roundtrip.channels,color.channels);assert.equal(roundtrip.space,space);assert.equal(roundtrip.alpha,color.alpha);}
  near(toHSV(parseColor('color(display-p3 1 .2 .1 / .3)')),[20/3,90,100]);
});
test('achromatic coordinates retain hue and black retains saturation for subsequent value edits',()=>{
  assert.deepEqual(toHSV(parseColor('#000'),[210,75,50]),[210,75,0]);
  assert.deepEqual(toHSV(parseColor('#fff'),[210,75,50]),[210,0,100]);
  near(fromHSV(parseColor('#000'),[210,75,100]).channels,[.25,.625,1]);
  near(fromHSV(parseColor('#f00'),[360,100,100]).channels,[1,0,0]);
});
