import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createColorValue,parseColor,serializeColor,convertColor,inGamut,exportSRGB,colorPaint} from '../../../dist/color-picker/color-value.js';
const near=(actual,expected,tolerance=1e-10)=>actual.forEach((v,i)=>assert.ok(Math.abs(v-expected[i])<tolerance,`${v} != ${expected[i]}`));
test('literal CSS subset preserves hex compatibility, alpha and exact fractional coordinates',()=>{
  assert.equal(serializeColor(parseColor('#3698')),'#33669988');
  assert.equal(serializeColor(parseColor('rgb(255, 0, 128)')),'#ff0080');
  assert.equal(serializeColor(parseColor('hsl(.5turn 100% 50%)')),'#00ffff');
  assert.equal(serializeColor(parseColor('rgba(100%, 0%, 0%, 50%)')),'color(srgb 1 0 0 / 0.5)');
  assert.deepEqual(parseColor('color(DISPLAY-P3 10% .25 1 / .3)'),{space:'display-p3',channels:[.1,.25,1],alpha:.3});
  for(const css of ['color(srgb 0.12345678912345678 0.2 0.8 / 0.12345678912345678)','color(display-p3 1 0.125 0 / 0.5)']) {
    const start=parseColor(css);let color=start;
    for(let i=0;i<100;i++)color=parseColor(serializeColor(color));
    assert.deepEqual(color,start);
  }
});
test('rejects unsupported, relative, nonfinite and out-of-range authored coordinates',()=>{
  for(const css of ['red','currentColor','var(--color)','rgb(from red r g b)','color(rec2020 1 0 0)','color(srgb 1.1 0 0)','color(display-p3 -0.1 0 0)','rgb(256 0 0)','rgb(10%, 2, 3)','hsl(0 110% 50%)','hsl(0 1 1)','rgb(0 0 0 / NaN)','rgb(0 0 0 / 2)','color(srgb 0 0 1e999)','rgb(1 2 3 /)','color(srgb 0,0,0)','color(srgb none 0 0)'])assert.equal(parseColor(css),undefined,css);
});
test('models are copied and deeply immutable',()=>{
  const input={space:'display-p3',channels:[.1,.2,.3],alpha:.5};const color=createColorValue(input);input.channels[0]=.9;
  assert.equal(color.channels[0],.1);assert.ok(Object.isFrozen(color));assert.ok(Object.isFrozen(color.channels));
  assert.equal(createColorValue({...input,channels:[NaN,0,0]}),undefined);
});
test('D65 conversion reference vectors and inverse round trips retain extended coordinates',()=>{
  // CSS Color 4 D65 conversion matrices: P3 primary red is outside sRGB.
  const red=parseColor('color(display-p3 1 0 0 / .25)'),srgb=convertColor(red,'srgb');
  near(srgb.channels,[1.0930663624351615,-0.22674197356975406,-0.1501345809371195]);
  assert.equal(srgb.alpha,.25);assert.equal(inGamut(srgb),false);
  const p3=convertColor(parseColor('#ff0000'),'display-p3');near(p3.channels,[.9174875573251656,.20028680774084695,.1385605912111141]);
  for(let r=0;r<=1;r+=.2)for(let g=0;g<=1;g+=.2)for(let b=0;b<=1;b+=.2){
    const color=createColorValue({space:'display-p3',channels:[r,g,b],alpha:.47});
    near(convertColor(convertColor(color,'srgb'),'display-p3').channels,color.channels);
  }
  assert.equal(inGamut(convertColor(parseColor('#ffffff'),'display-p3')),true);
});
test('lossy export and fallback are explicit, deterministic and never mutate storage',()=>{
  const color=parseColor('color(display-p3 1 0 0 / .5)');const exported=exportSRGB(color);
  assert.equal(exported.clipped,true);assert.deepEqual(exported.color,{space:'srgb',channels:[1,0,0],alpha:.5});
  assert.equal(colorPaint(color,false).value,'rgba(255,0,0,0.5)');
  assert.equal(colorPaint(color,true).value,'color(display-p3 1 0 0 / 0.5)');
  assert.equal(serializeColor(color),'color(display-p3 1 0 0 / 0.5)');
  assert.equal(exportSRGB(parseColor('#33669988')).value,'#33669988');
});
