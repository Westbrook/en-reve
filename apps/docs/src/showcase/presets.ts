import { createReviewDraft } from '@en-reve/tokens';
import type { ThemeDensity, ThemeMode } from '@en-reve/tokens';
import { createReviewWorkspace } from '../theme-review/workspace.js';
import catalogue from '../generated/showcase-catalogue.js';
export { default as presetItems } from '../generated/showcase-items.js';

/** Trusted repository recipes, generated from the same inputs as review downloads. */
export async function loadPreset(id: string) {
	const { default: presets } = await import('../generated/showcase-presets.js');
	const recipe = presets.find(preset => preset.id === id);
	if (!recipe) throw new Error('Choose one of the available themes.');
	const baseline = catalogue.find(preset => preset.id === id)?.baseOptions;
	const replay = (edits: typeof recipe.light, mode: ThemeMode) => {
		const draft = createReviewDraft(baseline?.[mode] ?? {});
		for (const edit of edits) {
			if (edit.type === 'context') draft.setContext({ mode: edit.mode as ThemeMode, density: edit.density as ThemeDensity });
			else if (edit.type === 'token') draft.setToken(edit.id!, edit.value);
			else if (edit.type === 'restore') draft.restoreToken(edit.id!);
			else throw new Error('Unsupported preset edit.');
		}
		return draft;
	};
	const pair = { name: recipe.id, light: replay(recipe.light, 'light'), dark: replay(recipe.dark, 'dark') };
	return { workspace: createReviewWorkspace(pair.light, pair), title: recipe.title, rationale: recipe.rationale };
}
