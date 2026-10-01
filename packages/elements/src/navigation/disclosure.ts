import { dispatchChange, dispatchNotification, type ChangeEvent, type ChangeOutcome } from '@en-reve/primitives/interactions/events.js';
import type { ReactiveElement } from 'lit';

export type DisclosureReason = 'toggle' | 'escape' | 'api';
export type DisclosureChangeEvent = ChangeEvent<boolean, DisclosureReason>;
/** Terminal state notification; never a cancelable proposal or presentation-complete signal. */
export type DisclosureToggleEvent = CustomEvent<{ readonly open: boolean }>;
export interface DisclosureEventMap {
  'en-change': DisclosureChangeEvent;
  'en-toggle': DisclosureToggleEvent;
}

/** Preserve authoritative writes and native pre-upgrade details behavior. */
export class NavigationDisclosure {
  value = false;
  private revision = 0;
  constructor(private host: HTMLElement & Pick<ReactiveElement, 'requestUpdate'>) {}
  write(value: boolean): void {
    const previous = this.value;
    this.value = value; this.revision++;
    this.host.requestUpdate('open', previous);
  }
  propose(value: boolean, reason: DisclosureReason): ChangeOutcome {
    const previous = this.value;
    return dispatchChange(this.host, {
      previous, proposed: value, reason, getRevision: () => this.revision,
      stage: value => { this.value = value; }, rollback: value => { this.value = value; },
      commit: () => { this.host.requestUpdate('open', previous); this.notify(); },
    });
  }
  notify(): void { dispatchNotification(this.host, 'en-toggle', { open: this.value }); }
}
