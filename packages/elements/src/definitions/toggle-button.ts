import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnToggleButton} from '../toggle-button.js';
export const toggleButtonDefinition = { tagName: 'en-toggle-button', elementClass: EnToggleButton } as const satisfies ElementDefinition;
