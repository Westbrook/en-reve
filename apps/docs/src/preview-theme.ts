import { createThemePair, emitThemeCSS, emitThemePairCSS, resolveTheme } from '@en-reve/tokens';
import { colorFromHex } from '@en-reve/tokens/color.js';
import type { ResolvedThemePair, ThemeDensity } from '@en-reve/tokens';

/** Only authored shared inputs are copied; each mode resolves its own defaults. */
export function resolvePreviewPair(options: {name: string; density: ThemeDensity; accent?: string; rhythm?: number}): ResolvedThemePair {
	const pins = {
		...(options.rhythm === undefined ? {} : {'rhythm.base': {value:options.rhythm,unit:'rem'}}),
		...(options.accent ? {'palette.accent':colorFromHex(options.accent)} : {}),
	};
	return createThemePair({
		name: options.name,
		light: resolveTheme({name:`${options.name}-light`,mode:'light',density:options.density,pins}),
		dark: resolveTheme({name:`${options.name}-dark`,mode:'dark',density:options.density,pins}),
	});
}

export function previewPairCSS(pair: ResolvedThemePair): string {
	return emitThemePairCSS(pair,{scope:'root'});
}

const inverseCache = new Map<ThemeDensity,string>();

/** The existing inverse specimen remains an independent, unpinned full scope. */
export function inversePreviewCSS(density: ThemeDensity): string {
	const cached = inverseCache.get(density);
	if (cached !== undefined) return cached;
	const light = resolveTheme({name:'inverse',mode:'light',density});
	const dark = resolveTheme({name:'inverse',mode:'dark',density});
	const inverse = '[data-en-theme="inverse"]';
	const autoDark = ':root:not([data-en-appearance="light"]):not([data-en-appearance="dark"]) ' + inverse;
	const forcedDark = ':root[data-en-appearance="dark"] ' + inverse;
	const branch = (theme: typeof light, selector: string) => emitThemeCSS(theme,{selector,colorScheme:true});
	const css = branch(dark,inverse)
		+ `@media (prefers-color-scheme: dark) {\n${branch(light,autoDark)}}\n`
		+ branch(light,forcedDark);
	inverseCache.set(density,css);
	return css;
}
