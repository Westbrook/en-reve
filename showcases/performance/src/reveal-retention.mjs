// SOURCE-ONLY PROPOSAL. Retention lane; never import into timed page code.
// The campaign owns fresh Chromium launches, serialization, source/build identity,
// five repetitions per arm/workload, and durable recording of failed runs.
import assert from 'node:assert/strict';
import {check, assertOwned, assertDisposalScalar, assertDisposalStimulus} from './reveal-retention-evidence.mjs';
import {installRevealListenerTracker} from './reveal-listener-tracker.mjs';
import {retentionAcceptance, retentionDisposalCase, OBSERVED_DOCUMENT_MOTION, documentMotionDiagnostic} from './reveal-retention-acceptance.mjs';

export const revealRetentionProtocol = Object.freeze({
  version: '3', browser: 'chromium', repetitionsPerArmWorkload: 5,
  checkpoints: Object.freeze([0, 10, 50, 100]),
  cases: Object.freeze(['completion', 'supersession', 'trusted-interruption', 'active-removal']),
  cycleMeaning: 'One fresh host lifetime; balanced rotation gives 25 lifetimes per case after 100 cycles.',
  stableFrames: 12, timeoutMs: 8000, alignmentTolerancePx: 2,
  stableGeometryTolerancePx: 0.5, maximumMountedRows: 64,
  postDisposalFrames: 12, wheelDeltaY: 160, wheelWaitMs: Object.freeze([600, 300]),
  wheelAnchorFrames: 12, wheelAnchorFinalFrames: 6, wheelDriftTolerancePx: 2,
  targets: Object.freeze({activity: Object.freeze({normal: 'history-119', far: 'history-79'}), document: Object.freeze({normal: 'row-150', far: 'row-350'})}),
});
const inputTypes = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
const inputProbeKey = '__revealRetentionInput';

function sameCounts(actual, expected) {
  return inputTypes.every(type => actual.captureInput[type] === expected.captureInput[type]);
}
function scalarFailure(error) {
  return {message: String(error?.message ?? error), stack: String(error?.stack ?? ''), detail: error?.detail ?? null, requiresBrowserClose: error?.requiresBrowserClose === true};
}
async function boundedOperation(promise, operation) {
  let timer;
  try {
    return await Promise.race([promise, new Promise((_, reject) => {
      timer = setTimeout(() => reject(Object.assign(new Error(`Retention operation timed out: ${operation}`),
        {requiresBrowserClose: true, detail: {operation, timeoutMs: revealRetentionProtocol.timeoutMs}})), revealRetentionProtocol.timeoutMs);
    })]);
  } finally { clearTimeout(timer); }
}

// CDP returns handler RemoteObjects. Flatten only scalar descriptors, explicitly
// release every returned handle, then release the root object group before GC.
// Filter by the document backend id so descendants cannot masquerade as owners.
export async function readDocumentListeners(cdp) {
  const objectGroup = `reveal-retention-listeners-${Math.random().toString(36).slice(2)}`;
  const handles = new Set();
  let output, failure;
  try {
    const evaluated = await cdp.send('Runtime.evaluate', {expression: 'document', objectGroup, returnByValue: false});
    check(!evaluated.exceptionDetails && evaluated.result?.objectId, 'Cannot inspect document event listeners', evaluated.exceptionDetails);
    const objectId = evaluated.result.objectId; handles.add(objectId);
    const described = await cdp.send('DOM.describeNode', {objectId, depth: 0});
    const backendNodeId = described.node?.backendNodeId;
    check(Number.isInteger(backendNodeId), 'Document backend id is unavailable');
    const response = await cdp.send('DOMDebugger.getEventListeners', {objectId, depth: 1, pierce: false});
    for (const listener of response.listeners) {
      for (const field of ['handler', 'originalHandler']) if (listener[field]?.objectId) handles.add(listener[field].objectId);
    }
    for (const listener of response.listeners) {
      check(Number.isInteger(listener.backendNodeId), 'Listener ownership cannot be established', {type: listener.type});
    }
    const descriptors = response.listeners.filter(listener => listener.backendNodeId === backendNodeId).map(listener => ({
      type: listener.type, capture: listener.useCapture, passive: listener.passive, once: listener.once,
      scriptId: listener.scriptId, lineNumber: listener.lineNumber, columnNumber: listener.columnNumber,
    })).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    output = {
      total: descriptors.length,
      captureInput: Object.fromEntries(inputTypes.map(type => [type, descriptors.filter(listener => listener.type === type && listener.capture).length])),
      descriptors,
    };
  } catch (error) { failure = error; }
  // A timed-out protocol request may still resolve later; do not measure GC or
  // race more page mutations. The owning runner must close this fresh browser.
  if (failure?.requiresBrowserClose) throw failure;
  const releaseErrors = [];
  for (const objectId of handles) {
    try { await cdp.send('Runtime.releaseObject', {objectId}); }
    catch (error) { if (error?.requiresBrowserClose) throw error; releaseErrors.push(String(error)); }
  }
  try { await cdp.send('Runtime.releaseObjectGroup', {objectGroup}); }
  catch (error) { if (error?.requiresBrowserClose) throw error; releaseErrors.push(String(error)); }
  if (releaseErrors.length) throw Object.assign(new Error('CDP handles were not demonstrably released; GC measurement invalid'), {requiresBrowserClose: true, detail: {releaseErrors, precedingFailure: failure && scalarFailure(failure)}});
  if (failure) throw failure;
  return output;
}

