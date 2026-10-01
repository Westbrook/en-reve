# Range delivery feasibility

Recommendation: **no-go for production range deferral on this base**. Keep range eager and the Phase 6 single-date policy unchanged. A calendar-independent essential range editor is plausible, but it is a transaction, fallback and hydration redesign, not an extension of the single-date loading flag. The isolated prototype demonstrates the state-ownership seam; it does not qualify a public API or a performance candidate.

## Boundary and ownership

- Base: latest local main at isolation, `66386af7daac295cb2e178236d45289a9ebced4f` (tree `6f0cd79db801f483dd40b51885742580c951b8a0`). Phase 6 seal `220d2dd3e4f55c6f2557d7e7fc593d5d16099bba` is a verified ancestor.
- Branch/worktree: `codex/scoped-followup-range-feasibility`, `/private/tmp/design-system-range-feasibility`. Original checkout and unrelated working changes remain untouched. No stash, reset, merge, remote push, deployment or publication.
- Applicable instructions: supplied personal AGENTS instructions; no additional repository/ancestor AGENTS file found. Read the progress-report skill and contract. Original `.progress-report/project.json` was read only as a locator. Canonical report remains `http://127.0.0.1:4177`; task-only updates use `data/.project.lock`, reread state and atomic replacement. Other task records, feedback and review checkpoints are preserved. Thirty open feedback items were read; no new range-related user feedback was open at audit.
- Frozen Phase 0–6 archives are context only, never timing controls. `archives-before.json` and final verification record a path/content aggregate. No files in those archives are changed.
- Coordinated with **Investigate Phase 6 delivery cost** (`01a0d339-cd53-76c3-8a1a-0403a653f21f`) and **Measure calendar detachment tradeoff** (`01a0d35d-482e-7bd2-ad8c-c2173808e1f3`). Date cost is complete at `c47797ca`, no runtime integration pending. Its exact current-main packed packages are copied, hashed and checked against relevant source and lockfile; its rejected guard-removal trial is excluded. Retention confirms fixture-only patches and range always bypasses parking. This task owns only its plan/artifact paths, no date runtime file.
- Preserve `guard` and `syncCalendar` behavior on main. A later owner must reconcile essential draft state and synchronization before any shared optimization. No live-tree registry reassignment, per-picker registry, generic persistence, new calendar or time-zone feature.

## Audit: the current structure is materially different

Read `packages/elements/src/date-picker/README.md`, `calendar/README.md`, `forms-private/README.md`, Phase 6 plan/results, actual picker/calendar/range helper/adapter implementations, definitions and optional loader, date/range/SSR tests, docs range browser tests and Phase 6 range/SSR probes.

| Layer | Actual responsibility and consequence |
| --- | --- |
| Definition | Canonical `datePickerDefinition` statically owns calendar, dialog, button and icon. Shell shares the exact picker constructor but excludes calendar from its hard registration closure. Both setters reject range + deferred in either assignment order. |
| Essential imports | Picker still imports native field/form controller, date parsing/step, range validation, calendar adapter, styles and events. Calendar type import is erased, but validation/formatting is not optional. Deleting calendar registration alone does not remove the synchronous date model. |
| Closed range UI | `renderControlFrame()` replaces the ordinary single native date field with accepted summary and trigger. It is **not** an always-editable pair of inputs. |
| Dialog contents | Two unnamed native `type=date` inputs, edit hint, eager calendar, range status, Clear/Cancel/Apply. Endpoint inputs are picker-shadow descendants projected through the dialog; they do not individually belong to the outer form. |
| Accepted owner | Picker `acceptedRange` drives `rangeValue`, `submissionValue`, JSON restoration state and accepted validity. Valid complete pairs use explicit start/end names. Optional empty pair is valid but submits nothing; partial/invalid pairs submit nothing. |
| Draft owner | Calendar `rangeDraft` is authoritative for `editRange()` and `applyRange()`. Picker's `pickerDraft` mirrors it for the two inputs and Apply availability. Missing calendar makes editing/Apply return early. |
| Open/reopen | `showEagerPicker()` and `dialogChanged()` invoke `syncCalendar()`, assigning accepted range to calendar and picker draft, clearing errors and selecting the accepted month. A repeat async opening that reuses these calls would overwrite an in-flight draft. |
| Close | `hidePicker()` copies accepted range into calendar, invokes `cancelRange()` and asks dialog to hide. It is not a neutral loading-cancellation primitive. Close veto also requires care because cancellation is performed before dismissal acceptance. |
| Grid Escape | Calendar key handler cancels range, prevents default and stops propagation. Escape from a grid cell can leave dialog open; it must not be described as identical to dialog dismissal. |
| Native field adapter | Single-date native editing/controller hydration contract does not automatically cover these two separately rendered range inputs. They use `@change`, not the ordinary field's composition-aware `en-input` path. |
| SSR | Exact packed SSR emits two input values, inside dialog content, with no native names. Existing range SSR test asserts summary, era and Parts; Phase 6 identity test exercises **single date only**. Neither proves paired range draft identity/restoration. |

