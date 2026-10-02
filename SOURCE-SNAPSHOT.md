# Source-only GitHub snapshot

This branch preserves the source tree from `main` at `6d792eba74135f12a1e6f026ffbd1357e3391819`.
It starts a new GitHub history as requested; the original local repository and
its complete history remain unchanged.

Large historical evidence is retained locally. Execution artifacts, performance
baselines, installed dependencies, and test output directories are omitted here.
The exact omitted paths and original Git object IDs are listed in
[the export manifest](.source-export/manifest.json). Source, documentation, tests,
package locks, metadata and required checked-in vendor packages are retained.

`main` represents accepted local main. Task and archive branches preserve work
in progress or historical source; their presence does not establish qualification.
Evidence-dependent historical replay requires restoring the retained evidence.

## Performance publication — 2026-10-01

The current source now includes local main `d314733215b89149d538bce3a3f8728c2dcc0822`. This update
is a normal descendant of the previous GitHub main commit. The original
large history and regression baselines remain local. Compact comparison evidence
and the checksum-verified 2026-10-01 acquisition archive are included deliberately.
See [the publication record](plans/performance-publication-2026-10-01.md) for
qualification limits and replay instructions, and [the source mapping](.source-export/updates/performance-20261001.json) for exact changed blobs.

## Validation efficiency publication — 2026-10-01

Current source maps to local main `0bc14ea0f82c379c5d8ab3d5bdcd2df399255d32`. The user approved stopping remaining confirmation and merging. LTS controls passed; the broad Current run was intentionally stopped before completion. No complete correctness pass is claimed. See `.source-export/updates/validation-efficiency-20261001.json`.

## Tooltip context checkpoint

Local main `b5bb6064c2b4c26a7c62c71796a575c23abb664a` includes the component-qualified tooltip context implementation and generated metadata. Demo review controls and source sample remain pending; see `plans/tooltip-context.md`. This is a source checkpoint, not a completed publication.

## Tooltip context checkpoint

Local main `a277af17a110df00d582d8162d89bb28d8b7cd30` includes the component-qualified tooltip context implementation and generated metadata. Demo review controls, reset and maintained source sample pass all 12 focused browser checks; see `plans/tooltip-context.md`. Publication identity is tracked in the independent Progress Report.

## Reference Target investigation

Local main `8e7fdacfefe6ce58a9d17d23adea4d3925f9ea8c` retains the pinned-source comparison and explicit adoption gaps in `probes/reference-target/README.md`. Production field semantics remain unchanged.

## Component-owned FACE label investigation

Local main `49e71cfcab7bd1cc4a3f9ecc6c3e70fb79fb0c09` retains the component-owned FACE bridge, SSR proof and explicit adoption gaps in `probes/reference-target/README.md`. Production field semantics remain unchanged.

## Production external field labels and Reference Target SSR

Local main `138829bc35cc4c361637cf47b0cb07d4d58bab19` integrates external labels for the nine common fields, shared subscriptions and per-renderer SSR serialization. Qualification and remaining relationship/device/AT limits are retained in `probes/reference-target/README.md`.

## External checkbox, radio and switch labels

Local main `c98507742d685c186dffd271f1bf054cfe900067` extends the shared external-label bridge to native checkbox, radio and switch activation, preserving cancelable transactions and grouped-radio ownership. Qualification and remaining relationship/device/AT limits are retained in `probes/reference-target/README.md`.

## Dynamic button descriptions and platform scope reconciliation

Local main `771f0e1f1c6a24e7103f5984c84d847ccb9abe2e` keeps documented native descriptions synchronized with their host-tree targets. Platform plan status now points to delivered scoped and framework evidence, and records the explicitly retired historical CSS pilot rerun. Remaining real AT/device and broader relationship scope stays open.

## Nested and conditional Reference Target comparison

Local main `dcb52a27dd5d0007218a006ad9c7121e7f978222` completes the planned isolated description/error and active-descendant comparison, preserving the native error-routing gap and unsupported fallback relations. Production descriptions and option relationships keep their documented semantic owner. See `probes/reference-target/README.md` for evidence and limits.

