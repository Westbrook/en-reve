import {html} from 'lit';
import {paginationDefinition} from '@en-reve/elements/definitions/pagination.js';
import type {EnPagination} from '@en-reve/elements/pagination.js';

export const version = 'pagination-1';
export const definitions = [paginationDefinition];

export interface PaginationSnapshot {
  page: number;
  pageCount: number;
}

export function template(snapshot: PaginationSnapshot) {
  // Server and client share the same eager template and snapshot.
  return html`<en-pagination id="ssr-pagination" label="Asset pages"
    page=${snapshot.page} page-count=${snapshot.pageCount}>
    <span slot="previous" data-authored="previous">Previous</span>
    <span slot="next" data-authored="next">Next</span>
  </en-pagination>`;
}

export async function ready(root: Element | ShadowRoot) {
  const pagination = root.querySelector<EnPagination>('en-pagination')!;
  // Inspect the field only after its containing hydration update.
  while (!await pagination.updateComplete) { /* Complete component updates. */ }
}

