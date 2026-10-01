export interface APIControlType {
	kind: 'boolean' | 'number' | 'string' | 'enum';
	optional: boolean;
	options?: string[];
}
export interface APIControl extends APIControlType {
	property: string;
	attribute: string | null;
	type: string | null;
	description: string | null;
	reflects: boolean;
}
export interface APIControlMetadata {
	controls: APIControl[];
	unsupported: Array<{ property: string; reason: string }>;
}
export function scalarControlType(text: unknown): APIControlType | null;
export function createSourceControlTypeResolver(options: {
	ts: any; manifest: any; packageRoot: string; compilerOptions?: Record<string, unknown>;
}): (context: { module: any; declaration: any; member: any }) => APIControlType | null;
export function deriveAPIControls(options: {
	manifest: any;
	resolveType?: (context: { module: any; declaration: any; member: any }) => APIControlType | null;
}): Record<string, APIControlMetadata>;
export interface APIControlTarget {
	id: string; caseId: string; selector: string; title: string;
	excludedProperties?: Record<string, string>;
}
export function buildAPIElementControls(options: {
	reference: { components: Array<{tagName: string; example: {id: string} | null}> };
	manifest: any;
	targets: Record<string, APIControlTarget>;
	resolveType?: (context: { module: any; declaration: any; member: any }) => APIControlType | null;
}): Record<string, {
	target: Omit<APIControlTarget, 'excludedProperties'> & {tagName: string};
	controls: APIControl[];
	excluded: Array<{property: string; reason: string}>;
}>;
