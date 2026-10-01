import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnRichTextEditor} from '../rich-text-editor.js';

/** Registration metadata only; importing this module does not define elements. */
export const richTextEditorDefinition = {
  tagName: 'en-rich-text-editor',
  elementClass: EnRichTextEditor,
} as const satisfies ElementDefinition;
