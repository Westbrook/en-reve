import { ChildUpgrades } from '../internal/child-upgrades.js';
import { interactionAvailable } from '../internal/interaction-availability.js';
import { tabsTemplate } from './template.js';
import { EnElement } from '../internal/en-element.js';
import type { PropertyValues } from 'lit';
import { createValueModel } from '@en-reve/primitives/state/value.js';
import { dispatchChange } from '@en-reve/primitives/interactions/events.js';
import { SignalController } from '@en-reve/primitives/interactions/signal-controller.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { selectionStyles } from '@en-reve/styles/selection.js';
import type { EnTab } from '../tab/tab.js';
import type { EnTabPanel } from '../tab-panel/tab-panel.js';

/**
 * Tabs with automatic or manual activation, roving focus and persistent panels.
 * Give each tab/panel pair the same unique value and, for SSR, stable author-supplied IDs.
 * Arrow keys move along orientation; Home/End find boundaries; Enter/Space activate.
 * @tagname en-tabs
 * @slot tab - en-tab label elements.
 * @slot panel - en-tab-panel content elements.
 * @csspart base - Tabs wrapper.
 * @csspart tab-list - Labeled tablist wrapper.
 * @csspart panels - Panel group wrapper.
 * @fires {CustomEvent<import('@en-reve/primitives/interactions/events.js').ChangeDetail<string>>} en-change - Cancelable tentative selected key; cancellation preserves the previous panel unless an author write supersedes it.
 */
export class EnTabs extends EnElement {
  static override properties = {
    value: { type: String, reflect: true, noAccessor: true },
    label: { type: String },
    orientation: { type: String, reflect: true },
    activation: { type: String, reflect: true },
  };
  static override styles = [foundationStyles, blockHostStyles, selectionStyles];
  declare label: string;
  declare orientation: 'horizontal' | 'vertical';
  declare activation: 'automatic' | 'manual';
  private readonly model = createValueModel('');
  // An equal public assignment can still supersede an in-flight proposal.
  private authorRevision = 0;
  private presentedValue = '';
  private tabs: EnTab[] = [];
  private panels: EnTabPanel[] = [];
  private focusKey = '';
  private idPrefix = '';
  private observer?: MutationObserver;
  private readonly upgrades = new ChildUpgrades(this, () => this.readChildren());

  constructor() {
    super();
    this.label = '';
    this.orientation = 'horizontal';
    this.activation = 'automatic';
    new SignalController(this, () => this.model.view.get());
  }

  /** Selected tab key. An explicit write, including empty, suppresses the silent initial fallback. */
  get value(): string { return this.model.value.get(); }
  set value(value: string) {
    this.authorRevision += 1;
    const previous = this.presentedValue;
    this.model.set(String(value ?? ''));
    this.presentedValue = this.value;
    this.requestUpdate('value', previous);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('keydown', this.onKeyDown);
    this.addEventListener('click', this.onClick);
    const MutationObserverClass = this.ownerDocument.defaultView?.MutationObserver;
    if (MutationObserverClass) {
      this.observer = new MutationObserverClass(() => this.readChildren());
      this.observer.observe(this, { childList: true, subtree: true, attributes: true, attributeFilter: ['value', 'disabled', 'id', 'hidden', 'inert', 'style', 'class', 'slot'] });
    }
  }

  override disconnectedCallback(): void {
    this.removeEventListener('keydown', this.onKeyDown);
    this.removeEventListener('click', this.onClick);
    this.observer?.disconnect();
    this.observer = undefined;
    super.disconnectedCallback();
  }

  private readChildren(): void {
    const tabSlot = this.renderRoot.querySelector<HTMLSlotElement>('slot[name="tab"]');
    const panelSlot = this.renderRoot.querySelector<HTMLSlotElement>('slot[name="panel"]');
    const tabs = tabSlot?.assignedElements({ flatten: true }) ?? [];
    const panels = panelSlot?.assignedElements({ flatten: true }) ?? [];
    this.upgrades.watch([...tabs, ...panels]);
    this.tabs = tabs.filter((element): element is EnTab => element.localName === 'en-tab' && element.matches(':defined') && 'disabled' in element && 'value' in element);
    this.panels = panels.filter((element): element is EnTabPanel => element.localName === 'en-tab-panel' && element.matches(':defined') && 'value' in element);
    // Generated IDs are a client convenience; consumer IDs remain the SSR identity contract.
    if (!this.idPrefix && this.tabs.length) this.idPrefix = this.id || `en-tabs-${this.ownerDocument.defaultView?.crypto.randomUUID() ?? Math.random().toString(36).slice(2)}`;
    this.tabs.forEach((tab, index) => { if (!tab.id) tab.id = `${this.idPrefix}-tab-${index + 1}`; });
    this.panels.forEach((panel, index) => { if (!panel.id) panel.id = `${this.idPrefix}-panel-${index + 1}`; });
    if (!this.value && this.authorRevision === 0) {
      const previous = this.presentedValue;
      this.model.set(this.tabs.find(tab => this.available(tab) && tab.value)?.value ?? '');
      this.presentedValue = this.value;
      this.requestUpdate('value', previous);
    }
    this.syncChildren();
  }

