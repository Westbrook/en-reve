import { render } from '@lit-labs/ssr';
import { EnElementRenderer } from './en-element-renderer.js';
import { collectResult } from '@lit-labs/ssr/lib/render-result.js';
import type { ElementRendererConstructor } from '@lit-labs/ssr/lib/element-renderer.js';
import { TextareaRenderer } from './textarea-renderer.js';
import { EnBreadcrumbs } from '@en-reve/elements/breadcrumbs.js';
import { prepareBreadcrumbsProjection } from '@en-reve/primitives/interactions/breadcrumbs-projection.js';
import { createBreadcrumbsSsrAdapter } from './breadcrumbs-adapter.js';
import { createSelectionChildrenSsrAdapter } from './selection-children-adapter.js';
import { createOptionalSlotsSsrAdapter } from './optional-slots-adapter.js';
import { createFormChildrenSsrAdapter } from './form-children-adapter.js';
import { createToastStackSsrAdapter } from './toast-stack-adapter.js';
import { createTreeSsrAdapter } from './tree-adapter.js';

export { createBreadcrumbsSsrAdapter };
export type {
  BreadcrumbsSsrAdapter,
  BreadcrumbsSsrAdapterOptions,
  BreadcrumbsSsrPlan,
  BreadcrumbsSsrVisibility,
} from './breadcrumbs-adapter.js';

export interface RenderOptions {
  /** Additional renderers precede the library and ordinary Lit renderers. */
  elementRenderers?: readonly ElementRendererConstructor[];
  onCustomElementRendered?: (tagName: string) => void;
}

/**
 * Render registered Lit custom elements and hydratable templates to HTML with
 * Declarative Shadow DOM. Registration is explicit; this function never calls
 * browser lifecycle hooks or shares a render context between requests.
 */
export async function renderToString(value: unknown, options: RenderOptions = {}): Promise<string> {
  const breadcrumbs = createBreadcrumbsSsrAdapter({
    tagName: 'en-breadcrumbs',
    elementClass: EnBreadcrumbs,
    capture: element => ({ label: element.label, size: element.size }),
    prepare: (element, keys, snapshot, { hiddenKeys }) => {
      if (element.label !== snapshot.label) element.label = snapshot.label;
      if (element.size !== snapshot.size) element.size = snapshot.size;
      prepareBreadcrumbsProjection(element, keys, hiddenKeys);
    },
  });
  const selection = createSelectionChildrenSsrAdapter();
  const forms = createFormChildrenSsrAdapter();
  const optionalSlots = createOptionalSlotsSsrAdapter();
  const tree = createTreeSsrAdapter();
  const toasts = createToastStackSsrAdapter();
  const markup = await collectResult(render(value, {
    elementRenderers: [...(options.elementRenderers ?? []), optionalSlots.Renderer, toasts.Renderer, forms.Renderer, selection.Renderer, breadcrumbs.Renderer, tree.Renderer, TextareaRenderer, EnElementRenderer],
    // Lit 4.1 omits release markers for static top-level elements when this is
    // true. Ordinary SSR leaves top-level upgrades enabled; nested shadow
    // children still defer automatically until their own parent hydrates.
    deferHydration: false,
    customElementRendered: options.onCustomElementRendered,
  }));
  return toasts.finalize(optionalSlots.finalize(await tree.finalize(await forms.finalize(await selection.finalize(await breadcrumbs.finalize(markup))))));
}

/** Construct fresh request-local models/templates for each snapshot. */
export function renderRequest<Snapshot>(
  snapshot: Snapshot,
  createTemplate: (snapshot: Snapshot) => unknown,
  options?: RenderOptions,
): Promise<string> {
  return renderToString(createTemplate(snapshot), options);
}
