import { createFixtureScheduler, type FixtureDelivery } from '../shared/fixture-scheduler.js';
import { failure, success, type Result } from '../shared/result.js';
import { copySettings, copySnapshot, initialSettings, type CreativeSettings, type SettingsSnapshot } from './model.js';

export type SaveProblem = { readonly kind: 'unavailable' } | { readonly kind: 'conflict'; readonly incoming: SettingsSnapshot };

/** A deterministic, instance-local stand-in for persistence and incoming collaboration. */
export function createSettingsService() {
  const scheduler = createFixtureScheduler();
  let current: SettingsSnapshot = { revision: 1, settings: copySettings(initialSettings) };
  let generation = 0;
  return {
    get pending() { return scheduler.pending; },
    release: (id?: number) => scheduler.release(id),
    save(settings: CreativeSettings, baseRevision: number, options: {
      signal: AbortSignal; delivery: FixtureDelivery; fail: boolean;
    }): Promise<Result<SettingsSnapshot, SaveProblem>> {
      const requestGeneration = generation;
      const snapshot = copySettings(settings);
      return scheduler.respond<Result<SettingsSnapshot, SaveProblem>>(() => {
        if (requestGeneration !== generation) throw new Error('Settings request superseded.');
        if (options.fail) return failure({ kind: 'unavailable' });
        if (current.revision !== baseRevision) return failure({ kind: 'conflict', incoming: copySnapshot(current) });
        // Only simulated service state changes here. UI application remains guarded by its request lane.
        current = { revision: baseRevision + 1, settings: snapshot };
        return success(copySnapshot(current));
      }, { action: 'settings-save', signal: options.signal, delivery: options.delivery });
    },
    incoming(signal: AbortSignal, delivery: FixtureDelivery): Promise<SettingsSnapshot> {
      const requestGeneration = generation;
      return scheduler.respond(() => {
        if (requestGeneration !== generation) throw new Error('Incoming settings superseded.');
        current = { revision: current.revision + 1, settings: { ...current.settings, opacity: 82 } };
        return copySnapshot(current);
      }, { action: 'settings-incoming', signal, delivery });
    },
    reset() { ++generation; scheduler.reset(); current = { revision: 1, settings: copySettings(initialSettings) }; },
    dispose() { ++generation; scheduler.dispose(); },
  };
}
