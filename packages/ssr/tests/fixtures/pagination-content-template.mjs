import { html } from 'lit';

export const paginationContentInitial = Object.freeze([
  Object.freeze({ id: 'pagination-eager', label: 'Eager pages' }),
  Object.freeze({ id: 'pagination-secondary', label: 'Secondary pages' }),
  Object.freeze({ id: 'pagination-unused', label: 'Unused pages' }),
  Object.freeze({ id: 'pagination-untouched', label: 'Untouched pages' }),
  Object.freeze({ id: 'pagination-reentrant', label: 'Hydration opening pages' }),
]);

// Both sides use the same eager initial template and snapshot.
export function paginationContentTemplate(pagers = paginationContentInitial) {
  return html`<section aria-label="Pagination content hydration">
    ${pagers.map(pager => html`<en-pagination id=${pager.id} label=${pager.label}
      page="3" page-count="18">
      <span slot="previous" data-previous=${pager.id}>Previous</span>
      <span slot="next" data-next=${pager.id}>Next</span>
    </en-pagination>`)}
  </section>`;
}

export function paginationContentDocumentParts(markup) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pagination content hydration</title><link rel="stylesheet" href="/packages/tokens/dist/default.css"><style>body{margin:24px;font:16px/1.5 sans-serif}en-pagination{display:block;max-width:42rem;margin-block:24px}</style></head><body><main id="pagination-content-fixture">${markup}</main><script>window.hydratePaginationContent = options => import('/packages/ssr/tests/fixtures/pagination-content-hydrate.mjs').then(module => module.start(options));</script></body></html>`;
}
