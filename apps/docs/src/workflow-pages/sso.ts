import { WorkflowsApp } from '../workflows-app.js';
import type { WorkflowDefinition } from './definition.js';
import { createSSOWorkflow, ssoStyles } from '../workflows/sso/index.js';
import source from '../generated/workflow-sso.js';

export class SignInWorkflowApp extends WorkflowsApp {
	static definition: WorkflowDefinition = {
		id: 'sso',
		pageTitle: 'Sign-in workflow',
		heading: 'Sign in to a workspace',
		description: 'Follow a multi-step sign-in flow with validation, waiting, cancellation, and recovery.',
		sourceTitle: 'SSO workflow',
		fixtureNote: 'Workspace lookup and sign-in use local fixtures in this tab. Use the review scenarios to explore waiting, cancellation, and recovery; reset the workflow to try again.',
		styles: ssoStyles,
		source,
		create: createSSOWorkflow,
	};
}
