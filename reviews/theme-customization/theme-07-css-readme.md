# CSS source authoring

Typography and surface recipes are maintained in `packages/styles/src/css/`. `css-authoring.json` lists their definitions and entry modules explicitly. The styles build generates Lit adapters, then emits the existing JavaScript, declarations and plain CSS entry points. No compiler, Node.js, TypeScript or external Reve checkout is required by consumers.

From the repository root, using the locked dependencies and Node 26.10.0 Current (or the supported Node 24.21.0 LTS line):

```sh
npm ci
npm run build -w @en-reve/tokens
npm run build -w @en-reve/styles
npm run test:authoring -w @en-reve/styles
node tooling/theme-authoring-pilot/verify.mjs --production-authoring
node tooling/css-authoring/verify-watch.mjs
npm run watch -w @en-reve/styles
```

Run the existing docs development server alongside the styles watcher. The watcher rebuilds package outputs when authored CSS, TypeScript adapters, the manifest, compiler, or built token inputs change. Token source edits still require the tokens build. Rebuilds are serialized, changes during a build are picked up next, and failed CSS generation removes generated adapters and the affected plain CSS outputs. Correcting the source regenerates them. This is package-output watching, not a separate Vite syntax plugin.

## Authoring contract

Source files use ordinary CSS selectors, declarations, nesting and `@media`, `@supports`, `@container` and `@layer`. The bounded internal build dialect adds:

- `--token(--en-known-token)` expands to the existing runtime custom-property reference, default, and finite size-role indirection. It does **not** freeze a themed value. Unknown tokens fail the build.
- Ordinary `var(--en-override, fallback)` keeps public override behavior. The override name is checked against the customization registry. Other application/private variable namespaces remain CSS variables.
- Top-level definitions use `@function --name(--parameter) { result: …; }` or `@mixin --name(--parameter) { @result { … } }`. An entry uses a function in a declaration value or `@apply --name(arguments)` inside a rule.

Definitions retain the audited pilot restrictions: unique untyped required parameters, exact arity, no implicit caller environment, locals, defaults, recursion, helper composition or nested results. `var()` in a definition refers only to a parameter; values may use `calc`, `max`, `min` and `clamp`. Quoted strings and commas inside native functions are preserved. Escapes and comments inside values are outside this small dialect and fail explicitly. Pass a comma-containing font stack through a native `var()` or a token reference. `@import` and unlisted authoring at-rules are rejected. This is an internal build contract, not a claim of native CSS functions/mixins compatibility.

The local compiler shares definition validation with the historical Reve pilot but does not load that external engine. It substitutes validated arguments in a PostCSS tree, preserving rule/declaration order and conditions. Production source CSS and the customization registry are inventoried directly; generated adapters are excluded from source evidence.

## Consumption contract

Keep importing `typographyStyles` and `surfaceStyles` from their existing `.js` subpaths, or load the corresponding `.css` exports. The generated JavaScript is a small Lit adapter; no styles are authored in that generated file. `layoutStyles` and other not-yet-migrated families retain their existing source. Typed token derivation and validation remain TypeScript APIs.

The regression snapshot starts with consumer CSS from pre-migration commit `a005a8e` and includes the intentional theme changes recorded with commit provenance in `fixtures/consumer-baseline.json`. Tests compare normalized emitted CSS and exercise actual native ESM/import-map exports, CSSResult values, declarative-shadow SSR, hydration, theme/size boundaries, missing-token fallbacks and live overrides in Chromium, Firefox and WebKit. A TypeScript consumer also checks the unchanged export types. Snapshot updates require an intentional consumer behavior change, not a routine build.

The shared browser harness's `--production-authoring --serve` mode exposes the production comparison at `http://127.0.0.1:47917/?progress-report`. The original mode remains a historical experiment and needs its pinned external engine. Production verification requires neither that engine nor its environment variable.
