import test from 'node:test';
import assert from 'node:assert/strict';
import { delimiter } from 'node:path';
import { setupEnvironment, setupEnvironmentInputs, testHarnessVariables, coordinationVariables } from './setup-environment.mjs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { immutableSetup } from './immutable-setup.mjs';
import { withMachineOwner } from '../testing/machine-owner.mjs';
import { withExecutionOwner } from '../testing/execution-owner.mjs';

test('fresh harness roots cannot affect an isolated producer, while semantic options remain distinct',()=>{
 const input={PATH:['/first','/second','/first'].join(delimiter),LANG:'fr_FR.UTF-8',VITE_PUBLIC_PREFIX:'/custom',REVE_CSS_FUNCTIONS_SOURCE:'/audited/engine',NODE_ENV:'development',...Object.fromEntries(testHarnessVariables.map(key=>[key,'/fresh/receipt-a']))};
 const first=setupEnvironment(input),second=setupEnvironment({...input,...Object.fromEntries(testHarnessVariables.map(key=>[key,'/fresh/receipt-b']))});
 assert.deepEqual(first,second);assert.equal(input.EN_EXECUTION_OUTPUT,'/fresh/receipt-a','Caller environment is not mutated');
 for(const key of testHarnessVariables)assert(!Object.hasOwn(first,key));
 assert.equal(first.NODE_ENV,'development');assert.equal(first.LANG,input.LANG);assert.equal(first.REVE_CSS_FUNCTIONS_SOURCE,input.REVE_CSS_FUNCTIONS_SOURCE);assert.equal(first.VITE_PUBLIC_PREFIX,input.VITE_PUBLIC_PREFIX);
 assert.equal(first.PATH,['/first','/second'].join(delimiter));
 assert.equal(setupEnvironment({PATH:''}).NODE_ENV,'production');assert(!Object.hasOwn(setupEnvironment({PATH:''},{production:false}),'NODE_ENV'));
});

test('omitted npm lifecycle context is absent from actual compiler environment, while packing retains npm configuration',()=>{
 const input={PATH:'/bin',npm_lifecycle_event:'metadata',npm_config_registry:'https://registry.example',npm_package_name:'caller',PWD:'/caller',INIT_CWD:'/caller',EN_TEST_EXECUTION_OWNER:'coordination-token'};
 const compiler=setupEnvironment(input),packing=setupEnvironment(input,{production:false});
 assert(!Object.keys(compiler).some(key=>key.startsWith('npm_')));
 assert.equal(packing.npm_config_registry,input.npm_config_registry);assert.equal(packing.npm_package_name,input.npm_package_name);
 for(const env of [compiler,packing]){assert(!Object.hasOwn(env,'PWD'));assert(!Object.hasOwn(env,'INIT_CWD'));assert(!Object.hasOwn(env,'npm_lifecycle_event'));assert.equal(env.EN_TEST_EXECUTION_OWNER,input.EN_TEST_EXECUTION_OWNER);}
});

test('distinct live owners reuse preparation while children retain ownership and semantic changes still rebuild', async () => {
 const root = await mkdtemp(join(tmpdir(), 'en-coordination-preparation-'));
 const previous = process.env.EN_SETUP_CACHE;
 process.env.EN_SETUP_CACHE = 'on'; // This private cache control must also run inside the uncached outer lane.
 const owners = [], children = [];
 try {
  const semantic = { PATH: process.env.PATH, LANG: 'fr_FR.UTF-8', EN_TEST_MACHINE_OWNER_SUFFIX: 'authored-option' };
  const contexts = ['first', 'second'].map(value => setupEnvironment({ ...semantic,
   ...Object.fromEntries(coordinationVariables.map(key => [key, value])) }));
  assert.deepEqual(setupEnvironmentInputs(contexts[0]), setupEnvironmentInputs(contexts[1]));
  for (const [index, context] of contexts.entries()) for (const key of coordinationVariables)
   assert.equal(context[key], index ? 'second' : 'first', 'Actual child context must retain every exact owner variable');
  assert.equal(setupEnvironmentInputs(contexts[0]).EN_TEST_MACHINE_OWNER_SUFFIX, 'authored-option');

  const machineModule = new URL('../testing/machine-owner.mjs', import.meta.url).href;
  const checkoutModule = new URL('../testing/execution-owner.mjs', import.meta.url).href;
  async function prepare(option) {
   const environment = { ...semantic, GENERATOR_OPTION: option, EN_TEST_MACHINE_LOCK: join(root, 'private-machine') };
   return withMachineOwner(async ({ owner }) => {
    owners.push(owner.id);
    return withExecutionOwner(root, async () => {
     const actual = setupEnvironment(environment);
     const inputs = { environment: setupEnvironmentInputs(actual) };
     const result = await immutableSetup({ cache: join(root, 'cache'), inputs,
      verifyInputs: async () => ({ environment: setupEnvironmentInputs(setupEnvironment(environment)) }),
      produce: async output => {
       const code = `import assert from 'node:assert/strict';import{writeFile}from'node:fs/promises';import{withMachineOwner}from ${JSON.stringify(machineModule)};import{withExecutionOwner}from ${JSON.stringify(checkoutModule)};await withMachineOwner(async machine=>{assert(machine.borrowed);await withExecutionOwner(${JSON.stringify(root)},async checkout=>{assert(checkout.borrowed);await writeFile(process.argv[1],JSON.stringify({language:process.env.LANG,option:process.env.GENERATOR_OPTION,lookalike:process.env.EN_TEST_MACHINE_OWNER_SUFFIX}));console.log(JSON.stringify({machine:machine.borrowed,checkout:checkout.borrowed}));});});`;
       const { stdout } = await promisify(execFile)(process.execPath,
        ['--input-type=module', '-e', code, join(output, 'value.json')], { env: actual });
       children.push(JSON.parse(stdout));
      } });
     return { ...result, value: JSON.parse(await readFile(join(result.directory, 'value.json'), 'utf8')) };
    }, { environment });
   }, { environment });
  }
  const first = await prepare('original'), warm = await prepare('original'), changed = await prepare('changed');
  assert.equal(new Set(owners).size, 3, 'Each invocation has a real distinct owner');
  assert.equal(first.reused, false); assert.equal(warm.reused, true); assert.equal(changed.reused, false);
  assert.equal(first.key, warm.key); assert.notEqual(first.key, changed.key);
  assert.deepEqual(warm.value, first.value); assert.equal(changed.value.option, 'changed');
  assert.deepEqual(children, [{ machine:true, checkout:true }, { machine:true, checkout:true }]);
 } finally {
  if (previous === undefined) delete process.env.EN_SETUP_CACHE; else process.env.EN_SETUP_CACHE = previous;
  await rm(root, { recursive:true, force:true });
 }
});
