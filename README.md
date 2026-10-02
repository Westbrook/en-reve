# en-reve

A private, exploratory design system for creativity and collaboration tools.
Lit custom elements share token-driven styles and Signals state/interaction
primitives. The public prefix is `en-*`; packages use `@en-reve`.

## Find the right entry point

- [Handbook](https://en-reve-docs.reve-ai-0869.chatgpt.site/guides.html): using
  controls, integrating applications, designing themes, agent contracts, and
  contributor/release workflows. Source: [guides.html](apps/docs/guides.html).
- [Live examples](https://en-reve-docs.reve-ai-0869.chatgpt.site/api-examples)
  and [API reference](https://en-reve-docs.reve-ai-0869.chatgpt.site/api-reference):
  current authored demonstrations and generated public contracts.
- [Showcase](https://en-reve-docs.reve-ai-0869.chatgpt.site/showcase) and
  [Theme Review](https://en-reve-docs.reve-ai-0869.chatgpt.site/theme-review):
  assembled applications and local candidate editing/export/reopen.
- [Portable agent skills](skills/README.md): component authoring, functional/accessibility testing,
  documentation, consumption, application building and theme authoring, versioned with the source.

The documentation's live catalog is authoritative for the current inventory;
old review counts are historical. The [consumer evidence audit](plans/consumer-evidence-audit-2026-10-02.md)
records bounded examples and reusable-layer qualification. The
[support ledger](plans/support-coverage.md) records actual platform coverage and
remaining gaps. Browser automation does not establish manual assistive-technology,
physical-device or every current-minus-one browser/OS combination.

## Reference workflows

Independent SSR pages cover sign-in, settings, chat, project selection, asset
browsing and the multi-step composition. Each uses public components and explicit
application-owned state. Source disclosures, reset controls and deterministic
service scenarios support repeatable review. These examples do not provide real
authentication, messaging, model services, file-upload transport or collaboration
backends. See the [workflow contract](apps/docs/src/workflows/shared/README.md)
and [verification guide](apps/docs/tests/README.md).

The handbook is an initial four-audience documentation pass. Managed submission
and adoption infrastructure, complete offline candidate review and comprehensive
old/new version delivery remain separate product work; the local Theme Review
editor does not supply those services. See the current
[documentation delivery checkpoint](plans/documentation-skills-2026-10-02.md).

## Local development

Use Node.js 26.10.0 Current and npm 12.1.0 (`.nvmrc` and `packageManager`). Node 24.21.0 LTS is the additional supported validation line; Node types follow that minimum. Python checks use 3.14.7 (`.python-version`). After `npm ci`, run `npm run build` and
`npm run dev:docs`. The sheet is available at `http://127.0.0.1:4180/`.
The documentation build emits the static Site into the root `dist/` directory.
It prerenders the sheet and workflows with Lit SSR and Declarative Shadow DOM, then
hydrates the rendered nodes in the browser. See `packages/ssr/README.md` for the
reusable server renderer and the verified native-editing/hydration contracts.

`packages/tokens`, `packages/styles`, `packages/primitives`, and
`packages/elements` have independent builds and focused tests. See their READMEs
and the component-family test directories for verified behaviors and limits.
`plans/` retains the specialist-reviewed architecture and pattern inventory.
Start with the [review-session plan update](plans/review-session.md) for the
current contracts, remaining proposals, and next implementation work.
`tooling/` contains isolated metadata, version-policy, and evidence utilities.

`npm run test:tokens`, `npm run test:tooling`, and `npm run test:probes` cover
their respective boundaries. Browser runs need installed Playwright engines;
set `PLAYWRIGHT_BROWSERS_PATH` when using a separate browser installation.

Packages remain private. Before1.0, `0.x.y` advances `x` for breaking or
deprecation changes and `y` for minor/patch changes. Stable releases use normal
SemVer, with minor deprecations and major removals. Source is licensed MIT.
