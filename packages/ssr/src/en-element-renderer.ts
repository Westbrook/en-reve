import { LitElementRenderer } from '@lit-labs/ssr/lib/lit-element-renderer.js';
import type { ThunkedRenderResult } from '@lit-labs/ssr/lib/render-result.js';
import type { RenderInfo } from '@lit-labs/ssr/lib/render.js';
import { STATIC_STYLES_ATTRIBUTE, STATIC_STYLES_VERSION } from '@en-reve/primitives/interactions/static-styles.js';

/** Mark only the installed Lit renderer's leading static-style chunk. */
export class EnElementRenderer extends LitElementRenderer {
  override renderShadow(info: RenderInfo): ThunkedRenderResult | undefined {
    const result = super.renderShadow(info);
    // No template parsing or global post-pass: unknown future/custom renderer
    // shapes retain their working inline styles instead of claiming ownership.
    if (Array.isArray(result) && result[0] === '<style>') {
      return [`<style ${STATIC_STYLES_ATTRIBUTE}="${STATIC_STYLES_VERSION}">`, ...result.slice(1)];
    }
    return result;
  }
}
