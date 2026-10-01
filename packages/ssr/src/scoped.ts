import type {DeliveryIdentity} from '@en-reve/elements/delivery.js';
import {snapshotDeliveryIdentity} from './delivery-identity.js';
import { Worker } from 'node:worker_threads';
import type { ElementDefinition } from '@en-reve/primitives/interactions/registration.js';

/** Trusted application module. Import class-only definitions, never browser define entries. */
export interface ScopedRenderModule<Snapshot = unknown> {
  readonly version: string;
  readonly delivery?: DeliveryIdentity;
  readonly definitions: readonly ElementDefinition[];
  template(snapshot: Snapshot): unknown | Promise<unknown>;
}
export interface ScopedRenderEntry { readonly module: URL; readonly version: string; readonly delivery?: DeliveryIdentity; }
export interface ScopedRenderRequest { readonly key: string; readonly snapshot: unknown; }
export interface ScopedRenderResult {
  readonly html: string;
  readonly key: string;
  readonly version: string;
  readonly delivery?: DeliveryIdentity;
  readonly tags: readonly string[];
}
export interface ScopedRenderer {
  render(request: ScopedRenderRequest, options?: { signal?: AbortSignal }): Promise<ScopedRenderResult>;
  dispose(): void;
}

/**
 * Request-local Node render realms. Lit 4.1 caches constructors in template ops
 * and its renderers read a global registry. A fresh worker confines both to one
 * request without replacing or mutating the calling process's registry.
 * Worker startup is a server cost; this opt-in path makes no throughput claim.
 */
export function createScopedRenderer(entries: Readonly<Record<string, ScopedRenderEntry>>, options: {
  concurrency?: number; maxPending?: number; timeoutMs?: number;
} = {}): ScopedRenderer {
  const concurrency = options.concurrency ?? 2, maxPending = options.maxPending ?? 32, timeoutMs = options.timeoutMs ?? 30_000;
  if (![concurrency, maxPending, timeoutMs].every(n => Number.isSafeInteger(n) && n > 0)) throw new Error('Scoped renderer limits must be positive integers.');
  const allowlist = new Map(Object.entries(entries).map(([key, entry]) => {
    if (!key || !entry.version || entry.module.protocol !== 'file:') throw new Error('Scoped render entries require a key, version and trusted file URL.');
    return [key, { module: entry.module.href, version: entry.version, delivery: snapshotDeliveryIdentity(entry.delivery) }] as const;
  }));
  type Job = { start(): void; cancel(): void };
  const queue: Job[] = [], active = new Set<Job>();
  let disposed = false;
  const pump = () => { while (!disposed && active.size < concurrency && queue.length) { const job = queue.shift()!; active.add(job); job.start(); } };
  return {
    render(request, { signal } = {}) {
      if (disposed) return Promise.reject(new Error('Scoped renderer is disposed.'));
      const key = request.key, entry = allowlist.get(key);
      if (!entry) return Promise.reject(new Error(`Unknown scoped render key: ${request.key}`));
      if (signal?.aborted) return Promise.reject(new DOMException('Render canceled', 'AbortError'));
      if (active.size >= concurrency && queue.length >= maxPending) return Promise.reject(new Error('Scoped render queue is full.'));
      // Snapshot at submission, not after waiting in the queue.
      let snapshot: unknown;
      try { snapshot = structuredClone(request.snapshot); } catch (error) { return Promise.reject(error); }
      return new Promise<ScopedRenderResult>((resolve, reject) => {
        let worker: Worker | undefined, timer: ReturnType<typeof setTimeout> | undefined, done = false;
        const finish = (error?: unknown, result?: ScopedRenderResult) => {
          if (done) return; done = true;
          clearTimeout(timer); signal?.removeEventListener('abort', job.cancel);
          const index = queue.indexOf(job); if (index >= 0) queue.splice(index, 1);
          // Hold the concurrency slot until the realm actually exits.
          const released = worker ? worker.terminate() : Promise.resolve();
          const release = () => { active.delete(job); pump(); };
          void released.then(release, release);
          if (error !== undefined) reject(error); else resolve(result!);
        };
        const job: Job = {
          cancel: () => finish(new DOMException('Render canceled', 'AbortError')),
          start() {
            try {
              worker = new Worker(new URL('./scoped-worker.js', import.meta.url), { workerData: { ...entry, key, snapshot } });
              worker.once('message', message => {
                if (message.error) finish(new Error(message.error)); else finish(undefined, message.result);
              });
              worker.once('error', error => finish(error));
              worker.once('exit', code => { if (!done) finish(new Error(`Scoped render worker exited before producing HTML (${code}).`)); });
            } catch (error) { finish(error); }
          },
        };
        signal?.addEventListener('abort', job.cancel, { once: true });
        timer = setTimeout(() => finish(new Error('Scoped rendering timed out.')), timeoutMs);
        queue.push(job); pump();
      });
    },
    dispose() { if (disposed) return; disposed = true; for (const job of [...queue, ...active]) job.cancel(); },
  };
}

export { serializeHydrationManifest } from './hydration-manifest.js';
export type { HydrationManifest } from './hydration-manifest.js';
export { renderIslandMarkup } from './island-markup.js';
