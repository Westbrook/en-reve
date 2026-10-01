import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root } from './pathways.mjs';
const destination=process.argv[2];
if(!destination)throw new Error('A fresh date campaign directory is required');
const bytes=await readFile(resolve(root,'showcases/performance/baselines/scoped-registry-phase-6-v1/budgets.json'));
JSON.parse(bytes);
await mkdir(resolve(destination),{recursive:true});
await writeFile(resolve(destination,'budgets.json'),bytes,{flag:'wx'});
