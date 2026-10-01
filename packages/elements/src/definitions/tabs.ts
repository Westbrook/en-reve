import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnTabs} from '../tabs.js';

/** Registration metadata only; importing this module does not define elements. */
export const tabsDefinition = {
  tagName: 'en-tabs',
  elementClass: EnTabs,
} as const satisfies ElementDefinition;
