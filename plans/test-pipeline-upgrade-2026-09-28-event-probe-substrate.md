# Captured imports and lexical body probes — qualified optional substrate

The captured compiler now offers an explicit constructor-aware creator. It records only bounded, source-derived selected-module import edges from checked constructor graph arguments before sealing host queries. Public export identity, usage resolution mode, exact target, failed lookups and package metadata remain bound. The existing ordinary capture API retains its original behavior. The annotation helper uses this capability for exact cross-module argument representations.

The new lexical body probe inserts one erased private type alias into an exact module-level factory body. Original runtime statements, class members, signatures, generic binders, exports and AST topology remain unchanged. Annotation and actual payload expressions can now use the same replay checker binder. This is a compiler substrate, not an event-admission certificate.

The repaired bounded run passed146/146: Current26.10.0 and LTS24.21.0 each ran8 import,8 scoped-probe,13 occurrence,9 function-probe and35 captured-foundation cases. All12 commands passed, with zero failure/skip/cancel/todo. Actual53418/launchb6af05/finalf84ac0/exit0 returned resources normally at2026-09-28T03:54:33.365Z. Owner duration327.815s is diagnostic duration, not performance evidence.

The original146 attempt remains failed: actual13926/launch0718c4/final9b3557/exit1,2Currentpasses/6failures and138unrun. New imports may move a dependency earlier in TypeScript's source traversal. The old guard compared differently ordered arrays across distinct Programs. The repair compares exact file-keyed source descriptor sets, rejecting duplicate identities and retaining every byte/format/library-ownership field, unchanged diagnostics and fresh AST identity. Each Program's own ordered mutation guard remains. The same positive fixture now checks both original root orders, requires the predicted changed/equal traversal, and records scalar before/after names. Both runtime arms passed these controls; no guard or negative assertion was removed.

A separate follow-up launch typo supplied PLACEHOLDER instead of the allocation SHA. Its guard rejected before acquiring an owner, creating output or launching any child. The zero-command refusal is preserved separately. The actual follow-up used the unchanged reviewed plan with the correct pin and host permissions for its original cleanup watchdog; command/time/inactivity/retry limits did not increase.

The earlier R130 proposal was superseded before allocation and remains unexecuted. It is not additional test evidence. The first and repaired146 stages, exact plans, logs, source/runtime/dependency guards, independent reviews and handbacks are preserved additively.

This optional change does not bind actual helper package semantics, prove full dispatch flows or public visibility, emit a final surviving event contract, activate callable generation, regenerate library outputs or publish/deploy anything. Those remain required migration work. Main consumers, package policy and generator identity remain unchanged.

Focused reproduction after repository setup, using each pinned runtime and fresh outputs under the normal exclusive execution protocol:

```sh
node --test --test-concurrency=1 --test-reporter=tap tooling/metadata/captured-constructor-imports.test.ts
node --test --test-concurrency=1 --test-reporter=tap tooling/metadata/captured-scoped-type-probe.test.ts
node --test --test-concurrency=1 --test-reporter=tap tooling/metadata/captured-occurrence-annotation-scope.test.ts
node --test --test-concurrency=1 --test-reporter=tap tooling/metadata/captured-function-probe.test.ts
node --test --test-concurrency=1 --test-reporter=tap tooling/metadata/captured-compiler-program.test.ts tooling/metadata/captured-type-probe.test.ts
```
