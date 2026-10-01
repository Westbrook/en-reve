import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnActionOverflow} from '../action-overflow.js';
export const actionOverflowDefinition = { tagName: 'en-action-overflow', elementClass: EnActionOverflow } as const satisfies ElementDefinition;
