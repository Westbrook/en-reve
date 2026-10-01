import test from 'node:test';
import assert from 'node:assert/strict';
import {timeSeconds,timeString,timeError,timePresentation} from '../../../dist/internal/time.js';
const defaults={precision:'minute',step:60,min:'',max:'',wrap:false};
test('canonical time rejects instants, offsets, 24:00, fractions and leap seconds',()=>{
 for(const value of ['24:00','12:60','12:00:60','12:00Z','12:00+01:00','2026-09-18T12:00','1:30','12:00:00.5'])assert.equal(timeSeconds(value),undefined,value);
 assert.equal(timeSeconds('00:00'),0);assert.equal(timeSeconds('23:59:59'),86399);assert.equal(timeString(86399,'second'),'23:59:59');
});
test('bounds, precision and step constraints never round',()=>{
 assert.equal(timeError('09:30',{...defaults,min:'09:00',max:'17:00',step:900}),'');assert.match(timeError('09:37',{...defaults,min:'09:00',max:'17:00',step:900}),/increments/);
 assert.match(timeError('08:59',{...defaults,min:'09:00'}),/after/);assert.match(timeError('17:01',{...defaults,max:'17:00'}),/before/);
 assert.match(timeError('10:00:00',defaults),/hours and minutes/);assert.equal(timeError('10:00:15',{...defaults,precision:'second',step:15}),'');assert.match(timeError('10:00',{...defaults,step:15}),/precision/);
 assert.match(timeError('',{...defaults,required:true}),/Enter/);assert.equal(timeError('',defaults),'');assert.match(timeError('09:30',{...defaults,min:'invalid'}),/bounds/);
});
test('overnight interval is explicit and stepping is based on its lower bound',()=>{
 const options={...defaults,min:'22:00',max:'02:00',step:900};assert.match(timeError('23:00',options),/wrap/);
 for(const value of ['22:00','23:45','00:00','01:45','02:00'])assert.equal(timeError(value,{...options,wrap:true}),'',value);
 for(const value of ['21:59','02:01','12:00'])assert.match(timeError(value,{...options,wrap:true}),/between/);
 assert.equal(timeError('00:01',{...defaults,min:'23:59',max:'00:05',wrap:true,step:120}),'');
});
test('localized display round-trips midnight, noon and seconds in both hour cycles',()=>{
 for(const locale of ['en-US','de-DE','ar','th-TH-u-nu-thai','ja-JP','fi-FI','en-US-u-hc-h24','en-US-u-hc-h11'])for(const cycle of ['auto','12','24'])for(const precision of ['minute','second']){
  const p=timePresentation(locale,cycle,precision);
  for(const seconds of [0,43200,86340,13*3600+30*60]){const value=timeString(seconds,precision);assert.equal(p.parse(p.format(value)),value,`${locale}/${cycle}: ${p.format(value)}`);}
 }
});
test('localized parsing is bounded and has canonical 24-hour fallback',()=>{
 const p=timePresentation('en-US','12','minute');assert.equal(p.parse('1:30 PM'),'13:30');assert.equal(p.parse('12:00 AM'),'00:00');assert.equal(p.parse('13:30'),'13:30');assert.equal(p.parse('13:30 PM'),undefined);assert.equal(p.parse('1:30 junk'),undefined);assert.equal(p.parse(''), '');assert.throws(()=>timePresentation('invalid_locale','auto','minute'));
});
test('caret ranges cover localized digits and prefix or suffix day periods without literals',()=>{
 for(const locale of ['en-US','ar-u-nu-arab','th-TH-u-nu-thai','ja-JP','zh-CN']){
  const p=timePresentation(locale,'12','second'),text=p.format('13:45:30'),segments=p.segments(text);
  assert.deepEqual(segments.map(s=>s.type).sort(),['dayPeriod','hour','minute','second']);
  for(const part of segments)assert(text.slice(part.start,part.end).length>0);
  assert.equal(segments.find(s=>s.type==='minute').end-segments.find(s=>s.type==='minute').start,2);
 }
 const p=timePresentation('en-US','12','minute');assert.deepEqual(p.segments('9:45 AM'),[{type:'hour',start:0,end:1},{type:'minute',start:2,end:4},{type:'dayPeriod',start:5,end:7}]);
 assert.deepEqual(timePresentation('en-US','24','second').segments('13:45:30').map(s=>s.type),['hour','minute','second']);
});
