import { WorkflowsApp } from '../workflows-app.js';
import type { WorkflowDefinition } from './definition.js';
import { createSettingsWorkflow, settingsStyles, type SettingsWorkflowOptions } from '../workflows/settings/index.js';
import source from '../generated/workflow-settings.js';
import { settingsScenarios, type SettingsScenarioId } from '../workflows/settings/scenarios.js';

/** A static definition gives server and client the same initial scenario. */
export function createSettingsWorkflowApp(scenarioId: SettingsScenarioId = 'explore', preparePalette?: SettingsWorkflowOptions['preparePalette'], preloadPalette?: SettingsWorkflowOptions['preloadPalette']) {
	const scenario = settingsScenarios.find(item => item.id === scenarioId)!;
	return class extends WorkflowsApp {
	static definition: WorkflowDefinition = {
		id: 'settings',
		pageTitle: scenarioId === 'explore' ? 'Design settings workflow' : scenario.title,
		heading: scenario.title,
		description: scenario.description,
		sourceTitle: 'design settings workflow',
		fixtureNote: 'Saves and collaborator updates use local fixtures in this tab. Use the review scenarios to compare incoming changes with unfinished edits; reset the workflow to try again.',
		styles: settingsStyles,
		source,
		reviewNavigation: {
			label: 'Settings review scenarios',
			items: settingsScenarios.map(item => ({ label: item.label, path: item.path, current: item.id === scenarioId })),
		},
		create: options => createSettingsWorkflow({ ...options, scenario: scenarioId, preparePalette, preloadPalette }),
	};
	};
}

export class SettingsWorkflowApp extends createSettingsWorkflowApp() {}
