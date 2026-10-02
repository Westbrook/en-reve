// Explicit authored dependencies, shared by server and browser entry points.
import '@en-reve/elements/define/table.js';
import '@en-reve/elements/define/button.js';
import '@en-reve/elements/define/icon.js';
import '@en-reve/elements/define/checkbox.js';
import '@en-reve/elements/define/select.js';
import '@en-reve/elements/define/text-field.js';
import '@en-reve/elements/define/pagination.js';
import {VirtualCollectionDemo} from './virtual-collection-demo.js';
customElements.define('en-virtual-collection-demo',VirtualCollectionDemo);
