import {html} from 'lit';
import {richTextEditorDefinition} from '@en-reve/elements/definitions/rich-text-editor.js';
import type {EnRichTextEditor} from '@en-reve/elements/rich-text-editor.js';

export const version = 'editor-1';
export const definitions = [richTextEditorDefinition];

export function template(snapshot: {text: string}) {
  return html`<en-rich-text-editor label="SSR project brief" .value=${snapshot.text}></en-rich-text-editor>`;
}

/** updateComplete alone does not mean the asynchronous editing backend mounted. */
export async function ready(root: Element | ShadowRoot, signal: AbortSignal) {
  const editor = root.querySelector<EnRichTextEditor>('en-rich-text-editor')!;
  await editor.updateComplete;
  const mounted = () => editor.shadowRoot!.querySelector('[part~="control"][contenteditable="true"]');
  if (mounted()) return;
  await new Promise<void>((resolve, reject) => {
    const cleanup = () => { observer.disconnect(); signal.removeEventListener('abort', canceled); };
    const canceled = () => { cleanup(); reject(new DOMException('Editor hydration canceled', 'AbortError')); };
    const observer = new MutationObserver(() => { if (mounted()) { cleanup(); resolve(); } });
    observer.observe(editor.shadowRoot!, {childList: true, subtree: true, attributes: true, attributeFilter: ['contenteditable']});
    signal.addEventListener('abort', canceled, {once: true});
    if (signal.aborted) canceled();
    else if (mounted()) { cleanup(); resolve(); }
  });
}
