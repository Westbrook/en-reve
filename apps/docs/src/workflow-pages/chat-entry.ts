import { startWorkflowPage } from '../workflows-client.js';
import '@en-reve/elements/define/presence-group.js';
import '@en-reve/elements/define/activity-feed.js';
import '@en-reve/elements/define/skeleton.js';
import '@en-reve/elements/define/chat-message.js';
import '@en-reve/elements/define/chat-composer.js';
import '@en-reve/elements/define/card.js';
import '@en-reve/elements/define/textarea.js';
import '@en-reve/elements/define/slider.js';
// Register workflow-owned color controls here, outside shared specimen imports.
import '@en-reve/elements/define/color-picker.js';
import '@en-reve/elements/define/swatch.js';
import '@en-reve/elements/define/tab.js';
import '@en-reve/elements/define/tab-panel.js';
import '@en-reve/elements/define/tabs.js';
import { ChatWorkflowApp } from './chat.js';

await startWorkflowPage(ChatWorkflowApp);
