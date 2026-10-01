import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnHoverCard} from '../hover-card.js';
export const hoverCardDefinition = { tagName: 'en-hover-card', elementClass: EnHoverCard } as const satisfies ElementDefinition;
