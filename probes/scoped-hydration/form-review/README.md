# Phase 5 real autofill and history review

Build with `python3 probes/scoped-hydration/form-review/prepare.py`, then run
`node probes/scoped-hydration/form-review/server.mjs`.
Open http://127.0.0.1:4233/?progress-report in the regular browser profile where
saved contact/address autofill is configured. The page contains the full checklist.

The build extracts the five frozen Phase5 package archives into an isolated stage;
it does not use current workspace library builds or overwrite frozen campaigns.
New local evidence lives in `artifacts/scoped-registry-phase-5-form-review`.
These fixtures extend manual coverage after commit `4a6da1fba47b`; they are not a
new performance campaign or a change to the sealed runtime.

- `shadow.html`: live SSR managed inputs in a deferred scoped shadow boundary;
  global fallback when native registry support is absent.
- `global.html`: explicit document-global delivery control.
- Each has a native light-DOM reference form and actual `en-text-field` components,
  name/email/address autocomplete tokens, empty defaults and separate autocomplete
  sections. All five fields are optional to permit partial saved profiles.
- Hydration is explicit; a five-second option allows continued focus/selection.
  Observation compares input identity, values, selection and focus without writing
  field state. Form buttons display actual FormData locally after hydration.
- History runs exercise both departure before and after hydration. Pageshow reports
  BFCache resume versus new-document navigation. A new document starts dormant so
  reviewers can observe browser-restored state before explicitly hydrating it.
- No storage, unload handler, automatic hydration, hidden input mirroring or
  scripted form-value restoration. Cache policy is `private, no-cache`.
- Entered data is never added to URLs or persisted by the fixture. Submit handlers
  prevent network submission; the server rejects POST without parsing/logging it.
  Local form-check output displays the values until navigation/reload.

Run `node probes/scoped-hydration/form-review/verify.mjs` for fixture mechanics.
Automation is explicitly **not** evidence of actual saved-profile autofill, physical
IME or regular-profile history restoration. Browser automation can choose a
new-document return instead of BFCache; record the observed path, not a promised one.
Record browser/version, delivery/registry mode, which suggestions were offered,
which values survived, local FormData matches, and the return path. Real-user
acceptance remains pending until results are reported.
