import { isDOMElement, isHTMLElement } from '../internal/dom-kind.js';
import { connectionDocument } from '../internal/element-registry.js';
import { treeDataKey } from '@en-reve/primitives/interactions/tree.js';
import { html, nothing } from 'lit';
import type { ReactiveController } from 'lit';
import { normalizeTreeData, type TreeDataItem } from '@en-reve/primitives/interactions/tree.js';
import { proposeTreeMove, treeMoveTargets, treeIndex, type TreeMovePosition, type TreeMove } from '@en-reve/primitives/interactions/tree-operations.js';
import type { EnTree } from './element.js';
import type { EnTreeItem } from '../tree-item/element.js';

/** One validator/transaction for programmatic, pointer and keyboard moves. */
export class TreeMoveController implements ReactiveController {
  private opened = false;
  private keys: readonly string[] = [];
  private target = '';
  private position: TreeMovePosition = 'before';
  private message = '';
  private drag?: { id: number; grip: HTMLElement; row: HTMLElement; label: string; keys: readonly string[]; x: number; y: number; moved: boolean; target?: string; position?: TreeMovePosition };
  private marker?: HTMLElement;
  private gap?: { id: string; left: number; top: number; width: number };
  private destination = '';
  private suppressClick = false;
  private frame = 0;
  constructor(private host: EnTree, private focus: (key: string) => Promise<void>) { host.addController(this); }
  hostConnected(): void {
    this.host.addEventListener('keydown', this.keydown, true);
    this.host.addEventListener('pointerdown', this.down);
    this.host.addEventListener('click', this.click, true);
    this.host.addEventListener('dragstart', this.nativeDrag);
    this.host.addEventListener('pointermove', this.pointermove);
    this.host.addEventListener('pointerup', this.up);
    this.host.addEventListener('pointercancel', this.cancelDrag);
    this.host.addEventListener('lostpointercapture', this.cancelDrag);
    this.host.ownerDocument.addEventListener('scroll', this.scrolled, true);
  }
  hostDisconnected(): void {
    this.cancelDrag(); this.opened = false;
    this.host.removeEventListener('keydown', this.keydown, true);
    this.host.removeEventListener('pointerdown', this.down);
    this.host.removeEventListener('click', this.click, true);
    this.host.removeEventListener('dragstart', this.nativeDrag);
    this.host.removeEventListener('pointermove', this.pointermove);
    this.host.removeEventListener('pointerup', this.up);
    this.host.removeEventListener('pointercancel', this.cancelDrag);
    this.host.removeEventListener('lostpointercapture', this.cancelDrag);
    connectionDocument(this.host).removeEventListener('scroll', this.scrolled, true);
  }
  private authored(): Map<string, EnTreeItem> { return new Map(Array.from(this.host.querySelectorAll('en-tree-item')).filter(item => item.closest('en-tree') === this.host).map(item => [item.value, item])); }
  private hierarchy(): readonly TreeDataItem[] {
    if (this.host.items !== undefined) return this.host.items;
    const read = (parent: Element): TreeDataItem[] => Array.from(parent.children ?? []).filter((node): node is EnTreeItem => node.localName === 'en-tree-item' && !node.matches('[hidden],[inert],[aria-hidden="true"]')).map(item => ({ value: item.value, label: item.treeLabel(), disabled: item.disabled, branch: item.branch, children: read(item) }));
    return normalizeTreeData(read(this.host));
  }
  private say(message: string): void { this.message = message; this.host.requestUpdate(); }
  open(keys: readonly string[]): void {
    if (!this.host.reorderable || !keys.length) return;
    this.keys = [...keys]; this.position = 'before';
    this.target = [...treeIndex(this.hierarchy()).keys()].find(key => proposeTreeMove(this.hierarchy(), this.keys, key, this.position)) ?? '';
    this.opened = true; this.host.requestUpdate();
    void this.host.updateComplete.then(() => this.host.renderRoot.querySelector<HTMLElement>('[data-move-destination]')?.focus());
  }
  private close = (): void => { this.opened = false; this.host.requestUpdate(); if (this.keys[0]) void this.focus(this.keys[0]); };
  move(keys: readonly string[], target: string, position: TreeMovePosition): boolean {
    if (!this.host.reorderable || !this.host.isConnected || this.host.matches('[hidden],[inert],[aria-hidden="true"]')) return false;
    const source = this.hierarchy(), proposal = proposeTreeMove(source, keys, target, position);
    if (!proposal) { this.say('This move is not available. Choose a loaded folder or another position.'); return false; }
    const data = this.host.items;
    const nodes = data === undefined ? this.authored() : undefined;
    const EventClass = this.host.ownerDocument.defaultView!.CustomEvent;
    const accepted = this.host.dispatchEvent(new EventClass('en-reorder', { bubbles: true, composed: true, cancelable: true, detail: proposal }));
    if (!accepted || !this.host.reorderable || !this.host.isConnected || this.host.matches('[hidden],[inert],[aria-hidden="true"]') || this.host.items !== data
      || (nodes && (JSON.stringify(this.hierarchy()) !== JSON.stringify(source) || [...nodes].some(([key,node]) => this.authored().get(key) !== node)))) {
      this.say('Move canceled or handled by the application.'); return false;
    }
    if (data !== undefined) this.host.items = proposal.proposed;
    else {
      const index = treeIndex(proposal.proposed), parentKey = index.get(proposal.keys[0]!)!.parent;
      const parent = parentKey ? nodes!.get(parentKey)! : this.host;
      const siblings = parentKey ? index.get(parentKey)!.item.children! : proposal.proposed;
      const last = siblings.findIndex(item => treeDataKey(item) === proposal.keys[proposal.keys.length - 1]);
      const after = siblings[last + 1]; const before = after ? nodes!.get(treeDataKey(after))! : null;
      for (const key of proposal.keys) {
        const node = nodes!.get(key)!; if (parentKey) node.slot = 'children'; else node.removeAttribute('slot');
        parent.insertBefore(node, before);
      }
    }
    const nextIndex = treeIndex(proposal.proposed), expanded = new Set(this.host.expanded);
    for (let parent = nextIndex.get(proposal.keys[0]!)?.parent; parent; parent = nextIndex.get(parent)?.parent) expanded.add(parent);
    this.host.expanded = [...expanded];
    this.opened = false;
    this.say(`Moved ${proposal.keys.length === 1 ? nextIndex.get(proposal.keys[0]!)!.item.label : `${proposal.keys.length} items`} ${position} ${nextIndex.get(target)!.item.label}.`);
    void this.focus(proposal.keys[0]!); return true;
  }
  private keyFromPath(event: Event): string | undefined {
    for (const node of event.composedPath()) if (isDOMElement(node)) {
      if (node.hasAttribute('data-en-tree-key')) return node.getAttribute('data-en-tree-key')!;
      if (node.localName === 'en-tree-item') return (node as EnTreeItem).value;
    }
    return;
  }
  private movingKeys(key: string): readonly string[] {
    const index = treeIndex(this.hierarchy());
    return this.host.multiple && this.host.values.includes(key) ? this.host.values.filter(value => index.has(value)) : [key];
  }
  private keydown = (event: KeyboardEvent): void => {
    if (!this.host.reorderable) return;
    if (event.key === 'Escape' && (this.opened || this.drag)) {
      event.preventDefault(); event.stopPropagation(); this.cancelDrag(); if (this.opened) this.close(); this.say('Move canceled.');
    } else if (event.altKey && (event.code === 'KeyM' || event.key.toLowerCase() === 'm')) {
      const key = this.keyFromPath(event); if (!key) return;
      event.preventDefault(); event.stopPropagation(); this.open(this.movingKeys(key));
    }
  };
  private click = (event: MouseEvent): void => {
    if (!this.suppressClick || event.detail === 0) return;
    this.suppressClick = false; event.preventDefault(); event.stopImmediatePropagation();
  };
  private nativeDrag = (event: DragEvent): void => { if (this.drag) event.preventDefault(); };
  private down = (event: PointerEvent): void => {
    this.suppressClick = false;
    if (!this.host.reorderable || event.defaultPrevented || event.button !== 0 || event.isPrimary === false) return;
    const path = event.composedPath();
    if (path.find(node => isDOMElement(node) && node.localName === 'en-tree') !== this.host) return;
    const row = path.find(node => isHTMLElement(node) && node.classList.contains('en-tree-option')) as HTMLElement | undefined;
    const grip = path.find(node => isHTMLElement(node) && node.hasAttribute('data-tree-drag')) as HTMLElement | undefined;
    const key = this.keyFromPath(event); if (!row || !key) return;
    // Touch keeps its dedicated grip so ordinary row gestures can scroll the tree.
    if (!grip && event.pointerType !== 'mouse') return;
    if (path.slice(0, path.indexOf(row)).some(node => isDOMElement(node) && node.matches('.en-tree-indicator, a, button, input, select, textarea, [contenteditable]:not([contenteditable="false"])'))) return;
    const item = treeIndex(this.hierarchy()).get(key)?.item; if (!item || item.disabled) return;
    if (grip) event.preventDefault();
    void this.focus(key);
    this.drag = { id: event.pointerId, grip: grip ?? row, row, label: item.label, keys: this.movingKeys(key), x: event.clientX, y: event.clientY, moved: false };
    (grip ?? row).setPointerCapture(event.pointerId);
  };
  private optionFor(key: string): HTMLElement | undefined {
    if (this.host.items !== undefined) return Array.from(this.host.renderRoot.querySelectorAll<HTMLElement>('[data-en-tree-key]'))
      .find(row => row.dataset.enTreeKey === key)?.querySelector<HTMLElement>('.en-tree-option') ?? undefined;
    return this.authored().get(key)?.renderRoot.querySelector<HTMLElement>('.en-tree-option') ?? undefined;
  }
  private subtreeBottom(row: HTMLElement): number {
    return (row.closest('[data-en-tree-key]') ?? (row.getRootNode() as ShadowRoot).host).getBoundingClientRect().bottom;
  }
  private hit(x: number, y: number): HTMLElement | undefined {
    let node = this.host.ownerDocument.elementFromPoint(x, y);
    while (node?.shadowRoot) { const inner = node.shadowRoot.elementFromPoint(x, y); if (!inner || inner === node) break; node = inner; }
    const row = node?.closest<HTMLElement>('.en-tree-option');
    if (row) return row;
    // Keep the boundary active while crossing spacing between adjacent authored rows.
    if (!(node && (this.host.contains(node) || node.getRootNode() === this.host.renderRoot || (node.getRootNode() as ShadowRoot).host?.closest('en-tree') === this.host))) return;
    const options = this.host.items !== undefined ? Array.from(this.host.renderRoot.querySelectorAll<HTMLElement>('.en-tree-option'))
      : [...this.authored().values()].flatMap(item => [...item.renderRoot.querySelectorAll<HTMLElement>('.en-tree-option')]);
    return options.map(option => ({ option, box: option.getBoundingClientRect() }))
      .filter(({box}) => box.height > 0 && x >= box.left && x <= box.right)
      .map(entry => ({...entry, distance: Math.max(entry.box.top-y, y-entry.box.bottom, 0)}))
      .filter(entry => entry.distance <= 8).sort((a,b) => a.distance-b.distance)[0]?.option;
  }
  private insertionGap(proposal: TreeMove, fallback: HTMLElement): void {
    const index = treeIndex(proposal.proposed), parent = index.get(proposal.keys[0]!)!.parent;
    const siblings = parent ? index.get(parent)!.item.children! : proposal.proposed;
    const first = siblings.findIndex(item => treeDataKey(item) === proposal.keys[0]);
    const previous = siblings[first-1], next = siblings[first+proposal.keys.length];
    this.destination = previous && next ? `Between ${previous.label} and ${next.label}`
      : next ? `At start${parent ? ` of ${index.get(parent)!.item.label}` : ''}, before ${next.label}`
      : previous ? `At end${parent ? ` of ${index.get(parent)!.item.label}` : ''}, after ${previous.label}` : 'At start';
    const before = previous && this.optionFor(treeDataKey(previous)), after = next && this.optionFor(treeDataKey(next));
    const box = (after ?? before ?? fallback).getBoundingClientRect();
    const previousEnd = before ? this.subtreeBottom(before) : undefined;
    // Prefer the following sibling as the single anchor for both approaches.
    const top = after ? previousEnd !== undefined && previousEnd <= box.top ? (previousEnd+box.top)/2 : box.top
      : previousEnd ?? (proposal.position === 'before' ? box.top : this.subtreeBottom(fallback));
    const viewport = this.host.renderRoot.querySelector<HTMLElement>('[data-virtualize]')?.getBoundingClientRect();
    if (viewport && (top < viewport.top || top > viewport.bottom)) return;
    const left = Math.max(box.left, viewport?.left ?? box.left), right = Math.min(box.right, viewport?.right ?? box.right);
    if (right > left) this.gap = { id: JSON.stringify([parent,previous?.value ?? null,next?.value ?? null]), left, top, width: right-left };
  }
  private scrolled = (): void => {
    if (!this.drag?.moved) return;
    this.point(this.drag.x, this.drag.y, false); this.host.requestUpdate();
  };
  private point(x: number, y: number, retainGap = true): void {
    const drag = this.drag; if (!drag) return;
    // A narrow shared boundary must not flip hierarchy depth in the space between rows.
    if (retainGap && this.gap && Math.abs(y-this.gap.top) <= 4 && x >= this.gap.left && x <= this.gap.left+this.gap.width) return;
    this.marker?.removeAttribute('data-tree-drop'); this.marker = undefined; drag.target = undefined; this.gap = undefined; this.destination = '';
    const row = this.hit(x, y); if (!row) return;
    const root = row.getRootNode() as ShadowRoot;
    const owner = root.host;
    if (owner !== this.host && owner?.closest('en-tree') !== this.host) return;
    const key = row.closest('[data-en-tree-key]')?.getAttribute('data-en-tree-key') ?? (owner as EnTreeItem)?.value;
    if (!key) return;
    const box = row.getBoundingClientRect(), fraction = (y - box.top) / box.height;
    const item = treeIndex(this.hierarchy()).get(key)?.item;
    const branch = item && (item.branch || item.lazy || item.children?.length);
    const position = branch ? fraction < .25 ? 'before' : fraction > .75 ? 'after' : 'inside' : fraction < .5 ? 'before' : 'after';
    const proposal = proposeTreeMove(this.hierarchy(), drag.keys, key, position); if (!proposal) return;
    drag.target = key; drag.position = position;
    if (position === 'inside') {
      this.destination = `Into ${item!.label}`; row.setAttribute('data-tree-drop', position); this.marker = row;
    } else this.insertionGap(proposal, row);
  }
  private tick = (): void => {
    this.frame = 0; const drag = this.drag; if (!drag?.moved) return;
    const viewport = this.host.renderRoot.querySelector<HTMLElement>('[data-virtualize]');
    if (viewport) {
      const box = viewport.getBoundingClientRect();
      if (drag.x >= box.left && drag.x <= box.right && drag.y >= box.top && drag.y <= box.bottom) {
        const delta = drag.y < box.top + 36 ? -12 : drag.y > box.bottom - 36 ? 12 : 0;
        if (delta) { viewport.scrollTop += delta; this.point(drag.x, drag.y, false); this.host.requestUpdate(); }
      }
    }
    this.frame = this.host.ownerDocument.defaultView!.requestAnimationFrame(this.tick);
  };
  private pointermove = (event: PointerEvent): void => {
    const drag = this.drag; if (!drag || drag.id !== event.pointerId) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 6) return;
    drag.row.setAttribute('data-tree-dragging', ''); this.suppressClick = true;
    drag.moved = true; drag.x = event.clientX; drag.y = event.clientY; event.preventDefault();
    this.point(drag.x, drag.y); this.host.requestUpdate(); if (!this.frame) this.frame = this.host.ownerDocument.defaultView!.requestAnimationFrame(this.tick);
  };
  private up = (event: PointerEvent): void => {
    const drag = this.drag; if (!drag || drag.id !== event.pointerId) return;
    this.cancelDrag();
    if (drag.moved && drag.target && drag.position) this.move(drag.keys, drag.target, drag.position);
    else if (drag.moved) this.say('Move canceled. No available destination.');
  };
  private cancelDrag = (): void => {
    const drag = this.drag; this.drag = undefined; this.gap = undefined; this.destination = '';
    drag?.row.removeAttribute('data-tree-dragging'); this.host.requestUpdate();
    this.marker?.removeAttribute('data-tree-drop'); this.marker = undefined;
    if (this.frame) this.host.ownerDocument.defaultView?.cancelAnimationFrame(this.frame); this.frame = 0;
    if (drag?.grip.hasPointerCapture(drag.id)) drag.grip.releasePointerCapture(drag.id);
  };
  render() {
    if (!this.host.reorderable) return nothing;
    const items = this.hierarchy();
    const targets = this.opened ? treeMoveTargets(items, this.keys, this.position) : new Set<string>();
    const drag = this.drag;
    const gap = this.gap;
    return html`${gap ? html`<div class="en-tree-drop-indicator" part="drop-indicator" aria-hidden="true" data-tree-gap=${gap.id}
      style=${`left:${gap.left}px;top:${gap.top}px;width:${gap.width}px`}></div>` : nothing}${drag?.moved ? html`<div class="en-tree-drag-preview" part="drag-preview" aria-hidden="true"
      style=${`left: min(${Math.max(0, drag.x + 12)}px, calc(100vw - 13rem)); top: min(${Math.max(0, drag.y + 12)}px, calc(100vh - 5rem))`}>
      ${drag.keys.length > 1 ? `${drag.keys.length} items` : drag.label}
      <small>${this.destination || 'Choose a destination'}</small>
    </div>` : nothing}<div class="en-tree-move" part="move-controls">
      ${this.opened ? html`<fieldset><legend>Move ${this.keys.length} selected item${this.keys.length === 1 ? '' : 's'}</legend>
        <label>Destination<select data-move-destination .value=${this.target} @change=${(event: Event) => {this.target=(event.target as HTMLSelectElement).value;this.host.requestUpdate();}}>
          <option value="" ?selected=${!this.target}>Choose a destination</option>${[...treeIndex(items)].map(([key,{item}]) => html`<option value=${key} ?selected=${key === this.target} ?disabled=${!targets.has(key)}>${item.label}</option>`)}
        </select></label>
        <label>Position<select .value=${this.position} @change=${(event: Event) => {this.position=(event.target as HTMLSelectElement).value as TreeMovePosition;this.host.requestUpdate();}}>
          <option value="before">Before</option><option value="after">After</option><option value="inside">Inside folder</option>
        </select></label>
        <button type="button" class="en-button" @click=${() => this.move(this.keys,this.target,this.position)} ?disabled=${!proposeTreeMove(items,this.keys,this.target,this.position)}>Move items</button>
        <button type="button" class="en-button" data-variant="secondary" @click=${this.close}>Cancel move</button>
      </fieldset>` : nothing}
      <p part="move-status" role="status" aria-atomic="true">${this.message}</p>
    </div>`;
  }
}
