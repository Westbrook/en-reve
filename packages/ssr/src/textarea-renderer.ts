import { EnElementRenderer } from './en-element-renderer.js';
import { collectResultSync } from '@lit-labs/ssr/lib/render-result.js';
import type { ThunkedRenderResult } from '@lit-labs/ssr/lib/render-result.js';
import type { RenderInfo } from '@lit-labs/ssr/lib/render.js';
import { parseFragment } from 'parse5';
import type { DefaultTreeAdapterMap } from 'parse5';
import { EnTextarea } from '@en-reve/elements/textarea.js';

type Node = DefaultTreeAdapterMap['node'];

/**
 * Lit does not support hydratable raw-text child bindings. The component owns a
 * static textarea; this server adapter writes its initial text between that
 * element's existing tags without adding parts or rewriting Lit's markers.
 * Client editing remains owned by the native textarea and EditingController.
 */
export class TextareaRenderer extends EnElementRenderer {
  static override matchesClass(ctor: typeof HTMLElement): boolean {
    return ctor === EnTextarea || ctor.prototype instanceof EnTextarea;
  }

  override renderShadow(info: RenderInfo): ThunkedRenderResult | undefined {
    const result = super.renderShadow(info);
    if (!result) return result;
    return [() => {
      const markup = collectResultSync(result);
      const root = parseFragment(markup, { sourceCodeLocationInfo: true });
      const textarea = findTextarea(root);
      const location = textarea?.sourceCodeLocation;
      if (!location?.startTag || !location.endTag) {
        throw new Error('EnTextarea SSR requires its static native textarea.');
      }
      const value = (this.element as EnTextarea).value;
      const escaped = value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
      // HTML drops the first LF after a textarea start tag. Supply that LF so a
      // value which itself begins with LF survives parsing unchanged.
      return markup.slice(0, location.startTag.endOffset) + '\n' + escaped + markup.slice(location.endTag.startOffset);
    }];
  }
}

function findTextarea(node: Node): DefaultTreeAdapterMap['element'] | undefined {
  if ('tagName' in node && node.tagName === 'textarea') return node;
  if ('childNodes' in node) {
    for (const child of node.childNodes) {
      const found = findTextarea(child);
      if (found) return found;
    }
  }
  return undefined;
}
