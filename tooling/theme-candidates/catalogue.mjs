import assert from 'node:assert/strict';

/** Canonical recipe locations are deliberately narrower than arbitrary file paths. */
export const candidateRecipes = Object.freeze({
	'spectrum-inspired': 'inspired/spectrum',
	'fluent-inspired': 'inspired/fluent',
	'astryx-inspired': 'inspired/astryx',
	'shadcn-inspired': 'inspired/shadcn',
	'radix-inspired': 'inspired/radix',
	'web-awesome-inspired': 'inspired/web-awesome',
	'chakra-inspired': 'inspired/chakra',
	'holotable-inspired': 'inspired/holotable',
	vellum: 'originals/vellum',
	signal: 'originals/signal',
	kinetic: 'originals/kinetic',
});
export const candidateIds = Object.freeze(Object.keys(candidateRecipes));

/** Shared by documentation generation and prepared-artifact verification. */
export function validateCandidateDefinitions(definitions) {
	assert.ok(Array.isArray(definitions), 'Definitions must be an array.');
	assert.deepEqual(definitions.map(definition => definition?.id), candidateIds, 'Expect every canonical theme pair in catalogue order.');
	for (const definition of definitions) {
		const { id, inputs, baseOptions, companion } = definition;
        if (companion) {
          assert.equal(companion.schemaVersion, 1);
          assert.equal(companion.id, `${id}-variants`);
          assert.deepEqual(companion.rules.filter(rule => rule.target === 'button').map(rule => rule.variant), ["primary", "secondary", "ghost", "danger"]);
        }
		assert.ok(typeof definition.title === 'string' && definition.title.trim(), `${id}: title required.`);
		assert.ok(typeof definition.rationale === 'string' && definition.rationale.trim(), `${id}: rationale required.`);
		assert.ok(['compact', 'comfortable', 'spacious'].includes(definition.density), `${id}: expected density required.`);
		if (definition.label !== undefined) assert.ok(typeof definition.label === 'string' && definition.label.trim(), `${id}: label must be nonempty.`);
		assert.ok(inputs && typeof inputs === 'object' && !Array.isArray(inputs), `${id}: branch inputs required.`);
		assert.deepEqual(Object.keys(inputs).sort(), ['dark', 'light']);
		if (baseOptions !== undefined) {
			assert.ok(baseOptions && typeof baseOptions === 'object' && !Array.isArray(baseOptions), `${id}: branch baselines must be an object.`);
			assert.deepEqual(Object.keys(baseOptions).sort(), ['dark', 'light'], `${id}: supply both authoritative branch baselines.`);
		}
		for (const mode of ['light', 'dark']) {
			assert.equal(inputs[mode], `${candidateRecipes[id]}.${mode}.json`, `${id}: recipe must match its canonical theme and branch.`);
			if (baseOptions !== undefined) assert.ok(baseOptions[mode] && typeof baseOptions[mode] === 'object' && !Array.isArray(baseOptions[mode]), `${id}/${mode}: baseline must be theme options.`);
		}
	}
	return definitions;
}