See `dependency-dom-audit.json` for exact source locations, and `source/`, `range-ssr.html` and `ssr-audit.json` for exact audit inputs. Native form semantics here are verified against the actual repository implementation; no assumed browser submission from a shadow descendant is used.

## Alternatives

| Alternative | Benefit | Cost / decision |
| --- | --- | --- |
| Keep existing eager range | Immediately usable pair, whole-interval validity, FACE association and accepted Apply/Cancel behavior after normal hydration; no new policy | **Use now.** Cost remains eager code/calendar construction. This is the only existing component fallback with the complete contract. |
| Flip the single-date flag / drop guard | Superficially small change | **Reject.** Explicit guard, hidden endpoint placement and calendar-owned draft make it incorrect. Date-cost guard-removal already increased render work. |
| Eager essential range editor; calendar construction optional | Draft, validation, form and actions usable without optional DOM/network | Most plausible future direction. Requires extracting ownership from calendar, preserving DOM/hydration identity and specifying new focus flow. Prototype only. |
| Same essential editor with optional calendar chunk | Could remove calendar-only delivery when unused | Greater first-use, retry/cache and localization risk; splitting cannot remove shared date validation/formatting. Do construction feasibility before choosing code splitting. |
| Delay whole existing range picker | Smaller initial component work | No immediate equivalent fallback. Cannot preserve current form/validity contract before hydration. **Reject** where essential editing/submission is required. |
| Two associated light-DOM native dates | Works without JavaScript, immediately editable/submittable | Not equivalent to atomic range Apply/Cancel or unavailable-interior validation. Viable no-JS route **only with server-side pair validation and a product-approved interaction contract**. Native fixture has no submission backend. |
| Detach/recreate/evict range session | Potential closed DOM reduction | **Excluded.** Never evict an uncommitted session, detach its editing owner or reassign registry ownership. Retention task keeps range out of its policy. |

## Accepted state and drafts: requirements before optional delivery

The proposed essential shell must own accepted pair A, draft pair D, default pair B, author-write revision, dirty state, validation/cache state and session identity. Optional calendar is a view/editor of D, not its storage. Registration/module preparation, calendar mount, dialog opening and focus readiness are distinct operations. A token cancels an open request without destroying D; imports may finish and remain shared. A mounted calendar stays connected for repeat use. Removing a host cancels pending effects; generic cross-navigation persistence is out of scope.

**Cancellation has two meanings.** Canceling loading, abandoning optional-calendar intent or returning from that view preserves D. Explicit **Cancel edits**, existing range Cancel, grid Escape cancellation, reset and authoritative writes have deliberate semantic effects. Keeping D after a user explicitly requests the existing Cancel behavior would contradict the accepted contract. No loading or retention policy may silently perform such a cancel. If the product instead wants resumed canceled sessions, that requires a separate interaction decision; this task does not adopt it.

