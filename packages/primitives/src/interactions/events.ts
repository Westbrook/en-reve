export interface ChangeDetail<T, Reason extends string = string> {
  readonly previous: T;
  readonly proposed: T;
  readonly reason: Reason;
}

export type ChangeOutcome = 'committed' | 'unchanged' | 'canceled' | 'superseded';

export interface ChangeTransaction<T, Reason extends string = string> extends ChangeDetail<T, Reason> {
  /** Changes on every authoritative author write, including an equal-value write. */
  getRevision: () => number;
  /** Expose provisional model and form state; defer draft, focus and group effects. */
  stage: (proposed: T) => void;
  /** Restore the captured state without calling an author setter or changing its revision. */
  rollback: (previous: T) => void;
  /** Pure validation of constraints that listeners may have changed. */
  canCommit?: (proposed: T) => boolean;
  /** Apply deferred effects after acceptance. Must not repeat staging through an author setter. */
  commit?: (proposed: T) => void;
}

export type ChangeEvent<T, Reason extends string = string> = CustomEvent<ChangeDetail<T, Reason>>;

interface TransactionFrame {
  readonly authorRevision: number;
  readonly acceptedEpoch: number;
}

interface TargetTransactions {
  acceptedEpoch: number;
  readonly frames: TransactionFrame[];
}

// Only live dispatch stacks need an epoch. Weak keys also avoid retaining hosts.
const transactions = new WeakMap<EventTarget, TargetTransactions>();

function customEvent<T>(target: EventTarget, name: string, detail: T, cancelable: boolean): CustomEvent<T> {
  // Use the target document's realm when dispatching into another document or an iframe.
  const view = (target as EventTarget & { ownerDocument?: Document }).ownerDocument?.defaultView;
  const Constructor = view?.CustomEvent ?? globalThis.CustomEvent;
  return new Constructor(name, { detail, bubbles: true, composed: true, cancelable });
}

/**
 * Dispatch one tentative, cancelable semantic change. Native editing is a separate transaction.
 * Author writes and accepted nested transactions win over an older default or rollback.
 * extraDetail supplies compatibility fields; it cannot override previous/proposed/reason.
 */
export function dispatchChange<T, Reason extends string = string>(target: EventTarget, change: ChangeTransaction<T, Reason>, options: { eventName?: string; extraDetail?: Readonly<Record<string, unknown>> } = {}): ChangeOutcome {
  if (Object.is(change.previous, change.proposed)) return 'unchanged';

  const detail = Object.freeze({ ...options.extraDetail, previous: change.previous, proposed: change.proposed, reason: change.reason });
  const event = customEvent(target, options.eventName ?? 'en-change', detail, true);
  const frame: TransactionFrame = {
    authorRevision: change.getRevision(),
    acceptedEpoch: transactions.get(target)?.acceptedEpoch ?? 0,
  };
  let context = transactions.get(target);
  if (!context) {
    context = { acceptedEpoch: 0, frames: [] };
    transactions.set(target, context);
  }
  const state = context;
  state.frames.push(frame);
  let settled = false;
  const stillOwnsStage = (): boolean =>
    state.frames[state.frames.length - 1] === frame &&
    change.getRevision() === frame.authorRevision &&
    state.acceptedEpoch === frame.acceptedEpoch;
  const rollback = (): void => {
    // Mark first: a throwing rollback must not be invoked a second time by catch.
    settled = true;
    change.rollback(change.previous);
  };

  try {
    change.stage(change.proposed);
    if (!stillOwnsStage()) { settled = true; return 'superseded'; }

    const allowed = target.dispatchEvent(event);
    if (!stillOwnsStage()) { settled = true; return 'superseded'; }
    if (!allowed) { rollback(); return 'canceled'; }

    const valid = change.canCommit?.(change.proposed) ?? true;
    if (!valid) event.preventDefault();
    if (!stillOwnsStage()) { settled = true; return 'superseded'; }
    if (!valid) { rollback(); return 'canceled'; }

    // Acceptance is the boundary before deferred effects. It supersedes any outer
    // transaction even when there is no commit callback, or a deferred effect throws.
    state.acceptedEpoch += 1;
    const acceptedEpoch = state.acceptedEpoch;
    settled = true;
    change.commit?.(change.proposed);
    if (change.getRevision() !== frame.authorRevision || state.acceptedEpoch !== acceptedEpoch) return 'superseded';
    return 'committed';
  } catch (error) {
    if (!settled && stillOwnsStage()) {
      try { rollback(); }
      catch (rollbackError) {
        throw new AggregateError([error, rollbackError], 'Change transaction and its rollback both failed.');
      }
    }
    throw error;
  } finally {
    state.frames.pop();
    if (state.frames.length === 0) transactions.delete(target);
  }
}

export interface ActionDetail<Action extends string, Data = undefined> {
  readonly action: Action;
  readonly data: Data;
}

/** Returns false only when a cancelable action was canceled; does not imply application completion. */
export function dispatchAction<Action extends string, Data = undefined>(target: EventTarget, detail: ActionDetail<Action, Data>, { cancelable = false }: { cancelable?: boolean } = {}): boolean {
  return target.dispatchEvent(customEvent(target, 'en-action', Object.freeze({ ...detail }), cancelable));
}

export interface DraftInputDetail {
  readonly value: string;
  readonly isComposing: boolean;
  readonly inputType: string;
}

export function dispatchDraftInput(target: EventTarget, detail: DraftInputDetail): void {
  target.dispatchEvent(customEvent(target, 'en-input', Object.freeze({ ...detail }), false));
}

/** A page proposal, exposed tentatively during synchronous dispatch. */
export type PageChangeEvent = ChangeEvent<number, 'pagination'>;
export type LoadStatus = 'idle' | 'loading' | 'loaded' | 'empty' | 'error';
export interface LoadStateDetail {
  readonly status: LoadStatus;
  readonly requestId: number;
}
export type LoadStateChangeEvent<Detail extends LoadStateDetail = LoadStateDetail> = CustomEvent<Detail>;

/** Report an already-applied state; this notification cannot veto it. */
export function dispatchNotification<T extends object>(target: EventTarget, name: string, detail: T): void {
  target.dispatchEvent(customEvent(target, name, Object.freeze({ ...detail }), false));
}
