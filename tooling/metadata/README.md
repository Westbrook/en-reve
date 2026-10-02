# Source-backed CEM generation

## Metadata-to-consumer qualification

The maintained `metadata-consumer` pathway verifies the chosen machine-readable
access path without introducing a CLI or MCP product. After the pinned workspace
setup (including `npm ci --prefix showcases/performance` for its locked esbuild):

```sh
tooling/test-pipeline/with-toolchain.sh npm run test:plan -- --pathways=metadata-consumer
EN_EXECUTION_OUTPUT=/absolute/new-run tooling/test-pipeline/with-toolchain.sh npm run test:union -- --pathways=metadata-consumer
```

The pathway performs the normal freshness checks and package/metadata producers,
then packs elements, primitives, styles and tokens. It queries the packed CEM
for writable checked/name properties, `en-change` and a label slot; retrieves
the selected checkbox's public graph and type snapshot; verifies their identities;
and generates a small TypeScript consumer using the described selective imports,
attribute/default mapping, slots, Part and event type. This is a bounded recipe,
not a promise to generate an application from every arbitrary CEM.

The generated consumer compiles against the unpacked public declarations.
Deliberately incorrect assignments must fail with the exact expected diagnostics.
The minified browser build rejects workspace sources and broad catalog imports;
actual Chromium, Firefox and WebKit checks exercise accessible naming/description,
Part customization, pointer/keyboard changes, tentative FormData, synchronous
cancellation, silent author writes, native reset and disabled omission.

Evidence under `evidence/direct_metadata-consumer/metadata-consumer/` retains
discovery results, retrieved API, generated source, type resolution, tarball
identities, compiler diagnostics, bundle inputs and individual browser outcomes.
The [October 2 receipt](verification/consumer-20261002.json) records nine browser
passes, 11 generation controls and 14 pathway controls. It does not qualify
every generated example, every reusable layer, retail browser products or
manual assistive technology. The original failed compiler-exit assumption is
retained separately from the successful run.

## Generation commands

```sh
node tooling/metadata/generate.ts --help
node tooling/metadata/generate.ts packages/elements custom-elements.json src/button/element.ts
node tooling/metadata/generate-elements.ts
node tooling/metadata/generate-elements.ts --check
node --test --test-concurrency=1 tooling/metadata/metadata.test.ts tooling/metadata/public-contract.test.ts
```

Supply actual source paths relative to the chosen source root, including relevant local bases and definition modules. Empty selections, missing or escaping files, invalid syntax and unsupported declaration forms fail explicitly. Extraction never imports component classes or executes registration.

The maintained `generateCem` entry point delegates to the WC Toolkit adapter. Core, Lit and utilities use the explicit TypeScript 6 API from `compiler-api.mjs`; the wrapper and effective compiler are separately fingerprinted. Workspace builds and production typechecks use TypeScript 7 through `node ../../node_modules/typescript/bin/tsc` in workspace package scripts. The compatibility alias also installs a `tsc` binary, so bare `tsc` or `npx tsc` does not establish the build compiler identity. Record the root launcher and its native executable separately from the metadata API.

Private, reproducible compatibility archives retain the pinned upstream distributions and license notices. Their source manifests, overlays and build instructions are in [vendor/README.md](vendor/README.md). They are local patch versions, not upstream releases. Strict invariants, exported-type validation and detector conflict rejection remain enabled.

## Extraction and provenance

The adapter creates a coherent compiler Program for exactly the selected sources and confirms the generator actually visits that membership. Local superclass and import aliases resolve to their declarations. External superclass references retain package and declaration-module ownership. Lit detection uses the actual installed `LitElement` declaration, including renamed and namespace imports, direct `lit-element` imports and generic local class bases. Same-name local classes cannot acquire Lit ownership.

Lit owns reactive member semantics and source-aware slot/Part extraction. The explicitly installed vanilla detector preserves other native contracts, including `observedAttributes`, CSS properties and states, and rejects contradictory facts. Function-local classes are not module declarations. Recursively ambiguous class names fail rather than allowing a nested class to overwrite a top-level declaration. In Lit extraction, dynamic slot/Part names and fake markup inside quoted attributes or comments do not become static contracts.

`lit-contract.ts` preserves actual visibility, source types, getter/setter compatibility, readonly fields, concrete overrides and internal/state exclusions. `@outputAttribute` describes reflected output state without introducing an author-writable attribute. Authored `@omit-csspart` / `@omit-part` exclusions survive as the narrow `x-en-reve-omitted-css-parts` extension; inheritance-aware consumers honor those exclusions while allowing an explicit child declaration to reintroduce a Part. Malformed exclusions fail.

New output uses CEM schema 2.1.0 and receipt schema 2 with kind `cem-generation`. The receipt records selected source digests, generator implementation, distribution/compiler identities, extraction policy, literal unions, topology, source-backed corrections and the manifest digest. The retained `--check` path verifies those identities and re-extracts the decorated manifest in memory, detecting changed imported declaration bodies and newly resolvable imports even when selected source bytes are unchanged. Verification never rewrites retained artifacts. A generated manifest is not proof of complete API documentation or browser behavior.

