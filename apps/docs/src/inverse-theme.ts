import { emitThemeCSS, resolveTheme, type ThemeDensity } from '@en-reve/tokens';

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
