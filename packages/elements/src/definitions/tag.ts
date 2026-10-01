import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnTag} from '../tag.js';
export const tagDefinition = { tagName: 'en-tag', elementClass: EnTag } as const satisfies ElementDefinition;
