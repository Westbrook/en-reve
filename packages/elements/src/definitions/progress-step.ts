import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnProgressStep} from '../progress-step.js';

/** Registration metadata only; importing this module does not define elements. */
export const progressStepDefinition = {
  tagName: 'en-progress-step',
  elementClass: EnProgressStep,
} as const satisfies ElementDefinition;
