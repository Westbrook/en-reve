import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnCheckboxGroup} from '../checkbox-group.js';
import {choiceOptionDefinition} from './choice-option.js';
export const checkboxGroupDefinition = { tagName: 'en-checkbox-group', elementClass: EnCheckboxGroup, dependencies: [choiceOptionDefinition] } as const satisfies ElementDefinition;
