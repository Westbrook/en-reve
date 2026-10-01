import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnChatMessage} from '../chat-message.js';

/** Registration metadata only; importing this module does not define elements. */
export const chatMessageDefinition = {
  tagName: 'en-chat-message',
  elementClass: EnChatMessage,
} as const satisfies ElementDefinition;
