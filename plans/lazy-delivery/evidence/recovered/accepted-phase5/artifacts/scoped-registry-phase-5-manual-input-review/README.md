# Phase 5 manual review — final follow-up

The requested manual checks are complete. This evidence follows runtime and
performance commit `4a6da1fba47ba47c32612e83e4cd9db0584ba774`; it changes no library
runtime or frozen performance campaign.

| Check | Chrome | Safari / WebKit | Firefox |
| --- | --- | --- | --- |
| Real IME | Pass | Pass | Pass |
| Scoped-shadow autofill before hydration | Pass | Pass | Pass |
| Scoped-shadow autofill after hydration | Pass | Pass | Pass |
| Scoped-shadow history after hydration | Pass | Pass | Pass |
| Scoped-shadow history before hydration | Pass on focused retest | Pass on focused retest | Pass |
| Global delivery — all four checks | Pass | Pass | Pass |

The scoped-shadow history-before-hydration check was initially reported as failing
in Chrome/Safari. In the focused retest, all native and managed fields retained
their values on Back and after hydration. Preserve both reports; the disposition
is **not reproduced on retest**, not a code fix or established user error.
The user labeled the global Safari-engine result “WebKit”; receipts retain that
label. Exact versions for these retests and BFCache/new-document return paths were
not supplied. The results qualify the reported workflows, not every restoration
path, device or input method. Automated history observations remain separate.

- `user-review.json`: current aggregate and real IME review.
- `scoped-shadow-review.json`: original scoped-shadow results, historical pending state.
- `global-delivery-review.json`: all four checks pass, historical issue state.
- `scoped-shadow-retest.json`: focused retest and final disposition.
- `seal.json`: source/evidence integrity checks and exact follow-up commit scope.

The accompanying form-review verification covers six browser/delivery
configurations: preservation, FormData, delayed focus, Back observations and
responsive layout. Synthetic assignments are not actual autofill evidence; user
receipts supply that acceptance. The source and build match the reviewed version.

Start the fixture with `node probes/scoped-hydration/form-review/server.mjs`, then
open http://127.0.0.1:4233/?progress-report. Rebuilding is optional: the exact reviewed
site is committed. Rebuilding or rerunning verification writes local evidence;
retain this committed revision as the accepted reference.

Resolve the final commit with:

```sh
git log -1 --format=%H -- artifacts/scoped-registry-phase-5-manual-input-review/seal.json
```