| Case | Current contract / future essential-shell gate |
| --- | --- |
| Accepted pair | Immutable copied ISO `{start,end}`. Single `value` is independent. FormData sees both proposed endpoints during the synchronous cancelable transaction and the prior pair after veto, unless superseded. Both names must be configured for paired consumer submission; current source omits a missing name rather than inventing one. |
| Normalization | `dateRange()` chronologically sorts complete valid endpoints. Reverse calendar clicks normalize. Native start edit after current end clears end; native end-before-start then normalizes the pair. Preserve this asymmetry unless a separate design decision changes it. |
| Same day | Inclusive same-day pair is valid when the date meets all constraints. It is not an empty interval. |
| Partial/invalid | Empty or one-sided ISO pairs can exist; invalid ISO author writes are ignored. Native invalid/incomplete edit can expose an empty value with browser-owned draft segments. No partial/invalid accepted pair submits. Do not rerender away those native segments when an optional load completes. Prototype preserves node identity, but incomplete segment/composition behavior is unqualified. |
| Required | Complete valid pair required. Optional completely empty pair is valid, but partial remains invalid. Keep accepted validity separate from a merely edited unapplied D; provide draft error when applying D fails. |
| min/max | Both endpoints and complete interval must fit. Recheck current constraints on Apply and after asynchronous preparation; a stale captured validation result cannot authorize a commit. |
| step | Anchor is min, else default single value, else 1970-01-01. Endpoint step checks plus whole-interval rule: a multi-day range fails for step > 1 even if endpoints individually land on allowed steps. Same-day on-step remains valid. |
| unavailableDate | Synchronous whole-interval predicate, including interior days. Cache by relevant constraints, replace predicate or explicitly invalidate captured data. At most 36,600 inclusive days with a predicate; no such cap without one. No remote availability or async predicate API added. |
| Veto | Existing Apply rolls A/form back, stays open, resets calendar draft to accepted and announces cancellation. Prototype intentionally retains D after veto to expose the potential ownership model; **this is an unresolved behavioral difference, not production parity**. |
| Author writes | Equal-value writes are still authoritative; valid write resets accepted/draft and advances revision. Reentrant accepted transactions supersede older rollback; canceled nested transaction must not. Use existing `dispatchChange` semantics, never an unguarded late assignment. Prototype uses that helper but has no production event forwarding on the host. |
| Reset/defaultRangeValue | Property-only copied default, empty initially. Pristine follows defaults; author or user edits make it dirty. Reset silently restores B and pristine state, cancels pending opening, closes editor and clears draft. Application `error` survives. Do not repurpose `rangeValue` as reset default. |
| Restoration | JSON pair through `formStateRestoreCallback`; foreign malformed state ignored. Restoration is an authoritative paired write; no `en-change`. Browser restore/autocomplete delivery and history paths need actual range evidence. Calling the callback in a test is not browser restoration qualification. |
| Clear | Atomic cancelable empty proposal, leaves required invalid and removes both entries. Current clear hides/reset drafts even after veto; it must not be silently changed by new delivery. Prototype exposes accepted-state transaction only, with no picker-close parity claim. |
| Apply | Reads D without needing calendar. Complete valid D stages A + form, dispatches one transaction, then handles commit/veto/supersession. Same pair may still close the existing picker. Failed validation must leave editable draft/error visible. |
| Cancel/Escape | Explicit editing cancel restores A. Grid Escape cancels draft and may retain open dialog; dialog Escape/close follows dialog focus/close contract. Loading Escape cancels only pending load/open, preserving D; do not wire it to current `hidePicker()` for a live draft. |
| Disabled/read-only | No commit/open; disabling cancels pending effects without eviction. Disabled form/fieldset excludes entries, including after re-enable; readonly keeps accepted submission. Close/readiness callbacks must not steal focus after state changes. |
| Calendar systems | Only Gregorian ISO 0001–9999 and modern Buddhist display 1941–9999 (+543 BE). Unsupported ID/Intl capability/interval shows explanation; no silently substituted calendar. ISO storage remains unchanged. Deterministic today, locale and Intl capability must agree across SSR/client. No time or time-zone selection added. |

## Fallback readiness and no-JavaScript are separate gates

1. **Now:** use the eager range component and promptly hydrate it when whole-interval client validity and Apply/Cancel are required. A native input merely visible in shadow SSR does not establish form association.
2. **Future essential JS fallback:** both native endpoints, accepted pair/form owner, labels/errors and Apply/Cancel/Clear become usable before optional calendar delivery. The prototype's FACE owner retains accepted submission while D changes and while the real calendar chunk is blocked. A failed optional chunk never disables that essential route. This proves only the illustrated seam; it does not prove equivalence to the library.
3. **No JS:** render actual associated light-DOM native named inputs (or explicit same-document form association) and validate the pair server-side. Required/min/max/step can be expressed natively, but cross-field atomicity, normalization and unavailable interior rules need server handling. No server endpoint was implemented. The static `native.html` demonstrates association, not end-to-end no-JS acceptance.
4. **Hydration:** a production essential shell needs server-rendered endpoint nodes with stable labels, IDs, constraints and positional identity; retain both exact nodes and browser draft/selection/focus through ordered SSR bootstrap. Reconcile restored/prehydration endpoints as one pair. Do not patch endpoints one at a time through the public setter or replace the endpoint subtree when calendar mounts. Our prototype is client-created, and is **not SSR/hydration qualification**.

