import { isDeepStrictEqual } from 'node:util';
/** Document-scoped acknowledgement; registration precedes navigation. No historical samples are reused. */
export function validLifecycleReceipt(payload, snapshot) {
  return payload && payload.protocol === 'ack-v1' && payload.terminal === true && payload.documentId === snapshot.documentId && payload.visibility === 'hidden' &&
    Number.isFinite(payload.timestamp) && payload.timestamp >= snapshot.timestamp &&
    payload.vitals && typeof payload.vitals === 'object' && !Array.isArray(payload.vitals) &&
    payload.milestones && typeof payload.milestones === 'object' && !Array.isArray(payload.milestones) &&
    Object.entries(payload.vitals).every(([key, metric]) => metric && metric.name === key && Number.isFinite(metric.value) && Number.isFinite(metric.delta) && typeof metric.id === 'string' && metric.id.length > 0) &&
    Object.keys(snapshot.vitals).every(key => Object.hasOwn(payload.vitals, key)) &&
    Object.entries(snapshot.milestones).every(([key, value]) => Object.hasOwn(payload.milestones, key) && isDeepStrictEqual(payload.milestones[key], value));
}
export class LifecycleReceipts {
  #waiters = new Map();
  expect(snapshot, timeoutMs = 5000) {
    snapshot = structuredClone(snapshot);
    const id = snapshot.documentId;
    if (!id || this.#waiters.has(id)) throw new Error('Missing or duplicate lifecycle document expectation');
    let cancel, settled = false;
    const promise = new Promise((resolve, reject) => {
      const clear = () => { if(settled)return false; settled=true; clearTimeout(timer); this.#waiters.delete(id); return true; };
      const timer = setTimeout(() => { clear(); reject(new Error(`Missing valid lifecycle receipt for ${id}`)); }, timeoutMs);
      cancel = () => { if(!clear())return; reject(new Error(`Lifecycle navigation canceled for ${id}`)); };
      this.#waiters.set(id, payload => {
        if (!validLifecycleReceipt(payload, snapshot)) return false;
        clear(); resolve(structuredClone(payload)); return true;
      });
    });
    // Attach immediately so a timeout during an awaited navigation cannot become unhandled.
    promise.catch(() => {});
    return { promise, cancel: () => cancel() };
  }
  deliver(payload) { return this.#waiters.get(payload?.documentId)?.(payload) ?? false; }
  get pending() { return this.#waiters.size; }
}
export const lifecycleReceipts = new LifecycleReceipts();
