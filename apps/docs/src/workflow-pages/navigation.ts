import type { ThemeDensity } from '@en-reve/tokens';

import type { Appearance } from '../appearance.js';

export type WorkflowId = 'sso' | 'settings' | 'chat' | 'selection' | 'assets' | 'multi-step';
export type WorkflowPreview = { mode: Appearance; density: ThemeDensity; direction: 'ltr' | 'rtl' };
export const initialPreview: Readonly<WorkflowPreview> = Object.freeze({ mode: 'auto', density: 'comfortable', direction: 'ltr' });

/** Public URLs are distinct from build filenames. No workflow controller or template is imported. */
export const workflowPages = [
	{ id: 'sso', label: 'Sign-in', path: '/workflows', file: 'workflows.html' },
	{ id: 'settings', label: 'Settings', path: '/workflows/settings', file: 'workflows/settings.html' },
	{ id: 'chat', label: 'Chat', path: '/workflows/chat', file: 'workflows/chat.html' },
	{ id: 'selection', label: 'Selection', path: '/workflows/selection', file: 'workflows/selection.html' },
	{ id: 'multi-step', label: 'Project brief', path: '/workflows/multi-step', file: 'workflows/multi-step.html' },
	{ id: 'assets', label: 'Assets', path: '/workflows/assets', file: 'workflows/assets.html' },
] as const;

export function previewFromSearch(search: string): WorkflowPreview {
	const params = new URLSearchParams(search);
	const density = params.get('density');
	const mode = params.get('theme');
	return {
		mode: mode === 'light' || mode === 'dark' ? mode : 'auto',
		density: density === 'compact' || density === 'spacious' ? density : 'comfortable',
		direction: params.get('direction') === 'rtl' ? 'rtl' : 'ltr',
	};
}

/** Preserve unrelated query values while removing default or invalid preview pins. */
export function searchWithPreview(search: string, preview: WorkflowPreview): string {
	const params = new URLSearchParams(search);
	for (const [name, value, defaultValue] of [
		['theme', preview.mode, initialPreview.mode],
		['density', preview.density, initialPreview.density],
		['direction', preview.direction, initialPreview.direction],
	] as const) {
		if (value === defaultValue) params.delete(name);
		else params.set(name, value);
	}
	const query = params.toString();
	return query ? `?${query}` : '';
}

/** Only the former combined page's two moved anchors are redirected. */
export function legacyWorkflowTarget(current: URL): URL | undefined {
	if (!['/workflows', '/workflows.html', '/workflows/'].includes(current.pathname)) return;
	let id: string;
	try { id = decodeURIComponent(current.hash.slice(1)); } catch { return; }
	if (id !== 'settings' && id !== 'chat') return;
	const target = new URL(current.href);
	target.pathname = workflowPages.find(page => page.id === id)!.path;
	return target;
}
