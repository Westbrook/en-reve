import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnMultiselect} from '../multiselect.js';
export const multiselectDefinition = { tagName: 'en-multiselect', elementClass: EnMultiselect } as const satisfies ElementDefinition;
