import '@en-reve/tokens/default.css';
import '@en-reve/styles/foundations.css';
import {definitions} from '@en-reve/elements/catalog.js';
import {registerDefinition} from '@en-reve/primitives/interactions/registration.js';
for (const definition of definitions) registerDefinition(customElements, definition);
document.body.dataset.ready='true';