// Uses public geometry only. The independent timer cancels the scheduled RAF;
// a stalled page returns a failed observation rather than leaving an RAF loop.
async function observeGeometry(page, {key, aligned, timeoutMs = 8000}) {
  return page.evaluate(({key, aligned, timeoutMs, protocol}) => new Promise(resolve => {
    let frame = 0, timer = 0, finished = false, anchor, stable = 0, observations = 0;
    const geometryNames = ['offset', 'scrollHeight', 'clientHeight', ...(aligned ? ['targetTop', 'targetBottom', 'viewportTop', 'viewportBottom'] : [])];
    const tail = [];
    const end = ok => {
      if (finished) return; finished = true; cancelAnimationFrame(frame); clearTimeout(timer);
      resolve({ok, observations, stableFrames: stable, tail});
    };
    const tick = () => {
      const state = window.revealFixture.snapshot(key); observations++;
      tail.push(state); if (tail.length > protocol.stableFrames) tail.shift();
      const valid = state.connected && state.liveHosts === 1 && geometryNames.every(name => Number.isFinite(state[name])) && state.clientHeight > 0
        && state.mounted > 0 && state.mounted <= protocol.maximumMountedRows
        && (!aligned || (state.targetKey === key && state.targetExists && state.targetIdentity !== null && state.targetHeight > 0
          && state.targetHeight <= state.viewportBottom - state.viewportTop && state.targetTop < state.viewportBottom && state.targetBottom > state.viewportTop
          && Number.isFinite(state.alignmentError) && Math.abs(state.alignmentError) < protocol.alignmentTolerancePx));
      // Every frame compares with the fixed first point of this candidate
      // window. Pairwise subpixel drift must not accumulate into a passing tail.
      const unchanged = anchor && geometryNames.every(name => Math.abs(state[name] - anchor[name]) < protocol.stableGeometryTolerancePx)
        && state.modelRevision === anchor.modelRevision
        && state.itemCount === anchor.itemCount && (!aligned || state.targetIdentity === anchor.targetIdentity)
        && JSON.stringify(state.interaction) === JSON.stringify(anchor.interaction)
        && JSON.stringify(state.mountedKeys) === JSON.stringify(anchor.mountedKeys);
      if (!valid) { stable = 0; anchor = undefined; }
      else if (unchanged) stable++;
      else { anchor = state; stable = 1; }
      if (stable >= protocol.stableFrames) end(true); else frame = requestAnimationFrame(tick);
    };
    timer = setTimeout(() => end(false), timeoutMs); frame = requestAnimationFrame(tick);
  }), {key, aligned, timeoutMs, protocol: revealRetentionProtocol});
}

async function connectedCleanup(page, cdp, key, aligned, baseline) {
  const deadline = performance.now() + revealRetentionProtocol.timeoutMs;
  const observations = [];
  while (performance.now() < deadline) {
    const geometry = await observeGeometry(page, {key, aligned, timeoutMs: Math.max(1, deadline - performance.now())});
    const listeners = await readDocumentListeners(cdp);
    const owned = await page.evaluate(() => window.__revealRetentionListeners.snapshot());
    assertOwned(owned);
    observations.push({geometry, listeners, owned}); if (observations.length > 16) observations.shift();
    if (geometry.ok && sameCounts(listeners, baseline) && inputTypes.every(type => owned.counts[type] === 0)) return {geometry, listeners, owned};
    if (!geometry.ok) break;
  }
  throw Object.assign(new Error('Connected host did not settle with document input listeners restored to its baseline'), {detail: {key, aligned, baseline, observations}});
}

