# En Reve application skills

These portable skills help an agent write, test, document and consume the library. They
are versioned with the source; they do not replace package contracts or authorize
publication. Each folder contains a self-contained `SKILL.md` and can be copied
into the skill directory supported by the consuming agent. No personal skill
installation is performed by the library build.

- [en-reve-component](en-reve-component/SKILL.md): author components and their
  reusable layers, registration, SSR and public contract.
- [en-reve-test](en-reve-test/SKILL.md): functional behavior and reproducible
  qualification through existing runners.
- [en-reve-accessibility](en-reve-accessibility/SKILL.md): semantics, keyboard,
  focus, preference checks and distinct manual AT evidence.
- [en-reve-document](en-reve-document/SKILL.md): documentation and executable
  examples without duplicating the API catalog.
- [en-reve-app](en-reve-app/SKILL.md): complete consuming applications with
  application-owned state, service adapters and responsive delivery.
- [en-reve-consume](en-reve-consume/SKILL.md): component discovery, explicit
  registration, authored/data composition, events, forms, SSR and verification.
- [en-reve-theme](en-reve-theme/SKILL.md): token/group/instance boundaries,
  full/partial scopes, registration policy and candidate review.

The documentation build distributes the exact files at `/guides/skills/` and
records their SHA-256 digests in `/guides/contract-index.json`. Copy each file into
its named folder as `SKILL.md`. Inspect a downloaded skill before installing it.
`en-reve-consume` provides one shared entry point and routes to element-specific
contracts and existing recipes, including the companion elements without a
primary example link. It does not require installing a separate skill per tag.
These skills intentionally route to the installed contract instead of embedding
a second component catalog. Use a documentation build matching your dependencies;
the hosted latest URL and GitHub main are mutable references.

## Responsibility boundaries

`catalog.json` is the explicit distribution/routing inventory. Select by the
requested outcome, not just the presence of an `en-*` tag. A single task may
need more than one skill, but reading a contract does not invoke its entire
workflow. No skill automatically invokes all the others.

| Request | Primary skill | Separate responsibility if needed |
| --- | --- | --- |
| Add a public component capability | component | test, accessibility, document |
| Reproduce a rollback regression | test | component for an authorized fix |
| Investigate duplicate screen-reader names | accessibility | component for implementation |
| Explain a slot or migration | document | consume for a runnable integration |
| Add a checkbox to an existing form | consume | test for requested regression coverage |
| Build a project settings workflow | app | consume for component bindings; theme for appearance |
| Change inspector-only button radius | theme | accessibility for affected contrast/target review |

The skills do not move unrelated work into scope, require an artificial sequence
of handoffs, or authorize publishing, new services or manual acceptance.
