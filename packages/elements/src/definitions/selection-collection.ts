import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnSelectionCollection} from '../selection-collection.js';
export const selectionCollectionDefinition = { tagName: 'en-selection-collection', elementClass: EnSelectionCollection } as const satisfies ElementDefinition;
