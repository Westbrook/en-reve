import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnProgressSteps} from '../progress-steps.js';
import {progressStepDefinition} from './progress-step.js';

/** Registration metadata only; importing this module does not define elements. */
export const progressStepsDefinition = {
  tagName: 'en-progress-steps',
  elementClass: EnProgressSteps,
  dependencies: [progressStepDefinition],
} as const satisfies ElementDefinition;
