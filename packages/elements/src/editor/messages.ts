import type {RichEditorCommand} from '../rich-text-editor.js';
import {resolveMessages} from '../internal/messages.js';

/** Partial, property-only translations shared by token/rich editors and the default toolbar. */
export interface EditorMessages {
  readonly suggestions?: Partial<{
    label: string;
    loading: string;
    unavailable: string;
    empty: string;
    keyboardHint: string;
  }>;
  readonly instructions?: Partial<{
    picker: string;
    richText: string;
  }>;
  readonly commands?: Partial<Record<RichEditorCommand, string>>;
  readonly link?: Partial<{
    label: string;
    placeholder: string;
    applyLabel: string;
    cancelLabel: string;
    invalid: string;
  }>;
}

export function editorMessages(messages?: EditorMessages | null) {
  return {
    suggestions: resolveMessages({label:'Suggestions',loading:'Loading…',unavailable:'Suggestions unavailable.',empty:'No matches.',keyboardHint:'Up/Down to choose, Enter to insert, Escape to dismiss.'}, messages?.suggestions),
    instructions: resolveMessages({picker:'Press Enter or Down Arrow to enter the picker. Escape cancels.',richText:'Enter starts a paragraph. Alt+F10 opens formatting controls.'}, messages?.instructions),
    commands: resolveMessages<Record<RichEditorCommand,string>>({bold:'Bold',italic:'Italic',heading:'Heading',paragraph:'Paragraph','bullet-list':'Bullet list','ordered-list':'Numbered list',link:'Link',unlink:'Remove link',undo:'Undo',redo:'Redo'}, messages?.commands),
    link: resolveMessages({label:'Link URL',placeholder:'https://example.com',applyLabel:'Apply link',cancelLabel:'Cancel',invalid:'Use an https, http, mailto or relative link.'}, messages?.link),
  };
}
