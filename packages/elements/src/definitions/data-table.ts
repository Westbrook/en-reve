import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnDataTable} from '../data-table.js';
import {tableDefinition} from './table.js';
import {checkboxDefinition} from './checkbox.js';
import {paginationDefinition} from './pagination.js';
import {buttonDefinition} from './button.js';
import {iconDefinition} from './icon.js';

/** Registration metadata only; importing this module does not define elements. */
export const dataTableDefinition = {
  tagName: 'en-data-table',
  elementClass: EnDataTable,
  dependencies: [tableDefinition, checkboxDefinition, paginationDefinition, buttonDefinition, iconDefinition],
} as const satisfies ElementDefinition;