## Keyboard, focus, announcements and localization

Existing calendar keyboard contract remains: one grid Tab stop; arrows move day/week with RTL reversal; Home/End week edges; Page Up/Down month; Shift+Page Up/Down year. Navigation does not select, disabled/off-step dates stay discoverable, selection validates the whole interval. Keep full localized weekday/date button names, semantic headers and endpoint suffixes. Accepted Phase 6 weekday-repetition and Firefox native-button dispositions stay closed.

Essential endpoint fields must be reachable independently of the optional grid, with visible translated labels and instructions. Apply/Cancel/Clear belong to the essential session. Optional trigger reports loading/failure locally without taking focus; focus departure or canceled intent prevents late dialog entry. After explicit opening, focus must go to the appropriate existing draft endpoint/grid date, not reset selection. Closing optional view returns to its trigger or last valid essential target. Explicit edit cancellation follows the existing dialog behavior. Focus and selection must survive unrelated shell/status rendering. Prototype currently opens calendar based on its accepted active day rather than guaranteeing the draft day: another production gate.

Use a persistent local polite status; announce loading, readiness where useful, failure and distinct retry attempt numbers. Do not move focus on error or use announcement timers. Announce draft start/end, valid completion, invalid interior and cancellation once at the owning interaction boundary. Avoid duplicate shell/calendar announcements. Prototype messages are English, and the optional view moves Apply outside the dialog: neither change inherits manual acceptance.

Locale governs language/numerals, not calendar ID, week start, direction or native input layout. Application must localize action/endpoint/picker/close/navigation labels, error and retry messages, calendar/era identity and native-edit explanation. Current source has hardcoded range summary/status/validation strings; optional-delivery design must explicitly address this existing limit before promising complete translation. Invalid native date editing follows browser preferences; do not claim locale-controlled native segments. Buddhist summaries must preserve ISO storage and explain Gregorian native editing.

## Permanent chunk failure

The essential editor stays operable and retains A, D, accepted validity and form association indefinitely. Retry is explicit best effort and may reject from a cached module failure; repeating a URL is not proof of a fresh network request. Show distinct localized retry failure text and a reload option without automatic reload. Warn in the reload action that unapplied local edits are not persisted; allow Apply or cancellation first. No cache-busting persistence, background retries or silent draft loss is introduced. Registry conflicts are terminal: correct definitions and use a fresh scope/page; never redefine or reassign a live tree. Mixing eager calendar imports can erase byte savings while retaining the new complexity.

## Prototype and evidence boundary

Artifacts: `artifacts/scoped-followup-range-feasibility/`. `session.mjs` is a private experiment using current packed `dateRange`, `validateRange` and `dispatchChange`; `prototype.mjs` has an essential FACE form owner and a real dynamically imported calendar, plus a delayed-load and simulated-failure route. It is deliberately not registered under `en-date-picker` and adds no public export. Actual request-abort checks are separate from the simulation switch. Optional view and input nodes are retained; there is no detached cache or eviction policy.

Seven model tests pass (including nested canceled/accepted transactions and disabled/read-only blocking). The model covers normalization, same-day, draft/accepted separation, tentative reads, veto/author authority, defaults/reset/restoration, partials, invalid author writes, clear, application error, min/max/step/predicate and supported calendars. Eight existing helper/SSR/definition tests are rerun against the exact packed packages (only import paths are adapted). `ssr-audit.mjs` inspects actual emitted range markup and both rejection orders.

This prototype lacks production SSR, scoped ownership, native composition/segment preservation, full localized strings, close-veto parity, event forwarding, accepted-value validity flags/form-entry parity under application errors, availability caching, calendar-sync revision handling and full runtime coverage. These are concrete correctness blockers, not optional polish. Therefore it never enters the viable performance-candidate gate.

## Measurements and interpretation

`costs.json`, `browser-attempts.jsonl`, `browser-verification.json`, `results.json` and the sortable `en-table` viewer keep raw values, requested/actual registry mode and direction notes. Exact built assets, source/package hashes, settings, logs and failures are retained. Results are diagnostics, not a speedup verdict.

