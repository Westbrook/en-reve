import type { ElementRenderer, ElementRendererConstructor } from '@lit-labs/ssr/lib/element-renderer.js';
import type { RenderInfo } from '@lit-labs/ssr/lib/render.js';
import type { ThunkedRenderResult } from '@lit-labs/ssr/lib/render-result.js';
import { parseFragment, type DefaultTreeAdapterMap } from 'parse5';

const attributeName = 'data-en-reference-target-ssr';
type Node = DefaultTreeAdapterMap['node'];

/** Per-response wrapper preserves renderer selection, template bytes and target ownership. */
export function referenceTargetAdapter() {
  const records = new Map<string, { tag: string; target: string; rendered: boolean }>();
  let nonce: string | undefined;
  let finished = false;
  return {
    wrap(Base: ElementRendererConstructor): ElementRendererConstructor {
      const Parent: typeof ElementRenderer = Base;
      return class extends Parent {
        private referenceMarker?: string;
        override renderAttributes(): ThunkedRenderResult {
          if (finished) throw new Error('Reference Target SSR adapter is single-use.');
          const result = super.renderAttributes();
          const target = (this.shadowRootOptions as ShadowRootInit & { referenceTarget?: string | null })?.referenceTarget;
          if (typeof target !== 'string') return result;
          if (this.element?.hasAttribute(attributeName)) throw new Error(`Reference Target SSR reserves ${attributeName}.`);
          nonce ??= globalThis.crypto.randomUUID();
          const marker = `${nonce}:${records.size}`;
          records.set(marker, { tag: this.tagName, target, rendered: false });
          this.referenceMarker = marker;
          // Host metadata survives buffered adapters replacing placeholder root
          // contents. It is removed before returning HTML to the application.
          return [...result, ` ${attributeName}="${marker}"`];
        }
        override renderShadow(info: RenderInfo): ThunkedRenderResult | undefined {
          const result = super.renderShadow(info);
          const record = this.referenceMarker && records.get(this.referenceMarker);
          if (record) record.rendered = result !== undefined;
          return result;
        }
      };
    },
    finalize(markup: string): string {
      if (finished) throw new Error('Reference Target SSR adapter is single-use.');
      finished = true;
      try {
        if (!records.size) return markup;
        const edits: { start: number; end: number; text: string }[] = [];
        const visit = (node: Node): void => {
          if ('tagName' in node) {
            const marker = node.attrs.find(attr => attr.name === attributeName)?.value;
            if (marker !== undefined) {
              const record = records.get(marker);
              const location = node.sourceCodeLocation?.attrs?.[attributeName];
              if (!record || record.tag !== node.tagName || !location) throw new Error('Reference Target SSR marker has no matching renderer.');
              records.delete(marker);
              edits.push({ start: location.startOffset, end: location.endOffset, text: '' });
              if (record.rendered) {
                const roots = node.childNodes.filter(child => 'tagName' in child && child.tagName === 'template' &&
                  child.attrs.some(attr => attr.name === 'shadowrootmode')) as DefaultTreeAdapterMap['template'][];
                const root = roots[0];
                const template = root?.sourceCodeLocation?.startTag;
                if (roots.length !== 1 || !template) throw new Error('Reference Target SSR requires the original declarative root.');
                if (root.attrs.some(attr => attr.name === 'shadowrootreferencetarget')) throw new Error('Reference Target SSR is already serialized; review renderer integration.');
                const escaped = record.target.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
                edits.push({ start: template.endOffset - 1, end: template.endOffset - 1, text: ` shadowrootreferencetarget="${escaped}"` });
              }
            }
          }
          if ('childNodes' in node) node.childNodes.forEach(visit);
          if ('content' in node) visit(node.content);
        };
        visit(parseFragment(markup, { sourceCodeLocationInfo: true }));
        if (records.size) throw new Error('Reference Target SSR output is incomplete.');
        let boundary = markup.length;
        let result = '';
        for (const edit of edits.sort((a, b) => b.start - a.start)) {
          if (edit.end > boundary) throw new Error('Reference Target SSR edits overlap.');
          result = edit.text + markup.slice(edit.end, boundary) + result; boundary = edit.start;
        }
        return markup.slice(0, boundary) + result;
      } finally { records.clear(); }
    },
  };
}
