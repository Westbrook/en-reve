import { createThemePair, emitThemePairCSS, resolveTheme } from '@en-reve/tokens';
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

export { inversePreviewCSS } from './inverse-theme.js';
