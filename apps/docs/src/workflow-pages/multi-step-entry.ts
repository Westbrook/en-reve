import { startWorkflowPage } from '../workflows-client.js';
import '@en-reve/elements/define/text-field.js';
import '@en-reve/elements/define/checkbox.js';
import '@en-reve/elements/define/alert.js';
import '@en-reve/elements/define/progress-steps.js';
import '@en-reve/elements/define/validation-summary.js';
import '@en-reve/elements/define/date-picker.js';
import { MultiStepWorkflowApp } from './multi-step.js';
await startWorkflowPage(MultiStepWorkflowApp);