## Versioned support coverage ledger

Local main `fb201d1c9be7e7559c76ed77563e1e00fb565268` adds the exact support inventory, bounded historical evidence, remaining qualification conditions and tooling consistency checks. See `plans/support-coverage.md`; support qualification remains incomplete.

## Independent packed framework consumers

Local main `53a1502115f968c7671d127543707a8e5d98b277` qualifies public package tarballs in HTML, React18/19, Vue2/3 and Svelte4/5. See `probes/framework-consumption/verification-packed-20261002.json` and its README for exact source, outcomes and limits.

## Installed browser product qualification

Local main `4a229e227d3501c1206a47a1ccd6deafb55e8352` qualifies public package tarballs across all seven consumers on installed Chrome/Edge and three pinned engines. See `probes/framework-consumption/verification-products-20261002.json` and its README for exact source, outcomes and limits.

## Current and preceding framework release lines

Local main `fc9da899dc897996fcbd3e3a6c7679ad34bac15c` qualifies public package tarballs across all ten consumers on installed Chrome/Edge and three pinned engines. See `probes/framework-consumption/verification-release-lines-20261002.json` and its README for exact source, outcomes and limits.

## Native Firefox product consumer qualification

Local main `9357f4e5500dac36ca90f5ae521a428978f166e8` qualifies three native-input contracts across ten retained packed consumers on actual Firefox157. Safari visibility remains unresolved. See `probes/native-browser-products/verification-20261002.json` and its README for exact source, outcomes and limits.

## Chrome and Edge production workflow qualification

Local main `0b935772368c40a611dc2ea15478db28d89b0e1d` qualifies SSO, settings, chat and project selection on installed Chrome/Edge.52 cases pass; two existing viewport cases remain skipped. See `apps/docs/tests/verification-products-20261002.json` and its README for exact source, outcomes and limits.

## Current and preceding Firefox qualification

Local main `7df6ba1bc6f41b54dff7df5c1f22ce51014d5bbc` qualifies30 native-input checks each on Firefox157.0 and isolated156.0.1. See `probes/native-browser-products/verification-firefox-lines-20261002.json` for exact acquisition, source, results and limits.

## Current and preceding Edge qualification

Local main `a2edb022a380992c342d1a2ebae14c189bb97f77` qualifies official isolated Edge153.0.4234.48 and154.0.4258.53:60 consumer checks and26 workflow checks per product. See `plans/support-coverage.md` and the versioned receipts for acquisition identity and remaining scope.

## Current Chrome stable qualification

Local main `ed12dc7d0cc0f60f535607b4fa849a2b1e87d0d5` qualifies official isolated Chrome154.0.8037.98:60 consumer checks and26 workflow checks. See `plans/support-coverage.md` and the versioned receipts for acquisition identity and remaining scope.

## Expanded Firefox consumer qualification

Local main `e860e5c216174d0345e55190ff9a3b55745df315` qualifies expanded native Firefox157.0 and156.0.1 consumer checks:60 per release with browser-computed field/tree names and roles. See `plans/support-coverage.md` and the versioned receipts for acquisition identity and remaining scope.

## Selected Firefox production workflow qualification

Local main `516d03caa86aeb830fc37b4d953c526e0ac421d6` qualifies11 selected production workflows and60 native consumer checks per Firefox release. See `plans/support-coverage.md` and the versioned receipts for acquisition identity and remaining scope.

## Expanded Firefox recovery and navigation qualification

Local main `d85cdee616e2f012379857783ba62a8297fb42b6` qualifies20 selected production workflows per Firefox release; the unchanged transport retains prior consumer evidence. See `plans/support-coverage.md` and the versioned receipts for acquisition identity and remaining scope.

## Firefox first paint and hydration qualification

Local main `366469ad70261235f60cac863f3330cf34c2f581` qualifies170 first-paint, consumer and workflow cases across two Firefox releases. See `plans/support-coverage.md` and the versioned receipts for acquisition identity and remaining scope.

## Firefox accessibility and narrow-layout qualification

