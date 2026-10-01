import { resolve } from 'node:path';

const forbidden = new Set(['__proto__', 'prototype', 'constructor']);
const visible = item => item.privacy !== 'private' && item.privacy !== 'protected'
	&& !String(item.name ?? '').startsWith('#') && !item.static;

/** Literal CEM types only. Named aliases require the source resolver below. */
export function scalarControlType(text) {
	if (typeof text !== 'string') return null;
	const parts = text.split('|').map(part => part.trim());
	const optional = parts.includes('undefined');
	const values = parts.filter(part => part !== 'undefined');
	if (values.length === 1 && ['boolean', 'number', 'string'].includes(values[0])) {
		return { kind: values[0], optional };
	}
	if (values.length && values.every(part => /^(['"])[^'"\\]*\1$/u.test(part))) {
		return { kind: 'enum', optional, options: [...new Set(values.map(part => part.slice(1, -1)))] };
	}
	return null;
}

/**
 * Build-only type resolution from the same checked-in sources as the CEM.
 * No element evaluation/registration, emitted files or guessed enum vocabulary.
 * Pass the existing analyzer's ts namespace and docs workspace compiler options.
 */
export function createSourceControlTypeResolver({ ts, manifest, packageRoot, compilerOptions = {} }) {
	const program = ts.createProgram({
		rootNames: manifest.modules.map(module => resolve(packageRoot, module.path)),
		options: {
			target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext,
			moduleResolution: ts.ModuleResolutionKind.Bundler, skipLibCheck: true,
			strict: true, noEmit: true, ...compilerOptions,
		},
	});
	const checker = program.getTypeChecker();
	const declarations = new Map();
	for (const module of manifest.modules) {
		const source = program.getSourceFile(resolve(packageRoot, module.path));
		if (!source) continue;
		for (const statement of source.statements) {
			if (ts.isClassDeclaration(statement) && statement.name) {
				declarations.set(`${module.path}:${statement.name.text}`, statement);
			}
		}
	}
	return ({ module, declaration, member }) => {
		const node = declarations.get(`${module.path}:${declaration.name}`);
		if (!node) return null;
		const symbol = checker.getSymbolAtLocation(node.name);
		const property = symbol && checker.getDeclaredTypeOfSymbol(symbol).getProperty(member.name);
		if (!property) return null;
		const location = property.valueDeclaration ?? property.declarations?.[0] ?? node;
		const type = checker.getTypeOfSymbolAtLocation(property, location);
		const parts = type.isUnion() ? type.types : [type];
		const optional = parts.some(part => Boolean(part.flags & ts.TypeFlags.Undefined));
		const values = parts.filter(part => !(part.flags & ts.TypeFlags.Undefined));
		if (!values.length) return null;
		if (values.every(part => Boolean(part.flags & (ts.TypeFlags.Boolean | ts.TypeFlags.BooleanLiteral)))) {
			return { kind: 'boolean', optional };
		}
		if (values.length === 1 && values[0].flags & ts.TypeFlags.Number) return { kind: 'number', optional };
		if (values.length === 1 && values[0].flags & ts.TypeFlags.String) return { kind: 'string', optional };
		if (values.every(part => Boolean(part.flags & ts.TypeFlags.StringLiteral))) {
			return { kind: 'enum', optional, options: [...new Set(values.map(part => part.value))] };
		}
		return null;
	};
}

/** Add this structured output to APIComponent; APIItem.notes is display prose. */
export function deriveAPIControls({ manifest, resolveType }) {
	const result = {};
	for (const module of manifest.modules ?? []) {
		for (const declaration of module.declarations ?? []) {
			if (!declaration.tagName) continue;
			const controls = [];
			const unsupported = [];
			for (const member of declaration.members ?? []) {
				if (member.kind !== 'field' || !visible(member) || member.readonly || forbidden.has(member.name)) continue;
				const descriptor = scalarControlType(member.type?.text)
					?? resolveType?.({ module, declaration, member });
				if (!descriptor) {
					unsupported.push({ property: member.name, reason: 'No scalar editor for this public type; use the authored source.' });
					continue;
				}
				const attribute = typeof member.attribute === 'string' ? member.attribute
					: (declaration.attributes ?? []).find(item => item.fieldName === member.name)?.name ?? null;
				controls.push({
					property: member.name, attribute, ...descriptor,
					type: member.type?.text ?? null,
					description: member.description ?? member.summary ?? null,
					reflects: Boolean(member.reflects),
				});
			}
			controls.sort((a, b) => a.property.localeCompare(b.property, 'en'));
			result[declaration.tagName] = { controls, unsupported };
		}
	}
	return result;
}

/** Join verified API entries to deliberately authored targets; never pick a DOM first match. */
export function buildAPIElementControls({ reference, manifest, targets, resolveType }) {
	const metadata = deriveAPIControls({ manifest, resolveType });
	const result = {};
	for (const component of reference.components) {
		const authored = targets[component.tagName];
		if (!authored) continue;
		if (!component.example || component.example.id !== authored.caseId) {
			throw new Error(`Controls target case does not match the authored API example for ${component.tagName}.`);
		}
		const source = metadata[component.tagName];
		if (!source) throw new Error(`No CEM controls metadata for ${component.tagName}.`);
		const { excludedProperties = {}, ...target } = authored;
		const known = new Set([...source.controls, ...source.unsupported].map(item => item.property));
		for (const property of Object.keys(excludedProperties)) {
			if (!known.has(property)) throw new Error(`Stale controls exclusion ${component.tagName}.${property}.`);
		}
		result[component.tagName] = {
			target: { ...target, tagName: component.tagName },
			controls: source.controls.filter(item => !(item.property in excludedProperties)),
			excluded: [...source.unsupported.filter(item => !(item.property in excludedProperties)),
				...Object.entries(excludedProperties).map(([property, reason]) => ({ property, reason }))],
		};
	}
	return result;
}
