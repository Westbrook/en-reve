# Offline theme review — October 2, 2026

The user asked for remaining feasible plan work while manual/platform testing is
blocked. Offline candidate review can proceed without choosing a submission or
adoption service. The earlier documentation checkpoint grouped these dependencies
too broadly; this follow-up corrects that boundary.

## Delivered

- An explicit maintainer packager preserves the original documentation assets,
  single/paired candidate envelope and exact build identity. It rejects changed,
  missing or extra assets, symlinks, unsafe paths and mismatched candidates.
- A portable built-in-only Node server and landing instructions accompany the
  package. No repository checkout, npm installation or network connection is
  needed on the reviewer computer after provisioning Node 24 or later.
- Integrity checks run before serving and again for each requested file. The
  server binds only loopback, allows GET/HEAD, validates Host and limits document
  resources to the local origin. Review sessions do not mutate the package.
- The existing Theme Review application performs authoritative token replay and
  preserves separate baseline/candidate frames. Edits can be exported separately.
- Handbook and owning documentation describe private transfer, startup, exact-build
  constraints, provenance and remaining boundaries.

## Verification

Six Node controls pass, covering exact-byte preservation, immutable destinations,
asset/candidate mismatch, pair envelopes, path safety, symlinks, missing/extra files,
startup and post-start corruption, route/method/Host restrictions. A fresh strict
TypeScript/SSR documentation build passes.

Three production browser cases pass in Chromium, Firefox and WebKit. Each exports
a real pinned radius candidate, packages the build, loads the copied standalone
runtime, opens a fresh context with every external request blocked, reopens the
candidate, compares its settings preview with the unchanged baseline, and exports
it again. No external requests or runtime errors occur. The changed handbook's
nine existing browser checks also pass. Screenshot review confirms the offline
WebKit Theme Review surface remains visually intact.

The first Node attempt was blocked by sandbox loopback policy. The next exposed a
fixture error: Fetch did not send the custom Host header, corrected using native
HTTP. The first browser attempt used a cwd-relative build path and failed the
three new cases; all nine handbook cases passed. Its corrected fixture resolves
from the test module. Failed receipts remain retained, not overwritten.

The committed [qualification](../apps/docs/tests/verification-offline-review-20261002.json)
binds source and built output. Node controls are included in the tooling graph;
browser cases use the existing workflow command and ownership leases.

## Remaining scope

This closes portable offline application/candidate packaging. It does not capture
browser sessions, automatically restore drafts, submit/adopt themes, establish
publisher authenticity from hashes, certify manual accessibility, or qualify real
connectivity/physical devices. Semantic replay remains the original application's
responsibility, not the packager's. Full component impact mapping and formal
expected/actual/diff visual evidence remain distinct from a usable offline viewer.

Interactive old/new release review remains another feasible independent slice.
Managed submission/adoption still needs explicit service/authority decisions.
Manual/platform requirements remain in the support ledger, with no new acceptance
inferred. Publication and user-review identities live in the independent report.