Local main `9d57602ce0e688202f3e7374050339c585b4ba7d` qualifies44 workflow cases and16 scoped axe scans across two Firefox releases; incomplete contrast findings remain open. See `plans/support-coverage.md` and the versioned receipts for acquisition identity and remaining scope.

## Firefox history and legacy-navigation qualification

Local main `892bc63abc2358589697c5a0befcbfb660633a4d` qualifies176 fresh workflow/first-paint/consumer cases across two Firefox releases, including native history and legacy-query normalization. See `plans/support-coverage.md` and the versioned receipts for acquisition identity and remaining scope.

## Firefox readiness and validation relationships qualification

Local main `edef0ec0c13f78c627bee0056e7f9acadf8dfde6` qualifies56 fresh workflow/first-paint cases across two Firefox releases, including eager child readiness and native validation/focus relationships. See `plans/support-coverage.md` and the versioned receipts for acquisition identity and remaining scope.

## Firefox pending-state and focus interactions qualification

Local main `db8d826c013633251f30e8ba846d3152a654ca20` qualifies46 fresh workflow cases across two Firefox releases, including pending-card identity, delayed focus protection, cancellation and document isolation. See `plans/support-coverage.md` and the versioned receipts for acquisition identity and remaining scope.

## Packed native ESM and SSR delivery qualification

Local main `a22b13b69b19a08df68119e3e7b65edb7c769295` qualifies21 native ESM cases and53 packed consumer cases, with1 native-registry capability skip. See `plans/support-coverage.md` and `probes/consumer-contracts/verification-20261002.json`. Original platform/manual scope remains.

## Native Firefox document response qualification

Local main `dc53b83b41e912cbf3a88aeaff527c1f74e2fa2d` qualifies178 fresh native Firefox cases and119 tooling checks. Browser-observed HTTP/redirect and no-JS navigation controls added. See `plans/support-coverage.md` and `probes/native-browser-products/verification-firefox-documents-20261002.json`. Physical/manual and other-product scope remain.

## Consumer evidence audit

Local main `15ea0cb00c082b9f0adfa1b5c1306a6557a3072f` maps packed native ESM, framework and SSR evidence separately from remaining reusable-layer, generated-example and machine-discovery requirements. See `plans/consumer-evidence-audit-2026-10-02.md`. No new browser qualification or completion claim.

## Metadata-driven packed consumer

Local main `7801a8daa781a78de74c69fa5f50b4b907cbb70b` qualifies CEM discovery, API retrieval, generated public consumer source, strict declarations and9 real browser cases.11 generation controls,14 pathway controls and120 tooling checks passed. See `tooling/metadata/README.md` and `tooling/metadata/verification/consumer-20261002.json`. Remaining layer/example and platform/manual requirements stay open.

## Packed reusable layers

Local main `9d2138dc9b32f386fce49e4fc4105cd3666678e6` qualifies 48 isolated packed-layer browser cases,17 pathway/inventory controls,36 existing-owner cases and121 integrity checks. See `probes/reusable-layers/README.md`. Remaining layer/example and platform/manual requirements stay open.

## Packed native content/navigation recipes

Local main `3f2990e6efaad50fd268366c34aed1e62736bb35` qualifies 78 packed browser cases across Lit and portable CSS,39 original-owner cases and18 pathway/inventory controls. 112 owning primitive and122 integrity checks pass. See `probes/native-recipes/README.md`. Remaining layer/example and platform/manual requirements stay open.

## Packed table and virtual collection recipes

Local main `2ced899c675ef6ca06ed9333f45b7b20be14263b` qualifies maintained table/list and document-scroll applications through isolated public tarballs. See `probes/collection-recipes/README.md` for exact scenarios and limits. Remaining public-layer, generated-example and manual/platform obligations stay open.

## Copied examples with packed declarations

Local main `6dec4ea611fd2262c35c3cdf1fe1ed09cae7d133` qualifies59 copied modules against packed declarations and eight native consumer examples across three pinned engines. See `apps/docs/tests/README.md` for exact scenarios and limits. Remaining public-layer, generated-example and manual/platform obligations stay open.

## Complete API copy consumer journeys

