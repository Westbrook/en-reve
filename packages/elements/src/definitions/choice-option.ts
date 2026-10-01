import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnChoiceOption} from '../choice-option.js';
export const choiceOptionDefinition = { tagName: 'en-choice-option', elementClass: EnChoiceOption } as const satisfies ElementDefinition;
