import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnEditorTrigger} from '../editor-trigger.js';

/** Registration metadata only; importing this module does not define elements. */
export const editorTriggerDefinition = {
  tagName: 'en-editor-trigger',
  elementClass: EnEditorTrigger,
} as const satisfies ElementDefinition;