// Browser-only retention instrumentation. No private controller or Lit fields.
// The counter factory has no host argument/reference; only its scalar reader
// survives disconnect. Temporary viewport/content references are cleared in the
// synchronous removal callback, before any post-disposal animation frame.
function installRetentionLifecycle() {
  const fixture = window.revealFixture;
  const tracker = window.__revealRetentionListeners;
  const types = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
  const originalDocumentStyle = {value: document.scrollingElement.style.getPropertyValue('overflow-anchor'), priority: document.scrollingElement.style.getPropertyPriority('overflow-anchor')};
  let readCounter, modelReference, stimulusOwned = false;
  const stimulusId = 'reveal-retention-layout-stimulus';
  const readRevision = () => {
    if (fixture.workload !== 'document') return {status: 'inapplicable'};
    // Synchronous dereference only: no strong model survives this callback.
    const model = modelReference?.deref();
    return model ? {status: 'observed', revision: model.revision.get()} : {status: 'collected'};
  };
  const makeCounter = () => {
    const counts = {updates: 0, disconnects: 0, postDisconnectUpdates: 0};
    return {controller: {
      hostUpdated() { counts.updates++; if (counts.disconnects) counts.postDisconnectUpdates++; },
      hostDisconnected() { counts.disconnects++; },
    }, read: () => ({...counts})};
  };
  const ownActive = value => !value.dropped && value.errors.length === 0 && types.every(type => value.counts[type] === 1 && value.maxCounts[type] <= 1);
  const activeBoundary = (key, startOffset) => {
    const state = fixture.snapshot(key), owned = tracker.snapshot();
    const exists = fixture.publicRecords().some(record => record.key === key);
    // A null rectangle means an unmounted target, never completed alignment.
    const notReached = state.alignmentError === null || Math.abs(state.alignmentError) >= 2;
    return {ok: state.connected && state.liveHosts === 1 && exists && notReached && ownActive(owned) && Math.abs(state.offset - startOffset) > 1, state, owned, exists, notReached};
  };
  const anchor = () => {
    const state = fixture.snapshot(), host = fixture.publicHost();
    const row = Array.from(host.shadowRoot.querySelectorAll('[data-en-virtual-key]')).find(row => {
      const rect = row.getBoundingClientRect(); return rect.bottom > state.viewportTop && rect.top < state.viewportBottom;
    });
    return {key: row?.getAttribute('data-en-virtual-key') ?? null, inset: row ? row.getBoundingClientRect().top - state.viewportTop : null, offset: state.offset, state};
  };
  const api = {
    activeBoundary, anchor,
    beforeMount() {
      tracker.resetCycle();
      if (fixture.workload === 'document') document.scrollingElement.style.setProperty('overflow-anchor', 'auto', 'important');
    },
    observeHost() {
      const pair = makeCounter(); fixture.publicHost().addController(pair.controller); readCounter = pair.read;
      if (fixture.workload === 'document') modelReference = new WeakRef(fixture.publicHost().model);
      const port = fixture.publicViewport(), content = fixture.publicContent();
      return {ownedOverflow: {value: port.style.getPropertyValue('overflow-anchor'), priority: port.style.getPropertyPriority('overflow-anchor')},
        contentTabindex: content.getAttribute('tabindex'), viewportTabindex: port.getAttribute('tabindex'), counter: readCounter(), publicRevision: readRevision()};
    },
    supersede(farKey, targetKey, startOffset) {
      const boundary = activeBoundary(farKey, startOffset);
      return {ok: boundary.ok && fixture.request(targetKey, 'instant'), boundary};
    },
    async dispose(active) {
      const boundary = active ? activeBoundary(active.key, active.startOffset) : null;
      if (boundary && !boundary.ok) return {ok: false, boundary};
      let viewport = fixture.publicViewport(), content = fixture.publicContent();
      const before = {value: viewport.style.getPropertyValue('overflow-anchor'), priority: viewport.style.getPropertyPriority('overflow-anchor'), contentTabindex: content.getAttribute('tabindex'), viewportTabindex: viewport.getAttribute('tabindex')};
      const expected = {value: fixture.workload === 'document' ? 'auto' : '', priority: fixture.workload === 'document' ? 'important' : '', contentTabindex: null, viewportTabindex: before.viewportTabindex};
      let restoration, atRemoval, revisionAtRemoval, tail, stimulusBeforeStyle;
      await fixture.dispose({afterRemove() {
        restoration = {value: viewport.style.getPropertyValue('overflow-anchor'), priority: viewport.style.getPropertyPriority('overflow-anchor'), contentTabindex: content.getAttribute('tabindex'), viewportTabindex: viewport.getAttribute('tabindex')};
        viewport = undefined; content = undefined;
        atRemoval = readCounter();
        revisionAtRemoval = readRevision();
        if (fixture.workload === 'document') {
          if (document.getElementById(stimulusId)) throw new Error('Retention layout stimulus id is already occupied');
          // #before belonged to the removed fixture. This new native live node
          // is an explicit post-disposal stimulus, never a retained old subtree.
          const stimulus = document.createElement('div');
          stimulus.id = stimulusId; stimulus.setAttribute('aria-hidden', 'true');
          stimulus.style.height = '1800px'; document.body.prepend(stimulus); stimulusOwned = true;
          const style = document.scrollingElement.style;
          stimulusBeforeStyle = {value: style.getPropertyValue('overflow-anchor'), priority: style.getPropertyPriority('overflow-anchor')};
          style.setProperty('overflow-anchor', 'none'); window.scrollTo({top: 0, behavior: 'instant'});
        }
        tail = new Promise(resolve => {
          const frames = [];
          const observe = () => {
            frames.push({counter: readCounter(), state: fixture.snapshot(), owned: tracker.snapshot(), publicRevision: readRevision(), documentOffset: window.scrollY});
            if (frames.length === 12) resolve(frames); else requestAnimationFrame(observe);
          };
          requestAnimationFrame(observe);
        });
      }});
      const frames = await tail;
      readCounter = undefined; modelReference = undefined;
      let stimulusRestoration = null;
      if (fixture.workload === 'document') {
        document.getElementById(stimulusId)?.remove(); stimulusOwned = false;
        const style = document.scrollingElement.style;
        if (stimulusBeforeStyle.value) style.setProperty('overflow-anchor', stimulusBeforeStyle.value, stimulusBeforeStyle.priority);
        else style.removeProperty('overflow-anchor');
        stimulusRestoration = {expectedStyle: stimulusBeforeStyle, actualStyle: {value: style.getPropertyValue('overflow-anchor'), priority: style.getPropertyPriority('overflow-anchor')}, removed: document.getElementById(stimulusId) === null};
      }
      const publicRevisionCoverage = fixture.workload !== 'document' ? 'inapplicable'
        : frames.every(frame => frame.publicRevision.status === 'observed') ? 'complete-twelve-observed' : 'partial-collected';
      return {ok: true, boundary, before, expected, restoration, atRemoval, revisionAtRemoval, publicRevisionCoverage, frames,
        layoutStimulus: fixture.workload === 'document' ? {kind: 'fresh-native-spacer-after-real-disposal', heightPx: 1800, scrollTarget: 0, description: 'New disposal counterpart; the unchanged connected-host document regression remains separately required.', restoration: stimulusRestoration} : null};
    },
    clear() {
      readCounter = undefined; modelReference = undefined;
      if (stimulusOwned) { document.getElementById(stimulusId)?.remove(); stimulusOwned = false; }
      const {value, priority} = originalDocumentStyle;
      if (value) document.scrollingElement.style.setProperty('overflow-anchor', value, priority);
      else document.scrollingElement.style.removeProperty('overflow-anchor');
      delete window.__revealRetentionLifecycle;
    },
  };
  window.__revealRetentionLifecycle = api;
}

