import {createElementScope, type ElementScope, type ElementScopeCapabilities, elementScopeCapabilities} from '@en-reve/elements/element-scope.js';
import {datePickerDefinition} from '@en-reve/elements/definitions/date-picker.js';
import {render, html} from 'lit';
const scope: ElementScope = createElementScope({document});
const capability: ElementScopeCapabilities = elementScopeCapabilities(document);
scope.register([datePickerDefinition]);
const native: HTMLButtonElement = scope.createElement('button');
const custom: HTMLElement = scope.createElement('en-date-picker');
const root: ShadowRoot = scope.attachShadow(scope.createElement('section'));
render(html`<en-date-picker></en-date-picker>`,root,{creationScope:scope.creationScope});
void [native,custom,capability];
// @ts-expect-error Null is not an eagerly usable registry.
createElementScope({document,registry:null});
// @ts-expect-error A document is required; server imports never pick an ambient window.
createElementScope({});
