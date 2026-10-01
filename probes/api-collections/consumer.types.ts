import type { EnTree, TreeChangeEvent, TreeDataItem } from '@en-reve/elements/tree.js';
import type { EnTreeItem } from '@en-reve/elements/tree-item.js';
import type { EnCarousel } from '@en-reve/elements/carousel.js';
import type { EnActivityFeed } from '@en-reve/elements/activity-feed.js';
import type { EnDataTable } from '@en-reve/elements/data-table.js';

declare const tree: EnTree;
declare const item: EnTreeItem;
declare const carousel: EnCarousel;
declare const feed: EnActivityFeed;
declare const table: EnDataTable<{id:string}>;
const data: readonly TreeDataItem[] = [{key:'folder',label:'Folder',children:[{value:'legacy',label:'Legacy'}]}];
tree.items = data;
tree.multiple = true;
tree.selectedKeys = ['legacy'];
tree.expandedKeys = ['folder'];
tree.selectedKey = 'legacy';
item.key = 'folder';
const selected: string = tree.value;
const normalized: string | undefined = tree.items?.[0].key;
const handler = (event: TreeChangeEvent): void => {
  const first: string = event.detail.proposed.selectedKey;
  const keys: readonly string[] = event.detail.proposed.selectedKeys;
  const expanded: readonly string[] = event.detail.proposed.expandedKeys;
  void first; void keys; void expanded;
};
tree.addEventListener('en-change', handler);
carousel.items = null;
carousel.items = undefined;
const authored: readonly unknown[] | undefined = carousel.items;
carousel.readingMode = 'list';
feed.mode = 'all'; feed.mode = 'paginated'; feed.mode = 'virtual'; feed.mode = 'paged';
table.mode = 'virtual'; table.mode = 'windowed'; table.getKey = row => row.id;
// @ts-expect-error Tree rendering remains a Boolean capability.
tree.virtualize = 'paginated';
// @ts-expect-error Carousel reading presentation is distinct from collection delivery.
carousel.readingMode = 'paginated';
void selected; void normalized; void authored;
