import { referenceRoot } from './id-reference.js';
export type AssociatedTrigger = HTMLElement & { disabled?: boolean; loading?: boolean };
/** Read live identity and availability before and after application callbacks. */
export function eligibleOverlayTrigger(host: HTMLElement, id: string, trigger: AssociatedTrigger | null): boolean {
  return !!(host.isConnected && trigger?.isConnected && referenceRoot(host)?.getElementById(id) === trigger
    && !trigger.disabled && !trigger.loading && !trigger.matches(':disabled,[aria-disabled="true"]'));
}
/** Associated buttons own this click's default, including a submit button in a form. */
export function admitOverlayClick(event: MouseEvent | undefined, eligible: boolean): boolean {
  if (event?.defaultPrevented || !eligible) return false;
  event?.preventDefault();
  return true;
}
