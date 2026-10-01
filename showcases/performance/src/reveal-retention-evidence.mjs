// Shared original scalar assertions; no browser operations or acceptance exemption.
const inputTypes = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
export function check(condition, message, detail) {
  if (!condition) { const error = new Error(message); error.detail = detail; throw error; }
}
export function assertOwned(snapshot, count) {
  check(snapshot && !snapshot.dropped && snapshot.errors.length === 0, 'Listener ownership instrumentation is incomplete', snapshot);
  check(inputTypes.every(type => (count === undefined || snapshot.counts[type] === count) && snapshot.maxCounts[type] <= 1), 'Owned document input subscription count violated the protocol', {expected: count, snapshot});
}

export function assertDisposalScalar(disposal) {
  check(disposal.ok && JSON.stringify(disposal.restoration) === JSON.stringify(disposal.expected), 'Disposal failed to restore overflow-anchor value/priority or tabindex', disposal);
  check(disposal.atRemoval.disconnects === 1 && disposal.frames.length === 12, 'Missing exact post-disposal lifecycle evidence', disposal);
  const documentRevision = disposal.revisionAtRemoval.status !== 'inapplicable';
  if (documentRevision) check(disposal.revisionAtRemoval.status === 'observed' && Number.isFinite(disposal.revisionAtRemoval.revision), 'Missing public document-model revision at removal', disposal);
  for (const frame of disposal.frames) {
    // Lit may finish a previously queued update after disconnection. Counts are
    // descriptive; they do not identify stale controller work by themselves.
    check(!frame.state.connected && frame.state.liveHosts === 0 && frame.counter.disconnects === 1,
      'Post-disposal host/disconnection ownership changed', {disposal, frame});
    if (documentRevision) {
      check(['observed', 'collected'].includes(frame.publicRevision.status), 'Invalid public model revision observation', frame);
      if (frame.publicRevision.status === 'observed') check(frame.publicRevision.revision === disposal.revisionAtRemoval.revision,
        'Disconnected public document model changed revision after scroll/layout stimulus', {disposal, frame});
    } else check(frame.publicRevision.status === 'inapplicable', 'Activity must not invent a public model revision', frame);
    assertOwned(frame.owned, 0);
  }
  return documentRevision;
}

export function assertDisposalStimulus(disposal, documentRevision) {
  if (documentRevision) check(disposal.layoutStimulus.restoration.removed && JSON.stringify(disposal.layoutStimulus.restoration.actualStyle) === JSON.stringify(disposal.layoutStimulus.restoration.expectedStyle), 'Post-disposal native stimulus or authored style was not restored', disposal);
}
