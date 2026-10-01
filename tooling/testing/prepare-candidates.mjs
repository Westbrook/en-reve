import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { root } from './pathways.mjs';
const output=process.argv[2];if(!output)throw new Error('A fresh candidate-fixture output is required');
const build=JSON.parse(await readFile(resolve(root,'dist/review-build.json'),'utf8'));
// Bind to this built fixture. Generating test input does not record human review.
const child=spawn(process.execPath,[resolve(root,'tooling/theme-candidates/prepare.mjs'),'--build-fingerprint',build.fingerprint,'--output',resolve(output)],{cwd:root,stdio:'inherit'});
const code=await new Promise((yes,no)=>{child.once('error',no);child.once('exit',yes);});
if(code!==0)throw new Error('Candidate test-fixture preparation failed: '+code);
