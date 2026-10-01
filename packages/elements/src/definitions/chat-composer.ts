import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnChatComposer} from '../chat-composer.js';
import {buttonDefinition} from './button.js';

/** Registration metadata only; importing this module does not define elements. */
export const chatComposerDefinition = {
  tagName: 'en-chat-composer',
  elementClass: EnChatComposer,
  dependencies: [buttonDefinition],
} as const satisfies ElementDefinition;
