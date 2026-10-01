import type { LitElement } from 'lit';
import { EnElementRenderer } from './en-element-renderer.js';
import type { ElementRendererConstructor } from '@lit-labs/ssr/lib/element-renderer.js';
import { collectResult } from '@lit-labs/ssr/lib/render-result.js';
import type { ThunkedRenderResult } from '@lit-labs/ssr/lib/render-result.js';
import type { RenderInfo } from '@lit-labs/ssr/lib/render.js';
import { parseFragment } from 'parse5';
import type { DefaultTreeAdapterMap } from 'parse5';
import {
  BREADCRUMBS_PLAN_ATTRIBUTE as PLAN_ATTRIBUTE,
  BREADCRUMBS_SLOT_PREFIX as SLOT_PREFIX,
} from '@en-reve/primitives/interactions/breadcrumbs-projection.js';
import type { BreadcrumbsProjectionPlan } from '@en-reve/primitives/interactions/breadcrumbs-projection.js';

const MARKER_PREFIX = 'en-breadcrumbs-ssr:';
const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';

/** Private projection metadata; it contains no duplicated labels or URLs. */
export type BreadcrumbsSsrPlan = BreadcrumbsProjectionPlan;

export interface BreadcrumbsSsrVisibility {
  readonly hiddenKeys: readonly string[];
}

export interface BreadcrumbsSsrAdapterOptions<ElementType extends LitElement, Snapshot> {
  readonly tagName: string;
  readonly elementClass: { new (): ElementType };
  /** Capture detached, request-local values from the initialized SSR instance. */
  readonly capture: (element: ElementType) => Snapshot;
  /** Prepare the same instance to render its canonical, named-slot template. */
  readonly prepare: (
    element: ElementType,
    keys: readonly string[],
    snapshot: Snapshot,
    visibility: BreadcrumbsSsrVisibility,
  ) => void;
}

export interface BreadcrumbsSsrAdapter {
  /** Pass before the ordinary Lit renderer in renderToString's elementRenderers. */
  readonly Renderer: ElementRendererConstructor;
  /** Consume this request's complete render output exactly once, including failures. */
  finalize(markup: string): Promise<string>;
}

type TreeNode = DefaultTreeAdapterMap['node'];
type TreeElement = DefaultTreeAdapterMap['element'];
type Edit = { start: number; end: number; replacement: string };
type CapturedRender = {
  marker: string;
  render: (keys: readonly string[], hiddenKeys: readonly string[]) => Promise<string>;
};

/**
 * Opt-in, buffered bridge for a component whose original direct a/span children
 * need one named SSR slot each. Instantiate per response, render with Renderer,
 * then await finalize. renderToString supplies a fresh adapter automatically for
 * the public EnBreadcrumbs class; this factory supports cooperating custom tags.
 *
 * The component must recover data-en-breadcrumbs-plan before its first hydrate
 * render and use en-crumb-<key> slots in that exact canonical template. The SSR
 * root remains named; a separately created client root may use manual assignment.
 * Authored slot/plan attributes are rejected rather than overwritten. This is a
 * component protocol, not a general framework hydration or HTML sanitizer API.
 */
