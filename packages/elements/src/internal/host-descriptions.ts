import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { observeIdReference, referenceRoot, type ReferenceRoot } from './id-reference.js';

/** Keeps a host's documented description relationship on its native semantic owner. */
export class HostDescriptions implements ReactiveController {
  private root: ReferenceRoot | null = null;
  private ids = '';
  private subscriptions: (() => void)[] = [];
  private control: HTMLElement | null = null;

  constructor(
    private readonly host: HTMLElement & ReactiveControllerHost,
    private readonly getControl: () => HTMLElement | null,
  ) { host.addController(this); }

  hostConnected(): void { this.host.requestUpdate(); }

  hostUpdated(): void {
    if (!this.host.isConnected) return;
    const control = this.getControl();
    if (control !== this.control) {
      this.clearControl();
      this.control = control;
    }
    const root = referenceRoot(this.host);
    const ids = this.host.getAttribute('aria-describedby') ?? '';
    if (root !== this.root || ids !== this.ids) {
      this.unsubscribe();
      this.root = root;
      this.ids = ids;
      this.subscriptions = [...new Set(ids.split(/\s+/).filter(Boolean))]
        .map(id => observeIdReference(root, id, () => this.forward()));
    }
    this.forward();
  }

  hostDisconnected(): void {
    this.unsubscribe();
    this.clearControl();
  }

  private forward(): void {
    if (!this.host.isConnected || !this.control || !('ariaDescribedByElements' in this.control)) return;
    // The browser resolves literal IDs in the host's tree. Forward real nodes,
    // preserving text changes and order rather than copying description text.
    const next = this.host.ariaDescribedByElements;
    const previous = this.control.ariaDescribedByElements;
    if (previous?.length !== next?.length || previous?.some((node, index) => node !== next?.[index])) {
      this.control.ariaDescribedByElements = next;
    }
  }

  private clearControl(): void {
    if (this.control && 'ariaDescribedByElements' in this.control) this.control.ariaDescribedByElements = null;
    this.control = null;
  }

  private unsubscribe(): void {
    for (const dispose of this.subscriptions) dispose();
    this.subscriptions = [];
    this.root = null;
    this.ids = '';
  }
}
