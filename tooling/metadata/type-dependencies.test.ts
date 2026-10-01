import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm,realpath } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { typeDependencyIdentity, revalidateTypeDependencyIdentity, captureTypeDependencyQueries } from './type-dependencies.ts';
import { generateTypeSnapshot } from './type-snapshot.ts';
import { digestJson } from '../evidence/identity.ts';

test('compiler identity follows external configuration/imports and newly resolved missing files', async t => {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'type-closure-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const pkg = join(root, 'package');
  await mkdir(join(pkg, 'src'), { recursive: true });
  await writeFile(join(pkg, 'package.json'), JSON.stringify({ type: 'module' }));
  await writeFile(join(root, 'base.json'), JSON.stringify({ compilerOptions: { target: 'ES2022', module: 'NodeNext', moduleResolution: 'NodeNext', strict: true, skipLibCheck: true } }));
  await writeFile(join(pkg, 'tsconfig.json'), JSON.stringify({ extends: '../base.json', include: ['src/**/*.ts'] }));
  await writeFile(join(pkg, 'src/index.ts'), "export type { Outside } from '../../outside.js';\nexport type { Added } from './added.js';\n");
  await writeFile(join(root, 'outside.ts'), 'export interface Outside { value: string }');
  const identity = () => digestJson(typeDependencyIdentity(pkg));
  const originalTrace = typeDependencyIdentity(pkg);
  assert(revalidateTypeDependencyIdentity(originalTrace));
  const first = identity();
  assert.equal(identity(), first, 'Repeated resolution is canonical');
  await writeFile(join(root, 'outside.ts'), 'export interface Outside { value: number }');
  assert.equal(revalidateTypeDependencyIdentity(originalTrace),false,'Replay detects changed external bytes without recreating the program');
  const externalTrace=typeDependencyIdentity(pkg);
  const external = identity(); assert.notEqual(external, first, 'External dependency edits invalidate');
  await writeFile(join(pkg, 'src/added.ts'), 'export type Added = string');
  assert.equal(revalidateTypeDependencyIdentity(externalTrace),false,'Replay detects an addition that can satisfy a failed resolution');
  const added = identity(); assert.notEqual(added, external, 'Newly resolvable inputs invalidate');
  await rm(join(pkg, 'src/added.ts')); assert(revalidateTypeDependencyIdentity(externalTrace)); assert.equal(identity(), external, 'Deleted input returns to the prior missing-resolution identity');
  await writeFile(join(root, 'base.json'), JSON.stringify({ compilerOptions: { target: 'ES2022', module: 'NodeNext', moduleResolution: 'NodeNext', strict: false, skipLibCheck: true } }));
  assert.equal(revalidateTypeDependencyIdentity(externalTrace),false);
  assert.notEqual(identity(), external, 'External compiler options invalidate');
});


test('actual snapshot capture covers declaration emit and second-program reads without changing canonical bytes', async t => {
  const root=await realpath(await mkdtemp(join(tmpdir(),'snapshot-capture-')));
  t.after(()=>rm(root,{recursive:true,force:true}));
  const pkg=join(root,'package');await mkdir(join(pkg,'src'),{recursive:true});
  await writeFile(join(pkg,'package.json'),JSON.stringify({name:'captured-fixture',type:'module',exports:{'.':{types:'./dist/index.d.ts'}}}));
  await writeFile(join(pkg,'tsconfig.json'),JSON.stringify({compilerOptions:{target:'ES2022',module:'NodeNext',moduleResolution:'NodeNext',outDir:'dist',rootDir:'src',strict:true,skipLibCheck:true},include:['src/**/*.ts']}));
  await writeFile(join(pkg,'src/index.ts'),"export type { External } from '../../external.js';\nexport const value = 1;\n");
  await writeFile(join(root,'external.d.ts'),'export interface External { value: string }');
  const direct=await generateTypeSnapshot(pkg);
  const captured=await captureTypeDependencyQueries(()=>generateTypeSnapshot(pkg));
  assert.deepEqual(captured.result,direct,'Canonical generator output is unchanged');
  assert.equal(captured.result.gaps.length,0);
  assert(captured.compiler.files.includes(join(root,'external.d.ts')));
  assert(revalidateTypeDependencyIdentity(captured.compiler));
  await writeFile(join(root,'external.d.ts'),'export interface External { value: number }');
  assert.equal(revalidateTypeDependencyIdentity(captured.compiler),false);
  await assert.rejects(captureTypeDependencyQueries(async()=>{throw new Error('seeded producer failure');}),/seeded producer failure/);
  const recovered=await captureTypeDependencyQueries(()=>generateTypeSnapshot(pkg));
  assert(revalidateTypeDependencyIdentity(recovered.compiler),'Failed capture restores the compiler host');
});
