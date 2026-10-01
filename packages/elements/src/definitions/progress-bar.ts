import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnProgressBar} from '../progress-bar.js';

/** Registration metadata only; importing this module does not define elements. */
export const progressBarDefinition = {
  tagName: 'en-progress-bar',
  elementClass: EnProgressBar,
} as const satisfies ElementDefinition;
