import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnPagination} from '../pagination.js';

/** Registration metadata only; importing this module does not define elements. */
export const paginationDefinition = {
  tagName: 'en-pagination',
  elementClass: EnPagination,
} as const satisfies ElementDefinition;
