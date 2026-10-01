import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeHexColor, fromHex, toHex, toHSL, fromHSL } from '../color.ts';
test('hex normalization supports alpha without confusing ARGB and RGBA', () => {
  assert.equal(normalizeHexColor('#3698'), '#33669988');
  assert.equal(normalizeHexColor('FF000080'), '#ff000080');
  assert.equal(normalizeHexColor('#abcd'), '#aabbccdd');
  assert.equal(normalizeHexColor('#123f'), '#112233');
  assert.equal(normalizeHexColor('#0000'), '#00000000');
  for (const value of ['#12','#12345','#1234567','#gggg','red','rgb(0,0,0)','']) assert.equal(normalizeHexColor(value), undefined);
});
test('HSL primary and grayscale values match CSS colors', () => {
  for (const [hue, hex] of [[0,'#ff0000'],[60,'#ffff00'],[120,'#00ff00'],[180,'#00ffff'],[240,'#0000ff'],[300,'#ff00ff'],[360,'#ff0000']] as const) assert.equal(toHex(fromHSL([hue,100,50])), hex);
  assert.equal(toHex(fromHSL([240,100,50],0.5)), '#0000ff80');
  assert.deepEqual(toHSL(fromHex('#808080'),270), [270,0,128/255*100]);
  assert.equal(toHex(fromHSL([270,0,0])), '#000000');
  assert.equal(toHex(fromHSL([270,0,100])), '#ffffff');
});
test('RGB/HSL conversion round trips a byte grid and preserves alpha', () => {
  for (let r=0;r<=255;r+=17) for (let g=0;g<=255;g+=17) for (let b=0;b<=255;b+=17) {
    const rgba:[number,number,number,number]=[r,g,b,128/255];
    assert.equal(toHex(fromHSL(toHSL(rgba),rgba[3])),toHex(rgba));
  }
});