export function createBreadcrumbsSsrAdapter<ElementType extends LitElement, Snapshot>(
  options: BreadcrumbsSsrAdapterOptions<ElementType, Snapshot>,
): BreadcrumbsSsrAdapter {
  if (!/^[a-z][a-z0-9._-]*-[a-z0-9._-]+$/.test(options.tagName)) {
    throw new TypeError('Breadcrumb SSR requires a lowercase custom-element tag name.');
  }
  const { tagName, elementClass, capture, prepare } = options;
  const records: CapturedRender[] = [];
  let nonce: string | undefined;
  let phase: 'rendering' | 'finalizing' | 'finished' = 'rendering';

  function requireRendering(): void {
    if (phase !== 'rendering') {
      throw new Error('Breadcrumb SSR adapter is single-use; create a new adapter for each response.');
    }
  }

  class BreadcrumbsRenderer extends EnElementRenderer {
    static override matchesClass(ctor: typeof HTMLElement, candidateTag?: string): boolean {
      return ctor === elementClass && candidateTag === tagName;
    }

    constructor(candidateTag: string) {
      requireRendering();
      super(candidateTag);
    }

    override get shadowRootOptions(): ShadowRootInit {
      const original = super.shadowRootOptions;
      if (original.mode !== 'open') {
        throw new Error('Breadcrumb SSR projection currently requires an open shadow root.');
      }
      return { ...original, slotAssignment: 'named' };
    }

    override renderShadow(info: RenderInfo): ThunkedRenderResult {
      requireRendering();
      const element = this.element as ElementType;
      const snapshot = capture(element);
      const context = copyContext(info);
      nonce ??= globalThis.crypto.randomUUID();
      const marker = `${MARKER_PREFIX}${nonce}:${records.length}`;
      records.push({
        marker,
        render: async (keys, hiddenKeys) => {
          prepare(element, keys, snapshot, Object.freeze({ hiddenKeys }));
          const result = super.renderShadow(copyContext(context));
          if (result === undefined) {
            throw new Error('Breadcrumb SSR projection cannot finalize a component with SSR disabled.');
          }
          return collectResult(result);
        },
      });
      // Lit 4.1 pops the host stack only for an emitted shadow result. Keep an
      // actual placeholder DSD template instead of returning undefined here.
      return [`<!--${marker}-->`];
    }
  }

  return {
    Renderer: BreadcrumbsRenderer,
    async finalize(markup): Promise<string> {
      requireRendering();
      phase = 'finalizing';
      try {
        if (records.length === 0) return markup;
        const document = parseFragment(markup, { sourceCodeLocationInfo: true });
        const byMarker = new Map(records.map(record => [record.marker, record]));
        const matches: { host: TreeElement; template: TreeElement; record: CapturedRender }[] = [];
        walk(document, node => {
          if (!isElement(node) || node.tagName !== tagName || node.namespaceURI !== HTML_NAMESPACE) return;
          for (const child of node.childNodes) {
            if (!isElement(child) || child.tagName !== 'template' || !('content' in child)) continue;
            const contents = child.content.childNodes;
            if (contents.length !== 1 || contents[0].nodeName !== '#comment' || !('data' in contents[0])) continue;
            const marker = contents[0].data;
            if (!marker.startsWith(MARKER_PREFIX)) continue;
            const record = byMarker.get(marker);
            if (!record) throw new Error('Breadcrumb SSR placeholder does not belong to this response or appears twice.');
            if (attribute(child, 'shadowrootmode') !== 'open') throw new Error('Breadcrumb SSR requires its open DSD placeholder.');
            byMarker.delete(marker);
            matches.push({ host: node, template: child, record });
          }
        });
        if (byMarker.size !== 0) throw new Error('Breadcrumb SSR output is incomplete or belongs to a different response.');

        const edits: Edit[] = [];
        for (const { host, template, record } of matches) {
          if (attribute(host, PLAN_ATTRIBUTE) !== undefined) {
            throw new Error(`Breadcrumb SSR reserves the ${PLAN_ATTRIBUTE} plan attribute; omit it from authored markup.`);
          }
          const children = supportedChildren(host, template);
          const keys = Object.freeze(children.map((_child, index) => `ssr-${index}`));
          const hiddenKeys = Object.freeze(children.flatMap((child, index) => attribute(child, 'hidden') === undefined ? [] : [keys[index]]));
          const plan: BreadcrumbsSsrPlan = { version: 1, keys, hiddenKeys };
          edits.push(insertAttribute(markup, host, PLAN_ATTRIBUTE, JSON.stringify(plan)));
          for (const [index, child] of children.entries()) {
            edits.push(insertAttribute(markup, child, 'slot', `${SLOT_PREFIX}${keys[index]}`));
          }
          const location = template.sourceCodeLocation;
          if (!location?.startTag || !location.endTag) throw new Error('Breadcrumb SSR requires a complete DSD template.');
          edits.push({
            start: location.startTag.endOffset,
            end: location.endTag.startOffset,
            replacement: await record.render(keys, hiddenKeys),
          });
        }
        return applyEdits(markup, edits);
      } finally {
        phase = 'finished';
        records.length = 0;
      }
    },
  };
}

function copyContext(info: RenderInfo): RenderInfo {
  return {
    ...info,
    elementRenderers: [...info.elementRenderers],
    customElementInstanceStack: [...info.customElementInstanceStack],
    customElementHostStack: [...info.customElementHostStack],
    eventTargetStack: [...info.eventTargetStack],
    slotStack: [...info.slotStack],
  };
}

function isElement(node: TreeNode): node is TreeElement {
  return 'tagName' in node;
}

function attribute(node: TreeElement, name: string): string | undefined {
  return node.attrs.find(item => item.name === name && !item.namespace)?.value;
}

function walk(node: TreeNode, visit: (node: TreeNode) => void): void {
  visit(node);
  if ('childNodes' in node) for (const child of node.childNodes) walk(child, visit);
  if ('content' in node) walk(node.content, visit);
}

function supportedChildren(host: TreeElement, placeholder: TreeElement): TreeElement[] {
  const children: TreeElement[] = [];
  for (const child of host.childNodes) {
    if (child === placeholder || child.nodeName === '#comment') continue;
    if (child.nodeName === '#text' && 'value' in child && /^[\t\n\f\r ]*$/.test(child.value)) continue;
    if (!isElement(child) || child.namespaceURI !== HTML_NAMESPACE || !['a', 'span'].includes(child.tagName)) {
      throw new Error('Breadcrumb SSR requires direct native a or span children; wrap direct text and omit unsupported elements.');
    }
    if (attribute(child, 'slot') !== undefined) {
      throw new Error('Breadcrumb SSR reserves each direct child slot attribute, including an empty slot attribute.');
    }
    if (attribute(child, 'hidden')?.toLowerCase() === 'until-found') {
      throw new Error('Breadcrumb SSR does not yet support direct children with hidden=until-found.');
    }
    children.push(child);
  }
  return children;
}

function insertAttribute(markup: string, element: TreeElement, name: string, value: string): Edit {
  const tag = element.sourceCodeLocation?.startTag;
  if (!tag || markup[tag.endOffset - 1] !== '>') throw new Error('Breadcrumb SSR requires explicit authored start tags.');
  // Insert directly after the tag name. Adding a trailing attribute could extend
  // an unquoted value or change the meaning of an authored self-closing slash.
  const start = tag.startOffset + 1 + element.tagName.length;
  const escaped = value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
  return { start, end: start, replacement: ` ${name}="${escaped}"` };
}

function applyEdits(markup: string, edits: Edit[]): string {
  edits.sort((left, right) => right.start - left.start);
  let boundary = markup.length;
  let result = '';
  for (const edit of edits) {
    if (edit.start < 0 || edit.end < edit.start || edit.end > boundary) {
      throw new Error('Breadcrumb SSR source edits overlap; this structure is outside the supported projection contract.');
    }
    result = edit.replacement + markup.slice(edit.end, boundary) + result;
    boundary = edit.start;
  }
  return markup.slice(0, boundary) + result;
}