  private syncChildren(): void {
    const enabled = this.tabs.filter((tab) => this.available(tab));
    const selected = this.tabs.find((tab) => tab.value === this.presentedValue);
    if (!enabled.some((tab) => tab.value === this.focusKey)) this.focusKey = enabled.find((tab) => tab === selected)?.value ?? enabled[0]?.value ?? '';
    for (const tab of this.tabs) {
      const panel = this.panels.find((candidate) => candidate.value === tab.value);
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', String(tab === selected));
      tab.setAttribute('aria-disabled', String(tab.disabled));
      if (panel) tab.setAttribute('aria-controls', panel.id);
      else tab.removeAttribute('aria-controls');
      tab.tabIndex = this.available(tab) && tab.value === this.focusKey ? 0 : -1;
    }
    for (const panel of this.panels) {
      const tab = this.tabs.find((candidate) => candidate.value === panel.value);
      panel.setAttribute('role', 'tabpanel');
      if (tab) panel.setAttribute('aria-labelledby', tab.id);
      else panel.removeAttribute('aria-labelledby');
      const shouldHide = panel.value !== this.presentedValue;
      const focused = this.ownerDocument.activeElement;
      if (shouldHide && !panel.hidden && focused && (focused === panel || panel.contains(focused))) selected?.focus();
      if (panel.hidden !== shouldHide) panel.hidden = shouldHide;
    }
  }

  private available(tab: EnTab): boolean { return !tab.disabled && interactionAvailable(tab); }
  private owns(tab: EnTab): boolean {
    return !!this.renderRoot.querySelector<HTMLSlotElement>('slot[name="tab"]')?.assignedElements({ flatten: true }).includes(tab);
  }

  private activate(tab: EnTab, reason: 'pointer' | 'keyboard'): void {
    if (!this.available(tab) || !tab.value || tab.value === this.value) return;
    dispatchChange(this, {
      previous: this.value, proposed: tab.value, reason,
      getRevision: () => this.authorRevision,
      canCommit: next => this.owns(tab) && this.available(tab) && tab.value === next,
      stage: next => { this.model.set(next); },
      rollback: prior => { this.model.set(prior); },
      commit: () => {
        const previous = this.presentedValue;
        this.presentedValue = this.value;
        this.requestUpdate('value', previous);
        this.syncChildren();
      },
    });
  }

  private eventTab(event: Event): EnTab | undefined {
    return this.tabs.find((tab) => event.composedPath().includes(tab));
  }

  private readonly onClick = (event: MouseEvent): void => {
    const tab = this.eventTab(event);
    if (!tab || !this.available(tab) || event.defaultPrevented) return;
    this.focusKey = tab.value;
    this.syncChildren();
    tab.focus();
    this.activate(tab, 'pointer');
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    const tab = this.eventTab(event);
    if (!tab || !this.available(tab) || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.activate(tab, 'keyboard');
      return;
    }
    const enabled = this.tabs.filter((candidate) => this.available(candidate));
    const index = enabled.indexOf(tab);
    let next = index;
    const horizontal = this.orientation !== 'vertical';
    const rtl = horizontal && this.ownerDocument.defaultView?.getComputedStyle(this).direction === 'rtl';
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = enabled.length - 1;
    else if (horizontal && event.key === 'ArrowRight') next += rtl ? -1 : 1;
    else if (horizontal && event.key === 'ArrowLeft') next += rtl ? 1 : -1;
    else if (!horizontal && event.key === 'ArrowDown') next += 1;
    else if (!horizontal && event.key === 'ArrowUp') next -= 1;
    else return;
    event.preventDefault();
    const target = enabled[(next + enabled.length) % enabled.length];
    if (!target) return;
    this.focusKey = target.value;
    this.syncChildren();
    target.focus();
    if (this.activation !== 'manual') this.activate(target, 'keyboard');
  };

  protected override updated(changed: PropertyValues): void {
    if (changed.has('value')) {
      this.focusKey = this.tabs.find((tab) => tab.value === this.presentedValue && this.available(tab))?.value ?? this.focusKey;
      this.syncChildren();
    }
  }

  protected override render() {
    return tabsTemplate({ label: this.label, orientation: this.orientation }, () => this.readChildren());
  }
}

declare global { interface HTMLElementTagNameMap { 'en-tabs': EnTabs; } }
