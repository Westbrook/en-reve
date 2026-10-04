---
name: en-reve-consume
description: Integrate an existing En Reve component into an application through its installed public imports, properties, events and slots. Use for individual component consumption; application architecture, new library components and theme design have separate skills.
---

# Consume En Reve

## Responsibility

Own: Select and wire existing public component APIs inside an application.

Whole-application routing, service adapters and workflow state belong to en-reve-app. New library components belong to en-reve-component. Theme design belongs to en-reve-theme. Keep a one-control integration a one-control task.

Load another skill only when that separate responsibility is needed for the user's
request. References provide contracts; they are not an instruction to execute
another entire workflow.


Use the application's installed `@en-reve` versions and its existing framework,
state ownership and delivery choices. Locate `@en-reve/elements/package.json`
and the matching `custom-elements.json`, `public-api.json`, and
`public-types.json` before choosing a component API. In a source checkout these
live in `packages/elements/`; the documentation publishes them at its root.
Do not assume hosted latest documentation matches the installed package.

For integration examples, begin with the [handbook](https://en-reve-docs.reve-ai-0869.chatgpt.site/guides.html#developers).
Find runnable examples through `/api-examples` and retrieve exact contracts through
`/api-reference?component=en-<name>`. The hosted `/guides/contract-index.json`
contains artifact digests and guide/skill locations, not a blanket support claim.
When offline, use the matching package README, declarations and component guide.

## Find guidance for the selected element

Start with the exact tag, not a similarly named component in another library.
In the matching `public-api.json`, find its `components` record and use its
public import identities; retrieve attributes, properties, events, slots, Parts
and CSS properties from the corresponding CEM declaration. Follow referenced
types in `public-types.json` for event details and data/rendering contracts.
These generated artifacts are the per-element API reference, not a recipe.

In a source checkout, look for `packages/elements/src/<name>/README.md` and the
component's owning examples. Not every element has its own README or isolated
example page. A missing primary example link does not mean the element is
unsupported or has no guidance. For these compositions, use the existing recipes:

| Elements | Recipe in the matching documentation build |
| --- | --- |
| `en-checkbox-group`, `en-choice-option`, `en-multiselect`, `en-tag`, `en-toggle-button`, `en-toggle-group` | [Choices and authored options](https://en-reve-docs.reve-ai-0869.chatgpt.site/component-patterns.html#choices) |
| `en-otp-field`, `en-range-slider` | [Field composition](https://en-reve-docs.reve-ai-0869.chatgpt.site/component-patterns.html#fields) |
| `en-context-menu`, `en-hover-card` | [Contextual surfaces](https://en-reve-docs.reve-ai-0869.chatgpt.site/component-patterns.html#context) |
| `en-action-overflow`, `en-selection-collection` | [Selection with independent actions](https://en-reve-docs.reve-ai-0869.chatgpt.site/component-patterns.html#collection) |
| `en-menubar`, `en-sheet` | [Commands and destinations](https://en-reve-docs.reve-ai-0869.chatgpt.site/component-patterns.html#navigation) |
| `en-chart` | [Feedback and measurement](https://en-reve-docs.reve-ai-0869.chatgpt.site/component-patterns.html#feedback) |
| `en-query-builder` | [Structured query](https://en-reve-docs.reve-ai-0869.chatgpt.site/component-patterns.html#workflows) |
| `en-questionnaire` | [Questionnaire](https://en-reve-docs.reve-ai-0869.chatgpt.site/component-patterns.html#questionnaire) |
| `en-transcript` | [Conversation following](https://en-reve-docs.reve-ai-0869.chatgpt.site/component-patterns.html#transcript) |
| `en-media-viewer` | [Media viewer](https://en-reve-docs.reve-ai-0869.chatgpt.site/component-patterns.html#media) |
| `en-splitter` | [Split-view composition](https://en-reve-docs.reve-ai-0869.chatgpt.site/api-examples/split-view) and `packages/elements/src/split-view/README.md` |

The pattern recipes above are authored in `apps/docs/src/component-patterns.ts`;
its section IDs match the links. Use that file when offline. Treat its gallery-wide
registration and status reporting as demo infrastructure: register only the
application's selected components and authored children. For other elements,
follow the API reference's primary example and its source sample. Read only the
selected recipe and relevant contracts; do not load the whole library catalog
into a one-component task.

The split-view recipe owns and registers its internal splitter. Use the standalone
`en-splitter` API when the application itself owns pane sizing; do not query or
bind to the split view's private separator.

A recipe explains one composition. Check the specific element's contract before
transferring an event payload, selection model, renderer wrapper, or focus rule
from a sibling. For complex editor extensions, virtual collections, or overlays,
read the family example and owning guide before composing the child elements.
If matching docs are unavailable, use installed declarations and report what
cannot be established instead of silently substituting hosted latest APIs.

## Choose the smallest supported composition

- Register explicit `@en-reve/elements/define/<name>.js` entries for a global
  registry. Class, definition, catalog and main-barrel imports register nothing.
  For an existing scoped/lazy application, keep its registry and preparation
  pathway; consult `packages/elements/SCOPED-REGISTRIES.md` and its README.
- Generated children are definition dependencies. Authored children still need
  their own explicit registration, including menu items and editor extensions.
- Load `@en-reve/tokens/default.css` through the application's stylesheet pipeline.
  Native import maps resolve JavaScript, not CSS URLs. Resolve the actual installed
  CSS asset, rather than inventing a browser URL containing a bare package name.
- Prefer authored slots for application-owned content; use data APIs for the
  documented collection contract. Keep keys stable. Do not nest a second row,
  cell, slide or activity wrapper inside a renderer that already supplies one.
- Use supported public exports. An importable private deep path is not a supported
  API. Reuse pure primitives or styles only with their documented semantic and
  interaction requirements; CSS alone does not implement a widget.

## Preserve ownership and native behavior

Read the selected event's contract. Tentative state changes generally use
synchronous cancelable events; programmatic authoritative writes are silent.
Check the event owner when descendants can emit the same bubbling event.
Cancel before awaiting an asynchronous decision, guard stale completions, and
apply only the still-current result. Do not add a second committed event or the
removed `controlled` / `en-request-change` protocol. `en-action`, draft events,
load response events and calendar notifications intentionally differ: consult
that component's event type and behavior record instead of guessing a payload.

Keep native editing drafts and composition intact. Do not repeatedly overwrite a
field's live value during typing. In a library extension, `EditingController`
owns this boundary. SSR hydration must adopt supported pre-upgrade edits instead
of rerendering the whole form. Server requests need their own state and matching
initial client snapshots; browser setup must not leak into pure imports.

Name the actual control using its documented label API; use a named label slot for
multiline choice markup. Keep interactive help in the supported description slot,
not inside a noninteractive label. External `for` references resolve in the same
Document or ShadowRoot. Do not promise cross-root labeling without its documented
native/fallback conditions. Preserve focus recovery when removing virtual content
or closing an overlay. Applications own transport, persistence and failure policy.

## Customize and verify

Use documented Parts and `--en-*` properties, not private shadow classes. Style
application-owned slotted content with ordinary application CSS. Read
`en-reve-theme` for coordinated themes; a one-off documented Part override does
not require a theme rebuild.

Exercise the requested consumer behavior and its relevant cancellation/recovery
path. Reuse the application's test harness and the repository's supported test
entrypoints when working here. Record actual package, browser and fixture scope;
a DOM accessibility snapshot does not establish VoiceOver speech or physical IME.
A passing generated manifest does not establish consumer behavior. Keep known
platform gaps visible, and do not publish, change package versions or install a
new service merely because this skill was used.
