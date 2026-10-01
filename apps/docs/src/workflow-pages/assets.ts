import { WorkflowsApp } from '../workflows-app.js';
import type { WorkflowDefinition } from './definition.js';
import { createAssetsWorkflow, assetsStyles } from '../workflows/assets/index.js';
import source from '../generated/workflow-assets.js';

export class AssetsWorkflowApp extends WorkflowsApp {
	static definition: WorkflowDefinition = {
		id: 'assets', pageTitle: 'Asset browser workflow', heading: 'Asset browser',
		description: 'Find and inspect local assets, then insert one into a study.',
		sourceTitle: 'asset browser workflow',
		fixtureNote: 'Nine local fixture records use bundled library icons and inline text excerpts. Insertion has a fixed local delay and creates a receipt in this page; there is no upload, storage, remote fetch or project backend.',
		styles: assetsStyles, source, create: createAssetsWorkflow,
	};
}
