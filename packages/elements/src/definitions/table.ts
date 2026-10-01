import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnTable} from '../table.js';

/** Registration metadata only; importing this module does not define elements. */
export const tableDefinition = {
  tagName: 'en-table',
  elementClass: EnTable,
} as const satisfies ElementDefinition;
