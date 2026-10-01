import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnEditorToolbar} from '../editor-toolbar.js';
import {iconDefinition} from './icon.js';
import {toolbarDefinition} from './toolbar.js';
import {buttonDefinition} from './button.js';
import {textFieldDefinition} from './text-field.js';

/** Registration metadata only; importing this module does not define elements. */
export const editorToolbarDefinition = {
  tagName: 'en-editor-toolbar',
  elementClass: EnEditorToolbar,
  dependencies: [iconDefinition, toolbarDefinition, buttonDefinition, textFieldDefinition],
} as const satisfies ElementDefinition;
