# Shared element size contract

`EnElement` is exported through `@en-reve/elements/element.js` with the `ElementSize` type. It supplies reactive property/attribute behavior and performs no registration. Component styles continue to include `foundationStyles`; the base does not append or replace a subclass's styles.

| Requested mode | Behavior |
| --- | --- |
| `medium` (default) | Selects the local medium scope without requiring an attribute, including inside a differently sized parent. |
| `inherit` | Explicitly uses the containing size scope. |
| `small`, `large` | Selects a concrete absolute scope through foundation styles. Repeated nesting does not multiply size. |

An untouched element reports `size === 'medium'` and has no initial `size` attribute. An explicit property write reflects after Lit's update. Removing the attribute restores `medium`. Invalid values resolve to `medium`; an invalid authored attribute can retain its original text until a property write normalizes the reflected attribute. The getter reports the requested mode, not computed CSS measurements.

The base uses a private backing field and custom accessor, so class fields do not shadow the reactive API. `useDefault` keeps the initial accessor value unreflected. Property options retain their prototype when a same-value write needs reflection: Lit's accessor options can inherit fields, so copying only enumerable own fields would drop `reflect`/`useDefault`.

Focused verification:

```sh
node --test packages/elements/src/internal/tests/size-ssr.test.ts packages/elements/src/internal/tests/size-metadata.test.ts
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/en-reve-playwright node node_modules/@playwright/test/cli.js test --config packages/elements/src/internal/tests/playwright.config.ts
```

Three browser engines passed the journey covering public properties/attributes, medium without an attribute, and explicitly inherited CSS scopes. Two Node tests verified import/construction without `document` and actual SSR default/explicit reflection. A CEM generation test verified that a derived element inherits the described size property and attribute. The CSS fixture deliberately tests the scope contract with simple finite values; the actual theme-role values and component-wide visual behavior belong to the styles and integration tests.
