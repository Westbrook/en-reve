import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnPresence} from '../presence.js';
import {avatarDefinition} from './avatar.js';

/** Registration metadata only; importing this module does not define elements. */
export const presenceDefinition = {
  tagName: 'en-presence',
  elementClass: EnPresence,
  dependencies: [avatarDefinition],
} as const satisfies ElementDefinition;