Local main `a4d85f16d66e3e10394a147c3809e3238bf119d3` qualifies59 copied modules against packed declarations and seventeen native source consumers across three pinned engines, covering all eleven complete API copies. See `apps/docs/tests/README.md` for exact scenarios and limits. Remaining public-layer, generated-example and manual/platform obligations stay open.

## Gallery consumer journeys

Local main `a7ffdfa251f2d91d97d9626b568a7b48974f9cce` qualifies59 copied modules against packed declarations and38 native source consumers across three pinned engines, covering27 gallery copies and all11 complete API copies. See `apps/docs/tests/README.md` for exact scenarios and limits. Remaining public-layer, generated-example and manual/platform obligations stay open.

## Standalone gallery presentation

Local main `7604e82f729db3fc4d227fd393b7371ae6432566` qualifies59 copied modules against packed declarations and47 native source consumers across three pinned engines, covering36 gallery copies and all11 complete API copies. See `apps/docs/tests/README.md` for exact scenarios and limits. Remaining public-layer, generated-example and manual/platform obligations stay open.

## Standalone gallery navigation and content

Local main `d23dc3dc409dce8ef92bd72e23cd13ed98a3f3e8` completes the displayed-copy inventory:59 modules compile against packed declarations and execute native consumer journeys across three pinned engines. See `apps/docs/tests/README.md` for exact scenarios and limits. Remaining public-layer and manual/platform/owner obligations stay open.

## GitHub build snapshots

Local main `f186cb6fb3c42d477e5f20c11f279a3bd238cd6a` adds the qualified gh-pages snapshot publisher and standing publication instructions. See `tooling/publishing/README.md`. Build assets stay on their own branch and never import the original source/evidence history.

## Packed projection consumers

Local main `661aac8552dd939c65e18ae23c40a3ea2b3657f6` qualifies four public navigation/selection projection entries in application-owned native compositions. See `probes/projection-recipes/README.md` for36 browser cases, exact scope and remaining obligations.

## Packed form consumers

Local main `9a84dcebf0dbd1ccd99a468f49ffb6c2ebf74f12` qualifies six public form projection/constraint/style entries in application-owned native compositions. See `probes/form-recipes/README.md` for72 browser cases, exact scope and remaining obligations.

## Packed state consumers

Local main `8c3fe212837d1277091e95accaed0f800c0bd94a` qualifies five public state/registration entries in application-owned native compositions. See `probes/state-recipes/README.md` for48 browser cases, exact scope and remaining obligations.

## Packed presentation consumers

Local main `71d0534abc33589ee198f1af1ad7c29200a9ea44` qualifies fourteen public presentation entries in application-owned native compositions. See `probes/presentation-recipes/README.md` for114 packed browser cases and32 gallery regressions, exact scope and remaining obligations.

## GitHub build base URL

GitHub-only HTML snapshots include the requested https://westbrook.github.io/en-reve/ base. Qualified private Site output is unchanged.

## Packed calendar consumers

Local main `49e642d8f15a27922f75cf09237a5658ce65af82` qualifies three calendar helper/style entries through120 native date/range cases. See `probes/calendar-recipes/README.md` for scope and browser limits.

## Packed tree consumers

Local main `add3b12b53effdb4581b3a79d2407e9ddf1b4505` qualifies four tree helper/style entries through120 native interaction cases. See `probes/tree-recipes/README.md` for scope and browser limits.

## Packed notification consumers

Local main `e5ec420ac6b5bd327858aa2e75c29c718ecf1ca2` qualifies seven notification helper/style entries and corrects portable feedback sizing. See `probes/notification-recipes/README.md` for scope and browser limits.

## Packed native collection styles

Local main `8455c55b569265491cbf5dddf009757ca552befe` qualifies five collection style entries and adds a native table wrapper. See `probes/collection-style-recipes/README.md` for scope and browser limits.

## Packed native choice and overlay styles

Local main `f179e86869c77c53c088a7ceeff2a0fecd6e3f94` qualifies ten additional choice, command and overlay style entries. See `probes/choice-overlay-recipes/README.md` for scope and browser limits.