The deterministic delivery audit walks the Vite manifest's complete static import graph, then the same route's dynamic calendar closure. **Marginal optional bytes** are the latter minus already-initial files; they describe prospective unused delivery in this experimental build. Shared chunks are counted once. Compression uses gzip level 6. Source sizes or module rendered length are not treated as compressed savings. The multi-entry build includes the evidence viewer; separate runtime closure accounting excludes that viewer's independent entry. The experimental essential route uses platform FACE directly and omits the production picker/dialog/styles architecture; its 29,367 gzip-byte optional closure includes shared Lit/style foundations that an actual production shell may already need. This is not a 29 KB production saving.

The actual eager range calendar subtree is counted with all descendant text/comment/shadow nodes. Its count is the upper bound on calendar-only deferred nodes at that fixture state, not a promised net reduction: an essential fallback adds its own DOM, and calendar nodes return after first use. The paired fields/actions must remain. Parent and prototype page totals have different controls/layout and **must not be subtracted as an improvement**.

First and repeat open measurements are instrumented one-observation diagnostics per available configuration. The parent records `showPicker()` API completion (not an independently timestamped paint or AT-ready boundary); a prototype measure, where reported, includes its own open/focus path. Artificial 800 ms delay belongs only to functional races and is never a performance sample. No median, interval or startup claim is inferred from these observations. Native scoped engines and global fallback are separate; prototype uses explicit global only. No warm HTTP-cache/new-document or constrained-device performance acceptance is claimed. Browser resource body/transfer counters are separate from emitted gzip sizes.

No viable matched production parent/candidate exists because essential semantics fail before optimization. Consequently **no production performance acceptance or repeated retention campaign was run**. Short repeated functional openings establish draft preservation only, not memory stability. Historical Phase 0–6 and single-date date-cost workloads are not pooled, subtracted or used as range acceptance.

### Predeclared gates for a separately approved implementation

Budgets in `budgets.json` are proposed investigation gates, not inherited user approval and not a claim that this prototype passes. Before collecting promotion data, approve a concrete matched range workload and freeze these or explicitly revise them with rationale:

- Identical parent/candidate range values, names, constraints, labels, calendar, viewport, registry/SSR mode and successful workflow; exact commits, source overlay, lockfile, tarballs and asset hashes.
- At least 30 **successful** timing samples per configuration, all failed attempts retained, no selective outlier trimming; separate cold HTTP, warm HTTP/new document, same-document repeat and intent-abandoned traffic. Record actual native scope vs global fallback; do not pool requested scopes.
- Proposed marginal unused benefit floor: ≥100 initial calendar nodes or ≥4,096 gzip bytes (and account for essential-shell additions). Zero semantic regression is mandatory even above this floor.
- Additional initial JS ≤4,096 gzip bytes; first focus upper practical regression +16 ms desktop / +50 ms constrained; repeat +4 / +10 ms; shell readiness +16 / +50 ms. Candidate-minus-parent negative means lower cost; positive means regression. Show uncertainty intervals; inconclusive budget crossings require an independent confirmation, not pooling until favorable.
- At least five separate 100-cycle retention repetitions per promoted configuration, measuring before use and cycles 10/100; closed retained nodes/listeners and heap recorded separately. Proposed additional growth ceiling +20 nodes, +10 listeners, +262,144 bytes, with **zero loss of any uncommitted range session**. Detachment/eviction is not authorized by a passing heap number.
- Native/fallback/cache/CPU/network regimes declared before runs and never averaged together. Real failed-import permanence, terminal registry conflict, cancellation, repeat and multiple fields/roots require functional qualification before timing.

## Production acceptance checklist and no-go conditions

| Gate | Required evidence | This investigation |
| --- | --- | --- |
| Existing contract | Eager default/range and Phase 6 single-date regression; unchanged metadata unless separately approved | Source untouched; focused tests pass |
| Essential independence | Paired editing, Apply/Cancel/Clear, accepted validity and association work before/without calendar | Model/prototype only; production blocked |
| Session integrity | Pending/coalesced load, failure, canceled intent, repeat, disconnect, adopt, disable/read-only, reset, author writes and close veto cannot revive stale state or erase D unintentionally | Partial automated prototype checks; production blocked |
| SSR/no-JS | Both node identities/focus/native drafts across actual hydration; correct pair/FormData; separate real no-JS server contract if required | Existing range SSR markup audited; new hydration/server route unperformed |
| Validation/transactions | Full whole-interval/calendar matrix, dirty defaults, restoration, reentrant/equal author authority, all form APIs and disabled fieldsets | Focused model/source tests; complete browser parity unperformed |
| Ownership | Date optimization/retention owners agree exact runtime patch; registration preflight and actual root ownership; no live reassignment | Coordination recorded; no runtime patch proposed |
| Accessibility/localization | Automated DOM/focus plus actual changed-flow AT cursor/speech, labels/errors, RTL, forced colors, responsive targets and physical input/device review | New actual AT/physical review unperformed; old acceptance unchanged |
| Performance/retention | Matched exact range campaign, ≥30 successful/configuration, raw failures, separate repeated retention and declared budgets | Not entered; no viable production candidate |
| Release decision | Separate user implementation/API decision followed by qualified reviewable patch | Not authorized in this task |

