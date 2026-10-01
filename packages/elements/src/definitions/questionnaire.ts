import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnQuestionnaire} from '../questionnaire.js';
export const questionnaireDefinition = { tagName: 'en-questionnaire', elementClass: EnQuestionnaire } as const satisfies ElementDefinition;
