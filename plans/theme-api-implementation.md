# Theme API recommendations implementation

All eleven recommendations in the theme refresh report are in the implementation scope. The [authoring contract](theme-api-authoring-contract.md) documents the delivered API and its exact boundaries. The exact validation result and build identity are recorded in the release-gate receipt described below.

| Recommendation | Implementation |
| --- | --- |
| Complete authoring contract | Supported layers, portable source versus exact-build evidence, migration notes and nine-theme release corpus. |
| Portable companion recipe | `createThemeCompanion`, fixed targets and variants, typed hook assignments, deterministic identity, nested-boundary exclusion and explicit installation. |
| Pressed presentation/defaults | Typed state hooks; bounded whole-button motion/elevation/timing; stable layout allocation; disabled/theme-specific popup/group/reduced-motion exceptions; distinct family feedback. |
| Rendered relationships | Explicit samples and alpha compositing; pass/fail/unknown results; retained consumer/state evidence. |
| Hook impact | Opt-in unknown-component warnings; editor impact disclosure; refreshed source/CEM registry. |
| Consumed provenance | Validated role records with source URL/hash, selector, appearance and measured viewport; Fluent/Radix records retain source distinctions. |
| Field geometry | Narrow radius, border width and rest/hover/invalid paint; shared control fallbacks; number-frame and combobox compensation. |
| Navigation/tab recipes | Independent hover/current/selected/pressed paints, tab indicator color and optional navigation marker. |
| Surface/type detail | Surface/card shadows; bounded font style and px/rem tracking; Vellum, Signal and Fluent demonstrations. |
| Motion/composites | Popup/dialog/toast phase profiles and independent choice/switch anatomy. |
| Font/responsive delivery | Licensed asset manifest verification, fallback measurements and application-owned responsive strategy. |

The Showcase and shared site typography consume style/tracking after their font shorthands, so Vellum’s italic heading and Fluent’s heading tracking appear in the actual theme demonstration.

Existing component semantics are retained. The separate five-library component roadmap, Display-P3, generalized fluid token expressions and automatic font downloading remain outside this scope. The follow-up [press correction](theme-press-correction.md) moves the complete button and makes popup exceptions theme-specific. This supersedes the original content-only adaptation.

## Evidence and corrections

The release gate is retained in `artifacts/theme-api-v1/verification.json`, with its exact build identity and individual suite receipts. It includes the token suite, nine-theme catalogue transport, source/font provenance verification, customization and public API metadata, document/font delivery, the existing state-paint compatibility suite, the new theme API browser matrix, and the complete retained theme-refresh browser corpus.

The rendered relationship matrix samples the default theme plus all nine retained themes in light and dark: 740 relationships per browser. The verified matrix records **720 passes, 20 explicit unknowns and zero failures in each engine**. It covers field rest/hover/invalid, selected options and selected-hover/held combinations, links, four status/toast roles, all four button variants, and the actual adjacent surfaces of offset focus outlines. Disabled text is recorded separately; deliberately image-backed samples remain unknown. The machine-readable receipts retain the sampled layers, consumer/state identity and ratios. A positive outline offset exposes the parent surface on both sides; an inset outline samples its inner surface separately.

The initial smaller matrix found nine failures in each engine: six success/warning badge combinations in Spectrum/Radix and three danger-button held combinations in Astryx/shadcn/Radix. Status badges now use the surface paired with their status ink; danger buttons invert that ink/surface pairing while held. Explicit authored hooks still take priority. The existing compatibility suite also caught a broad button-background pin being mixed by the new default; the explicit broad pin now wins. The expanded held-family check found native `.en-option` missing the shared paint recipe and navigation specificity hiding press feedback; both consumers are corrected. The native option recipe also retains its previous visible keyboard-candidate fallback when no explicit active-background hook is authored.

Browser checks exercise actual pointer-down and held Space states, whole-button transforms with stable layout allocation, immediate focus, disabled controls, theme-specific closed/open popup treatment, explicit group opt-outs, reduced motion, forced colors where available, narrow/RTL/200% text, field value retention, companion isolation and composite anatomy. Source/selector/edit/undo/export/reopen tests retain all nine recipes and both branch baselines. These checks establish the tested contracts, not pixel equivalence to reference systems or a blanket accessibility certification.

## Deliberate boundaries

- Press movement affects content, not the native hit surface or focus contour. Slotted icons may need a public Part treatment. Astryx's whole-button shrink and Radix's filter/material effects are documented adaptations rather than identical reproductions.
- Companions support three fixed target families, four explicit button variants and registered typed hook assignments. Auto appearance must resolve to an explicit light/dark boundary. Arbitrary CSS, Parts rules and assets remain trusted application code, never executable imported review data.
- Field invalid-width compensation remains the single-line text/combobox treatment. Other frames receive the narrow radius, border and state paints without forcing identical anatomy.
- Native popup/dialog motion requires discrete display/overlay support. Browsers without it retain immediate visibility/dismissal. Removing a toast node cannot animate its absent exit; retain it through the hidden transition when that effect is needed.
- The Firefox touch protocol reaches bare native buttons but fails on a minimal slotted shadow button as well as the library button. The tests probe that capability explicitly. No-hover pointer-held paint is tested separately; real-device held touch and assistive technology remain unqualified. WebKit's unavailable forced-colors emulation is a documented skip.
- Figtree, Geist and Geist Mono assets and licenses are hash-checked; loaded and explicit fallback text widths are retained per engine. Local-only proprietary families, responsive type rules, variable font axes, fluid expressions and P3 remain application delivery or future API concerns.

The separate five-library component roadmap is still a proposal. This implementation does not add those components or declare the first official release. Existing THEME-02/06 migration guidance remains in force; token-kind consumers must handle `fontStyle`, and the new default held paint is an intentional visual change.
