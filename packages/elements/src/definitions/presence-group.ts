import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnPresenceGroup} from '../presence-group.js';
import {presenceDefinition} from './presence.js';
import {buttonDefinition} from './button.js';

/** Registration metadata only; importing this module does not define elements. */
export const presenceGroupDefinition = {
  tagName: 'en-presence-group',
  elementClass: EnPresenceGroup,
  dependencies: [presenceDefinition, buttonDefinition],
} as const satisfies ElementDefinition;
