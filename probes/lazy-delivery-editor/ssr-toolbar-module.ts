import {html} from 'lit';
import {editorToolbarDefinition} from '@en-reve/elements/definitions/editor-toolbar.js';
import type {EnEditorToolbar} from '@en-reve/elements/editor-toolbar.js';
import type {RichEditorCommandHost} from '@en-reve/elements/editor/context.js';

export const version = 'toolbar-1';
export const definitions = [editorToolbarDefinition];
const commands = ['bold', 'italic', 'link', 'undo'] as const;

export function template(snapshot: {editor?: RichEditorCommandHost}) {
  return html`<en-editor-toolbar label="SSR contextual formatting" .mode=${'contextual'} .commands=${commands} .editor=${snapshot.editor}></en-editor-toolbar>`;
}

export async function ready(root: Element | ShadowRoot) {
  const toolbar = root.querySelector<EnEditorToolbar>('en-editor-toolbar')!;
  // Finish association and visibility updates before observing descendant readiness.
  while (!await toolbar.updateComplete) { /* Wait for the component's own updates. */ }
  const pending: Promise<unknown>[] = [];
  const visit = (parent: ParentNode) => {
    for (const element of parent.querySelectorAll<HTMLElement & {updateComplete?: Promise<unknown>}>('*')) {
      if (element.updateComplete) pending.push(element.updateComplete);
      if (element.shadowRoot) visit(element.shadowRoot);
    }
  };
  visit(toolbar.shadowRoot!);
  await Promise.all(pending);
}
