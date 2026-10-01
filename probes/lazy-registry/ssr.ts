import '@en-reve/ssr/install.js';
import {renderToString} from '@en-reve/ssr';
import {registerDefinitions} from '@en-reve/primitives/interactions/registration.js';
import {essential} from './essential.js';
import {createSettingsWorkflow} from './workflows/settings/index.js';
registerDefinitions(customElements, essential);
const workflow=createSettingsWorkflow({requestUpdate(){throw Error('SSR must remain inert');}});
export const markup=await renderToString(workflow.render());
workflow.dispose();
