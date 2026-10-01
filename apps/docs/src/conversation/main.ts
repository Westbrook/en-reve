import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import '@en-reve/elements/define/button.js';
import '@en-reve/elements/define/icon.js';
import '@en-reve/elements/define/badge.js';
import { ConversationApp } from './app.js';

customElements.define('en-conversation-app', ConversationApp);
