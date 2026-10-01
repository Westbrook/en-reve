import { isControlOperation, type APIControlOperation } from './controls.js';

/** Finite commands for trusted, same-origin documentation examples. */
export const API_EXAMPLE_VERSION = 1;
export type ExampleMode = 'auto' | 'light' | 'dark';
export type ExampleDensity = 'compact' | 'comfortable' | 'spacious';
export interface ExampleConfiguration {
	type: 'en-api-example-configure'; version: 1; caseId: string; documentId: string;
	componentTag: string; targetId: string | null; control?: APIControlOperation;
	requestId: number; mode: ExampleMode; density: ExampleDensity; resetRevision: number;
}
export function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
export function isConfiguration(value: unknown): value is ExampleConfiguration {
	return isRecord(value) && value.type === 'en-api-example-configure' && value.version === API_EXAMPLE_VERSION
		&& typeof value.caseId === 'string' && typeof value.documentId === 'string'
		&& typeof value.componentTag === 'string' && (value.targetId === null || typeof value.targetId === 'string')
		&& (value.control === undefined || isControlOperation(value.control))
		&& Number.isSafeInteger(value.requestId) && Number(value.requestId) > 0
		&& Number.isSafeInteger(value.resetRevision) && Number(value.resetRevision) >= 0
		&& (value.mode === 'auto' || value.mode === 'light' || value.mode === 'dark')
		&& (value.density === 'compact' || value.density === 'comfortable' || value.density === 'spacious');
}
