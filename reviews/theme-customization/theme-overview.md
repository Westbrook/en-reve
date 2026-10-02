# Theme customization audit

**Current status — September 19, 2026:** THEME-01–08 are published. CSS-source authoring and the three-theme proof are accepted. Review the [remaining follow-up plan](#theme-decisions-follow-up-implementation-september-19-2026) and [delivered proof](/theme-proof.html?progress-report). The following preserves the original audit and readiness criteria, not an outstanding implementation backlog.

## Historical audit context

Status: **review and proposed decisions only. No token contracts, component styles, build transforms or theme presets were changed by this audit.**

The theme foundation is substantial, but its public contract is uneven. It already has a typed token graph, independently authored light/dark pairs, full theme boundaries, partial overrides, size and density roles, inherited CSS hooks and CSS Parts. The next step should make those layers predictable across the whole library before using three deliberately divergent themes to prove their expressive range.

This addendum extends the [custom-element API audit](/reviews/api-normalization.html?progress-report). It inspects source at `94751f96128fd50347949cdafb16735c10324c43` on September 18, 2026. The earlier audit's CSS-01–CSS-10 remain relevant; this pass evaluates the relationships among the customization layers rather than counting the same issue twice.

## What each level should let a consumer do

| Level | Available now | Contract to settle |
| --- | --- | --- |
| System theme | Compile a typed token graph; deliver paired appearances; replace the graph at a named boundary. | Complete the public hook registry and define which application inputs survive a rebase. |
| Visual concept | Change semantic color, typography, radius, spacing, border, focus and motion roles. | Explain aliases versus compiled recipes, and ensure components actually consume the intended roles. |
| Shared feature group | Use `--en-control-*`, `--en-surface-*`, `--en-overlay-*` and option-list roles. | Publish membership and precedence. A shared control name currently does not imply the same coverage in buttons and inputs. |
| Family | Specialize buttons, inputs, options, editor tokens, toasts and other families. | Provide equivalent state coverage and geometry rules where the semantics match. A family should refine shared defaults in a predictable way. |
| Component or instance | Set supported variables on a host; style exposed native surfaces through Parts. | Make the supported hook/Part contract complete through composite components. Distinguish host layout from native control paint. |
| Application region | Scope inherited variables or emit a full/partial theme for a selector. | Make dependent-token behavior explicit, preserve isolation through nested boundaries, and demonstrate shadow-root and overlay cases. |
| Exceptional visual treatment | Use ordinary CSS, light-DOM content and Parts. | Keep a supported escape hatch without requiring private shadow selectors or a fork. Not every structural constant needs a token. |

These levels are related, but they are not a single ordinary-CSS specificity ladder. A fallback expression can make a shared variable win even when the family variable is set on a nearer element. An inherited alias may already have resolved on its ancestor. Consumers need both the vocabulary and the resolution rules.

## Read the evidence

- [Hierarchy, family membership and precedence](theme-hierarchy.md)
- [Scoped themes, inheritance and runtime boundaries](theme-scoping.md)
- [Coverage, managed controls and customization gaps](theme-coverage.md)
- [CSS functions and mixins assessment](theme-functions.md)
- [Proposed decisions and cleanup sequence](theme-decisions.md)
- [Readiness criteria for three divergent themes](theme-readiness.md)

The detailed reports distinguish confirmed source differences, reproduced browser behavior, useful deliberate exceptions and proposals. This is not a claim that every customization combination has been rendered or that every missing metadata entry is a runtime defect.

## Main recommendation

Keep **ordinary CSS custom properties as the public runtime theme contract**, backed by typed semantic tokens and explicit family/component fallbacks. Add a source-backed customization registry that describes each public hook's role, consumer coverage, state behavior, fallback, reset policy and managed-editor support. Use that registry to generate documentation and checks.

Treat `@function` and `@mixin` as a possible **authoring improvement** after the hierarchy is agreed. The referenced Reve build transform can reuse expressions and declaration recipes, but it cannot add a missing control hook or make a partial token update regenerate dependent values. A bounded internal pilot is justified; adopting it as a prerequisite for consumer themes is not yet justified. See the functions assessment for source limitations and the proposed pilot.

## What happens after this review

1. Agree the theme decisions alongside the existing API decision register.
2. Repair existing promises first: hook/reset completeness, shared size/field rules, missing composite Parts and token fallbacks.
3. Implement the agreed hierarchy and state refinements with an explicit compatibility policy.
4. Prove isolation and interaction states across representative early and late components.
5. Build three strongly divergent themes using the supported public surface, record every workaround, and turn those examples into documentation.

The cleanup and three themes are recorded as follow-up work. This audit does not mark their design, implementation or user review complete.
