import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnSplitView} from '../split-view.js';
import {splitterDefinition} from './splitter.js';
import {buttonDefinition} from './button.js';

/** Registration metadata only; importing this module does not define elements. */
export const splitViewDefinition = {
  tagName: 'en-split-view',
  elementClass: EnSplitView,
  dependencies: [splitterDefinition, buttonDefinition],
} as const satisfies ElementDefinition;
