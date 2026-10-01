import type {
  EnActivityFeed, EnTree, EnDataTable, EnDialog, EnPopover, EnNavigation,
  EnTokenEditor, EnRichTextEditor, ActivityLoadRequestEvent, ActivityLoadDetail,
  ActivityLoadStateChangeEvent, PageChangeEvent, TreeChangeEvent,
  OverlayChangeEvent, DisclosureChangeEvent, TokenEditorChangeEvent,
  RichTextEditorChangeEvent, EditorInputEvent,
} from '@en-reve/elements';
import type { ActivityLoadRequestEvent as DeepRequest } from '@en-reve/elements/activity-feed.js';
import type { TreeLoadStateChangeEvent } from '@en-reve/elements/tree.js';
import type { DataTableSortEvent } from '@en-reve/elements/data-table.js';
import type { OverlayChangeEvent as DeepOverlay } from '@en-reve/elements/dialog.js';

declare const feed: EnActivityFeed, tree: EnTree, table: EnDataTable;
declare const dialog: EnDialog, popover: EnPopover, nav: EnNavigation;
declare const token: EnTokenEditor, rich: EnRichTextEditor;
class Consumer {
  onPage(event: PageChangeEvent): void {
    const page: number = event.detail.proposed;
    const reason: 'pagination' = event.detail.reason;
    if (page > 2 && reason === 'pagination') event.preventDefault();
    // @ts-expect-error Page values are numeric, not strings.
    const invalid: string = event.detail.proposed;
    void invalid;
  }
  onLoad(event: ActivityLoadRequestEvent): void {
    const same: DeepRequest = event;
    same.respondWith(Promise.resolve({ items: [], hasMore: false }));
    // @ts-expect-error Response must be an ActivityPage.
    event.respondWith(Promise.resolve('wrong'));
  }
  onState(event: ActivityLoadStateChangeEvent): void { console.log(event.detail.status); }
  onTree(event: TreeChangeEvent): void { console.log(event.detail.proposed.expanded); }
  onOverlay(event: OverlayChangeEvent): void { const same: DeepOverlay = event; console.log(same.detail.proposed); }
  onDisclosure(event: DisclosureChangeEvent): void { console.log(event.detail.reason); }
  onToken(event: TokenEditorChangeEvent): void { console.log(event.detail.proposed.runs); }
  onRich(event: RichTextEditorChangeEvent): void { console.log(event.detail.proposed); }
  onInput(event: EditorInputEvent): void { console.log(event.detail.value); }
}
const consumer = new Consumer();
feed.addEventListener('en-page-change', consumer.onPage);
table.addEventListener('en-page-change', consumer.onPage);
feed.addEventListener('en-load-request', consumer.onLoad, { signal: new AbortController().signal });
feed.removeEventListener('en-load-request', consumer.onLoad, { capture: false });
feed.addEventListener('en-load-state-change', consumer.onState);
feed.addEventListener('en-load', (event: CustomEvent<ActivityLoadDetail>) => event.detail.fail('test'));
feed.addEventListener('en-load-request', { handleEvent: consumer.onLoad });
feed.removeEventListener('en-load-request', { handleEvent: consumer.onLoad });
feed.addEventListener('en-load-request', null);
feed.addEventListener('click', event => { const x: number = event.clientX; console.log(x); });
feed.addEventListener('application-event', (event: Event) => console.log(event.type));
feed.addEventListener('en-load-request', event => event.respondWith({ items: [], hasMore: false }));
feed.addEventListener('en-page-change', function(event) { const same: EnActivityFeed = this; console.log(same.page, event.detail.proposed); });
// @ts-expect-error This is a change proposal, not a load request.
feed.addEventListener('en-page-change', consumer.onLoad);
// @ts-expect-error Tree snapshots do not describe numeric pages.
tree.addEventListener('en-change', consumer.onPage);
tree.addEventListener('en-change', consumer.onTree);
tree.addEventListener('en-load-state-change', (event: TreeLoadStateChangeEvent) => console.log(event.detail.key));
table.addEventListener('en-sort', (event: DataTableSortEvent) => console.log(event.detail.proposed?.direction));
dialog.addEventListener('en-change', consumer.onOverlay);
popover.addEventListener('en-change', consumer.onOverlay);
nav.addEventListener('en-change', consumer.onDisclosure);
token.addEventListener('en-change', consumer.onToken);
rich.addEventListener('en-change', consumer.onRich);
rich.addEventListener('en-input', consumer.onInput);
rich.addEventListener('en-toolbar-request', event => event.preventDefault());
