import type { CSSResult, TemplateResult } from 'lit';
import type { WorkflowId } from './navigation.js';
import type { WorkflowController, WorkflowOptions } from '../workflows/shared/workflow.js';

/** Each entry imports exactly one authored recipe; the shared shell imports none. */
export interface WorkflowDefinition {
	readonly id: WorkflowId;
	readonly pageTitle: string;
	readonly heading: string;
	readonly description: string;
	readonly sourceTitle: string;
	readonly fixtureNote: string;
	readonly styles: CSSResult;
	readonly source: string;
	readonly reviewNavigation?: {
		readonly label: string;
		readonly items: readonly { label: string; path: string; current: boolean }[];
	};
	create(options: WorkflowOptions): WorkflowController<TemplateResult>;
}