## Elements and public contracts

`generate-elements.ts` discovers production sources while excluding tests, fixtures, declarations, configuration and generated files. It reads the explicit catalog and canonical definition graph through the compiler AST. Cycles, duplicate copies, missing definitions, mismatched tag maps and registration bypasses fail. Every intended catalog class/tag must agree with the emitted manifest.

`event-contracts.ts` validates source `@fires` types in their import scope, rejects missing or bare `any`/`unknown` details, checks direct dispatch payloads and classifies authored internal events. Receipts include source-backed coverage findings, shared size contracts and named label-slot membership. Zero metadata counts are findings to review, not fabricated documentation or automatic claims of failure.

`npm run metadata` produces the CEM and receipt, `public-types.json`, `public-api.json`, lazy definitions and customization evidence. The type snapshot has its own schema and captures exported interfaces, aliases, generic/mapped/recursive types, signatures and type/value export distinctions through the explicit API compiler. `metadata:types` and `check:types` regenerate or verify that snapshot. `metadata:api` and `check:api` join or verify the CEM, types and canonical definitions in one public graph. Preserve the complete sibling artifact set.

Docs, customization and release consumers verify the matching provenance. Release comparison continues to accept maintained historical CEM 1.0.0 subjects as well as 2.1.0; an unknown schema must never become an empty successful comparison. Public visibility and source ownership determine exposed contracts. `public-policy.ts` explicitly declares supported root, component, registration, definition, catalog, context, editor-extension and event-type entries. Other wildcard/deep exports remain importable but are unsupported implementation paths. Metadata does not narrow package exports or replace the owning behavior, accessibility, rendered Parts, event and consumer tests.

## Fresh comparison and qualification

```sh
node tooling/metadata/generate-candidate-elements.ts <fresh-output-directory>
node tooling/metadata/generate-candidate-public.ts <fresh-output-directory>
node tooling/metadata/candidate-compare.mjs <baseline-cem> <candidate-cem> <fresh-output-directory>
```

The candidate-named commands use the same maintained producer and reserve caller-owned outputs instead of replacing retained artifacts. Public generation produces matching CEM/receipt, TypeScript snapshot and public graph. Both commands reject existing output directories. Public-bundle generation also rejects physical paths inside the elements package; failed attempts retain their failure status. Comparison separates schema/source provenance and ordering from semantic changes; types, defaults, visibility, inheritance, references and missing fields are not silently normalized.

`generateCandidateAPIReference({workspaceRoot,bundleRoot,outputRoot})` produces docs assets in a fresh physical directory outside the workspace. `createCandidateCoverageReport({root,bundleRoot})` returns customization coverage without replacing retained evidence. Both independently regenerate and verify the full bundle, compiler ownership and dependency-query trace. A rejected docs bundle leaves its output directory reserved without rendered assets. Use a new directory for each attempt.

Run qualification through the allocated bounded owner with exact source/build identities and fresh receipts. Allocate a fresh caller-owned `TMPDIR` outside the implementation workspace for candidate-consumer fixtures, so workspace-boundary and existing-output checks exercise separate conditions. Passing fixtures do not qualify a full browser matrix or release. Promote regenerated retained artifacts only after reviewing their semantic differences.

The maintained producer and active Phase6 preparation now use the same explicit TypeScript 6 API; the root legacy analyzer and its scoped override are removed. Historical preparation applies a hash-bound compatibility overlay only to fresh caller-owned stages, preserves the archived commit and lock, and records original/executed files. Its metadata-only Parts policy is separate from product source. See the [migration checkpoint](../../plans/cem-migration-2026-09-26.md) for exact semantic changes, clean-install and Current/LTS evidence, and remaining qualification. Callable/mixin factories remain explicitly rejected; ordinary named-class inheritance is supported. Archived release comparison code is not qualified by a successful active replay.


## Explicit compatibility limits

Anonymous default functions and callable/mixin superclass factories are not supported by this adapter and must fail before a manifest is returned. Callable/mixin support remains unfinished: upstream Lit discovery selects nested implementations by spelling, places mixin fragments in the consuming module and does not prove returned-constructor ownership. Strict provenance and ordinary function/variable supplementation need a coordinated implementation before those inputs can be accepted. There are no callable superclass factories in the current selected library sources. Rejection tests establish the boundary; they do not establish mixin support or full migration completion.

External library declarations remain opaque where their actual package/platform class ownership is proven. Production typechecks, exported source contracts and consuming-scope round trips still provide independent correctness checks. Keep unresolved constraints and all unrun tiers visible in the upgrade report rather than treating a successful extraction as complete acceptance.

`metadata:lazy` also joins the strict canonical definition graph with authored
`delivery-inventory.json` and `delivery-policy.ts`. It produces the inert typed
`delivery-catalog.ts` and the small internal profile policy consumed by selectors;
the selectors do not import the full discovery catalog. `check:lazy` verifies all
three generated siblings before regeneration. Exact tag/dependency coverage,
unique versioned feature IDs, classified cost axes and agreement between supported
preparation policy and inventory are mandatory. Historical audit receipts remain
in the tooling inventory and plans, outside the compact public runtime metadata.
