import {EnPagination} from '@en-reve/elements/pagination.js';
import {paginationDefinition} from '@en-reve/elements/definitions/pagination.js';
import {createElementScope} from '@en-reve/elements/element-scope.js';
import type {PaginationChangeEvent} from '@en-reve/elements/events.js';

declare const document: Document;
const scope = createElementScope({document, registry: 'auto'});
scope.register([paginationDefinition]);
const pagination: EnPagination = scope.createElement('en-pagination');
pagination.pageCount = 12;
pagination.page = 3;
pagination.disabled = false;
pagination.addEventListener('en-change', nativeEvent => {
  const event = nativeEvent as PaginationChangeEvent;
  const proposed: number = event.detail.proposed;
  const previous: number = event.detail.previous;
  const reason: 'previous' | 'next' | 'page' = event.detail.reason;
  void [proposed, previous, reason];
  event.preventDefault();
});

