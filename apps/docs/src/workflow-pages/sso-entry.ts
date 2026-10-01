import { startWorkflowPage } from '../workflows-client.js';
import '@en-reve/elements/define/card.js';
import '@en-reve/elements/define/radio.js';
import '@en-reve/elements/define/radio-group.js';
import '@en-reve/elements/define/text-field.js';
import { SignInWorkflowApp } from './sso.js';

await startWorkflowPage(SignInWorkflowApp);