No-go if fallback requires optional calendar to edit/Apply, prehydration submission is claimed without associated native inputs, draft or form state is overwritten by loading, async focus steals focus, accepted and draft validity are conflated, partial pairs leak, a canceled transaction overwrites an authoritative write, registry ownership changes, localization/calendar coverage regresses, or savings are justified by incomparable single-date/native controls. A performance win cannot override these conditions.

## Final investigation results

- Seven model tests, eight existing packed helper/SSR/definition tests and all 15 final browser configurations pass. Three-engine viewer checks cover sorting, the flagged return link and its absence without the flag. Desktop/mobile screenshots are retained; this is automated DOM evidence, not manual AT or physical-device acceptance.
- Current eager range calendar subtree: **506 nodes** in every captured engine/mode. Parent page totals: 729 global and 730 native scoped; Firefox's scoped request is actually global fallback (729). These are one-fixture counts, not removed nodes in an accepted implementation.
- Production-build JS closure: unchanged eager reference **55,927 gzip6 B**, plus an unused 84 B dynamic re-export wrapper. Experimental essential route **7,750 gzip6 B** initially; its optional closure is **29,367 gzip6 B** including shared foundations. Both routes have **8,978 gzip6 B** initial CSS. Do not subtract these different control architectures to claim an improvement.

| Diagnostic configuration | First API/open completion ms | Same-document repeat ms |
| --- | ---: | ---: |
| Eager range / chromium / global requested → global actual | 5.60 | 2.50 |
| Eager range / chromium / scoped requested → scoped actual | 5.50 | 2.40 |
| Eager range / firefox / global requested → global actual | 8.00 | 4.00 |
| Eager range / firefox / scoped requested → global actual | 8.00 | 4.00 |
| Eager range / webkit / global requested → global actual | 4.00 | 2.00 |
| Eager range / webkit / scoped requested → scoped actual | 3.00 | 1.00 |

The separate prototype workflow has first/repeat diagnostics of chromium 17.70/2.10 ms, firefox 22.00/4.00 ms, webkit 18.00/1.00 ms. Each cell has one successful observation, without the artificial delay. These are not medians or comparable-control deltas; no speedup, latency budget pass or retention conclusion follows. Negative candidate-minus-matched-parent values would mean lower cost, positive added cost; no such cross-control delta is computed here.

The browser investigation retained three failed functional/setup attempts in its raw attempt stream: a wrong-server readiness timeout, a duplicate implicit/explicit status locator in the prototype, and a WebKit late-open assertion. Launch/lock failures are separately retained in setup logs. The status target was made singular. WebKit showed that comparing only final focus can miss an intervening departure; the prototype now observes departure and cancels the request without canceling the draft. Prior source/assets and partial successful observations remain in `rejected-setup/run7` and `run8`, never pooled into final results. The final source also reconciles calendar accepted state after Apply so grid Escape cannot restore an older accepted pair. All changes are isolated prototype changes.

The last prototype screenshots are after reset; their retained-calendar node counts follow a changed accepted range. Changes in painted range bands explain differing node counts and are not a retention-growth series. No warm-cache, throttled, BFCache, actual hydration, speech or physical-device outcome is inferred.

## Handoff

Review the no-go and essential-ownership design, then decide separately whether to fund a range-shell implementation with explicit interaction/localization/no-JS scope. Until then use eager range. A subsequent implementation owner should first extract a private draft/transaction controller with parity tests, establish real SSR endpoint identity and an essential fallback, and only then choose construction-only versus optional-code delivery. Do not begin by changing `calendarLoading` guards.

Review artifacts are local and unreviewed by the user. Automated DOM/focus evidence is not speech/cursor or physical-device evidence. Existing accepted manual work is not reopened because no shipped interaction changed. No merge, publish, deployment, new public range-delivery API or generic persistence is part of this investigation.
