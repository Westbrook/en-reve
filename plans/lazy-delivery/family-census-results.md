# Family construction eligibility census

Status: deterministic reference census complete; no candidate construction, timing,
retention, package-saving or manual-acceptance result is established here.

The full replacement run completed 30 route cells: Chromium 153.0.8010.12, Firefox
155.0 and WebKit 26.6, each at 1280×900 and 390×844. Those cells contain 48 family
observations across eight candidates. Every cell retained the unchanged real
consumer, with no seeded catalogs/history and no opening or activation actions.
There were no page/HTTP errors. Relevant source hashes and all 1,172 frozen site
asset hashes remained unchanged. Source for that production build is accepted
`fba5ec19b58606cf1776df44862a38a3898f4c72`, tree
`758b9365f2270f5540885c803801a4b6d45ed9d2`.

The resource-owning runner is `probes/lazy-delivery-families/census.mjs`. It uses
existing machine, checkout and browser leases and the documented static server on
an ephemeral port. The first run was aborted after its whole-route readiness wait
encountered intentionally hydration-deferred SSR descendants. Its partial cells,
closure error and failure explanation are retained. The corrected runner waits
only for candidate hosts/descendants, skips `defer-hydration`, and bounds each
promise wait. It reran all 30 cells in fresh contexts; results are not pooled.

## Observed allocation and conservative bounds

| Candidate and current consumer | Generated removable upper bound | Component bound | Whole-route bound | Decision supported now |
| --- | ---: | ---: | ---: | --- |
| Media, two existing data-URI images | 69 elements / 201 nodes | 75.824% elements | 6.128–6.144% elements | Continue implementation qualification |
| Combobox, existing 40-project selection workflow | 160 elements / 524 nodes | 90.034% nodes | 32.935–32.977% nodes | Continue implementation qualification |
| Settings command palette, four SSR commands | 15 elements / 80 nodes | 49.080% nodes | 3.196–3.203% nodes | Continue implementation qualification |
| Pagination, seven known-total pagers in existing specimen | 35 elements / 168 nodes combined | 11.163–12.632% nodes per known pager | 7.992–8.004% nodes | Continue; exact net savings have tight component headroom |
| Multiselect, three existing teams | 3 elements / 24 nodes | 38.710% nodes | 0.882–0.885% nodes | Reject proposed opt-in rollout for this consumer: 3 < 24-element floor; component also < 40% |
| Menubar, four existing commands | 28 elements / 94 nodes | 69.630% nodes | 3.455–3.467% nodes | Reject this consumer's rollout: < 5% route gate |
| Action overflow, existing five actions | Desktop 0; phone 3 elements / 16 nodes | Desktop 0%; phone 22.857% nodes | 0–0.588% nodes | Reject this consumer's rollout: < 5% route gate |
| Toast history, actual initial empty history | Optimistic whole history body 9 elements / 38 nodes | Absolute bound 9 < 50 elements | No structural percentage gate declared | Reject this consumer's rollout; no synthetic history substituted |

More removable nodes/elements and larger percentages indicate more opportunity;
these columns are reference-allocation bounds, not changes achieved by a lazy
implementation. The exact frozen per-family units and thresholds are preserved in
`plans/lazy-delivery/family-designs.json`; elements are never substituted for an
all-node threshold.

The negative route conclusions are narrow. Removing the **entire** menubar host
would save only 4.961–4.980% of route nodes, below its 5% gate. Removing the entire
overflow host would save only 2.249–2.574%, also below 5%. Those impossible-to-ship
bounds independently reject current route adoption. They do not establish that
all future menubars/overflow consumers are too small. Overflow's settled `.extra`
counts do not measure the different initial-constructor opportunity in Variant B;
`count=Infinity` alone is not a rejection of that algorithm.

## Passing bounds are not passing implementations

Media has just 0.824 percentage points above its 75% component gate. Adding a
loading/status element to the retained shell may erase that margin. Its two media
resources are already previewed data URIs; this census establishes no image-request
or optional-code saving.

Combobox's exact option subtrees contain 400 nodes/160 elements; its conservative
listbox-child upper bound contains 524 nodes because it also includes Lit repeat
markers. Both describe substantial reference allocation, but a real implementation
must count its own replacement markers and retain native input, form, validation
and active-descendant ownership.

The settings palette remains an undefined host with SSR-rendered search, results
and status. Its root/code activation policy does not eliminate those nodes. The
80-node body bound includes a 78-node content wrapper; preserving an authored slot
or wrapper reduces the actual net opportunity. No eager client constructor cost,
first-use latency, or hydration parity follows from counting that retained SSR.

Pagination's seven known-total instances each have a 24-node child-body bound,
including a 22-node `.en-pagination__jump` wrapper and five elements. The
`#api-pagination-slotted` host has 215 nodes and needs **at least 22 net nodes
removed** to clear 10%. A 20- or 21-node actual reduction fails that instance even
though the route bound passes. The other known hosts contain 199, 190, 190, 190,
190 and 197 nodes. The eighth, unknown-total host has no chooser and is N/A for the
component gate. All 42 known-instance upper-bound checks passed; no result removes
the need for exact candidate net-count and interaction qualification.

## Coverage and independent review

Two read-only reviewers independently checked the receipt and gate interpretation.
They agree on the narrow negative dispositions and the four remaining opportunities.
Actual physical phone/IME/native picker/screen-reader checks were not performed.
Phone width in a desktop engine is recorded as such. No 30-sample timing or
five-by-100-cycle retention campaign was run; such campaigns remain required for
promoted runtime changes.

The canonical tag inventory covers all 96 tags. A follow-up source review identified
a separately generated hidden `en-data-table` pager that must have its own feature
disposition; it must not be hidden under an "active pagination is essential" row.
That source/consumer design audit is tracked separately and is not qualified by this
five-element pagination-chooser census.
