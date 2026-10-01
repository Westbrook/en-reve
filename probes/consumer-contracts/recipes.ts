import {html, render} from 'lit-html';
import {createElementScope, elementScopeCapabilities, type ElementScope} from '@en-reve/elements/element-scope.js';
import {createDefinitionLoader, type DefinitionLoaders} from '@en-reve/elements/lazy-loader.js';
import {createElementActivation, type ElementActivationOptions} from '@en-reve/elements/activation.js';
import type {EnCard} from '@en-reve/elements/card.js';

// Literal imports are deliberately selective. Reuse this object to share imports.
export const loaders = Object.freeze({
  'en-card': () => import('@en-reve/elements/definitions/card.js').then(m => m.cardDefinition),
  'en-toast-region': () => import('@en-reve/elements/definitions/toast-region.js').then(m => m.toastRegionDefinition),
}) satisfies DefinitionLoaders;
export {createElementScope, elementScopeCapabilities, createDefinitionLoader, createElementActivation};

export async function mountCards(container: HTMLElement, shadow = false, global = false) {
  const scope = createElementScope({document: container.ownerDocument, registry: global ? 'global' : 'auto'});
  await createDefinitionLoader(scope.registry, loaders).ensure(['en-card']);
  const region = scope.createElement('section');
  container.append(region);
  const root = shadow ? scope.attachShadow(region) : region;
  render(html`<en-card><span slot="heading">Details</span>Scoped content</en-card>`, root, {creationScope: scope.creationScope});
  const card = root.querySelector('en-card') as EnCard;
  await card.updateComplete;
  return {scope, root, card};
}

// No framework portal claim: append accepts an existing Node and preserves ownership.
export function moveCard(card: EnCard, destination: Element) { destination.append(card); }

export function optionalCard(scope: ElementScope, ready?: ElementActivationOptions['ready']) {
  const document = scope.document;
  // Native null creation is deliberately guarded. Global fallback uses inert markup.
  const root = scope.mode === 'scoped'
    ? document.createElement('section', {customElementRegistry: null})
    : document.createElement('section');
  const template = document.createElement('template');
  template.innerHTML = '<en-card><span slot="heading">Optional details</span>Details loaded.</en-card>';
  if (scope.mode === 'scoped') root.innerHTML = template.innerHTML;
  const activation = createElementActivation({
    scope, root, policy: 'dormant', tags: ['en-card'], loaders,
    template: scope.mode === 'global' ? template : undefined,
    ready: ready ?? (async (root, signal) => {
      await (root.querySelector('en-card') as EnCard).updateComplete;
      signal.throwIfAborted();
    }),
  });
  return {root, activation};
}

export function mountOptional(container: HTMLElement, global = false) {
  const scope = createElementScope({document: container.ownerDocument, registry: global ? 'global' : 'auto'});
  const {root, activation} = optionalCard(scope);
  container.append(root);
  return {scope, root, activation};
}
