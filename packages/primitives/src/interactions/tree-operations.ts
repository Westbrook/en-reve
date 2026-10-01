import type { LoadStateDetail } from './events.js';
import { normalizeTreeData, treeDataKey, type TreeDataItem } from './tree.js';

export type TreeMovePosition = 'before' | 'after' | 'inside';
export interface TreeMove {
  readonly keys: readonly string[];
  readonly target: string;
  readonly position: TreeMovePosition;
  readonly previous: readonly TreeDataItem[];
  readonly proposed: readonly TreeDataItem[];
}
export function treeIndex(items: readonly TreeDataItem[]): Map<string, { item: TreeDataItem; parent: string | null }> {
  const index = new Map<string, { item: TreeDataItem; parent: string | null }>();
  const visit = (rows: readonly TreeDataItem[], parent: string | null): void => {
    for (const item of rows) { index.set(treeDataKey(item), { item, parent }); visit(item.children ?? [], treeDataKey(item)); }
  };
  visit(items, null); return index;
}
function moveContext(items: readonly TreeDataItem[], keys: readonly string[]) {
  const index = treeIndex(items), selected = new Set(keys);
  const blocked = (key: string | null): boolean => {
    for (let value = key; value; value = index.get(value)?.parent ?? null) if (index.get(value)?.item.disabled) return true;
    return false;
  };
  if (!keys.length || keys.some(key => !index.has(key) || blocked(key))) return;
  const roots = [...index.keys()].filter(key => selected.has(key) && (() => {
    for (let parent = index.get(key)?.parent; parent; parent = index.get(parent)?.parent) if (selected.has(parent)) return false;
    return true;
  })());
  const allows = (target: string, position: TreeMovePosition): boolean => {
    const destination = index.get(target);
    if (!destination || blocked(target) || !['before','after','inside'].includes(position)) return false;
    for (let parent: string | null = target; parent; parent = index.get(parent)?.parent ?? null) if (roots.includes(parent)) return false;
    if (position === 'inside' && (destination.item.lazy || !(destination.item.branch || destination.item.children?.length))) return false;
    const parent = position === 'inside' ? target : destination.parent;
    return !parent || !index.get(parent)?.item.lazy;
  };
  return { index, roots, allows };
}
/** Valid destinations without constructing an entire proposed hierarchy per option. No-op detection is deferred to commit. */
export function treeMoveTargets(items: readonly TreeDataItem[], keys: readonly string[], position: TreeMovePosition): ReadonlySet<string> {
  const context = moveContext(items, keys);
  return new Set(context ? [...context.index.keys()].filter(key => context.allows(key, position)) : []);
}
/** Pure move proposal. Ancestor selection subsumes descendants; source preorder is retained. */
export function proposeTreeMove(items: readonly TreeDataItem[], keys: readonly string[], target: string, position: TreeMovePosition): TreeMove | undefined {
  const context = moveContext(items, keys);
  if (!context?.allows(target, position)) return;
  const {index, roots} = context;
  const parent = position === 'inside' ? target : index.get(target)!.parent;
  const moving = roots.map(key => index.get(key)!.item);
  const rewrite = (rows: readonly TreeDataItem[], owner: string | null): TreeDataItem[] => {
    const result: TreeDataItem[] = rows.filter(item => !roots.includes(treeDataKey(item))).map(item => ({ ...item, children: rewrite(item.children ?? [], treeDataKey(item)) }));
    if (owner === parent) {
      const at = position === 'inside' ? result.length : result.findIndex(item => treeDataKey(item) === target) + (position === 'after' ? 1 : 0);
      result.splice(at, 0, ...moving);
    }
    return result;
  };
  const proposed = normalizeTreeData(rewrite(items, null));
  if (JSON.stringify(proposed) === JSON.stringify(normalizeTreeData(items))) return;
  return Object.freeze({ keys: Object.freeze(roots), target, position, previous: items, proposed });
}

export interface TreeLoadContext { readonly key: string; readonly item: TreeDataItem; readonly requestId: number; readonly signal: AbortSignal; }
export type TreeLoadChildren = (context: TreeLoadContext) => Promise<readonly TreeDataItem[]> | readonly TreeDataItem[];
export interface TreeBranchState extends LoadStateDetail {}
export const idleTreeBranch: TreeBranchState = Object.freeze({ status: 'idle', requestId: 0 });
