# Production minification

`literals.mjs` exports `minifyLitTemplates({ include, exclude? })`, a build-only
Vite plugin with an explicit source scope. Rules are absolute file/directory
paths, file URLs, regular expressions, or predicates. It is reusable in a
consumer build; it is not imported by shipped component modules.

```js
import { minifyLitTemplates } from './tooling/minify/literals.mjs';
const plugins = [minifyLitTemplates({ include: [appSource, libraryPackages] })];
```

Apply the same transform to **both** the client bundle and the SSR bundle.
The docs SSR build bundles local `@en-reve/*` packages so their templates pass
through the same plugin, while Lit, the Lit SSR runtime and Signals stay external.
Lit hashes the template strings for hydration; minifying only one build produces
incompatible hashes. Preserve the existing DOM-shim-before-class-import ordering.

The transform parses source with the explicit TypeScript 6 JavaScript API from
`tooling/metadata/compiler-api.mjs` (wrapper 6.0.2, effective compiler 6.0.3) and
applies mapped literal edits directly through pinned `magic-string` 1.4.2.
TypeScript 7 remains the package build/typecheck compiler. The former Lit
rollup plugin, its TypeScript 5.9.3 parser and imported default minifier are
removed; the active HTML strategy remains `html-minifier-next` 8.6.0. It resolves the
actual import binding for Lit `html`, `svg` and `css` tags, including aliases and
namespace imports. Locally shadowed functions, unrelated tags, untagged strings,
`lit/static-html.js` source-display wrappers, virtual modules and all query
imports (including `?raw`) are left alone. Errors fail the build. Source maps
remain enabled and are chained by Vite into the final bundle maps.

HTML literals collapse repeated whitespace conservatively, retaining inline
word separators, comments and exact `pre`, `textarea` and `code` content. Dynamic
expressions remain JavaScript expressions and their runtime string contents are
not minified. A parser cannot infer an external `white-space: pre` rule; protect
such a literal explicitly:

```js
const example = /* en-preserve-whitespace */ html`<span class="pre">  exact  text</span>`;
```

CSS literals may be complete sheets, rules, declarations, selectors, or nested
`var()`/`calc()` value fragments. The upstream stylesheet optimizer cannot safely
parse every expression hole. This stage therefore compresses CSS whitespace
tokens, preserving strings, comments, escapes, separators, expression order and
modern syntax in every fragment. It does not reorder declarations, lower CSS
features, or claim full stylesheet optimization. Final resolved SSR styles use
the separate full Lightning CSS pass below.

`document.mjs` exports `createDocumentMinifier()`. Create one per build, then call
it after SSR injection with `(html, { filename })` to obtain `{ html, report }`.
It minimizes HTML tag syntax and resolved inline CSS without reserializing the
DOM or removing text nodes or comments. This preserves Lit hydration markers,
DSD and textarea leading-newline handling. Reuse this stage for other generated
HTML, and calculate artifact hashes after the final pass.

Run `node --test tooling/minify/*.test.mjs` for the focused semantic tests.

The docs build first uses `apps/docs/scripts/document-styles.mjs` to replace local
head stylesheet links with inline CSS at the same position, preserving media
conditions and cascade order. Document theme, recipe and page CSS are included
in the initial HTML. Hydrated body templates and their authored links remain
unchanged, and CSS assets are still emitted. Inline CSS repeats per document
instead of using a shared browser stylesheet cache. The build rejects external
paths, links with unsupported loading/alternate-sheet semantics, and CSS URL or
import dependencies; it does not silently rebase them or deduplicate styles.

Production browser fixtures additionally verify hydration identity, native draft
and focus retention, inline text spacing, native controls and CSS behavior.
These tests establish the exercised build paths; they do not establish the full
rolling browser/framework/assistive-technology support target.

Primary references:
- [Lit production builds](https://lit.dev/docs/tools/production/)
- [Lit Labs literal minifier](https://github.com/lit/lit/tree/main/packages/labs/rollup-plugin-minify-html-literals)
- [Lit client SSR and hydration](https://lit.dev/docs/ssr/client-usage/)

SVG fragments preserve self-closing slashes, including aliased and namespace tags.
Without those slashes a circle followed by a path can become a circle containing
a non-rendering path in SSR HTML. Regression coverage compares SVG sibling
structure before and after transformation, including expression boundaries.

Table-fragment literals are minified within their native table/row-group/row
context, then stripped of only those temporary wrappers. This preserves standalone
col, cell, row, caption and row-group templates without injecting phantom groups.
The normal whitespace-preservation escape remains for genuinely verbatim content.

The [compiler migration checkpoint](../../plans/literal-compiler-migration-2026-09-27.md)
records exact Current/LTS output comparisons, clean-install proof and real
consumer validation. Historical evidence keeps its original tool identities.
