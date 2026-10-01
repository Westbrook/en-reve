import test from 'node:test';
import assert from 'node:assert/strict';
import { registerDefinitions } from '../dist/interactions/registration.js';

function registry() {
  const definitions = new Map();
  const calls = [];
  return { definitions, calls, get: (name) => definitions.get(name), define: (name, constructor) => { calls.push(name); definitions.set(name, constructor); } };
}

test('registration adds dependency closure once and allows repeated identical registrations', () => {
  const target = registry();
  class Leaf {}
  class Branch {}
  const leaf = { tagName: 'en-leaf', elementClass: Leaf };
  const branch = { tagName: 'en-branch', elementClass: Branch, dependencies: [leaf] };
  registerDefinitions(target, [branch, leaf]);
  registerDefinitions(target, [branch]);
  assert.deepEqual(target.calls, ['en-leaf', 'en-branch']);
});

test('an existing different version rejects before registering any new dependencies', () => {
  const target = registry();
  class Existing {}
  class NewVersion {}
  class NewDependency {}
  target.definitions.set('en-branch', Existing);
  assert.throws(() => registerDefinitions(target, [{ tagName: 'en-branch', elementClass: NewVersion, dependencies: [{ tagName: 'en-leaf', elementClass: NewDependency }] }]), /different version/);
  assert.deepEqual(target.calls, []);
  assert.equal(target.get('en-branch'), Existing);
});

test('the same tags can be registered with distinct constructors in separate supplied registries', () => {
  const oldRegistry = registry();
  const newRegistry = registry();
  class Old {}
  class New {}
  registerDefinitions(oldRegistry, [{ tagName: 'en-field', elementClass: Old }]);
  registerDefinitions(newRegistry, [{ tagName: 'en-field', elementClass: New }]);
  assert.equal(oldRegistry.get('en-field'), Old);
  assert.equal(newRegistry.get('en-field'), New);
});

test('a dependency graph cannot silently bind one tag to different constructors', () => {
  const target = registry();
  assert.throws(() => registerDefinitions(target, [{ tagName: 'en-field', elementClass: class First {} }, { tagName: 'en-field', elementClass: class Second {} }]), /Conflicting constructors/);
  assert.deepEqual(target.calls, []);
});

test('multiple descriptors for one constructor preserve their complete dependency closure', () => {
  const target = registry();
  class Host {}
  class Child {}
  registerDefinitions(target, [
    { tagName: 'en-host', elementClass: Host },
    { tagName: 'en-host', elementClass: Host, dependencies: [{ tagName: 'en-child', elementClass: Child }] },
  ]);
  assert.equal(target.get('en-host'), Host);
  assert.equal(target.get('en-child'), Child);
  assert.deepEqual(target.calls, ['en-child', 'en-host']);
});
