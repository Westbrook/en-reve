import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { writeExperimentReceipt } from './receipt-output.mjs';
test('fresh instrument receipts preserve hierarchy, reject overwrite and escaping paths',async()=>{
 const directory=await mkdtemp(resolve(tmpdir(),'native-control-receipt-')),before=process.env.EN_NATIVE_EXPERIMENT_OUTPUT;
 process.env.EN_NATIVE_EXPERIMENT_OUTPUT=directory;
 try{
  await writeExperimentReceipt('reports/en-reve-main/startup-calibration.json','{"passed":true}');
  assert.equal(await readFile(resolve(directory,'en-reve-main/startup-calibration.json'),'utf8'),'{"passed":true}');
  await assert.rejects(writeExperimentReceipt('reports/en-reve-main/startup-calibration.json','replacement'),{code:'EEXIST'});
  for(const path of ['reports/../outside','reports//absolute','/reports/file','reports/./file','reports/dir\\file'])await assert.rejects(writeExperimentReceipt(path,'invalid'),/Invalid/);
 }finally{
  if(before===undefined)delete process.env.EN_NATIVE_EXPERIMENT_OUTPUT;else process.env.EN_NATIVE_EXPERIMENT_OUTPUT=before;
  await rm(directory,{recursive:true,force:true});
 }
});
