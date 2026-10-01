import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnContextMenu} from '../context-menu.js';
export const contextMenuDefinition = { tagName: 'en-context-menu', elementClass: EnContextMenu } as const satisfies ElementDefinition;
