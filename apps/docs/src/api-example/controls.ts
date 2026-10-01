/** Build-derived scalar editors. These are private documentation contracts. */
export type APIControlValue = string | number | boolean;
export interface APIControlDescriptor {
	property: string;
	attribute: string | null;
	kind: 'boolean' | 'string' | 'number' | 'enum';
	options?: readonly APIControlValue[];
	optional: boolean;
	description: string | null;
}
export interface APIControlTarget { id: string; caseId: string; tagName: string; selector: string; title: string; }
export interface APIElementControls {
	target: APIControlTarget | null;
	controls: readonly APIControlDescriptor[];
	excluded: readonly { property: string; reason: string }[];
}
export interface APIControlOperation { revision: number; property: string; value: APIControlValue; }
export type APIControlReadback = { defined: false } | { defined: true; value: APIControlValue };
export interface APIControlsSnapshot {
	targetId: string | null;
	available: boolean;
	values: Record<string, APIControlReadback>;
	message: string;
}
export function isControlValue(value: unknown): value is APIControlValue {
	return typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number' && Number.isFinite(value);
}
export function acceptsControlValue(control: APIControlDescriptor, value: unknown): value is APIControlValue {
	if (!isControlValue(value)) return false;
	return control.kind === 'enum' ? Boolean(control.options?.some(option => Object.is(option, value))) : typeof value === control.kind;
}
export function isControlOperation(value: unknown): value is APIControlOperation {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
	const operation = value as Record<string, unknown>;
	return Number.isSafeInteger(operation.revision) && Number(operation.revision) > 0
		&& typeof operation.property === 'string' && isControlValue(operation.value);
}

/** Only allowlisted public getters/setters are touched; no source strings run. */
export function readControls(target: HTMLElement, controls: readonly APIControlDescriptor[]): Record<string, APIControlReadback> {
	const values: Record<string, APIControlReadback> = {};
	for (const control of controls) {
		try {
			const value = (target as unknown as Record<string, unknown>)[control.property];
			values[control.property] = isControlValue(value) ? { defined: true, value } : { defined: false };
		} catch { values[control.property] = { defined: false }; }
	}
	return values;
}
