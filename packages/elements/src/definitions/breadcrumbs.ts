import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnBreadcrumbs} from '../breadcrumbs.js';

/** Registration metadata only; importing this module does not define elements. */
export const breadcrumbsDefinition = {
  tagName: 'en-breadcrumbs',
  elementClass: EnBreadcrumbs,
} as const satisfies ElementDefinition;
