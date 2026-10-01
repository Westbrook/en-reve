import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {readDefinitionGraph, verifyDefinitionEntries, type SourceDefinition} from './definition-graph.ts';

function closure(root: SourceDefinition): string[] {
  return [...new Set([root.tagName, ...root.dependencies.flatMap(closure)])].sort();
}

test('all catalog and define entries consume canonical component definitions', async () => {
  const graph = await verifyDefinitionEntries(new URL('../../packages/elements/', import.meta.url).pathname);
  assert.equal(graph.length, 96);
  const byTag = new Map(graph.map(item => [item.tagName, item]));
  assert.deepEqual(closure(byTag.get('en-color-picker')!), ['en-button', 'en-color-picker', 'en-color-plane', 'en-color-slider', 'en-select', 'en-select-option', 'en-switch', 'en-text-field']);
  assert.deepEqual(closure(byTag.get('en-date-picker')!), ['en-button', 'en-calendar', 'en-date-picker', 'en-dialog', 'en-icon']);
  // Authored children and compatible editor implementations remain explicit imports.
  for (const tag of ['en-menu', 'en-radio-group', 'en-accordion', 'en-tabs', 'en-editor-trigger']) assert.deepEqual(closure(byTag.get(tag)!), [tag]);
  assert.ok(byTag.has('en-menu-item'));
});

async function fixture(run: (root: string) => Promise<void>) {
  const root = await mkdtemp(join(tmpdir(), 'en-definition-graph-'));
  try {
    await mkdir(join(root, 'src/definitions'), {recursive:true});
    await writeFile(join(root, 'src/catalog.ts'), "import {aDefinition} from './definitions/a.js'; export const definitions = [aDefinition] as const;");
    await run(root);
  } finally { await rm(root, {recursive:true, force:true}); }
}

test('reads shared diamonds and aliases without evaluating component code', async () => fixture(async root => {
  await writeFile(join(root, 'src/definitions/a.ts'), "import {bDefinition as b} from './b.js'; import {cDefinition} from './c.js'; export const aDefinition = {tagName:'en-a', elementClass:A, dependencies:[b,cDefinition]};");
  await writeFile(join(root, 'src/definitions/b.ts'), "import {dDefinition} from './d.js'; export const bDefinition = {tagName:'en-b', elementClass:B, dependencies:[dDefinition]};");
  await writeFile(join(root, 'src/definitions/c.ts'), "import {dDefinition} from './d.js'; export const cDefinition = {tagName:'en-c', elementClass:C, dependencies:[dDefinition]};");
  await writeFile(join(root, 'src/definitions/d.ts'), "import {D as LocalD} from '../never-execute.js'; export const dDefinition = {tagName:'en-d', elementClass:LocalD};");
  await writeFile(join(root, 'src/never-execute.ts'), "throw new Error('Must not execute');");
  const [a] = await readDefinitionGraph(root);
  assert.deepEqual(closure(a), ['en-a','en-b','en-c','en-d']);
  assert.equal(a.dependencies[0].dependencies[0], a.dependencies[1].dependencies[0]);
  assert.equal(a.dependencies[0].dependencies[0].className, 'D');
}));

test('rejects cycles, missing definitions, duplicate roots and computed graphs', async () => fixture(async root => {
  const file = join(root, 'src/definitions/a.ts');
  await writeFile(file, "export const aDefinition = {tagName:'en-a', elementClass:A, dependencies:[aDefinition]};");
  await assert.rejects(readDefinitionGraph(root), /Cyclic/);
  await writeFile(file, "import {missing} from './missing.js'; export const aDefinition = {tagName:'en-a', elementClass:A, dependencies:[missing]};");
  await assert.rejects(readDefinitionGraph(root), /ENOENT/);
  await writeFile(file, 'export const aDefinition = computeDefinition();');
  await assert.rejects(readDefinitionGraph(root), /literal/);
  await writeFile(file, "export const aDefinition = {tagName:'en-a', elementClass:A};");
  await writeFile(join(root, 'src/catalog.ts'), "import {aDefinition} from './definitions/a.js'; export const definitions = [aDefinition,aDefinition];");
  await assert.rejects(readDefinitionGraph(root), /Duplicate/);
}));

test('rejects duplicate dependency copies even when tag and constructor spellings agree', async () => fixture(async root => {
  await mkdir(join(root, 'src/define'));
  await writeFile(join(root, 'src/definitions/a.ts'), "export const aDefinition = {tagName:'en-a', elementClass:A, dependencies:[{tagName:'en-b', elementClass:B}]};");
  await writeFile(join(root, 'src/catalog.ts'), "import {aDefinition} from './definitions/a.js'; export const definitions = [aDefinition, {tagName:'en-b', elementClass:B}];");
  await assert.rejects(verifyDefinitionEntries(root), /Noncanonical/);
}));

test('entry verification accepts formatting and aliases but rejects registration bypasses', async () => fixture(async root => {
  await mkdir(join(root, 'src/define'));
  await writeFile(join(root, 'src/definitions/a.ts'), "export const aDefinition = {tagName:'en-a', elementClass:A};");
  const entry = join(root, 'src/define/a.ts');
  await writeFile(entry, `// Alternate formatting is not a different contract.
    import { aDefinition as definition } from '../definitions/a.js';
    import { registerDefinition as register } from '@en-reve/primitives/interactions/registration.js';
    register(customElements, definition);
  `);
  assert.equal((await verifyDefinitionEntries(root)).length, 1);
  await writeFile(entry, "import {aDefinition} from '../definitions/a.js'; import {registerDefinition} from '@en-reve/primitives/interactions/registration.js'; registerDefinition(otherRegistry, aDefinition);");
  await assert.rejects(verifyDefinitionEntries(root), /canonical definition/);
}));
