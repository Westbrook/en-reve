# Inspired popup motion

The four canonical light/dark pairs now carry the following identical motion inputs per pair. These extend the existing reviewed palettes, typography, focus and geometry; they do not change the library’s immediate-motion defaults or adopt any inspired theme. [Provenance](./popup-motion-provenance.json) records pinned sources, byte hashes, exact edits and pending validation.

| Pair | Enter / exit | Enter / exit easing | Modal offset / scale | Evidence and adaptation |
| --- | --- | --- | --- | --- |
| Spectrum 2 | 200 / 200 ms | CSS ease-out / ease-in | 4 px / 1 |Pinned S2 Popover uses 200 ms and a 4 px placement nudge. Applying that nudge to modal surfaces and selecting native CSS easing curves are explicit adaptations. |
| Fluent | 200 / 150 ms |`(0,0,0,1)` / `(1,0,1,1)` | 0 px / 1 |Published normal/fast durations and midpoint decelerate/accelerate curves. Assigning them to shared popup entry/exit is an authored recipe, not an observed universal Fluent component rule. |
| Astryx | 230 / 130 ms |Live `ease.standard` alias, currently `(.24,1,.4,1)` | 8 px / .95 |Pinned layer entry uses 230 ms, 8 px and .95. Exit 130 ms uses the source fast-min primitive as an explicit adaptation; no source exit was established. |
| shadcn Rhea | 100 / 100 ms |Live `ease.standard` alias, currently `(.4,0,.2,1)` | 0 px / .95 |Rhea dialog/select classes specify 100 ms fade/zoom .95. Modal geometry follows the dialog; retaining the candidate easing is an adaptation. |

[Spectrum S2 Popover](https://github.com/adobe/react-spectrum/blob/4dd44e0f400636a87a9ad4390903e78c5ae6113c/packages/%40react-spectrum/s2/src/Popover.tsx) provides separate entering/exiting opacity and displacement, 200 ms transitions and an exiting `in` timing macro. This audit did not establish that macro’s exact emitted cubic-bezier or the default entering curve, so the explicit CSS ease-out/ease-in pair is not labeled an exact source value. Submenu motion is absent in the source and remains outside the present one-level menu API.

[Fluent’s published token archive](https://registry.npmjs.org/@fluentui/tokens/-/tokens-1.0.0-alpha.24.tgz) supplies the numeric timing/curve primitives. Its [official motion guidance](https://fluent2.microsoft.design/motion) supports purposeful entry/exit and reduced-motion alternatives; it does not establish one mandatory timing pair for all menus and dialogs.

[Astryx’s pinned layer implementation](https://github.com/facebook/astryx/blob/1e0c2acf27b7c0a1d56f64088aaa664cf15be6bc/packages/core/src/Layer/layerAnimations.stylex.ts) explicitly connects entry to `duration-fast-max`, `ease-standard`, `spacing-2` and .95 scale; [the token source](https://github.com/facebook/astryx/blob/1e0c2acf27b7c0a1d56f64088aaa664cf15be6bc/packages/core/src/theme/tokens.stylex.ts) resolves those to 230 ms, `(.24,1,.4,1)` and 8 px. The candidate retains an editable easing alias rather than copying an unrelated curve.

[Rhea’s pinned stylesheet](https://github.com/shadcn-ui/ui/blob/3ba91b1cc83e1bbe4ab35a422ff2a694849c5048/apps/v4/registry/styles/style-rhea.css) specifies 100 ms enter/exit and .95 zoom for the relevant select/dialog classes. Placement-directed popup sliding is not copied onto anchored rectangles.

## Runtime contract and review limits

Anchored menus enter through opaque elevation paint. Popovers, combobox surfaces and enhanced native select pickers fade in and out using the shared timing/easing tokens. Their measured rectangles do not translate or scale. The motion offset/scale tokens apply only to dialog/drawer/palette surfaces. This is an intentional fidelity adaptation that protects anchored geometry while keeping focus and selection immediate.

Open state, command availability, focus, events and dismissal remain immediate. Supported discrete CSS transitions can retain noninteractive exit paint after closure; no timeout delays the semantic close. Reduced motion removes transitions and travel. Browser paths without the required discrete/presence features retain immediate behavior. Source popup zoom or fade is therefore not a promise of identical behavior across every component or engine.

`duration.enter`, `duration.exit`, `ease.enter`, `ease.exit`, `motion.surface-offset` and `motion.surface-scale` remain independently editable managed tokens, with raw CSS/Parts customization available under the existing public contract. Ordinary focus timing is separate. Holotable retains its independently documented 150 ms entry recipe and is not changed by this patch.

The current five pairs replay, reopen and export against build `edd09329014f` with 30 passing browser checks. Separate focused suites cover normal and reduced motion, opening/closing, rapid reopen, focus continuity and mobile visual-viewport positioning. Exact evidence and remaining review limits are recorded in [the checkpoint receipt](../../../artifacts/asset-browser-followups/verification.json). Automated checks do not establish source equivalence, manual assistive-technology acceptance or theme adoption.
