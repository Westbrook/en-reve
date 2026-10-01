# Local CEM compatibility patches

These private local archives retain the latest upstream releases verified on September 26, 2026: core 0.1.10, Lit 0.1.11 and utils 0.1.3. Core is explicitly versioned `0.1.10-en-cem.14`, Lit `0.1.11-en-cem.5` and utils `0.1.3-en-cem.6`; they are not upstream releases. MIT notices and all unchanged upstream distribution files are retained.

`source.json` records the npm archive URL, integrity, verification date and reason. `upstream.tgz` is immutable. `overlay/dist` contains the reviewed changed source modules. Rebuild with `python3 tooling/metadata/vendor/build.py`; verify byte reproducibility with the same command plus `--check`. npm installs the resulting archives through root file dependencies and the generated lockfile. Root overrides bind the Lit plugin to the same core and utils copies. Runtime identity hashes every distribution module and checks these resolutions.

Core repairs strict type validation to use originating compiler symbols, follows namespace exports by identity, and corrects inferred method return types. Inherited external members are opaque only when their declarations belong to actual package/platform ancestor classes. External base defaults remain dependency-owned; explicit heritage arguments and all project-local defaults remain strict. Utils preserves call, construct and index signatures, including precedence inside arrays and unions. The candidate adapter filters authored Lit state/internal contracts before validation. Strict invariants and export validation remain enabled.

Regression commands are `node --test --test-concurrency=1 tooling/metadata/provenance.test.mjs tooling/metadata/extraction-regressions.test.mjs tooling/metadata/wc-toolkit.test.ts` under each retained runtime. The maintained producer uses this adapter. Full generation and semantic/public-contract qualification remain required before accepting the migration.

Core retains getter-only readonly and getter documentation across accessor order. Lit supplements source properties without allowing absent metadata or converter constructors to erase/narrow types, defaults or visibility; explicit attribute suppression remains authoritative. Generated attributes retain the declaring member inheritance origin.

Core extracts only direct constructor assignments and never evaluates component code. Slot discovery distinguishes missing, literal and unresolved dynamic names. Lit preserves inherited constructor defaults, declare-only property defaults, inherited documentation and attribute deprecation.

Inferred and parsed types retain the consuming source node, including nested return and callable structures, so external types cannot silently become same-named DOM or local types. Explicit source annotations remain authoritative.

Parsed types group callable, constructor and conditional constituents at composition boundaries. Text resolution and equivalence split only TypeScript-parsed top-level operators; nested return unions and generic arrows retain their meaning. Library types remain opaque.

Structural expansion uses the owning compiler printer. Readonly properties/tuples, optional and rest tuple elements, mapped modifiers, method variance, accessors, computed names and instantiated generic arguments retain their contracts. Nested named types may stay aliases; a redundant expansion is omitted while the primary type remains unchanged.

Primary type whitespace compaction is retained only when reparsing proves equivalent structure and literal contents. Newline/comment-sensitive syntax stays authored. Optional singleton true/false contracts are not widened to boolean by union formatting.

Core can omit only its automatic vanilla detector; strict merging and CSS detection are unchanged. The maintained adapter installs vanilla explicitly after semantic Lit ownership, preserving native contract rows and rejecting incompatible overlap. Lit eligibility and its external framework boundary are tied to the actual installed LitElement declaration in the owning Program.

The current local cohort includes exact own-constructor extraction and provenance hooks, source-owned event dispatch recognition, and direct JSDoc parsing. These hooks support the independently qualified composition fixtures. The maintained generator still rejects callable heritage until its selective integration is qualified; ordinary metadata remains on the established route. Archive source manifests enumerate every overlay file and the builder rejects omitted or duplicate entries.

Core .13 adds an optional exact class-node selector to the vanilla detector. The hybrid adapter uses it to preserve completed ordinary rows while extracting callable constructors by source identity. Default detector behavior is unchanged; selective producer qualification is recorded separately from the already qualified projection seam.
