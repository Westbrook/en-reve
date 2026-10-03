# Interactive version review — 2026-10-02

Implemented independently of outstanding manual platform/assistive-technology
reviews. See [the maintainer workflow](../tooling/releases/REVIEW.md).

## Delivered

- A portable immutable package containing two original documentation builds, a
  reproducible CEM/type/graph-informed release draft and explicit scenario mapping.
- Independent document origins and state; native scoped-registry component panes
  load separately bundled public consumers from the two installations. Unsupported
  engines report that scoped comparison was not run; there is no global fallback.
- Change rationale, API facts, missing release requirements, labeled before/after
  layouts and explicit unavailable-side explanations.
- Scenario feedback export/reopening bound to exact review and release identities.
  Feedback never approves or adopts a release.
- Shared byte inventory, integrity verification and build-copy utilities with the
  existing offline theme-review packager.

## Verification

The qualification receipt is
[`verification-version-review-20261002.json`](../apps/docs/tests/verification-version-review-20261002.json).

- Strict documentation/SSR build passed.
- Twelve Node controls passed: six offline package/server checks and six release
  review checks, including corrupted assets and missing scoped fixture coverage.
- Three focused release-review cases passed across pinned Chromium, Firefox and
  WebKit, including interaction/storage isolation, responsive layout, export,
  reopening and wrong-identity rejection. External requests were blocked.
- Nine handbook and three offline regression cases passed in the initial browser
  run. Its three release-review cases failed on an exact label locator; the
  corrected role/name locators passed in the focused rerun. Failed evidence stays
  retained rather than being replaced.
- Desktop and narrow screenshots were inspected. These checks are not physical
  device, assistive-technology or human acceptance evidence.

The browser fixture uses an actual retained pre-change docs build and the new
build. Its scoped consumers are two independently compiled copies of the current
public package, explicitly marked as a sample isolation check; this does not
establish compatibility between two historical released package versions.

## Next independent work

The broader goal remains active. The plan's candidate visual-evidence work still
needs generated real dependency/affected-component mapping and expected/actual/
difference captures tied to exact case, candidate, environment and cache identity.
Current `tooling/evidence` supplies identity, selection and cache primitives, but
its README expressly retains source graph generation and browser integration as
follow-up work. Audit existing producers before adding adapters, keep unknown
edges conservative, and compare focused selection against broad uncached checks.

Manual platform/assistive-technology acceptance and the unselected managed-theme
submission/adoption service remain distinct outstanding dependencies. This
checkpoint neither retires them nor claims the whole plan complete.
