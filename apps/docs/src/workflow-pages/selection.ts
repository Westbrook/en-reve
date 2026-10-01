import { WorkflowsApp } from '../workflows-app.js';
import type { WorkflowDefinition } from './definition.js';
import { createSelectionWorkflow, selectionStyles } from '../workflows/selection/index.js';
import source from '../generated/workflow-selection.js';

export class SelectionWorkflowApp extends WorkflowsApp {
	static definition: WorkflowDefinition = {
		id: 'selection',
		pageTitle: 'Project selection workflow',
		heading: 'Project selection',
		description: 'Choose a project from a long catalog while reviewing a campaign brief.',
		sourceTitle: 'project selection workflow',
		fixtureNote: 'The 40-project catalog and submitted assignment stay in this page. Use a real phone or tablet to review keyboard and scrolling behavior; no workspace account or server is connected.',
		styles: selectionStyles,
		source,
		create: createSelectionWorkflow,
	};
}
