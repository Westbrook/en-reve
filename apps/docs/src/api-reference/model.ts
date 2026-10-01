/** Public, serializable reference data. Missing CEM facts remain absent. */
export interface APIItem {
	name: string;
	type: string | null;
	default: string | null;
	description: string | null;
	notes: string[];
	inheritedFrom: string | null;
}
export const sectionNames = {
	attributes: 'Attributes', properties: 'Properties', methods: 'Methods', events: 'Events',
	slots: 'Slots', cssParts: 'CSS parts', cssProperties: 'CSS custom properties',
} as const;
export type APISection = keyof typeof sectionNames;
export interface APIComponent {
	tagName: string;
	className: string;
	description: string | null;
	source: string;
	classImport: string;
	definitionImport: string;
	example: { id: string; title: string; href: string } | null;
	sections: Record<APISection, APIItem[]>;
}
export interface APIReferenceData {
	schemaVersion: 1;
	packageName: string;
	packageVersion: string;
	manifestDigest: string;
	manifestSchemaVersion: string;
	components: APIComponent[];
	typeSnapshotDigest?: string;
	publicTypes?: Array<{ name: string; declaration: string }>;
}
export interface VerifiedEntry {
	tagName: string;
	className: string;
	classImport: string;
	definitionImport: string;
	example?: APIComponent['example'];
}
type RecordValue = Record<string, any>;
const text = (value: unknown): string | null => typeof value === 'string' && value.trim() ? value.trim() : null;
const description = (value: RecordValue) => text(value.description) ?? text(value.summary);
const lifecycleMethods = new Set(['connectedCallback', 'disconnectedCallback', 'adoptedCallback', 'attributeChangedCallback', 'formAssociatedCallback', 'formDisabledCallback', 'formResetCallback', 'formStateRestoreCallback', 'connectedMoveCallback', 'createRenderRoot', 'scheduleUpdate', 'performUpdate', 'shouldUpdate', 'willUpdate', 'update', 'firstUpdated', 'updated', 'render']);
const publicEntry = (value: RecordValue) => value.privacy !== 'private' && value.privacy !== 'protected' && !String(value.name ?? '').startsWith('#');
const defaultText = (value: unknown): string | null => value === undefined ? null : typeof value === 'string' ? value : JSON.stringify(value);
function item(value: RecordValue): APIItem {
	return {
		name: String(value.name ?? ''), type: text(value.type?.text), default: defaultText(value.default),
		description: description(value), notes: [], inheritedFrom: text(value.inheritedFrom?.name),
	};
}
function parameter(value: RecordValue) {
	return `${value.rest ? '...' : ''}${value.name}${value.optional ? '?' : ''}: ${text(value.type?.text) ?? 'type not documented'}${value.default !== undefined ? ` = ${defaultText(value.default)}` : ''}`;
}
/** CEM is source metadata, not a promise that undocumented public helpers are stable. */
export function normalizeAPIReference(input: {
	manifest: RecordValue; manifestDigest: string; packageName: string; packageVersion: string; entries: VerifiedEntry[];
}): APIReferenceData {
	const declarations = (input.manifest.modules ?? []).flatMap((module: RecordValue) =>
		(module.declarations ?? []).map((declaration: RecordValue) => ({ declaration, source: module.path })));
	const components = input.entries.map(entry => {
		const matches = declarations.filter((value: RecordValue) => value.declaration.tagName === entry.tagName && value.declaration.name === entry.className);
		if (matches.length !== 1) throw new Error(`Expected one CEM declaration for ${entry.tagName} (${entry.className}).`);
		const { declaration, source } = matches[0];
		const members: RecordValue[] = declaration.members ?? [];
		const visible = members.filter(value => publicEntry(value) && !value.static);
		const hiddenNames = new Set(members.filter(value => !publicEntry(value) || value.static).map(value => value.name));
		const sections = Object.fromEntries(Object.keys(sectionNames).map(key => [key, []])) as unknown as APIComponent['sections'];
		sections.attributes = (declaration.attributes ?? []).filter((value: RecordValue) => publicEntry(value) && !hiddenNames.has(value.fieldName)).map((value: RecordValue) => {
			const row = item(value); if (value.fieldName) row.notes.push(`Property: ${value.fieldName}`); return row;
		});
		sections.properties = visible.filter(value => value.kind === 'field').map(value => {
			const row = item(value);
			if (value.attribute) row.notes.push(`Attribute: ${value.attribute}`);
			else row.notes.push('JavaScript property');
			if (value.readonly) row.notes.push('Read only');
			if (value.reflects) row.notes.push('Reflects to attribute');
			return row;
		});
		sections.methods = visible.filter(value => value.kind === 'method' && !lifecycleMethods.has(value.name)).map(value => {
			const row = item(value);
			row.type = `(${(value.parameters ?? []).map(parameter).join(', ')}) → ${text(value.return?.type?.text) ?? 'return type not documented'}`;
			return row;
		});
		for (const key of ['events', 'slots', 'cssParts', 'cssProperties'] as const) {
			sections[key] = (declaration[key] ?? []).filter(publicEntry).map((value: RecordValue) => {
				const row = item(value); if (key === 'cssProperties') row.type = text(value.syntax) ?? row.type; return row;
			});
		}
		for (const rows of Object.values(sections)) rows.sort((a, b) => a.name.localeCompare(b.name, 'en'));
		return { ...entry, description: description(declaration), source, example: entry.example ?? null, sections };
	}).sort((a, b) => a.tagName.localeCompare(b.tagName, 'en'));
	return {
		schemaVersion: 1, packageName: input.packageName, packageVersion: input.packageVersion,
		manifestDigest: input.manifestDigest, manifestSchemaVersion: String(input.manifest.schemaVersion ?? ''), components,
	};
}
/** Filtering never changes selection; the consuming page owns that separate state. */
export function filterComponents(components: APIComponent[], query: string): APIComponent[] {
	const terms = query.trim().toLocaleLowerCase('en').split(/\s+/u).filter(Boolean);
	return components.filter(component => {
		const searchable = [component.tagName, component.className, component.description ?? '',
			...Object.values(component.sections).flatMap(rows => rows.map(row => row.name))].join(' ').toLocaleLowerCase('en');
		return terms.every(term => searchable.includes(term));
	});
}
