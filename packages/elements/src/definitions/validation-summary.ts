import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnValidationSummary} from '../validation-summary.js';

/** Registration metadata only; importing this module does not define elements. */
export const validationSummaryDefinition = {
  tagName: 'en-validation-summary',
  elementClass: EnValidationSummary,
} as const satisfies ElementDefinition;
