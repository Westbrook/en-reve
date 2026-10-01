import { createContext } from '@lit/context';
import type { EditorBookmark } from '@en-reve/primitives/interactions/editor-extensions.js';
import type { EditorExtensionHost } from './extensions.js';
import type { RichEditorCommand, RichCommandState } from '../rich-text-editor.js';

/** Public formatting capability. Command state remains owned by the editor. */
export interface RichEditorCommandHost extends HTMLElement {
  readonly revision: number;
  readonly selectionKey: string;
  readonly hasSelection: boolean;
  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly composing: boolean;
  readonly extensionOpen: boolean;
  captureBookmark(): EditorBookmark;
  restoreBookmark(bookmark: EditorBookmark): boolean;
  execute(command: RichEditorCommand, value?: string, bookmark?: EditorBookmark): boolean;
  getCommandState(command: RichEditorCommand): RichCommandState;
  getSelectionRect(): DOMRectReadOnly | undefined;
}

// Versioned string keys interoperate across independently bundled copies.
export const editorExtensionContext = createContext<EditorExtensionHost | undefined>('@en-reve/editor-extension/v1');
export const richEditorCommandContext = createContext<RichEditorCommandHost | undefined>('@en-reve/rich-editor-command/v1');

export function isEditorExtensionHost(value: unknown): value is EditorExtensionHost {
  const host = value as Partial<EditorExtensionHost> | null;
  return !!host && host.nodeType === 1 && typeof host.registerExtension === 'function';
}
export function isRichEditorCommandHost(value: unknown): value is RichEditorCommandHost {
  const host = value as Partial<RichEditorCommandHost> | null;
  return !!host && host.nodeType === 1
    && ['captureBookmark', 'restoreBookmark', 'execute', 'getCommandState', 'getSelectionRect'].every(key => typeof Reflect.get(host, key) === 'function')
    && typeof host.revision === 'number' && typeof host.selectionKey === 'string'
    && ['hasSelection', 'disabled', 'readOnly', 'composing', 'extensionOpen'].every(key => typeof Reflect.get(host, key) === 'boolean');
}
