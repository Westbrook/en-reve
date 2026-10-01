import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {selectDefinition} from './select.js';
import {EnQueryBuilder} from '../query-builder.js';
export const queryBuilderDefinition = { tagName: 'en-query-builder', elementClass: EnQueryBuilder, dependencies: [selectDefinition] } as const satisfies ElementDefinition;
