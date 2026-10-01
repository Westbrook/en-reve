import { css } from 'lit';
import { WorkflowsApp } from '../workflows-app.js';
import type { WorkflowDefinition } from './definition.js';
import { multiStepExample } from '../multi-step-demo.js';
import source from '../generated/multi-step-source.js';
export class MultiStepWorkflowApp extends WorkflowsApp {
 static definition: WorkflowDefinition = {
  id: 'multi-step', pageTitle: 'Project brief workflow', heading: 'Create a project brief',
  description: 'Validate each step, revise earlier answers, and recover from a save failure.',
  sourceTitle: 'multi-step project brief', fixtureNote: 'All values and saves are local to this demonstration. No data is sent.', styles: css``, source,
  create: options => { let key=0; return { render: () => multiStepExample(key), reset: () => { key++; options.requestUpdate(); }, dispose: () => {} }; },
 };
}
