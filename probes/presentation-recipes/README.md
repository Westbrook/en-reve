# Packed native presentation recipes

This application-owned Lit consumer exercises public templates and style sheets
without the elements package or workspace aliases. Packed declarations compile
strictly; bundle inputs, portable CSS and static asset hashes are recorded.

```sh
EN_EXECUTION_OUTPUT=/absolute/non-existing/run \
  tooling/test-pipeline/with-toolchain.sh npm run test:union -- \
  --pathways=presentation-recipes,delivery-gallery
```

The pathway reserves its own loopback port and uses the pinned three browser
engines with isolated contexts and no retries. The gallery pathway adds a fresh
production docs build and the owning gallery regressions.

[The contract](../../packages/primitives/docs/presentation-consumers.md) explains
native vs application ownership. The 19 journeys run in Lit and portable CSS in
each engine (114 cases): shell landmarks/responsiveness; disclosure and link keys;
choice submission; authored choice reconciliation; uncontrolled selection;
joined-field draft/caret preservation; action orientation; real file download and
removal; local datetime validity/FormData; meter thresholds; escaped code;
status/disclosure semantics; keyboard scrolling; signed and nonfinite chart data;
empty/zero charts and scoped colors; button/link/radio pins and focus; native
recipe semantics/forced-color boundaries; image geometry; enlarged RTL/text spacing.

The first run exposed a real choice-card bug: changing the checked attribute did
not reconcile a dirty native checked property. The correction synchronizes explicit
state but preserves uncontrolled cards. The second run passed all 114 browser cases
and caught a separate SSR serialization issue; the final run preserves boolean
server markup and passes initial checked true/false/omitted cases for both input
types. Earlier failing evidence is retained, not replaced.

[verification-20261002.json](verification-20261002.json) records 114 packed cases,
32 owning gallery cases, 33 Node checks, exact inputs and fresh production output.
Fourteen further public entries are qualified for named scenarios, bringing the
inventory to 59/110. The other 51 entries and platform/manual/owner obligations
remain open. Native clipboard transport, hydration, assistive-technology speech,
physical IME/touch and retail/alternate-OS behavior are not inferred from these tests.
