# API-03 native-aligned forms

`node node_modules/@playwright/test/cli.js test -c probes/api-forms/playwright.config.ts`

Uses source modules and a dedicated localhost port (45943), with Chromium, Firefox and WebKit. Covers pristine/default/live state, typed families, native checkedness comparisons, same-value writes, attribute removal, canceled reset/change, pre-upgrade properties, restored values, drafts, validation/error clearing, form data/submission, disabled fieldsets, accessible error association, range defaults and native numeric step bases. Does not claim manual screen-reader certification.

After metadata generation: `node --test probes/api-forms/metadata.test.mjs`.

The implementation and migration contract is in `plans/api-03-forms.md`.
