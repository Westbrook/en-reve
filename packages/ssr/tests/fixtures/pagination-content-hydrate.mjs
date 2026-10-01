import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import { hydrate } from '@lit-labs/ssr-client';
import { EnPagination } from '@en-reve/elements/pagination.js';
import { paginationContentTemplate } from './pagination-content-template.mjs';

export async function start(options = {}) {
  if (customElements.get('en-pagination')) throw new Error('Pagination fixture already hydrated.');
  const root = document.querySelector('#pagination-content-fixture');
  const observations = [];
  // Open during the first render to exercise recovery before listeners attach.
  class FixturePagination extends EnPagination {
    render() {
      const result = super.render();
      if (options.openDuringFirstRender && !this.hasUpdated && this.id === 'pagination-reentrant') {
        const panel = this.shadowRoot?.querySelector('[popover]');
        if (panel && !panel.matches(':popover-open')) {
          panel.showPopover();
          observations.push({ open: panel.matches(':popover-open'), body: Boolean(panel.querySelector('input')) });
        }
      }
      return result;
    }
  }
  customElements.define('en-pagination', FixturePagination);
  hydrate(paginationContentTemplate(), root);
  await Promise.all([...root.querySelectorAll('en-pagination')].map(element => element.updateComplete));
  window.paginationContentFixture = { root, observations };
  document.documentElement.dataset.hydrated = 'true';
  return observations;
}
