import '@en-reve/elements/define/chat-composer.js';
import '@en-reve/elements/define/token-editor.js';
import '@en-reve/elements/define/editor-trigger.js';
import {ComposableChatDemo} from './composable-chat-demo.definition.js';
export {ComposableChatDemo} from './composable-chat-demo.definition.js';
if (!customElements.get('en-composable-chat-demo')) customElements.define('en-composable-chat-demo', ComposableChatDemo);
