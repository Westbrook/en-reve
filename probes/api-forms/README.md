# API-03 native-aligned forms

`node node_modules/@playwright/test/cli.js test -c probes/api-forms/playwright.config.ts`

Uses source modules and a dedicated localhost port (45943), with Chromium, Firefox and WebKit. Covers pristine/default/live state, typed families, native checkedness comparisons, same-value writes, attribute removal, canceled reset/change, pre-upgrade properties, restored values, drafts, validation/error clearing, form data/submission, disabled fieldsets, accessible error association, range defaults and native numeric step bases. Does not claim manual screen-reader certification.

The label assertion checks the browser-native association rather than assuming
that all labels remain on a form-associated host. Where native Reference Target
is supported, the text field and individual choices forward their external label
to the enclosed native input; the public `labels` facade reflects the empty
`ElementInternals.labels` list. The test requires the exact original label on the
native input, requires `label.control` to retain the host, and checks the exact
host-list count. Other controls and unsupported engines retain the label on the
host. This follows the [Reference Target label contract](https://github.com/WICG/webcomponents/blob/gh-pages/proposals/reference-target-explainer.md#interaction-with-htmlinputelementlabels-and-elementinternalslabels);
no label, engine, or validation assertion is skipped.

After metadata generation: `node --test probes/api-forms/metadata.test.mjs`.

The implementation and migration contract is in `plans/api-03-forms.md`.
