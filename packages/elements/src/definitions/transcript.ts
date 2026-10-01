import {chatMessageDefinition} from './chat-message.js';
import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnTranscript} from '../transcript.js';
export const transcriptDefinition = { tagName: 'en-transcript', elementClass: EnTranscript, dependencies: [chatMessageDefinition] } as const satisfies ElementDefinition;
