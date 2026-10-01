import test from 'node:test';
import assert from 'node:assert/strict';
import { filterComponents, normalizeAPIReference } from '../src/api-reference/model.ts';

const entry = { tagName: 'en-example', className: 'EnExample', classImport: '@example/elements/example.js', definitionImport: '@example/elements/define/example.js' };
function normalize(declaration: Record<string, unknown>) {
	return normalizeAPIReference({ packageName: '@example/elements', packageVersion: '0.1.0', manifestDigest: 'sha256:fixture', entries: [entry],
		manifest: { schemaVersion: '1.0.0', modules: [{ path: 'src/example/element.ts', declarations: [{ name: 'EnExample', tagName: 'en-example', ...declaration }] }] } });
}
test('public inheritance survives while private/protected/static and lifecycle hooks do not become consumer APIs', () => {
	const component = normalize({
		members: [
			{ kind: 'field', name: 'size', type: { text: 'ElementSize' }, default: "'medium'", inheritedFrom: { name: 'EnElement', module: 'src/internal/en-element.ts' } },
			{ kind: 'field', name: 'secret', privacy: 'private', attribute: 'secret' },
			{ kind: 'field', name: 'model', privacy: 'protected' },
			{ kind: 'field', name: '#projection' },
			{ kind: 'field', name: 'formAssociated', static: true },
			{ kind: 'method', name: 'formResetCallback' },
			{ kind: 'method', name: 'render' },
			{ kind: 'method', name: 'focus', parameters: [{ name: 'options', optional: true, type: { text: 'FocusOptions' } }], return: { type: { text: 'void' } } },
		], attributes: [{ name: 'secret', fieldName: 'secret' }, { name: 'size', fieldName: 'size' }],
	}).components[0];
	assert.deepEqual(component.sections.properties.map(row => row.name), ['size']);
	assert.equal(component.sections.properties[0].inheritedFrom, 'EnElement');
	assert.deepEqual(component.sections.attributes.map(row => row.name), ['size']);
	assert.deepEqual(component.sections.methods.map(row => [row.name, row.type]), [['focus', '(options?: FocusOptions) → void']]);
});
test('missing metadata stays distinct from recorded false, zero, empty strings, default slot and CSS syntax', () => {
	const component = normalize({
		members: [{ kind: 'field', name: 'disabled', default: false }, { kind: 'field', name: 'count', default: 0 }, { kind: 'field', name: 'value', default: '' }],
		events: [{ name: 'en-change' }], slots: [{ name: '', description: 'Native authored content.' }],
		cssProperties: [{ name: '--example-size', syntax: '<length>', default: '1rem' }],
	}).components[0];
	assert.equal(component.description, null);
	assert.deepEqual(component.sections.properties.map(row => [row.name, row.default]), [['count', '0'], ['disabled', 'false'], ['value', '']]);
	assert.equal(component.sections.events[0].type, null);
	assert.equal(component.sections.events[0].description, null);
	assert.equal(component.sections.slots[0].name, '');
	assert.equal(component.sections.cssProperties[0].type, '<length>');
});
test('filtering finds public API names without mutating data or substituting selection', () => {
	const data = normalize({ members: [{ kind: 'field', name: 'workspaceIdentifier' }] });
	const before = JSON.stringify(data);
	assert.equal(filterComponents(data.components, 'example WORKSPACE')[0], data.components[0]);
	assert.equal(filterComponents(data.components, 'missing').length, 0);
	assert.equal(JSON.stringify(data), before);
});
test('ambiguous or missing class declarations fail rather than silently selecting an API', () => {
	assert.throws(() => normalizeAPIReference({ packageName: 'x', packageVersion: '0.1.0', manifestDigest: 'x', entries: [entry], manifest: { modules: [] } }), /Expected one CEM declaration/);
});
