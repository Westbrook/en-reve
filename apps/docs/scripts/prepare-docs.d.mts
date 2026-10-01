import type { Plugin } from 'vite';
import type { SettingsScenario } from '../src/workflows/settings/scenarios.js';
export const stylesheetAssets: ReadonlyArray<{ specifier: string; href: string }>;
export function prepareDocs(): Promise<{
  settingsScenarioPages: readonly SettingsScenario[];
  apiExamplePages: Array<{id:string;title:string;file:string;path:string;tags:string[];definitions:string[]}>;
  specimens: number;
  workflows: number;
  stylesheets: string[];
  changedFiles: number;
}>;
export function prepareDocsPlugin(): Plugin;
