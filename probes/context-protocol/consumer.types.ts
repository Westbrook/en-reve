import { ContextProvider, richEditorCommandContext, editorMessagesContext, colorMessagesContext, type RichEditorCommandHost } from '@en-reve/elements/context.js';
import type { EnRichTextEditor } from '@en-reve/elements/rich-text-editor.js';
import type { EnEditorToolbar } from '@en-reve/elements/editor-toolbar.js';
declare const host: HTMLElement;
declare const editor: EnRichTextEditor;
declare const toolbar: EnEditorToolbar;
const capability: RichEditorCommandHost = editor;
toolbar.editor = capability;
const provider = new ContextProvider(host, {context: richEditorCommandContext, initialValue: capability});
provider.setValue(undefined);
new ContextProvider(host, {context: editorMessagesContext, initialValue: {commands: {bold: 'Gras'}}});
new ContextProvider(host, {context: colorMessagesContext, initialValue: {channels: {red: 'Rouge'}}});
// @ts-expect-error Context does not accept a non-editor capability.
provider.setValue({execute: () => true});

import {colorPickerDefinition} from '@en-reve/elements/definitions/color-picker.js';
import {menuDefinition} from '@en-reve/elements/definitions/menu.js';
import {registerDefinition, collectDefinitions} from '@en-reve/primitives/interactions/registration.js';
declare const registry: CustomElementRegistry;
registerDefinition(registry, colorPickerDefinition);
collectDefinitions([colorPickerDefinition, menuDefinition]);
