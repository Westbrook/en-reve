import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import { registerAll } from '@en-reve/elements/catalog.js';
import { ShowcaseApp } from './app.js';

registerAll();
customElements.define('en-showcase-app', ShowcaseApp);
