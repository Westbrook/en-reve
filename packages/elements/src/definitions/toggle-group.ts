import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {iconDefinition} from './icon.js';
import {EnToggleGroup} from '../toggle-group.js';
export const toggleGroupDefinition = { tagName: 'en-toggle-group', elementClass: EnToggleGroup, dependencies: [iconDefinition] } as const satisfies ElementDefinition;
