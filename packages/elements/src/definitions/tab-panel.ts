import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnTabPanel} from '../tab-panel.js';

/** Registration metadata only; importing this module does not define elements. */
export const tabPanelDefinition = {
  tagName: 'en-tab-panel',
  elementClass: EnTabPanel,
} as const satisfies ElementDefinition;
