import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnTokenEditor} from '../token-editor.js';

/** Registration metadata only; importing this module does not define elements. */
export const tokenEditorDefinition = {
  tagName: 'en-token-editor',
  elementClass: EnTokenEditor,
} as const satisfies ElementDefinition;
