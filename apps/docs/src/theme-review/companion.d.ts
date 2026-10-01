import type {ResolvedTheme, ResolvedThemePair, ThemeCompanionRecipe} from '@en-reve/tokens';
export interface PresetCompanion { schemaVersion:number; recipe:ThemeCompanionRecipe; css:string; identity:string; }
export function presetCompanion(theme:ResolvedTheme | ResolvedThemePair):PresetCompanion | undefined;
export function compilePresetCompanion(theme:ResolvedTheme | ResolvedThemePair, recipe:ThemeCompanionRecipe):PresetCompanion;
