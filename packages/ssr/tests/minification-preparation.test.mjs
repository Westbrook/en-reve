import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, stat, utimes, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareMinificationSource } from './minification/source.mjs';

test('minifier source preparation binds exact template bytes without rewriting unchanged input',async t=>{
 const root=await mkdtemp(join(tmpdir(),'en-minifier-source-'));
 t.after(()=>rm(root,{recursive:true,force:true}));
 const template=join(root,'template.mjs'),generated=join(root,'source.generated.mjs');
 const original='Quotes " and \\ and Unicode Ω\n';
 await writeFile(template,original);await prepareMinificationSource(root);
 assert.equal(await readFile(generated,'utf8'),`export default ${JSON.stringify(original)};\n`);
 await utimes(generated,1000,1000);const before=await stat(generated);
 await prepareMinificationSource(root);assert.equal((await stat(generated)).mtimeMs,before.mtimeMs);
 await writeFile(template,'changed');await prepareMinificationSource(root);
 assert.equal(await readFile(generated,'utf8'),'export default "changed";\n');
 await rm(template);await assert.rejects(prepareMinificationSource(root),{code:'ENOENT'});
 assert.equal(await readFile(generated,'utf8'),'export default "changed";\n');
});