async function beginActive(page, cdp, key, baseline) {
  const before = await page.evaluate(() => window.revealFixture.snapshot());
  check(await page.evaluate(key => window.revealFixture.request(key, 'smooth'), key), 'Smooth reveal was rejected', {key, before});
  const deadline = performance.now() + revealRetentionProtocol.timeoutMs;
  const observations = [];
  while (performance.now() < deadline) {
    // Independently bounded one-frame observation, not a private state probe.
    const state = await page.evaluate(timeoutMs => new Promise(resolve => {
      let raf = 0;
      const timer = setTimeout(() => { cancelAnimationFrame(raf); resolve(null); }, timeoutMs);
      raf = requestAnimationFrame(() => { clearTimeout(timer); resolve(window.revealFixture.snapshot()); });
    }), Math.max(1, deadline - performance.now()));
    check(state, 'No animation frame arrived inside the active-motion observation budget', {key, observations});
    const listeners = await readDocumentListeners(cdp);
    const owned = await page.evaluate(() => window.__revealRetentionListeners.snapshot());
    check(!owned.dropped && owned.errors.length === 0 && inputTypes.every(type => owned.maxCounts[type] <= 1), 'Invalid listener ownership evidence during motion', owned);
    const evidence = {state, listeners, owned}; observations.push(evidence); if (observations.length > 16) observations.shift();
    if (state.connected && state.liveHosts === 1 && Math.abs(state.offset - before.offset) > 1
      && inputTypes.every(type => listeners.captureInput[type] === baseline.captureInput[type] + 1 && owned.counts[type] === 1)) return {before, ...evidence};
  }
  throw Object.assign(new Error('Active smooth motion and its four document capture listeners were not observed together'), {detail: {key, baseline, observations}});
}

