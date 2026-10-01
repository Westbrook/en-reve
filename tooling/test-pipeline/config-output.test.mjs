import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pipelineOutput } from './config-output.mjs';

test('opt-in output keeps configurations distinct and leaves ordinary configuration intact', () => {
  const previous = process.env.EN_TEST_PIPELINE_OUTPUT;
  try {
    delete process.env.EN_TEST_PIPELINE_OUTPUT;
    assert.deepEqual(pipelineOutput('file:///a/config.ts'), {});
    process.env.EN_TEST_PIPELINE_OUTPUT = '/tmp/fresh-evidence';
    const a = pipelineOutput('file:///a/config.ts'), b = pipelineOutput('file:///b/config.ts');
    assert.notEqual(a.outputDir, b.outputDir);
    assert.notEqual(a.reporter[1][1].outputFile, b.reporter[1][1].outputFile);
    assert.equal(a.outputDir, pipelineOutput('file:///a/config.ts').outputDir);
  } finally {
    if (previous === undefined) delete process.env.EN_TEST_PIPELINE_OUTPUT;
    else process.env.EN_TEST_PIPELINE_OUTPUT = previous;
  }
});

test('a focused test is rejected and safe listing cannot overwrite a receipt', async () => {
  const directory = await mkdtemp(join(process.cwd(), 'artifacts/focus-rejection-'));
  try {
    const receipt = join(directory,'retained.json');
    await writeFile(receipt,'retained execution evidence\n');
    await writeFile(join(directory,'playwright.config.mjs'), `export default {forbidOnly:true,testDir:'.',reporter:[['json',{outputFile:${JSON.stringify(receipt)}}]]};`);
    await writeFile(join(directory,'focus.spec.js'), "import {test} from '@playwright/test'; test.only('accidental focus',()=>{});");
    const result = spawnSync(process.execPath,['node_modules/@playwright/test/cli.js','test','--config',join(directory,'playwright.config.mjs'),'--list','--reporter=list'],{encoding:'utf8'});
    assert.notEqual(result.status,0);
    assert.match(result.stdout+result.stderr,/forbidOnly|test.only/);
    assert.equal(await readFile(receipt,'utf8'),'retained execution evidence\n');
  } finally { await rm(directory,{recursive:true,force:true}); }
});
