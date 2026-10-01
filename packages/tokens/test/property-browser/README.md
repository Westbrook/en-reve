# Property registration browser probes

Run from the repository root after building the token package:

```sh
npm run build -w @en-reve/tokens
node packages/tokens/test/property-browser/probe.mjs
```

The script launches installed Playwright Chromium, Firefox, and WebKit builds. It needs no docs server, elements build, or network. A failure in any engine exits nonzero, including a missing browser binary. On macOS, browser launches may require execution outside the filesystem sandbox to access platform services.

Results are written to a new temporary directory, printed when the run ends. Set `PROPERTY_TEST_OUTPUT_DIR` to choose another evidence directory. The JSON records engine versions, complete parsed registration definitions, native validation results, consumer snapshots, and semantic observations. No evidence directory is written into this source tree by default.

## Checks

- Every emitted registration in compatible, typed, and explicit profiles must appear exactly once in CSSOM with its expected name, syntax, inheritance, and presence/absence of an initial value. The explicit profile covers every grammar supported by the authoring API.
- Every profile is also validated with `CSS.registerProperty()` in a fresh page, so a browser-rejected definition fails the run and JS registration cannot leak between profiles.
- Built `properties.css` must match the default emitter. Built `default.css` must contain exactly the same registrations.
- Representative native button/input consumers compare the generated default theme pair with no registration, the standalone compatible registry, and bundled `default.css`. They cover light/dark preferences, 16px/20px root font sizes, inherited optional overrides, full/partial child themes, a local size value, and shadow-root consumers. These are isolated semantic fixtures, not a replacement for the elements package's component tests.
- Isolated semantic probes compare unregistered, wildcard/no-initial, and typed/initial behavior for absence, invalid values, missing variables, empty values, full resets, partial inheritance, relative lengths, `light-dark()`, `currentColor`, inheritance into shadow roots, and CSS animation interpolation.

## Contract guarded by these tests

Compatible registration uses `syntax:"*"`, `inherits:true`, and no `initial-value`. It preserves the existing optional `var()` fallback and `--override:initial` reset behavior in the tested cases. It does not add typed interpolation.

Typed registration is an intentional change: absent/reset values use registered initials; invalid typed values can inherit an ancestor's value; inherited `em` values compute before consumption; and `light-dark()` may resolve under the declaring element's scheme before inheritance. Typed numbers interpolate. Direct `currentColor` still follows the consuming element in the tested engines, despite differences in computed-style serialization.

Document registrations apply to shadow descendants. The probe records what happens when a registration is placed inside a shadow stylesheet, but does not assert the current engines' unsupported behavior as a permanent requirement. Install the emitted registry in a document stylesheet.

The probe also confirms that typed `em`/`rem` initial values and missing typed initials are rejected. Some contextual color initials are accepted by browsers; the library's concrete-value authoring grammar is intentionally more conservative.

## References

- [MDN @property](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@property)
- [W3C Properties and Values API, 26 March 2024 draft](https://www.w3.org/TR/2024/WD-css-properties-values-api-1-20240326/)
- [Current editor's draft](https://drafts.css-houdini.org/css-properties-values-api-1/)

Use one name per rule with explicit syntax and inheritance for portable output. Newer draft features such as multiple names and omitted descriptors are outside this probe's contract.