async function clearInputProbe(page) {
  await page.evaluate(name => { window[name]?.cleanup?.(); delete window[name]; }, inputProbeKey);
}
async function installInputProbe(page, key) {
  await page.evaluate(({name, key}) => {
    if (window[name]) throw new Error('Stale retention input probe');
    const startOffset = window.revealFixture.snapshot().offset;
    const probe = {event: null, cleanup: undefined};
    const listener = event => {
      const boundary = window.__revealRetentionLifecycle.activeBoundary(key, startOffset);
      probe.event = {type: event.type, deltaX: event.deltaX, deltaY: event.deltaY, deltaMode: event.deltaMode, isTrusted: event.isTrusted, now: performance.now(), boundary};
      probe.cleanup();
    };
    window.__revealRetentionListeners.markObserver(listener);
    probe.cleanup = () => document.removeEventListener('wheel', listener, true);
    window[name] = probe;
    document.addEventListener('wheel', listener, {capture: true, passive: true});
  }, {name: inputProbeKey, key});
}
async function trustedWheel(page, workload) {
  let input, failure;
  try {
    await page.mouse.wheel(0, revealRetentionProtocol.wheelDeltaY);
    input = await page.evaluate(name => new Promise(resolve => {
      const deadline = performance.now() + 8000;
      const poll = () => {
        const event = window[name]?.event;
        if (event || performance.now() >= deadline) resolve(event ?? null); else setTimeout(poll, 10);
      };
      poll();
    }), inputProbeKey);
    check(input?.isTrusted === true && input.type === 'wheel' && input.deltaY === revealRetentionProtocol.wheelDeltaY && input.deltaX === 0 && input.deltaMode === 0, 'Expected trusted pixel wheel input was not observed', input);
    check(input.boundary.ok === true, 'Wheel missed the owned active-motion boundary', input);
  } catch (error) { failure = error; }
  if (failure?.requiresBrowserClose) throw failure;
  try { await clearInputProbe(page); }
  catch (error) {
    error.detail = {cleanupFailure: error.detail ?? null, precedingFailure: failure && scalarFailure(failure)};
    throw error;
  }
  if (failure) throw failure;
  // Preserve the existing document-wheel 600ms / 300ms offset contract. Wheel
  // intentionally scrolls, so do not compare its result to the pre-input anchor.
  const stability = await page.evaluate(async () => {
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    await wait(600); const first = window.__revealRetentionLifecycle.anchor();
    await wait(300); const second = window.__revealRetentionLifecycle.anchor();
    const frames = [];
    for (let index = 0; index < 12; index++) {
      await new Promise(resolve => requestAnimationFrame(resolve));
      frames.push(window.__revealRetentionLifecycle.anchor());
    }
    return {first, second, frames};
  });
  check(stability.first.key && Number.isFinite(stability.first.inset), 'No visible post-wheel anchor', stability);
  check(Math.abs(stability.second.offset - stability.first.offset) < 2, 'Wheel-owned scroll position drifted after the existing settling interval', stability);
  if (workload === 'document') check(stability.first.offset < 16000 && stability.second.offset < 16000, 'The old distant document reveal continued after wheel interruption', stability);
  for (const frame of stability.frames.slice(-6)) {
    check(frame.key === stability.first.key && Math.abs(frame.inset - stability.first.inset) < 2 && Math.abs(frame.offset - stability.first.offset) < 2,
      'Settled post-wheel visible anchor was not preserved', {first: stability.first, frame, stability});
  }
  return {input, stability};
}

// Observation happens in the same JavaScript task as the action. Reject a late
// action that reached the smooth destination while CDP evidence was in transit.
// This is a public geometry precondition, not a claim to see private phases.
async function actBeforeDestination(page, farKey, targetKey, kind, startOffset) {
  return page.evaluate(({farKey, targetKey, kind, startOffset}) => kind === 'supersession'
    ? window.__revealRetentionLifecycle.supersede(farKey, targetKey, startOffset)
    : window.__revealRetentionLifecycle.dispose({key: farKey, startOffset}), {farKey, targetKey, kind, startOffset});
}

