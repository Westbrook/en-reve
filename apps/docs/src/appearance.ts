import type { ThemeMode } from '@en-reve/tokens';

export type Appearance = 'auto' | ThemeMode;
export const appearanceItems = [
	{value:'auto',label:'Auto'}, {value:'light',label:'Light'}, {value:'dark',label:'Dark'},
];

export function isAppearance(value: unknown): value is Appearance {
	return value === 'auto' || value === 'light' || value === 'dark';
}

/** SSR chooses deterministic light data; adaptive CSS already follows preference. */
export function effectiveAppearance(appearance: Appearance, systemMode: ThemeMode = 'light'): ThemeMode {
	return appearance === 'auto' ? systemMode : appearance;
}

/** Attach after hydration. The caller keeps one stable application/model instance. */
export function observeSystemAppearance(view: Window, onMode: (mode: ThemeMode) => void, signal: AbortSignal): void {
	if (signal.aborted) return;
	const preference = view.matchMedia('(prefers-color-scheme: dark)');
	const update = () => onMode(preference.matches ? 'dark' : 'light');
	preference.addEventListener('change', update, {signal});
	update();
}
