# Packed application-owned form recipes

Run from the repository root, using a fresh output directory:

```sh
EN_EXECUTION_OUTPUT=/absolute/new/form-recipes \
  tooling/test-pipeline/with-toolchain.sh npm run test:union -- --pathways=form-recipes
```

Preparation extracts verified primitives/styles/tokens tarballs into an isolated
consumer, strictly typechecks against their declarations and rejects workspace
source or any elements-package runtime. Locked third-party dependencies are the
only links to the workspace. A fresh reserved loopback fixture runs in all three
pinned engines with one worker, no retries and no developer-server reuse.

The [contract](../../packages/primitives/docs/form-consumers.md) and
[receipt](verification-20261002.json) cover six entries and 72 cases:
12 journeys × Lit/portable stylesheet delivery × Chromium/Firefox/WebKit.

- Rich authored steps retain names, native disabled/current state, focused control
  and label identity through edits; veto, stale-catalog guards and silent author
  authority work. Invalid content recovers, hidden/reordered children reconcile,
  disconnect releases slots, and cross-host transfer preserves receiving ownership.
- Original validation links retain native Enter/Tab, focus and fragment navigation,
  cancellation/listeners and rich updates. Invalid hrefs, hidden links and
  reconnection reconcile without clones.
- Native file selection submits actual File bytes. Mixed-invalid batches reject
  atomically, with MIME/extension, size and multiplicity reasons. Invalid accept
  tokens retain the documented permissive behavior. Transactions stage FormData,
  veto restores the accepted array, author authority supersedes, and removal,
  disabled state, reset and instance isolation stay coherent.
- Both delivered style forms honor scoped pins, native focus decoration, drag
  feedback, enlarged narrow RTL layout and forced-color boundaries.

Earlier attempts are retained: sandbox loopback admission prevented run01 from
starting browser assertions; run02 corrected a `textContent` assertion to use the
slotted accessible name; run03 found oversized fixture text fields in Firefox;
run04 corrected WebKit traversal to its native all-controls Alt+Tab modifier.
The final full matrix passed. No library runtime changed or assertion was omitted.

These are named scenarios, not every exported method or owning-element behavior.
The native picker uses Playwright `setInputFiles`; drop payload delivery is
synthetic. OS chooser UI, physical drag/drop, speech/AT, physical IME, SSR/hydration,
other platform conditions and separate-owner acceptance remain separate.
The public-entry inventory is now40/110;70 entries remain pending.