async function afterDisposal(page, cdp, coldBaseline, disposal, rememberDisposal, selectedAcceptance, rememberMotion, disposalCase) {
  const acceptance = retentionAcceptance(selectedAcceptance);
  if (acceptance.id === OBSERVED_DOCUMENT_MOTION) retentionDisposalCase(disposalCase);
  let documentMotion;
  disposal ??= await page.evaluate(() => window.__revealRetentionLifecycle.dispose());
  // Retain scalar first-removal evidence in Node before any assertion fails.
  // Never keep an additional browser host/model reference for cleanup.
  rememberDisposal?.(disposal);
  const documentRevision = assertDisposalScalar(disposal);
  if (acceptance.id === OBSERVED_DOCUMENT_MOTION) {
    documentMotion = documentMotionDiagnostic(disposal, acceptance, disposalCase); rememberMotion?.(documentMotion);
  }
  if (documentRevision) {
    if ((acceptance.id !== OBSERVED_DOCUMENT_MOTION || disposalCase !== 'active-removal')) check(disposal.frames.at(-1).documentOffset === 0, 'Document moved after the post-disposal author scroll/layout stimulus', disposal);
    assertDisposalStimulus(disposal, documentRevision);
  }
  const state = await page.evaluate(() => window.revealFixture.snapshot());
  check(state.connected === false && state.liveHosts === 0, 'Disposal left a live fixture host', state);
  const listeners = await readDocumentListeners(cdp);
  check(coldBaseline, 'No valid initial listener inventory exists for cleanup comparison', {state, listeners});
  check(sameCounts(listeners, coldBaseline), 'Document input listeners remain after host removal', {coldBaseline, listeners, state});
  // The document mode also owns a persistent scroll listener while connected;
  // all document listeners, not just its transient input listeners, must return.
  check(JSON.stringify(listeners.descriptors) === JSON.stringify(coldBaseline.descriptors), 'Document listener inventory changed after host disposal', {coldBaseline, listeners});
  return {state, listeners, disposal, ...(documentMotion ? {documentMotion} : {})};
}

async function forcedGcCheckpoint(page, cdp, cycle, coldBaseline) {
  const state = await page.evaluate(() => window.revealFixture.snapshot());
  check(!state.connected && state.liveHosts === 0, 'GC checkpoint still owns a mounted host', state);
  const listeners = await readDocumentListeners(cdp); // all remote handles released on return
  check(JSON.stringify(listeners.descriptors) === JSON.stringify(coldBaseline.descriptors), 'Document listener inventory differs at GC checkpoint', {listeners, coldBaseline});
  const owned = await page.evaluate(() => window.__revealRetentionListeners.snapshot());
  assertOwned(owned, 0);
  // Retain this scalar trace in Node, then clear only the probe's event log.
  // Otherwise its last lifetime's log would bias post-GC comparisons with zero.
  await page.evaluate(() => window.__revealRetentionListeners.resetCycle());
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 0)));
  await cdp.send('HeapProfiler.collectGarbage');
  await cdp.send('HeapProfiler.collectGarbage');
  const heap = await cdp.send('Runtime.getHeapUsage');
  const dom = await cdp.send('Memory.getDOMCounters');
  check(Number.isFinite(heap.usedSize) && Number.isFinite(heap.totalSize), 'Missing heap counters', heap);
  check(['documents', 'nodes', 'jsEventListeners'].every(name => Number.isFinite(dom[name])), 'Missing DOM counters', dom);
  return {cycle, heap, dom, listeners, owned, state, collection: 'Two forced collections after disposal, released CDP handles, cleared scalar observer log and a task turn; separate retention lane.'};
}

/** Run ONE already-created fresh Chromium page. Caller must retain failures and
 * supply five fresh-browser repetitions per arm/workload; this function does not
 * retry, launch, build, serve, acquire locks, or interpret heap growth as a leak.
 */
