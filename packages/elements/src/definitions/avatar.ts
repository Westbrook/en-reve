import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnAvatar} from '../avatar.js';

/** Registration metadata only; importing this module does not define elements. */
export const avatarDefinition = {
  tagName: 'en-avatar',
  elementClass: EnAvatar,
} as const satisfies ElementDefinition;
