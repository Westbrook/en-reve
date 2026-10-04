import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import { hydrate } from '@lit-labs/ssr-client';
import { registerAll } from '@en-reve/elements/catalog.js';
import { fixtureTemplate, initial } from './template.mjs';

export async function start({ buttonStates = [] } = {}) {
  // Hold only the requested SSR children until the matching owner hydrates.
  const pending = buttonStates.map(({ id, disabled }) => {
    const host = document.getElementById(id);
    if (host.localName !== 'en-button' || host.matches(':defined')) throw new Error('Expected an unregistered SSR button.');
    host.setAttribute('defer-hydration', '');
    return { host, disabled };
  });
  registerAll();
  const beforeRelease = pending.map(({ host, disabled }) => {
    host.disabled = disabled;
    return {
      id: host.id, defined: host.matches(':defined'), hasUpdated: host.hasUpdated,
      deferred: host.hasAttribute('defer-hydration'), disabled: host.disabled,
      nativeDisabled: host.shadowRoot.querySelector('button').disabled,
    };
  });
  hydrate(fixtureTemplate(initial), document.querySelector('#fixture'));
  await Promise.all([...document.querySelectorAll('#fixture *')].map(element => element.updateComplete));
  document.documentElement.dataset.hydrated = 'true';
  return beforeRelease;
}