async function executeRetention(page, workload, {cdp, checkpoints, qualification, acceptance}) {
  assert.ok(cdp, 'Retention requires Chromium CDP; unsupported is not a pass');
  const sourcePage = page, sourceCdp = cdp;
  page = {
    evaluate: (...args) => boundedOperation(sourcePage.evaluate(...args), 'page.evaluate'),
    mouse: {
      move: (...args) => boundedOperation(sourcePage.mouse.move(...args), 'pointer placement'),
      wheel: (...args) => boundedOperation(sourcePage.mouse.wheel(...args), 'trusted wheel input'),
    },
  };
  cdp = {send: (...args) => boundedOperation(sourceCdp.send(...args), args[0])};
  const result = {status: 'running', kind: qualification ? 'retention-qualification' : 'retention', workload,
    protocol: revealRetentionProtocol, acceptance, requestedCheckpoints: checkpoints, checkpoints: [], cycles: [], completedCycles: 0};
  let coldBaseline, instrumentationInstalled = false, firstDisposal;
  try {
    const identity = await page.evaluate(() => ({ready: window.revealFixture?.ready, workload: window.revealFixture?.workload, targetKey: window.revealFixture?.targetKey, farKey: window.revealFixture?.farKey}));
    check(identity.ready === true && identity.workload === workload, 'Wrong or unready retention fixture', identity);
    check(typeof identity.targetKey === 'string' && typeof identity.farKey === 'string', 'Missing fixture target keys', identity);
    check(identity.targetKey === revealRetentionProtocol.targets[workload]?.normal && identity.farKey === revealRetentionProtocol.targets[workload]?.far, 'Fixture targets differ from the reviewed retention protocol', identity);
    await clearInputProbe(page);
    await page.evaluate(() => window.revealFixture.dispose());
    coldBaseline = await readDocumentListeners(cdp);
    result.coldBaseline = coldBaseline;
    check(inputTypes.every(type => coldBaseline.captureInput[type] === 0), 'Dedicated no-reveal fixture has document capture input listeners after initial disposal; do not absorb them into the baseline', coldBaseline);
    result.trackerStartup = await page.evaluate(installRevealListenerTracker);
    instrumentationInstalled = true;
    await page.evaluate(installRetentionLifecycle);
    for (const checkpoint of checkpoints) {
      while (result.completedCycles < checkpoint) {
        const cycle = result.completedCycles + 1;
        const kind = revealRetentionProtocol.cases[(cycle - 1) % revealRetentionProtocol.cases.length];
        const row = {cycle, kind, status: 'running'}; result.cycles.push(row);
        firstDisposal = undefined;
        try {
          await page.evaluate(() => window.__revealRetentionLifecycle.beforeMount());
          row.mounted = await page.evaluate(() => window.revealFixture.mount());
          check(row.mounted.connected && row.mounted.liveHosts === 1, 'Mount did not produce exactly one host', row.mounted);
          check(row.mounted.itemCount === (workload === 'activity' ? 160 : 500), 'Mounted workload record count differs', row.mounted);
          row.lifecycle = await page.evaluate(() => window.__revealRetentionLifecycle.observeHost());
          check(row.lifecycle.ownedOverflow.value === 'none' && row.lifecycle.ownedOverflow.priority === '' && row.lifecycle.contentTabindex === (workload === 'document' ? '-1' : null), 'Connected overflow-anchor/tabindex ownership differs from source contract', row.lifecycle);
          row.connectedBaseline = await readDocumentListeners(cdp);
          check(sameCounts(row.connectedBaseline, coldBaseline), 'Mount unexpectedly installed document capture input listeners before any reveal', {coldBaseline, connectedBaseline: row.connectedBaseline});
          assertOwned(await page.evaluate(() => window.__revealRetentionListeners.snapshot()), 0);
          if (kind === 'completion') {
            check(await page.evaluate(key => window.revealFixture.request(key, 'instant'), identity.targetKey), 'Instant reveal was rejected');
            row.completed = await connectedCleanup(page, cdp, identity.targetKey, true, row.connectedBaseline);
          } else {
            // Install before request so the capture runs before its document
            // cancellation handler. Remove it before every cleanup comparison.
            if (kind === 'trusted-interruption') {
              // Position before motion begins; moving into the scroller later
              // would consume the active window or deliver the wheel elsewhere.
              row.pointer = await page.evaluate(() => {
                const state = window.revealFixture.snapshot();
                const box = window.revealFixture.publicViewport().getBoundingClientRect();
                return {x: Math.max(1, Math.min(innerWidth - 1, (box.left + box.right) / 2)), y: Math.max(1, Math.min(innerHeight - 1, (state.viewportTop + state.viewportBottom) / 2))};
              });
              await page.mouse.move(row.pointer.x, row.pointer.y);
              await installInputProbe(page, identity.farKey);
            }
            const activeBaseline = kind === 'trusted-interruption' ? await readDocumentListeners(cdp) : row.connectedBaseline;
            row.active = await beginActive(page, cdp, identity.farKey, activeBaseline);
            if (kind === 'supersession') {
              row.actionBoundary = await actBeforeDestination(page, identity.farKey, identity.targetKey, kind, row.active.before.offset);
              check(row.actionBoundary.ok, 'Supersession missed its active-motion window or the new reveal was rejected', row.actionBoundary);
              row.completed = await connectedCleanup(page, cdp, identity.targetKey, true, row.connectedBaseline);
            } else if (kind === 'trusted-interruption') {
              row.input = await trustedWheel(page, workload);
              row.completed = await connectedCleanup(page, cdp, identity.farKey, false, row.connectedBaseline);
            } else {
              row.actionBoundary = await actBeforeDestination(page, identity.farKey, identity.targetKey, kind, row.active.before.offset);
              if (row.actionBoundary.ok) firstDisposal = row.actionBoundary;
              check(row.actionBoundary.ok, 'Removal missed its active-motion window', row.actionBoundary);
            }
            // active-removal deliberately has no connected completion wait.
          }
          const finalConnected = kind === 'active-removal' ? row.actionBoundary.boundary.state : row.completed.geometry.tail.at(-1);
          check(finalConnected.itemCount === row.mounted.itemCount && JSON.stringify(finalConnected.interaction) === JSON.stringify(row.mounted.interaction), 'Reveal changed records, focus or selection', {before: row.mounted, after: finalConnected});
          row.disposed = await afterDisposal(page, cdp, coldBaseline, kind === 'active-removal' ? row.actionBoundary : undefined, value => { firstDisposal = value; }, acceptance, value => { row.documentMotion = value; }, kind);
          row.status = 'ok'; result.completedCycles = cycle;
        } catch (error) { row.status = 'failed'; row.failure = scalarFailure(error); throw error; }
      }
      result.checkpoints.push(await forcedGcCheckpoint(page, cdp, checkpoint, coldBaseline));
    }
    result.caseCounts = Object.fromEntries(revealRetentionProtocol.cases.map(kind => [kind, result.cycles.filter(row => row.kind === kind && row.status === 'ok').length]));
    check(Object.values(result.caseCounts).every(count => count === (qualification ? 1 : 25)), 'Retention case schedule was not completed exactly', result.caseCounts);
    result.status = 'ok';
  } catch (error) {
    result.status = 'failed'; result.failure = scalarFailure(error);
    // Preserve failure; best-effort cleanup does not convert it into success or
    // append a replacement checkpoint. Caller closes the fresh browser next.
    if (error?.requiresBrowserClose) { result.requiresBrowserClose = true; return result; }
    try {
      await clearInputProbe(page);
      const state = await page.evaluate(() => window.revealFixture.snapshot());
      if (!state.connected && state.liveHosts === 0) {
        result.failureCleanup = {status: 'already-disposed', state, disposal: firstDisposal ?? null,
          evidence: firstDisposal ? 'First disposal evidence retained; failed assertions are not rerun.' : 'No complete first-disposal evidence was returned.',
          finalListenerInventory: 'not-run in this cleanup path; original outcome remains failed'};
      } else {
        result.failureCleanup = await afterDisposal(page, cdp, coldBaseline, undefined, value => { firstDisposal = value; });
      }
    }
    catch (cleanupError) { result.cleanupFailure = scalarFailure(cleanupError); if (cleanupError?.requiresBrowserClose) result.requiresBrowserClose = true; }
  } finally {
    // A timed-out operation is still uncertain: only the owning runner may
    // close that browser. Otherwise restore instrumented methods in all paths.
    if (instrumentationInstalled && !result.requiresBrowserClose) {
      try {
        await clearInputProbe(page);
        result.trackerFinal = await page.evaluate(() => {
          const tracker = window.__revealRetentionListeners, snapshot = tracker?.snapshot();
          try { window.__revealRetentionLifecycle?.clear(); }
          finally { tracker?.restore(); }
          return snapshot;
        });
        if (result.status === 'ok') assertOwned(result.trackerFinal, 0);
      } catch (error) {
        result.status = 'failed'; result.restorationFailure = scalarFailure(error);
        if (error?.requiresBrowserClose) result.requiresBrowserClose = true;
      }
    }
  }
  return result;
}

export async function runRevealRetention(page, workload, {cdp, checkpoints = [0, 10, 50, 100], acceptance} = {}) {
  assert.deepEqual(checkpoints, [...revealRetentionProtocol.checkpoints]);
  return executeRetention(page, workload, {cdp, checkpoints, qualification: false, acceptance: retentionAcceptance(acceptance)});
}

// Separate source-only qualification entry: all four cases exactly once, with
// real GC at 0/1/2/3/4. Its row never counts toward the five full retention runs.
export async function qualifyRevealRetention(page, workload, {cdp, acceptance} = {}) {
  return executeRetention(page, workload, {cdp, checkpoints: [0, 1, 2, 3, 4], qualification: true, acceptance: retentionAcceptance(acceptance)});
}

// Private diagnostic composition; keep the shared operation bodies unchanged.
export {beginActive, boundedOperation, afterDisposal};
