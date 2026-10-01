import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp, mkdir, writeFile, readFile, rm,realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {readEventContracts} from './event-contracts.ts';

async function fixture(files: Record<string,string>, run: (root:string) => Promise<void>) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'cem-event-origin-')));
  try {
    await mkdir(join(root, 'src'));
    for (const [name, text] of Object.entries(files)) await writeFile(join(root, 'src', name), text);
    await run(root);
  } finally {await rm(root, {recursive:true, force:true});}
}
const dispatch = 'declare function dispatchChange(target:EventTarget, change:unknown):void;';
const source = (type:string, payload:string, extra = '') => `${dispatch}
/**
 * @tag en-${type}
 * @fires {CustomEvent<{previous:${type};proposed:${type}}>} en-change
 */
export class Sample extends EventTarget {run(){dispatchChange(this,{previous:${payload},proposed:${payload}});}${extra}}
`;
const orders = [['src/number.ts','src/string.ts'], ['src/string.ts','src/number.ts']];

for (const sources of orders) {
  const order = sources.join(',');
  test(`same-named classes validate only their own event payloads (${order})`, () => fixture({
    'number.ts': source('number', '1'), 'string.ts': source('string', "'right'"),
  }, async root => {
    const contracts = await readEventContracts(root, sources);
    assert.equal(contracts.length, 2);
    for (const contract of contracts) {
      assert.equal(contract.className, 'Sample');
      assert.equal(contract.name, 'en-change');
      const type = contract.source.includes('number') ? 'number' : 'string';
      assert.match(contract.detail, new RegExp(`previous: ${type}`));
      assert.match(contract.detail, new RegExp(`proposed: ${type}`));
      assert.deepEqual(Object.keys(contract).sort(), ['className','detail','name','source','type']);
    }
  }));

  test(`another module's same-named contract cannot mask a wrong payload (${order})`, () => fixture({
    'number.ts': source('number', "'wrong'"), 'string.ts': source('string', "'right'"),
  }, async root => {
    await assert.rejects(() => readEventContracts(root, sources), /Emitted payload disagrees with @fires: .*number\.ts:/);
  }));

  test(`internal events on a same-named class do not waive public classification (${order})`, () => fixture({
    'number.ts': `${dispatch}\n/** @tag en-number */ export class Sample extends EventTarget {run(){dispatchChange(this,{previous:1,proposed:2});}}`,
    'string.ts': `${dispatch}\n/**\n * @tag en-string\n * @internalEvent en-change\n */ export class Sample extends EventTarget {run(){dispatchChange(this,{previous:'a',proposed:'b'});}}`,
  }, async root => {
    await assert.rejects(() => readEventContracts(root, sources), /Unclassified emitted event: .*number\.ts Sample\.en-change/);
  }));
}

test('public classification does not leak to an unrelated same-named helper', () => fixture({
  'number.ts': `${dispatch}\n/** @tag en-number */ export class Sample extends EventTarget {}`,
  'string.ts': `${dispatch}\nexport class Sample extends EventTarget {run(){dispatchChange(this,{previous:1,proposed:2});}}\n/** @fires {CustomEvent<null>} en-other */ export class ContractOwner extends EventTarget {}`,
}, async root => {
  const contracts = await readEventContracts(root, ['src/number.ts','src/string.ts']);
  assert.deepEqual(contracts.map(row => row.className), ['ContractOwner']);
}));

test('an imported alias is checked against the target class rather than the enclosing class', () => fixture({
  'number.ts': source('number', '1'),
  'string.ts': `import {Sample as Numeric} from './number.js';\n` + source('string', "'right'", `cross(target:Numeric){dispatchChange(target,{previous:'wrong',proposed:'wrong'});}`),
}, async root => {
  await assert.rejects(() => readEventContracts(root, ['src/number.ts','src/string.ts']), /Emitted payload disagrees with @fires: .*string\.ts:/);
}));

test('an imported alias accepts the target class payload even inside a different same-named class', () => fixture({
  'number.ts': source('number', '1'),
  'string.ts': `import {Sample as Numeric} from './number.js';\n` + source('string', "'right'", 'cross(target:Numeric){dispatchChange(target,{previous:1,proposed:2});}'),
}, async root => {
  assert.equal((await readEventContracts(root, ['src/number.ts','src/string.ts'])).length, 2);
}));

test('duplicate typed annotations on one exact class are rejected rather than overwritten', () => fixture({
  'number.ts': `/**\n * @fires {CustomEvent<number>} en-change\n * @fires {CustomEvent<string>} en-change\n */ export class Sample extends EventTarget {}`,
}, async root => {
  await assert.rejects(() => readEventContracts(root, ['src/number.ts']), /Duplicate typed @fires contract: src\/number\.ts#Sample\.en-change/);
}));

test('generic class receivers and imported generic event aliases retain typed payload enforcement', () => fixture({
  'contracts.ts': 'export type Changed<T> = CustomEvent<{previous:T;proposed:T}>;',
  'number.ts': `import type {Changed} from './contracts.js'; ${dispatch}
/** @fires {Changed<number>} en-change */
export class Sample<T=string> extends EventTarget {value!:T; run(){dispatchChange(this,{previous:1,proposed:2});}}
/** @fires {CustomEvent<null>} en-other */ export class Caller extends EventTarget {
  run(target:Sample<boolean>){dispatchChange(target,{previous:1,proposed:2});}
}`,
}, async root => {
  const sources = ['src/number.ts','src/contracts.ts'];
  assert.equal((await readEventContracts(root, sources)).length, 2);
  const file = join(root,'src/number.ts'), valid = await readFile(file,'utf8');
  const changed = valid.replace('dispatchChange(target,{previous:1,proposed:2})', "dispatchChange(target,{previous:'wrong',proposed:'wrong'})");
  assert.notEqual(changed, valid);
  const line = changed.split('\n').findIndex(text => text.includes('run(target:Sample<boolean>)')) + 1;
  assert.ok(line > 0);
  await writeFile(file, changed);
  await assert.rejects(() => readEventContracts(root, sources), new RegExp(`Emitted payload disagrees with @fires: .*number\\.ts:${line} Sample\\.en-change`));
}));

test('ordinary event typing still rejects missing, any, unknown and unresolved payload contracts', () => fixture({
  'number.ts': '',
}, async root => {
  for (const type of ['CustomEvent','CustomEvent<any>','CustomEvent<unknown>','MissingEvent']) {
    await writeFile(join(root,'src/number.ts'), `/** @fires {${type}} en-change */ export class Sample extends EventTarget {}`);
    await assert.rejects(() => readEventContracts(root, ['src/number.ts']), type === 'MissingEvent'
      ? /Cannot find name 'MissingEvent'/ : /Type 'false' does not satisfy the constraint 'true'/);
  }
}));
