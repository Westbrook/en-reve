import { execFile } from 'node:child_process';
import { cpus, loadavg } from 'node:os';
import { basename } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const INTERVAL_MS = 10_000;

export const admissionPolicies = Object.freeze(['legacy-strict', 'active-desktop-v1']);

/** Ambient load is descriptive under active desktop; declared competing work still blocks. */
export function contentionDecision(observation, admissionPolicy = 'legacy-strict') {
  if (!admissionPolicies.includes(admissionPolicy)) throw new TypeError('Unknown contention admission policy');
  const managedOverlap = observation.knownHeavyTaskIds.length > 0 || observation.knownHeavyProcessIds.length > 0;
  const ambientPressure = observation.loadStreak >= 3 || observation.repeatedHighCpuPids.length > 0;
  return { admissionPolicy, managedOverlap, ambientPressure,
    block: managedOverlap || (admissionPolicy === 'legacy-strict' && ambientPressure) };
}

// The caller owns locks, append-only evidence and job aborts. Default preserves historical admission.
export async function createContentionMonitor({ record, onBreach, getKnownHeavyWork, admissionPolicy = 'legacy-strict' }) {
  if (!admissionPolicies.includes(admissionPolicy)) throw new TypeError('Unknown contention admission policy');
  if ([record, onBreach, getKnownHeavyWork].some((fn) => typeof fn !== 'function')) {
    throw new TypeError('record, onBreach and getKnownHeavyWork callbacks are required');
  }
  const logicalCpuCount = cpus().length;
  if (!logicalCpuCount) throw new Error('Logical CPU count is unavailable');
  const abort = new AbortController();
  const state = { admissionPolicy, stopped: false, breach: null, observations: 0, ambientPressureObservations: 0, lastObservation: null };
  let timer, pending, previousStart, loadStreak = 0;
  let cpuStreaks = new Map();

  function breach(reason) {
    if (state.breach) return;
    state.breach = reason;
    clearTimeout(timer);
    // Abort synchronously before evidence I/O; active browser work must stop now.
    abort.abort(reason);
    try {
      Promise.resolve(onBreach(reason)).catch(() => {
        state.breach.handlerFailed = true;
      });
    } catch {
      state.breach.handlerFailed = true;
    }
  }

  async function observe() {
    const started = performance.now();
    const observedAt = new Date().toISOString();
    const elapsedSincePreviousMs = previousStart === undefined ? null : started - previousStart;
    previousStart = started;
    try {
      // This callback must return an explicit current inventory, including empty arrays.
      const known = await getKnownHeavyWork();
      if (!known || !Array.isArray(known.taskIds) || !Array.isArray(known.processIds)
        || known.taskIds.some((id) => typeof id !== 'string' || !id)
        || known.processIds.some((pid) => !Number.isInteger(pid) || pid <= 0)) {
        throw new Error('Invalid coordinator heavy-work inventory');
      }
      const { stdout } = await execFileAsync('/bin/ps', ['-axo', 'pid=,ppid=,pcpu=,comm='], {
        timeout: 5_000, maxBuffer: 4 * 1024 * 1024,
        env: { ...process.env, LC_ALL: 'C' },
      });
      const processes = stdout.trim().split('\n').map((line) => {
        const match = line.trim().match(/^(\d+)\s+(\d+)\s+([\d.]+)\s+(.+)$/);
        if (!match) throw new Error('Unrecognized ps observation');
        const cpuPercent = Number(match[3]);
        if (!Number.isFinite(cpuPercent)) throw new Error('Invalid process CPU observation');
        return { pid: Number(match[1]), ppid: Number(match[2]),
          cpuPercent, commandName: basename(match[4]) };
      });
      if (!processes.some(({ pid }) => pid === process.pid)) {
        throw new Error('Current runner is absent from process inventory');
      }
      const owned = new Set([process.pid]);
      let size;
      do {
        size = owned.size;
        for (const row of processes) if (owned.has(row.ppid)) owned.add(row.pid);
      } while (owned.size !== size);
      const load1 = loadavg()[0];
      if (!Number.isFinite(load1)) throw new Error('Host load is unavailable');
      loadStreak = load1 > logicalCpuCount ? loadStreak + 1 : 0;
      const nextStreaks = new Map();
      const repeatedHighCpuPids = [];
      for (const row of processes) {
        if (owned.has(row.pid) || row.cpuPercent < 50) continue;
        const key = JSON.stringify([row.pid, row.ppid, row.commandName]);
        const count = (cpuStreaks.get(key) ?? 0) + 1;
        nextStreaks.set(key, count);
        if (count >= 3) repeatedHighCpuPids.push(row.pid);
      }
      cpuStreaks = nextStreaks;
      const present = new Set(processes.map(({ pid }) => pid));
      const knownHeavyProcessIds = known.processIds.filter((pid) => present.has(pid));
      const observation = { type: 'contention-observation', observedAt,
        elapsedSincePreviousMs, sampleDurationMs: performance.now() - started,
        logicalCpuCount, load1, loadStreak, runnerPid: process.pid,
        ownedProcessIds: [...owned], processes,
        knownHeavyTaskIds: [...known.taskIds], declaredHeavyProcessIds: [...known.processIds],
        knownHeavyProcessIds, repeatedHighCpuPids };
      observation.admission = contentionDecision(observation, admissionPolicy);
      state.observations++;
      if (observation.admission.ambientPressure) state.ambientPressureObservations++;
      state.lastObservation = observation;
      if (observation.admission.block) {
        breach({ type: 'contention-breach', observedAt, admissionPolicy,
          knownHeavyTaskIds: [...known.taskIds], knownHeavyProcessIds,
          sustainedHostLoad: loadStreak >= 3, repeatedHighCpuPids });
      }
      await record(observation);
      if (state.breach) await record({ ...state.breach });
    } catch {
      // Do not serialize child-process errors: they may include environment or output.
      breach({ type: 'contention-monitor-error', observedAt });
      try { await record({ type: 'contention-monitor-error', observedAt }); }
      catch { state.breach.recordingFailed = true; }
    }
    if (!state.stopped && !state.breach) {
      timer = setTimeout(() => { pending = observe(); },
        Math.max(0, INTERVAL_MS - (performance.now() - started)));
    }
  }

  pending = observe();
  await pending; // No workload may start before the first observation is recorded.
  return {
    signal: abort.signal,
    snapshot: () => structuredClone(state),
    assertHealthy() {
      if (state.breach || state.stopped) throw new Error('Contention monitor is not healthy');
    },
    async stop() {
      state.stopped = true;
      clearTimeout(timer);
      await pending;
      return structuredClone(state);
    },
  };
}
